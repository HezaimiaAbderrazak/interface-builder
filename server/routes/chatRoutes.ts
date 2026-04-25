import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import type { AuthRequest } from '../auth.js';
import { db } from '../db.js';
import { chatConversations, chatMessages } from '../../shared/schema.js';
import { and, asc, desc, eq } from 'drizzle-orm';
import { groqStream, GroqError } from '../lib/groq.js';

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

router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, req.userId!))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(50);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/conversations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const [conv] = await db
      .select()
      .from(chatConversations)
      .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, req.userId!)))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, id))
      .orderBy(asc(chatMessages.createdAt));
    res.json({ conversation: conv, messages });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/conversations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await db
      .delete(chatConversations)
      .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, req.userId!)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  const { messages, conversationId: incomingId } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages must be a non-empty array' });
    return;
  }

  const lastUser = [...messages].reverse().find((m) => m?.role === 'user');
  if (!lastUser) {
    res.status(400).json({ error: 'no user message provided' });
    return;
  }

  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  let conversationId: string | null = null;
  try {
    if (incomingId) {
      const [existing] = await db
        .select({ id: chatConversations.id })
        .from(chatConversations)
        .where(and(eq(chatConversations.id, incomingId), eq(chatConversations.userId, req.userId!)))
        .limit(1);
      if (existing) conversationId = existing.id;
    }
    if (!conversationId) {
      const title = String(lastUser.content || 'New chat').slice(0, 60);
      const [created] = await db
        .insert(chatConversations)
        .values({ userId: req.userId!, title })
        .returning({ id: chatConversations.id });
      conversationId = created.id;
    }

    await db.insert(chatMessages).values({
      conversationId,
      role: 'user',
      content: String(lastUser.content),
    });
  } catch (e) {
    console.error('chat persistence error (pre):', e);
  }

  try {
    const stream = await groqStream(messages, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 1024,
      signal: controller.signal,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    if (conversationId) {
      res.write(`data: ${JSON.stringify({ conversationId })}\n\n`);
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantText = '';
    let doneSent = false;

    const sendDone = () => {
      if (!doneSent) {
        res.write('data: [DONE]\n\n');
        doneSent = true;
      }
    };

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
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) {
            assistantText += text;
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          }
          if (parsed.choices?.[0]?.finish_reason) sendDone();
        } catch {
          // partial JSON; will complete on next chunk
        }
      }
    }
    sendDone();
    res.end();

    if (conversationId && assistantText) {
      try {
        await db.insert(chatMessages).values({
          conversationId,
          role: 'assistant',
          content: assistantText,
        });
        await db
          .update(chatConversations)
          .set({ updatedAt: new Date() })
          .where(eq(chatConversations.id, conversationId));
      } catch (e) {
        console.error('chat persistence error (post):', e);
      }
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      try { res.end(); } catch { /* noop */ }
      return;
    }
    console.error('chat error:', e);
    if (e instanceof GroqError) {
      if (!res.headersSent) {
        res.status(e.status).json({ error: e.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
      return;
    }
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || 'Unknown error' });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch { /* noop */ }
    }
  }
});

export default router;
