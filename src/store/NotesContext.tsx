import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Note, NoteColor, Tag } from '@/data/mockNotes';
import { mockNotes } from '@/data/mockNotes';

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  archiveNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  getNote: (id: string) => Note | undefined;
}

const NotesContext = createContext<NotesContextType | null>(null);

const STORAGE_KEY = 'noteflow-notes';

function loadNotes(): Note[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return mockNotes.map(n => ({ ...n, isDeleted: false }));
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(loadNotes);

  useEffect(() => { saveNotes(notes); }, [notes]);

  const addNote = useCallback((data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const now = new Date().toISOString();
    const note: Note = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true, isArchived: false, updatedAt: new Date().toISOString() } : n));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n));
  }, []);

  const archiveNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isArchived: true, isPinned: false, updatedAt: new Date().toISOString() } : n));
  }, []);

  const restoreNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isArchived: false, isDeleted: false, updatedAt: new Date().toISOString() } : n));
  }, []);

  const permanentlyDelete = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const emptyTrash = useCallback(() => {
    setNotes(prev => prev.filter(n => !n.isDeleted));
  }, []);

  const getNote = useCallback((id: string) => notes.find(n => n.id === id), [notes]);

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, togglePin, archiveNote, restoreNote, permanentlyDelete, emptyTrash, getNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
