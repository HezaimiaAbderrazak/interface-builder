import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import NoteCard from '@/components/NoteCard';
import type { Note } from '@/data/mockNotes';

interface TrashViewProps {
  onNoteClick: (note: Note) => void;
}

export default function TrashView({ onNoteClick }: TrashViewProps) {
  const { notes, emptyTrash } = useNotes();
  const trashedNotes = notes.filter(n => n.isDeleted);

  return (
    <div className="px-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Trash</h2>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{trashedNotes.length}</span>
        </div>
        {trashedNotes.length > 0 && (
          <button onClick={emptyTrash} className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium">
            Empty Trash
          </button>
        )}
      </div>

      {trashedNotes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <Trash2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Trash is empty</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Deleted notes will appear here</p>
        </motion.div>
      ) : (
        <div className="masonry">
          {trashedNotes.map(note => (
            <NoteCard key={note.id} note={note} onClick={onNoteClick} viewMode="trash" />
          ))}
        </div>
      )}
    </div>
  );
}
