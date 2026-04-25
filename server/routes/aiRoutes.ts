import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { db } from '../db.js';
import { notes, tags, noteTags } from '../../shared/schema.js';
import { and, eq, inArray } from 'drizzle-orm';
import { groqGenerate, groqGenerateJSON, groqTranscribe, GroqError } from '../lib/groq.js';

const router = Router();
router.use(authMiddleware);

function handleAIError(res: any, e: unknown) {
  if (e instanceof GroqError) {
    res.status(e.status).json({ error: e.message });
    return;
  }
  console.error('AI route error:', e);
  res.status(500).json({ error: (e as Error)?.message || 'Unknown error' });
}

router.post('/auto-tag', async (req: AuthRequest, res) => {
  try {
    const { title = '', content = '', existingTags = [] } = req.body ?? {};
    const text = `${title}\n${content}`.trim();
    if (!text) {
      res.status(400).json({ error: 'title or content required' });
      return;
    }

    const prompt = `You are an expert note tagger. Read the note and return 2-5 short, lowercase, single-or-two-word tags that best describe it. Avoid duplicates of existing tags.

Existing tags: ${existingTags.join(', ') || '(none)'}

Note title: ${title}
Note content: ${content}

Return STRICT JSON: {"tags": ["tag1", "tag2"]}`;

    const result = await groqGenerateJSON<{ tags: string[] }>(prompt, {
      temperature: 0.3,
      maxOutputTokens: 200,
    });

    const cleanTags = (result.tags || [])
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim().toLowerCase().slice(0, 32))
      .filter((t) => t.length > 0)
      .slice(0, 5);

    res.json({ tags: cleanTags });
  } catch (e) {
    handleAIError(res, e);
  }
});

router.post('/summarize', async (req: AuthRequest, res) => {
  try {
    const { title = '', content = '' } = req.body ?? {};
    const text = `${title}\n${content}`.trim();
    if (!text || text.length < 20) {
      res.status(400).json({ error: 'Note content is too short to summarize.' });
      return;
    }

    const summary = await groqGenerate(
      `Summarize the following note in 1-2 concise sentences. No preamble, just the summary.\n\nTitle: ${title}\n\nContent:\n${content}`,
      { temperature: 0.3, maxOutputTokens: 200 },
    );

    res.json({ summary });
  } catch (e) {
    handleAIError(res, e);
  }
});

router.post('/enhance', async (req: AuthRequest, res) => {
  try {
    const { content = '' } = req.body ?? {};
    if (!content || content.trim().length < 5) {
      res.status(400).json({ error: 'Content too short to enhance.' });
      return;
    }

    const enhanced = await groqGenerate(
      `Rewrite the following note to be clearer, more concise, and well-structured. Keep the original language and meaning. Return only the rewritten note, no explanations.\n\n${content}`,
      { temperature: 0.4, maxOutputTokens: 800 },
    );

    res.json({ content: enhanced });
  } catch (e) {
    handleAIError(res, e);
  }
});

router.post('/search', async (req: AuthRequest, res) => {
  try {
    const { query } = req.body ?? {};
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query required' });
      return;
    }

    const userNotes = await db
      .select({ id: notes.id, title: notes.title, content: notes.content })
      .from(notes)
      .where(and(eq(notes.userId, req.userId!), eq(notes.isDeleted, false)));

    if (userNotes.length === 0) {
      res.json({ noteIds: [], explanation: 'No notes to search.' });
      return;
    }

    const corpus = userNotes
      .map((n, i) => `[${i}] id=${n.id} | title="${n.title}" | ${(n.content || '').slice(0, 300)}`)
      .join('\n');

    const result = await groqGenerateJSON<{ noteIds: string[]; explanation?: string }>(
      `You are a semantic search engine over a user's notes. Given a query, return the IDs of the most relevant notes (max 10), most relevant first. If none match, return an empty array.

Query: ${query}

Notes:
${corpus}

Return STRICT JSON: {"noteIds": ["uuid1", "uuid2"], "explanation": "short reason"}`,
      { temperature: 0.2, maxOutputTokens: 400 },
    );

    const validIds = new Set(userNotes.map((n) => n.id));
    const noteIds = (result.noteIds || []).filter((id) => validIds.has(id)).slice(0, 10);

    res.json({ noteIds, explanation: result.explanation || '' });
  } catch (e) {
    handleAIError(res, e);
  }
});

router.post('/transcribe', async (req: AuthRequest, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body ?? {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'audioBase64 required' });
      return;
    }

    const transcript = await groqTranscribe(audioBase64, mimeType);
    res.json({ transcript });
  } catch (e) {
    handleAIError(res, e);
  }
});

export default router;
