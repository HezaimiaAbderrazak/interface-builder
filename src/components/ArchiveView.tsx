import { motion } from 'framer-motion';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import NoteCard from '@/components/NoteCard';
import type { Note } from '@/types';

interface ArchiveViewProps {
  onNoteClick: (note: Note) => void;
}

export default function ArchiveView({ onNoteClick }: ArchiveViewProps) {
  const { notes } = useNotes();
  const archivedNotes = notes.filter(n => n.isArchived && !n.isDeleted);

  return (
    <div className="px-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Archive className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Archive</h2>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{archivedNotes.length}</span>
      </div>

      {archivedNotes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <Archive className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">No archived notes</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Archived notes will appear here</p>
        </motion.div>
      ) : (
        <div className="masonry">
          {archivedNotes.map(note => (
            <NoteCard key={note.id} note={note} onClick={onNoteClick} viewMode="archive" />
          ))}
        </div>
      )}
    </div>
  );
}
