import { pgTable, text, boolean, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default(''),
  content: text('content').default(''),
  color: text('color').notNull().default('default'),
  isPinned: boolean('is_pinned').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  isVoiceNote: boolean('is_voice_note').notNull().default(false),
  voiceDuration: integer('voice_duration'),
  reminderAt: timestamp('reminder_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isAI: boolean('is_ai').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const noteTags = pgTable('note_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export type User = typeof users.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type NoteTag = typeof noteTags.$inferSelect;
