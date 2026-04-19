import { motion } from 'framer-motion';
import { Pin, Sparkles, Code, CheckSquare, MoreHorizontal, Mic, Archive, Trash2, PinOff, RotateCcw, Bell } from 'lucide-react';
import { useState } from 'react';
import type { Note, NoteColor } from '@/data/mockNotes';
import { useNotes } from '@/store/NotesContext';

const colorStyles: Record<NoteColor, { bg: string; border: string; dot: string; text: string }> = {
  yellow:  { bg: 'bg-amber-400/15 dark:bg-amber-400/12',    border: 'border-amber-400/50',   dot: 'bg-amber-400',   text: 'text-amber-300' },
  green:   { bg: 'bg-emerald-400/15 dark:bg-emerald-400/12', border: 'border-emerald-400/50', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  blue:    { bg: 'bg-sky-400/15 dark:bg-sky-400/12',         border: 'border-sky-400/50',     dot: 'bg-sky-400',     text: 'text-sky-300' },
  pink:    { bg: 'bg-rose-400/15 dark:bg-rose-400/12',       border: 'border-rose-400/50',    dot: 'bg-rose-400',    text: 'text-rose-300' },
  orange:  { bg: 'bg-orange-400/15 dark:bg-orange-400/12',   border: 'border-orange-400/50',  dot: 'bg-orange-400',  text: 'text-orange-300' },
  purple:  { bg: 'bg-violet-400/15 dark:bg-violet-400/12',   border: 'border-violet-400/50',  dot: 'bg-violet-400',  text: 'text-violet-300' },
  teal:    { bg: 'bg-teal-400/15 dark:bg-teal-400/12',       border: 'border-teal-400/50',    dot: 'bg-teal-400',    text: 'text-teal-300' },
  default: { bg: 'bg-secondary/60',                          border: 'border-border',          dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
};

const glowMap: Record<NoteColor, string> = {
  pink:    'hover:shadow-rose-500/20',
  orange:  'hover:shadow-orange-500/15',
  yellow:  'hover:shadow-amber-500/15',
  green:   'hover:shadow-emerald-500/15',
  blue:    'hover:shadow-sky-500/15',
  purple:  'hover:shadow-violet-500/15',
  teal:    'hover:shadow-teal-500/15',
  default: '',
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
  const cs = colorStyles[note.color];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`
        relative rounded-2xl cursor-pointer group overflow-hidden
        border ${cs.border}
        ${cs.bg}
        shadow-lg ${glowMap[note.color]}
        hover:shadow-xl transition-all duration-200
        backdrop-blur-sm
      `}
    >
      {/* Top accent stripe */}
      {note.color !== 'default' && (
        <div className={`h-[3px] w-full ${cs.dot} opacity-70`} />
      )}

      <div onClick={() => onClick(note)} className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 flex-1">
            {note.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {hasReminder && <Bell className="w-3.5 h-3.5 text-orange-400" />}
            {note.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
            {note.isVoiceNote && <Mic className="w-3.5 h-3.5 text-accent" />}
          </div>
        </div>

        {/* Content */}
        {note.content && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5 mb-3">
            {note.content}
          </p>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                  ${note.color !== 'default'
                    ? `${cs.bg} ${cs.text} border ${cs.border}`
                    : 'bg-secondary text-secondary-foreground'
                  }`}
              >
                {tag.isAI && <Sparkles className="w-2.5 h-2.5" />}
                {tag.name}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground px-1">+{note.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 text-[10px] text-muted-foreground">
        <span>{timeAgo}</span>
        <div className="flex items-center gap-2">
          {note.hasCode && <Code className="w-3 h-3" />}
          {note.hasChecklist && <CheckSquare className="w-3 h-3" />}
          <span className={`w-2 h-2 rounded-full ${cs.dot}`} />

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 bottom-full mb-1 glass-strong rounded-xl p-1.5 min-w-[148px] z-20 shadow-2xl"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
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
