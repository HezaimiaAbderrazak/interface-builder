import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Note as NoteType, NoteColor, Tag } from '@/types';
import { notesApi } from '@/lib/api';
import { toast } from 'sonner';

interface NotesContextType {
  notes: NoteType[];
  loading: boolean;
  addNote: (note: Omit<NoteType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NoteType>;
  updateNote: (id: string, updates: Partial<NoteType>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  getNote: (id: string) => NoteType | undefined;
}

const NotesContext = createContext<NotesContextType | null>(null);

function serverNoteToLocal(n: any): NoteType {
  return {
    id: n.id,
    title: n.title,
    content: n.content || '',
    color: (n.color as NoteColor) || 'default',
    isPinned: n.isPinned,
    isArchived: n.isArchived,
    isDeleted: n.isDeleted,
    tags: (n.tags || []).map((t: any) => ({ id: t.id, name: t.name, isAI: t.isAI })),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    isVoiceNote: n.isVoiceNote,
    voiceDuration: n.voiceDuration || undefined,
    audioUrl: n.audioUrl || null,
  };
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notesApi.list()
      .then(data => setNotes(data.map(serverNoteToLocal)))
      .catch(e => toast.error('Failed to load notes: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const addNote = useCallback(async (data: Omit<NoteType, 'id' | 'createdAt' | 'updatedAt'>): Promise<NoteType> => {
    const server = await notesApi.create({
      title: data.title,
      content: data.content,
      color: data.color,
      isPinned: data.isPinned,
      isArchived: data.isArchived,
      isDeleted: data.isDeleted,
      isVoiceNote: data.isVoiceNote,
      voiceDuration: data.voiceDuration ?? null,
      audioUrl: (data as any).audioUrl ?? null,
      tags: data.tags as any,
    });
    const note = serverNoteToLocal(server);
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<NoteType>) => {
    const server = await notesApi.update(id, {
      ...updates,
      tags: updates.tags as any,
    });
    const note = serverNoteToLocal(server);
    setNotes(prev => prev.map(n => n.id === id ? note : n));
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await updateNote(id, { isDeleted: true, isArchived: false });
  }, [updateNote]);

  const togglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) await updateNote(id, { isPinned: !note.isPinned });
  }, [notes, updateNote]);

  const archiveNote = useCallback(async (id: string) => {
    await updateNote(id, { isArchived: true, isPinned: false });
  }, [updateNote]);

  const restoreNote = useCallback(async (id: string) => {
    await updateNote(id, { isArchived: false, isDeleted: false });
  }, [updateNote]);

  const permanentlyDelete = useCallback(async (id: string) => {
    await notesApi.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const emptyTrash = useCallback(async () => {
    const trashed = notes.filter(n => n.isDeleted);
    await Promise.all(trashed.map(n => notesApi.delete(n.id)));
    setNotes(prev => prev.filter(n => !n.isDeleted));
  }, [notes]);

  const getNote = useCallback((id: string) => notes.find(n => n.id === id), [notes]);

  return (
    <NotesContext.Provider value={{ notes, loading, addNote, updateNote, deleteNote, togglePin, archiveNote, restoreNote, permanentlyDelete, emptyTrash, getNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
