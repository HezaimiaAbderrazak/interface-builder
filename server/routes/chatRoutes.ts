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

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    res.status(503).json({ error: 'AI service not configured. Please add a GOOGLE_API_KEY secret.' });
    return;
  }

  try {
    const geminiContents = (messages as { role: string; content: string }[]).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiContents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' });
        return;
      }
      const t = await response.text();
      console.error('Gemini error:', response.status, t);
      res.status(500).json({ error: 'AI service error' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, '');
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
        try {
          const parsed = JSON.parse(json);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const openaiFormat = {
              choices: [{ delta: { content: text }, index: 0 }],
            };
            res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`);
          }
          if (parsed.candidates?.[0]?.finishReason) {
            res.write('data: [DONE]\n\n');
          }
        } catch {
          // skip malformed lines
        }
      }
    }
    res.end();
  } catch (e: any) {
    console.error('chat error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || 'Unknown error' });
    }
  }
});

export default router;
