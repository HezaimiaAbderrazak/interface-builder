import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { db } from '../db.js';
import { notes, tags, noteTags } from '../../shared/schema.js';
import { and, eq, inArray } from 'drizzle-orm';
import { geminiGenerate, geminiGenerateJSON, GeminiError } from '../lib/gemini.js';

const router = Router();
router.use(authMiddleware);

function handleAIError(res: any, e: unknown) {
  if (e instanceof GeminiError) {
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

    const result = await geminiGenerateJSON<{ tags: string[] }>(prompt, {
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

    const summary = await geminiGenerate(
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

    const enhanced = await geminiGenerate(
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

    const result = await geminiGenerateJSON<{ noteIds: string[]; explanation?: string }>(
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

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'AI service not configured.' });
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe this audio verbatim. Return only the transcript, no preamble.' },
              { inline_data: { mime_type: mimeType, data: audioBase64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.0, maxOutputTokens: 2048 },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text().catch(() => '');
      console.error('Transcribe error', upstream.status, t);
      const code = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 503;
      res.status(code).json({ error: 'Transcription failed.' });
      return;
    }

    const data = await upstream.json();
    const transcript = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('').trim() ?? '';
    res.json({ transcript });
  } catch (e) {
    handleAIError(res, e);
  }
});

export default router;
