import { motion } from 'framer-motion';
import { Pin, Sparkles, Code, CheckSquare, MoreHorizontal } from 'lucide-react';
import type { Note, NoteColor } from '@/data/mockNotes';

const colorMap: Record<NoteColor, string> = {
  yellow: 'border-l-note-yellow',
  green: 'border-l-note-green',
  blue: 'border-l-note-blue',
  pink: 'border-l-note-pink',
  orange: 'border-l-note-orange',
  purple: 'border-l-note-purple',
  teal: 'border-l-note-teal',
  default: 'border-l-muted-foreground/30',
};

const dotColorMap: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow',
  green: 'bg-note-green',
  blue: 'bg-note-blue',
  pink: 'bg-note-pink',
  orange: 'bg-note-orange',
  purple: 'bg-note-purple',
  teal: 'bg-note-teal',
  default: 'bg-muted-foreground/30',
};

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const timeAgo = getTimeAgo(note.updatedAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(note)}
      className={`glass rounded-xl p-4 cursor-pointer group border-l-[3px] ${colorMap[note.color]} hover:border-border/60 transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm text-foreground leading-snug pr-2 line-clamp-2">
          {note.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {note.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary">
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 mb-3">
        {note.content}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {note.tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground"
          >
            {tag.isAI && <Sparkles className="w-2.5 h-2.5 text-primary" />}
            {tag.name}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{timeAgo}</span>
        <div className="flex items-center gap-2">
          {note.hasCode && <Code className="w-3 h-3" />}
          {note.hasChecklist && <CheckSquare className="w-3 h-3" />}
          <span className={`w-2 h-2 rounded-full ${dotColorMap[note.color]}`} />
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
