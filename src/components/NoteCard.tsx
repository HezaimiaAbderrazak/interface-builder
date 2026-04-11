import { motion } from 'framer-motion';
import { Pin, Sparkles, Code, CheckSquare, MoreHorizontal, Mic, Archive, Trash2, PinOff, RotateCcw, Bell } from 'lucide-react';
import { useState } from 'react';
import type { Note, NoteColor } from '@/data/mockNotes';
import { useNotes } from '@/store/NotesContext';

const colorMap: Record<NoteColor, string> = {
  yellow: 'border-l-note-yellow', green: 'border-l-note-green', blue: 'border-l-note-blue',
  pink: 'border-l-note-pink', orange: 'border-l-note-orange', purple: 'border-l-note-purple',
  teal: 'border-l-note-teal', default: 'border-l-muted-foreground/30',
};

const dotColorMap: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow', green: 'bg-note-green', blue: 'bg-note-blue',
  pink: 'bg-note-pink', orange: 'bg-note-orange', purple: 'bg-note-purple',
  teal: 'bg-note-teal', default: 'bg-muted-foreground/30',
};

// Priority glow map for high-importance notes
const priorityGlowMap: Record<NoteColor, string> = {
  pink: 'shadow-[0_0_20px_hsl(var(--note-pink)/0.3)] animate-pulse',
  orange: 'shadow-[0_0_15px_hsl(var(--note-orange)/0.25)]',
  yellow: 'shadow-[0_0_10px_hsl(var(--note-yellow)/0.15)]',
  green: '', blue: '', purple: '', teal: '', default: '',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`glass rounded-xl p-4 cursor-pointer group border-l-[3px] ${colorMap[note.color]} hover:border-border/60 transition-all relative ${priorityGlowMap[note.color]}`}
    >
      <div onClick={() => onClick(note)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm text-foreground leading-snug pr-2 line-clamp-2">{note.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasReminder && <Bell className="w-3.5 h-3.5 text-note-orange" />}
            {note.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
            {note.isVoiceNote && <Mic className="w-3.5 h-3.5 text-accent" />}
          </div>
        </div>
        {/* Content */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 mb-3">{note.content}</p>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
              {tag.isAI && <Sparkles className="w-2.5 h-2.5 text-primary" />}
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{timeAgo}</span>
        <div className="flex items-center gap-2">
          {note.hasCode && <Code className="w-3 h-3" />}
          {note.hasChecklist && <CheckSquare className="w-3 h-3" />}
          <span className={`w-2 h-2 rounded-full ${dotColorMap[note.color]}`} />

          {/* Quick Actions */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 bottom-full mb-1 glass-strong rounded-lg p-1 min-w-[140px] z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {viewMode === 'default' && (
                  <>
                    <button onClick={() => { togglePin(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors">
                      {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      {note.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => { archiveNote(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors">
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                    <button onClick={() => { deleteNote(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
                {viewMode === 'archive' && (
                  <>
                    <button onClick={() => { restoreNote(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                    <button onClick={() => { deleteNote(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
                {viewMode === 'trash' && (
                  <>
                    <button onClick={() => { restoreNote(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                    <button onClick={() => { permanentlyDelete(note.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors">
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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
