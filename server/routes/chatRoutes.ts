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

const GEMINI_MODEL = 'gemini-2.0-flash';

function mapGeminiStatus(status: number): { code: number; message: string } {
  if (status === 400) return { code: 400, message: 'Invalid request to AI service.' };
  if (status === 401 || status === 403) return { code: 503, message: 'AI service authentication failed. Check the GOOGLE_API_KEY.' };
  if (status === 404) return { code: 503, message: `AI model "${GEMINI_MODEL}" is not available for this API key.` };
  if (status === 429) return { code: 429, message: 'Rate limit exceeded. Please wait a moment and try again.' };
  if (status >= 500) return { code: 502, message: 'Upstream AI service is temporarily unavailable.' };
  return { code: 500, message: 'AI service error.' };
}

router.post('/', async (req: AuthRequest, res) => {
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages must be a non-empty array' });
    return;
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    res.status(503).json({ error: 'AI service not configured. Please add a GOOGLE_API_KEY secret.' });
    return;
  }

  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const geminiContents = (messages as { role: string; content: string }[])
      .filter((m) => typeof m?.content === 'string' && m.content.length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: geminiContents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      console.error('Gemini error:', response.status, text);
      const { code, message } = mapGeminiStatus(response.status);
      res.status(code).json({ error: message });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let doneSent = false;

    const sendDone = () => {
      if (!doneSent) {
        res.write('data: [DONE]\n\n');
        doneSent = true;
      }
    };

    try {
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
          if (!json) continue;
          if (json === '[DONE]') { sendDone(); continue; }

          try {
            const parsed = JSON.parse(json);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const chunk = { choices: [{ delta: { content: text }, index: 0 }] };
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            if (parsed.candidates?.[0]?.finishReason) {
              sendDone();
            }
            if (parsed.error) {
              console.error('Gemini stream error payload:', parsed.error);
              res.write(`data: ${JSON.stringify({ error: parsed.error.message || 'AI stream error' })}\n\n`);
              sendDone();
            }
          } catch {
            // partial JSON; skip silently — next chunk may complete it
          }
        }
      }
      sendDone();
      res.end();
    } catch (streamErr: any) {
      if (streamErr?.name === 'AbortError') {
        res.end();
        return;
      }
      console.error('Stream error:', streamErr);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      sendDone();
      res.end();
    }
  } catch (e: any) {
    console.error('chat error:', e);
    if (!res.headersSent) {
      const status = e?.name === 'AbortError' ? 499 : 500;
      res.status(status).json({ error: e.message || 'Unknown error' });
    } else {
      try { res.end(); } catch { /* noop */ }
    }
  }
});

export default router;
