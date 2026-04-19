import { Router } from 'express';
import { db } from '../db.js';
import { notes, tags, noteTags } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../auth.js';
import type { AuthRequest } from '../auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userNotes = await db.select().from(notes)
      .where(eq(notes.userId, req.userId!))
      .orderBy(desc(notes.updatedAt));

    const noteIds = userNotes.map(n => n.id);
    let tagsMap: Record<string, { id: string; name: string; isAI: boolean }[]> = {};

    if (noteIds.length > 0) {
      const allNoteTags = await db
        .select({ noteId: noteTags.noteId, tagId: tags.id, name: tags.name, isAI: tags.isAI })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(tags.userId, req.userId!));

      for (const nt of allNoteTags) {
        if (!tagsMap[nt.noteId]) tagsMap[nt.noteId] = [];
        tagsMap[nt.noteId].push({ id: nt.tagId, name: nt.name, isAI: nt.isAI });
      }
    }

    const result = userNotes.map(n => ({
      ...n,
      tags: tagsMap[n.id] || [],
    }));

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, content, color, isPinned, isArchived, isVoiceNote, voiceDuration, reminderAt, tags: tagList } = req.body;
    const [note] = await db.insert(notes).values({
      userId: req.userId!,
      title: title || '',
      content: content || '',
      color: color || 'default',
      isPinned: isPinned || false,
      isArchived: isArchived || false,
      isVoiceNote: isVoiceNote || false,
      voiceDuration: voiceDuration || null,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
    }).returning();

    const noteTa = await upsertTags(req.userId!, note.id, tagList || []);
    res.json({ ...note, tags: noteTa });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { tags: tagList, ...updates } = req.body;

    const [existing] = await db.select().from(notes).where(and(eq(notes.id, id), eq(notes.userId, req.userId!))).limit(1);
    if (!existing) { res.status(404).json({ error: 'Note not found' }); return; }

    const updateData: any = { updatedAt: new Date() };
    const allowed = ['title', 'content', 'color', 'isPinned', 'isArchived', 'isDeleted', 'isVoiceNote', 'voiceDuration', 'reminderAt'];
    for (const key of allowed) {
      if (key in updates) {
        if (key === 'reminderAt') updateData[key] = updates[key] ? new Date(updates[key]) : null;
        else updateData[key] = updates[key];
      }
    }

    const [note] = await db.update(notes).set(updateData).where(and(eq(notes.id, id), eq(notes.userId, req.userId!))).returning();

    let noteTa = null;
    if (tagList !== undefined) {
      noteTa = await upsertTags(req.userId!, id, tagList);
    } else {
      noteTa = await getNoteTags(req.userId!, id);
    }

    res.json({ ...note, tags: noteTa });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, req.userId!)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function upsertTags(userId: string, noteId: string, tagList: { name: string; isAI: boolean }[]) {
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  if (!tagList.length) return [];

  const result = [];
  for (const t of tagList) {
    let [tag] = await db.select().from(tags).where(and(eq(tags.userId, userId), eq(tags.name, t.name))).limit(1);
    if (!tag) {
      [tag] = await db.insert(tags).values({ userId, name: t.name, isAI: t.isAI }).returning();
    }
    await db.insert(noteTags).values({ noteId, tagId: tag.id }).onConflictDoNothing();
    result.push({ id: tag.id, name: tag.name, isAI: tag.isAI });
  }
  return result;
}

async function getNoteTags(userId: string, noteId: string) {
  const rows = await db
    .select({ id: tags.id, name: tags.name, isAI: tags.isAI })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(and(eq(noteTags.noteId, noteId), eq(tags.userId, userId)));
  return rows;
}

export default router;
