var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// server/routes/authRoutes.ts
import { Router } from "express";

// server/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatConversations: () => chatConversations,
  chatConversationsRelations: () => chatConversationsRelations,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  noteAttachments: () => noteAttachments,
  noteAttachmentsRelations: () => noteAttachmentsRelations,
  noteTags: () => noteTags,
  noteTagsRelations: () => noteTagsRelations,
  notes: () => notes,
  notesRelations: () => notesRelations,
  tags: () => tags,
  tagsRelations: () => tagsRelations,
  userPreferences: () => userPreferences,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  index,
  uniqueIndex,
  jsonb
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull().default(""),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    emailLowerIdx: uniqueIndex("users_email_lower_idx").on(t.email)
  })
);
var userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  language: text("language").notNull().default("en"),
  defaultNoteColor: text("default_note_color").notNull().default("default"),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  settings: jsonb("settings").$type().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    content: text("content").default(""),
    color: text("color").notNull().default("default"),
    isPinned: boolean("is_pinned").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    isVoiceNote: boolean("is_voice_note").notNull().default(false),
    voiceDuration: integer("voice_duration"),
    audioUrl: text("audio_url"),
    transcript: text("transcript"),
    summary: text("summary"),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userUpdatedIdx: index("notes_user_updated_idx").on(t.userId, t.updatedAt),
    userPinnedIdx: index("notes_user_pinned_idx").on(t.userId, t.isPinned),
    userArchivedIdx: index("notes_user_archived_idx").on(t.userId, t.isArchived),
    userDeletedIdx: index("notes_user_deleted_idx").on(t.userId, t.isDeleted),
    reminderIdx: index("notes_reminder_idx").on(t.reminderAt)
  })
);
var tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isAI: boolean("is_ai").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userNameUq: uniqueIndex("tags_user_name_uq").on(t.userId, t.name)
  })
);
var noteTags = pgTable(
  "note_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    noteTagUq: uniqueIndex("note_tags_note_tag_uq").on(t.noteId, t.tagId),
    tagIdx: index("note_tags_tag_idx").on(t.tagId)
  })
);
var noteAttachments = pgTable(
  "note_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    noteIdx: index("note_attachments_note_idx").on(t.noteId)
  })
);
var chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userUpdatedIdx: index("chat_conv_user_updated_idx").on(t.userId, t.updatedAt)
  })
);
var chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    actions: jsonb("actions").$type(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    conversationIdx: index("chat_msg_conv_idx").on(t.conversationId, t.createdAt)
  })
);
var usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId]
  }),
  notes: many(notes),
  tags: many(tags),
  conversations: many(chatConversations)
}));
var notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  tags: many(noteTags),
  attachments: many(noteAttachments)
}));
var tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  notes: many(noteTags)
}));
var noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] })
}));
var noteAttachmentsRelations = relations(noteAttachments, ({ one }) => ({
  note: one(notes, { fields: [noteAttachments.noteId], references: [notes.id] })
}));
var chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, { fields: [chatConversations.userId], references: [users.id] }),
  messages: many(chatMessages)
}));
var chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id]
  })
}));

// server/db.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/auth.ts
import { eq } from "drizzle-orm";
var JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "noteflow-secret-change-in-production";
function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
async function registerUser(email, password, fullName) {
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) throw new Error("Email already in use");
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    fullName
  }).returning();
  return user;
}
async function loginUser(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) throw new Error("Invalid email or password");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");
  return user;
}

