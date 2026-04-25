import { motion } from 'framer-motion';
import { Pin, Sparkles, MoreHorizontal, Mic, Archive, Trash2, PinOff, RotateCcw, Bell } from 'lucide-react';
import { useState } from 'react';
import type { Note, NoteColor } from '@/types';
import { useNotes } from '@/store/NotesContext';

const colorBar: Record<NoteColor, string> = {
  yellow:  'bg-amber-400',
  green:   'bg-emerald-400',
  blue:    'bg-sky-400',
  pink:    'bg-rose-400',
  orange:  'bg-orange-400',
  purple:  'bg-violet-500',
  teal:    'bg-teal-400',
  default: 'bg-transparent',
};

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  viewMode?: 'default' | 'archive' | 'trash';
}

export default function NoteCard({ note, onClick, viewMode = 'default' }: NoteCardProps) {
  const { togglePin, archiveNote, deleteNote, restoreNote, permanentlyDelete } = useNotes();
  const [showMenu, setShowMenu] = useState(false);
  const timeAgo = getTimeAgo(note.updatedAt);
  const hasReminder = !!(note as any).reminderAt;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all duration-150 group"
    >
      {/* Color stripe */}
      {note.color !== 'default' && (
        <div className={`h-1 w-full ${colorBar[note.color]}`} />
      )}

      <div onClick={() => onClick(note)} className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 flex-1">
            {note.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {hasReminder && <Bell className="w-3 h-3 text-orange-400" />}
            {note.isPinned && <Pin className="w-3 h-3 text-primary" />}
            {note.isVoiceNote && <Mic className="w-3 h-3 text-primary/70" />}
          </div>
        </div>

        {note.content && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 mb-2.5">
            {note.content}
          </p>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags.slice(0, 3).map((tag) => (
              <span key={tag.id}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground">
                {tag.isAI && <Sparkles className="w-2.5 h-2.5 text-primary" />}
                {tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 pb-2.5 -mt-1">
        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary text-muted-foreground"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 bottom-full mb-1 bg-card border border-border rounded-xl p-1 min-w-[140px] z-20 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {viewMode === 'default' && (
                <>
                  <button onClick={() => { togglePin(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors">
                    {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    {note.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => { archiveNote(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                  <button onClick={() => { deleteNote(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-red-50 dark:hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
              {viewMode === 'archive' && (
                <>
                  <button onClick={() => { restoreNote(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button onClick={() => { deleteNote(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-red-50 dark:hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
              {viewMode === 'trash' && (
                <>
                  <button onClick={() => { restoreNote(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary rounded-lg transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button onClick={() => { permanentlyDelete(note.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-red-50 dark:hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                  </button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
