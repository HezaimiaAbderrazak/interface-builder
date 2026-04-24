import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull().default(''),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailLowerIdx: uniqueIndex('users_email_lower_idx').on(t.email),
  }),
);

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('dark'),
  language: text('language').notNull().default('en'),
  defaultNoteColor: text('default_note_color').notNull().default('default'),
  aiEnabled: boolean('ai_enabled').notNull().default(true),
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default(''),
    content: text('content').default(''),
    color: text('color').notNull().default('default'),
    isPinned: boolean('is_pinned').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    isVoiceNote: boolean('is_voice_note').notNull().default(false),
    voiceDuration: integer('voice_duration'),
    audioUrl: text('audio_url'),
    transcript: text('transcript'),
    summary: text('summary'),
    reminderAt: timestamp('reminder_at', { withTimezone: true }),
    reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUpdatedIdx: index('notes_user_updated_idx').on(t.userId, t.updatedAt),
    userPinnedIdx: index('notes_user_pinned_idx').on(t.userId, t.isPinned),
    userArchivedIdx: index('notes_user_archived_idx').on(t.userId, t.isArchived),
    userDeletedIdx: index('notes_user_deleted_idx').on(t.userId, t.isDeleted),
    reminderIdx: index('notes_reminder_idx').on(t.reminderAt),
  }),
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isAI: boolean('is_ai').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userNameUq: uniqueIndex('tags_user_name_uq').on(t.userId, t.name),
  }),
);

export const noteTags = pgTable(
  'note_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    noteTagUq: uniqueIndex('note_tags_note_tag_uq').on(t.noteId, t.tagId),
    tagIdx: index('note_tags_tag_idx').on(t.tagId),
  }),
);

export const noteAttachments = pgTable(
  'note_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    noteIdx: index('note_attachments_note_idx').on(t.noteId),
  }),
);

export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('New conversation'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userUpdatedIdx: index('chat_conv_user_updated_idx').on(t.userId, t.updatedAt),
  }),
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    actions: jsonb('actions').$type<unknown[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    conversationIdx: index('chat_msg_conv_idx').on(t.conversationId, t.createdAt),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  notes: many(notes),
  tags: many(tags),
  conversations: many(chatConversations),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  tags: many(noteTags),
  attachments: many(noteAttachments),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  notes: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const noteAttachmentsRelations = relations(noteAttachments, ({ one }) => ({
  note: one(notes, { fields: [noteAttachments.noteId], references: [notes.id] }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, { fields: [chatConversations.userId], references: [users.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type NoteTag = typeof noteTags.$inferSelect;
export type NoteAttachment = typeof noteAttachments.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