// server/routes/authRoutes.ts
import { eq as eq2 } from "drizzle-orm";
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName = "" } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = await registerUser(email, password, fullName);
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = await loginUser(email, password);
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq2(users.id, req.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, fullName: user.fullName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
var authRoutes_default = router;

// server/routes/notesRoutes.ts
import { Router as Router2 } from "express";
import { eq as eq3, and, desc } from "drizzle-orm";
var router2 = Router2();
router2.use(authMiddleware);
router2.get("/", async (req, res) => {
  try {
    const userNotes = await db.select().from(notes).where(eq3(notes.userId, req.userId)).orderBy(desc(notes.updatedAt));
    const noteIds = userNotes.map((n) => n.id);
    let tagsMap = {};
    if (noteIds.length > 0) {
      const allNoteTags = await db.select({ noteId: noteTags.noteId, tagId: tags.id, name: tags.name, isAI: tags.isAI }).from(noteTags).innerJoin(tags, eq3(noteTags.tagId, tags.id)).where(eq3(tags.userId, req.userId));
      for (const nt of allNoteTags) {
        if (!tagsMap[nt.noteId]) tagsMap[nt.noteId] = [];
        tagsMap[nt.noteId].push({ id: nt.tagId, name: nt.name, isAI: nt.isAI });
      }
    }
    const result = userNotes.map((n) => ({
      ...n,
      tags: tagsMap[n.id] || []
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/", async (req, res) => {
  try {
    const { title, content, color, isPinned, isArchived, isVoiceNote, voiceDuration, reminderAt, tags: tagList } = req.body;
    const [note] = await db.insert(notes).values({
      userId: req.userId,
      title: title || "",
      content: content || "",
      color: color || "default",
      isPinned: isPinned || false,
      isArchived: isArchived || false,
      isVoiceNote: isVoiceNote || false,
      voiceDuration: voiceDuration || null,
      reminderAt: reminderAt ? new Date(reminderAt) : null
    }).returning();
    const noteTa = await upsertTags(req.userId, note.id, tagList || []);
    res.json({ ...note, tags: noteTa });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tags: tagList, ...updates } = req.body;
    const [existing] = await db.select().from(notes).where(and(eq3(notes.id, id), eq3(notes.userId, req.userId))).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    const allowed = ["title", "content", "color", "isPinned", "isArchived", "isDeleted", "isVoiceNote", "voiceDuration", "reminderAt"];
    for (const key of allowed) {
      if (key in updates) {
        if (key === "reminderAt") updateData[key] = updates[key] ? new Date(updates[key]) : null;
        else updateData[key] = updates[key];
      }
    }
    const [note] = await db.update(notes).set(updateData).where(and(eq3(notes.id, id), eq3(notes.userId, req.userId))).returning();
    let noteTa = null;
    if (tagList !== void 0) {
      noteTa = await upsertTags(req.userId, id, tagList);
    } else {
      noteTa = await getNoteTags(req.userId, id);
    }
    res.json({ ...note, tags: noteTa });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(notes).where(and(eq3(notes.id, id), eq3(notes.userId, req.userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
async function upsertTags(userId, noteId, tagList) {
  await db.delete(noteTags).where(eq3(noteTags.noteId, noteId));
  if (!tagList.length) return [];
  const result = [];
  for (const t of tagList) {
    let [tag] = await db.select().from(tags).where(and(eq3(tags.userId, userId), eq3(tags.name, t.name))).limit(1);
    if (!tag) {
      [tag] = await db.insert(tags).values({ userId, name: t.name, isAI: t.isAI }).returning();
    }
    await db.insert(noteTags).values({ noteId, tagId: tag.id }).onConflictDoNothing();
    result.push({ id: tag.id, name: tag.name, isAI: tag.isAI });
  }
  return result;
}
async function getNoteTags(userId, noteId) {
  const rows = await db.select({ id: tags.id, name: tags.name, isAI: tags.isAI }).from(noteTags).innerJoin(tags, eq3(noteTags.tagId, tags.id)).where(and(eq3(noteTags.noteId, noteId), eq3(tags.userId, userId)));
  return rows;
}
var notesRoutes_default = router2;

// server/routes/chatRoutes.ts
import { Router as Router3 } from "express";
import { and as and2, asc, desc as desc2, eq as eq4 } from "drizzle-orm";

// server/lib/gemini.ts
var GEMINI_MODEL = "gemini-2.0-flash";
var GeminiError = class extends Error {
  status;
  upstreamStatus;
  constructor(message, status, upstreamStatus) {
    super(message);
    this.status = status;
    this.upstreamStatus = upstreamStatus;
  }
};
function mapStatus(status) {
  if (status === 400) return { code: 400, message: "Invalid request to AI service." };
  if (status === 401 || status === 403) return { code: 503, message: "AI authentication failed. Check the GOOGLE_API_KEY." };
  if (status === 404) return { code: 503, message: `AI model "${GEMINI_MODEL}" is not available for this API key.` };
  if (status === 429) return { code: 429, message: "AI rate limit reached. Please retry in a moment." };
  if (status >= 500) return { code: 502, message: "Upstream AI service is temporarily unavailable." };
  return { code: 500, message: "AI service error." };
}
function getApiKey() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new GeminiError("AI service not configured. Add a GOOGLE_API_KEY secret.", 503);
  }
  return key;
}
async function geminiGenerate(prompt, opts = {}) {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxOutputTokens ?? 512
    }
  };
  if (opts.systemInstruction) {
    body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
  }
  if (opts.responseMimeType) {
    body.generationConfig.responseMimeType = opts.responseMimeType;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal: opts.signal
  });
  if (!response.ok) {
    const text3 = await response.text().catch(() => "");
    console.error("Gemini error", response.status, text3);
    const { code, message } = mapStatus(response.status);
    throw new GeminiError(message, code, response.status);
  }
  const data = await response.json();
  const text2 = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  return text2.trim();
}
async function geminiGenerateJSON(prompt, opts = {}) {
  const raw = await geminiGenerate(prompt, { ...opts, responseMimeType: "application/json" });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Gemini JSON parse failed:", cleaned);
    throw new GeminiError("AI returned malformed JSON.", 502);
  }
}
async function geminiStream(messages, opts = {}) {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
  const contents = messages.filter((m) => typeof m.content === "string" && m.content.length > 0).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const body = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024
    }
  };
  if (opts.systemInstruction) {
    body.system_instruction = { parts: [{ text: opts.systemInstruction }] };
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal: opts.signal
  });
  if (!response.ok || !response.body) {
    const text2 = await response.text().catch(() => "");
    console.error("Gemini stream error", response.status, text2);
    const { code, message } = mapStatus(response.status);
    throw new GeminiError(message, code, response.status);
  }
  return response.body;
}

// server/routes/chatRoutes.ts
var router3 = Router3();
router3.use(authMiddleware);
var SYSTEM_PROMPT = `You are NoteFlow AI, an intelligent note-taking assistant. You help users manage their notes through natural language commands.

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
router3.get("/conversations", async (req, res) => {
  try {
    const rows = await db.select().from(chatConversations).where(eq4(chatConversations.userId, req.userId)).orderBy(desc2(chatConversations.updatedAt)).limit(50);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router3.get("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [conv] = await db.select().from(chatConversations).where(and2(eq4(chatConversations.id, id), eq4(chatConversations.userId, req.userId))).limit(1);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const messages = await db.select().from(chatMessages).where(eq4(chatMessages.conversationId, id)).orderBy(asc(chatMessages.createdAt));
    res.json({ conversation: conv, messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router3.delete("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(chatConversations).where(and2(eq4(chatConversations.id, id), eq4(chatConversations.userId, req.userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router3.post("/", async (req, res) => {
  const { messages, conversationId: incomingId } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }
  const lastUser = [...messages].reverse().find((m) => m?.role === "user");
  if (!lastUser) {
    res.status(400).json({ error: "no user message provided" });
    return;
  }
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  let conversationId = null;
  try {
    if (incomingId) {
      const [existing] = await db.select({ id: chatConversations.id }).from(chatConversations).where(and2(eq4(chatConversations.id, incomingId), eq4(chatConversations.userId, req.userId))).limit(1);
      if (existing) conversationId = existing.id;
    }
    if (!conversationId) {
      const title = String(lastUser.content || "New chat").slice(0, 60);
      const [created] = await db.insert(chatConversations).values({ userId: req.userId, title }).returning({ id: chatConversations.id });
      conversationId = created.id;
    }
    await db.insert(chatMessages).values({
      conversationId,
      role: "user",
      content: String(lastUser.content)
    });
  } catch (e) {
    console.error("chat persistence error (pre):", e);
  }
  try {
    const stream = await geminiStream(messages, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 1024,
      signal: controller.signal
    });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    if (conversationId) {
      res.write(`data: ${JSON.stringify({ conversationId })}

`);
    }
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";
    let doneSent = false;
    const sendDone = () => {
      if (!doneSent) {
        res.write("data: [DONE]\n\n");
        doneSent = true;
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (!json) continue;
        if (json === "[DONE]") {
          sendDone();
          continue;
        }
        try {
          const parsed = JSON.parse(json);
          const text2 = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text2) {
            assistantText += text2;
            const chunk = { choices: [{ delta: { content: text2 }, index: 0 }] };
            res.write(`data: ${JSON.stringify(chunk)}

`);
          }
          if (parsed.candidates?.[0]?.finishReason) sendDone();
          if (parsed.error) {
            console.error("Gemini stream error payload:", parsed.error);
            res.write(`data: ${JSON.stringify({ error: parsed.error.message || "AI stream error" })}

`);
            sendDone();
          }
        } catch {
        }
      }
    }
    sendDone();
    res.end();
    if (conversationId && assistantText) {
      try {
        await db.insert(chatMessages).values({
          conversationId,
          role: "assistant",
          content: assistantText
        });
        await db.update(chatConversations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq4(chatConversations.id, conversationId));
      } catch (e) {
        console.error("chat persistence error (post):", e);
      }
    }
  } catch (e) {
    if (e?.name === "AbortError") {
      try {
        res.end();
      } catch {
      }
      return;
    }
    console.error("chat error:", e);
    if (e instanceof GeminiError) {
      if (!res.headersSent) {
        res.status(e.status).json({ error: e.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: e.message })}

`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || "Unknown error" });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}

