import { motion } from 'framer-motion';
import { Sparkles, Tag, Hash } from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import NoteCard from '@/components/NoteCard';
import type { Note } from '@/data/mockNotes';
import { useMemo, useState } from 'react';

interface TagsViewProps {
  onNoteClick: (note: Note) => void;
  aiOnly?: boolean;
}

export default function TagsView({ onNoteClick, aiOnly = false }: TagsViewProps) {
  const { notes } = useNotes();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const activeNotes = notes.filter(n => !n.isArchived && !n.isDeleted);

  const tagMap = useMemo(() => {
    const map = new Map<string, { count: number; isAI: boolean }>();
    activeNotes.forEach(note => {
      note.tags.forEach(tag => {
        if (aiOnly && !tag.isAI) return;
        const existing = map.get(tag.name);
        if (existing) existing.count++;
        else map.set(tag.name, { count: 1, isAI: tag.isAI });
      });
    });
    return map;
  }, [activeNotes, aiOnly]);

  const filteredNotes = selectedTag
    ? activeNotes.filter(n => n.tags.some(t => t.name === selectedTag))
    : activeNotes.filter(n => aiOnly ? n.tags.some(t => t.isAI) : n.tags.length > 0);

  return (
    <div className="px-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        {aiOnly ? <Sparkles className="w-5 h-5 text-primary" /> : <Hash className="w-5 h-5 text-muted-foreground" />}
        <h2 className="text-lg font-semibold text-foreground">{aiOnly ? 'AI Tags' : 'Tags'}</h2>
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedTag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          All
        </button>
        {[...tagMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([name, { count, isAI }]) => (
          <button
            key={name}
            onClick={() => setSelectedTag(selectedTag === name ? null : name)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedTag === name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {isAI && <Sparkles className="w-3 h-3" />}
            {name}
            <span className="opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Notes */}
      {filteredNotes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">No tagged notes found</p>
        </motion.div>
      ) : (
        <div className="masonry">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} onClick={onNoteClick} />
          ))}
        </div>
      )}
    </div>
  );
}
