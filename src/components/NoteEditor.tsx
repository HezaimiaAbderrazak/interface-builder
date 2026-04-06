import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Bold, Italic, Code, List, CheckSquare, Link,
  Heading1, Heading2, Tag, Wand2, FileText, Share2, Pin, PinOff,
  Archive, Trash2, Palette
} from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import type { Note, NoteColor } from '@/data/mockNotes';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
}

const colorOptions: { value: NoteColor; class: string }[] = [
  { value: 'default', class: 'bg-muted' },
  { value: 'yellow', class: 'bg-note-yellow' },
  { value: 'green', class: 'bg-note-green' },
  { value: 'blue', class: 'bg-note-blue' },
  { value: 'pink', class: 'bg-note-pink' },
  { value: 'orange', class: 'bg-note-orange' },
  { value: 'purple', class: 'bg-note-purple' },
  { value: 'teal', class: 'bg-note-teal' },
];

export default function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { updateNote, togglePin, archiveNote, deleteNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showColors, setShowColors] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    updateNote(note.id, { title: title.trim() || 'Untitled', content });
    onClose();
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !note.tags.find(tag => tag.name === t)) {
      updateNote(note.id, { tags: [...note.tags, { id: crypto.randomUUID(), name: t, isAI: false }] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    updateNote(note.id, { tags: note.tags.filter(t => t.id !== tagId) });
  };

  const handleColorChange = (color: NoteColor) => {
    updateNote(note.id, { color });
    setShowColors(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={handleSave} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-full max-w-2xl glass-strong border-l border-border flex flex-col"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-border">
          <div className="flex items-center gap-1">
            {[Bold, Italic, Code, Heading1, Heading2, List, CheckSquare, Link].map((Icon, i) => (
              <button key={i} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => togglePin(note.id)} className={`p-2 rounded-md transition-colors ${note.isPinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button onClick={() => { archiveNote(note.id); onClose(); }} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Archive className="w-4 h-4" />
            </button>
            <button onClick={() => { deleteNote(note.id); onClose(); }} className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={handleSave} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-semibold text-foreground bg-transparent outline-none mb-4 placeholder:text-muted-foreground"
            placeholder="Note title..."
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {note.tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {tag.isAI && <Sparkles className="w-3 h-3 text-primary" />}
                {tag.name}
                <X className="w-3 h-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => handleRemoveTag(tag.id)} />
              </span>
            ))}
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-muted-foreground border border-dashed border-border">
              <Tag className="w-3 h-3" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag"
                className="bg-transparent outline-none w-14 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Body */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[300px] text-sm text-foreground bg-transparent outline-none resize-none leading-relaxed placeholder:text-muted-foreground"
            placeholder="Start writing..."
          />
        </div>

        {/* AI Actions + Color */}
        <div className="px-6 py-3 border-t border-border flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowColors(!showColors)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Palette className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showColors && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 p-2 glass-strong rounded-lg">
                  {colorOptions.map((c) => (
                    <button key={c.value} onClick={() => handleColorChange(c.value)}
                      className={`w-6 h-6 rounded-full ${c.class} transition-transform ${note.color === c.value ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110' : 'hover:scale-110'}`} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
            <Wand2 className="w-3.5 h-3.5" />
            AI Enhance
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
            <FileText className="w-3.5 h-3.5" />
            Summarize
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Tag
          </button>
          <div className="flex-1" />
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