`);
        res.write("data: [DONE]\n\n");
        res.end();
      } catch {
      }
    }
  }
});
var chatRoutes_default = router3;

// server/routes/aiRoutes.ts
import { Router as Router4 } from "express";
import { and as and3, eq as eq5 } from "drizzle-orm";
var router4 = Router4();
router4.use(authMiddleware);
function handleAIError(res, e) {
  if (e instanceof GeminiError) {
    res.status(e.status).json({ error: e.message });
    return;
  }
  console.error("AI route error:", e);
  res.status(500).json({ error: e?.message || "Unknown error" });
}
router4.post("/auto-tag", async (req, res) => {
  try {
    const { title = "", content = "", existingTags = [] } = req.body ?? {};
    const text2 = `${title}
${content}`.trim();
    if (!text2) {
      res.status(400).json({ error: "title or content required" });
      return;
    }
    const prompt = `You are an expert note tagger. Read the note and return 2-5 short, lowercase, single-or-two-word tags that best describe it. Avoid duplicates of existing tags.

Existing tags: ${existingTags.join(", ") || "(none)"}

Note title: ${title}
Note content: ${content}

Return STRICT JSON: {"tags": ["tag1", "tag2"]}`;
    const result = await geminiGenerateJSON(prompt, {
      temperature: 0.3,
      maxOutputTokens: 200
    });
    const cleanTags = (result.tags || []).filter((t) => typeof t === "string").map((t) => t.trim().toLowerCase().slice(0, 32)).filter((t) => t.length > 0).slice(0, 5);
    res.json({ tags: cleanTags });
  } catch (e) {
    handleAIError(res, e);
  }
});
router4.post("/summarize", async (req, res) => {
  try {
    const { title = "", content = "" } = req.body ?? {};
    const text2 = `${title}
