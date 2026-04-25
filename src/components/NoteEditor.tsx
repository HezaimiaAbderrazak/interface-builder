import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Bold, Italic, Code, List, CheckSquare, Link,
  Heading1, Heading2, Tag, Wand2, FileText, Pin, PinOff,
  Archive, Trash2, Palette, Loader2
} from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Note, NoteColor } from '@/types';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
}

const colorOptions: { value: NoteColor; solid: string; ring: string; label: string }[] = [
  { value: 'default', solid: 'bg-slate-500',   ring: 'ring-slate-400',   label: 'Default' },
  { value: 'yellow',  solid: 'bg-amber-400',   ring: 'ring-amber-400',   label: 'Yellow' },
  { value: 'green',   solid: 'bg-emerald-400', ring: 'ring-emerald-400', label: 'Green' },
  { value: 'blue',    solid: 'bg-sky-400',     ring: 'ring-sky-400',     label: 'Blue' },
  { value: 'pink',    solid: 'bg-rose-400',    ring: 'ring-rose-400',    label: 'Pink' },
  { value: 'orange',  solid: 'bg-orange-400',  ring: 'ring-orange-400',  label: 'Orange' },
  { value: 'purple',  solid: 'bg-violet-400',  ring: 'ring-violet-400',  label: 'Purple' },
  { value: 'teal',    solid: 'bg-teal-400',    ring: 'ring-teal-400',    label: 'Teal' },
];

const colorAccent: Record<NoteColor, string> = {
  yellow: 'from-amber-500/10 to-transparent',
  green:  'from-emerald-500/10 to-transparent',
  blue:   'from-sky-500/10 to-transparent',
  pink:   'from-rose-500/10 to-transparent',
  orange: 'from-orange-500/10 to-transparent',
  purple: 'from-violet-500/10 to-transparent',
  teal:   'from-teal-500/10 to-transparent',
  default:'from-transparent to-transparent',
};

export default function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { updateNote, togglePin, archiveNote, deleteNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showColors, setShowColors] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [aiBusy, setAiBusy] = useState<null | 'enhance' | 'summarize' | 'autotag'>(null);

  const handleEnhance = async () => {
    if (!content.trim()) { toast.error('Nothing to enhance yet.'); return; }
    setAiBusy('enhance');
    try {
      const { content: enhanced } = await aiApi.enhance({ content });
      setContent(enhanced);
      updateNote(note.id, { content: enhanced });
      toast.success('Note enhanced');
    } catch (e: any) {
      toast.error(e.message || 'Enhance failed');
    } finally { setAiBusy(null); }
  };

  const handleSummarize = async () => {
    if (!content.trim()) { toast.error('Nothing to summarize yet.'); return; }
    setAiBusy('summarize');
    try {
      const { summary } = await aiApi.summarize({ title, content });
      const next = `${content}\n\n---\n📝 Summary: ${summary}`;
      setContent(next);
      updateNote(note.id, { content: next });
      toast.success('Summary added');
    } catch (e: any) {
      toast.error(e.message || 'Summarize failed');
    } finally { setAiBusy(null); }
  };

  const handleAutoTag = async () => {
    if (!title.trim() && !content.trim()) { toast.error('Add some text first.'); return; }
    setAiBusy('autotag');
    try {
      const existing = note.tags.map(t => t.name);
      const { tags: suggested } = await aiApi.autoTag({ title, content, existingTags: existing });
      const newTags = suggested
        .filter(name => !existing.includes(name))
        .map(name => ({ id: crypto.randomUUID(), name, isAI: true }));
      if (newTags.length === 0) { toast.info('No new tags to add'); return; }
      updateNote(note.id, { tags: [...note.tags, ...newTags] });
      toast.success(`Added ${newTags.length} AI tag${newTags.length > 1 ? 's' : ''}`);
    } catch (e: any) {
      toast.error(e.message || 'Auto-tag failed');
    } finally { setAiBusy(null); }
  };

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

  const handleColorChange = (c: NoteColor) => {
    updateNote(note.id, { color: c });
    setShowColors(false);
  };

  const currentColor = colorOptions.find(c => c.value === note.color)!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={handleSave} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-full max-w-2xl glass-strong border-l border-border flex flex-col overflow-hidden"
      >
        {/* Color accent gradient at top */}
        <div className={`absolute inset-x-0 top-0 h-48 bg-gradient-to-b ${colorAccent[note.color]} pointer-events-none`} />

        {/* Toolbar */}
        <div className="relative flex items-center justify-between px-5 h-14 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-0.5">
            {[Bold, Italic, Code, Heading1, Heading2, List, CheckSquare, Link].map((Icon, i) => (
              <button key={i} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => togglePin(note.id)}
              className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button onClick={() => { archiveNote(note.id); onClose(); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Archive className="w-4 h-4" />
            </button>
            <button onClick={() => { deleteNote(note.id); onClose(); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={handleSave}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold text-foreground bg-transparent outline-none mb-5 placeholder:text-muted-foreground/50 tracking-tight"
            placeholder="Note title..."
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {note.tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {tag.isAI && <Sparkles className="w-3 h-3 text-primary" />}
                {tag.name}
                <X className="w-3 h-3 ml-1 cursor-pointer hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => updateNote(note.id, { tags: note.tags.filter(t => t.id !== tag.id) })} />
              </span>
            ))}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-muted-foreground border border-dashed border-border/60 hover:border-border transition-colors">
              <Tag className="w-3 h-3" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag"
                className="bg-transparent outline-none w-16 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Body */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[360px] text-sm text-foreground bg-transparent outline-none resize-none leading-7 placeholder:text-muted-foreground/50"
            placeholder="Start writing..."
          />
        </div>

        {/* Footer */}
        <div className="relative px-5 py-3 border-t border-border/60 flex items-center gap-2 flex-shrink-0">
          {/* Color picker */}
          <div className="relative">
            <button onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-secondary transition-colors">
              <div className={`w-4 h-4 rounded-full ${currentColor.solid}`} />
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showColors && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 p-3 glass-strong rounded-2xl shadow-2xl border border-border/60 z-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Note Color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((c) => (
                      <button key={c.value} onClick={() => handleColorChange(c.value)}
                        title={c.label}
                        className={`w-10 h-10 rounded-xl ${c.solid} transition-all hover:scale-110 hover:brightness-110
                          ${note.color === c.value ? `ring-2 ring-offset-2 ring-offset-background ${c.ring} scale-110` : ''}`} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleEnhance} disabled={aiBusy !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">
            {aiBusy === 'enhance' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} AI Enhance
          </button>
          <button onClick={handleSummarize} disabled={aiBusy !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
            {aiBusy === 'summarize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Summarize
          </button>
          <button onClick={handleAutoTag} disabled={aiBusy !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
            {aiBusy === 'autotag' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Auto-Tag
          </button>
          <div className="flex-1" />
          <button onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
