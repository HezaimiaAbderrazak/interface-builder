import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import type { AuthRequest } from '../auth.js';

const router = Router();
router.use(authMiddleware);

const SYSTEM_PROMPT = `You are NoteFlow AI, an intelligent note-taking assistant. You help users manage their notes through natural language commands.

You can help with:
- Creating notes: When the user says "create a note about X" or "new note: X", extract title & content.
- Setting priorities: Map colors to priorities - red/pink = urgent, orange = high, yellow = medium, blue/green = low, default = normal.
- Setting reminders: When the user says "remind me about X at/on Y", extract the datetime.
- Searching notes: Help find notes by content, tags, or topics.
- Organizing: Pin, archive, tag notes.

When the user gives a command, respond with a JSON action block wrapped in \`\`\`action markers:
\`\`\`action
{"type": "create_note", "title": "...", "content": "...", "color": "pink", "reminder_at": null}
\`\`\`

Or for search:
\`\`\`action
{"type": "search", "query": "..."}
\`\`\`

Or for reminders:
\`\`\`action
{"type": "set_reminder", "query": "...", "reminder_at": "2025-01-15T09:00:00Z"}
\`\`\`

Always provide a friendly conversational response along with the action block. Keep responses concise and helpful.
If it's just a conversation (not a command), respond normally without action blocks.`;

router.post('/', async (req: AuthRequest, res) => {
  const { messages } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: 'AI service not configured. Please add an OPENAI_API_KEY secret.' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' });
        return;
      }
      const t = await response.text();
      console.error('OpenAI error:', response.status, t);
      res.status(500).json({ error: 'AI service error' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.body!.pipeTo(
      new WritableStream({
        write(chunk) { res.write(chunk); },
        close() { res.end(); },
        abort(e) { console.error('stream aborted', e); res.end(); },
      })
    );
  } catch (e: any) {
    console.error('chat error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || 'Unknown error' });
    }
  }
});

export default router;