${content}`.trim();
    if (!text2 || text2.length < 20) {
      res.status(400).json({ error: "Note content is too short to summarize." });
      return;
    }
    const summary = await geminiGenerate(
      `Summarize the following note in 1-2 concise sentences. No preamble, just the summary.

Title: ${title}

Content:
${content}`,
      { temperature: 0.3, maxOutputTokens: 200 }
    );
    res.json({ summary });
  } catch (e) {
    handleAIError(res, e);
  }
});
router4.post("/enhance", async (req, res) => {
  try {
    const { content = "" } = req.body ?? {};
    if (!content || content.trim().length < 5) {
      res.status(400).json({ error: "Content too short to enhance." });
      return;
    }
    const enhanced = await geminiGenerate(
      `Rewrite the following note to be clearer, more concise, and well-structured. Keep the original language and meaning. Return only the rewritten note, no explanations.

${content}`,
      { temperature: 0.4, maxOutputTokens: 800 }
    );
    res.json({ content: enhanced });
  } catch (e) {
    handleAIError(res, e);
  }
});
router4.post("/search", async (req, res) => {
  try {
    const { query } = req.body ?? {};
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "query required" });
      return;
    }
    const userNotes = await db.select({ id: notes.id, title: notes.title, content: notes.content }).from(notes).where(and3(eq5(notes.userId, req.userId), eq5(notes.isDeleted, false)));
    if (userNotes.length === 0) {
      res.json({ noteIds: [], explanation: "No notes to search." });
      return;
    }
    const corpus = userNotes.map((n, i) => `[${i}] id=${n.id} | title="${n.title}" | ${(n.content || "").slice(0, 300)}`).join("\n");
    const result = await geminiGenerateJSON(
      `You are a semantic search engine over a user's notes. Given a query, return the IDs of the most relevant notes (max 10), most relevant first. If none match, return an empty array.

Query: ${query}

Notes:
${corpus}

Return STRICT JSON: {"noteIds": ["uuid1", "uuid2"], "explanation": "short reason"}`,
      { temperature: 0.2, maxOutputTokens: 400 }
    );
    const validIds = new Set(userNotes.map((n) => n.id));
    const noteIds = (result.noteIds || []).filter((id) => validIds.has(id)).slice(0, 10);
    res.json({ noteIds, explanation: result.explanation || "" });
  } catch (e) {
    handleAIError(res, e);
  }
});
router4.post("/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body ?? {};
    if (!audioBase64 || typeof audioBase64 !== "string") {
      res.status(400).json({ error: "audioBase64 required" });
      return;
    }
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "AI service not configured." });
      return;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: "Transcribe this audio verbatim. Return only the transcript, no preamble." },
              { inline_data: { mime_type: mimeType, data: audioBase64 } }
            ]
          }
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 2048 }
      })
    });
    if (!upstream.ok) {
      const t = await upstream.text().catch(() => "");
      console.error("Transcribe error", upstream.status, t);
      const code = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 503;
      res.status(code).json({ error: "Transcription failed." });
      return;
    }
    const data = await upstream.json();
    const transcript = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() ?? "";
    res.json({ transcript });
  } catch (e) {
    handleAIError(res, e);
  }
});
var aiRoutes_default = router4;

// server/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes_default);
app.use("/api/notes", notesRoutes_default);
app.use("/api/chat", chatRoutes_default);
app.use("/api/ai", aiRoutes_default);
var distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
var index_default = app;
export {
  index_default as default
};
