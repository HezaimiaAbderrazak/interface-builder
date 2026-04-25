import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Bold, Italic, Code, List, CheckSquare, Link,
  Heading1, Heading2, Tag, Wand2, FileText, Pin, PinOff,
  Archive, Trash2, Palette, Loader2, Play, Pause, Languages, ChevronDown
} from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Note, NoteColor } from '@/types';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
}

const colorOptions: { value: NoteColor; cls: string; label: string }[] = [
  { value: 'default', cls: 'bg-slate-400',   label: 'Default' },
  { value: 'yellow',  cls: 'bg-amber-400',   label: 'Yellow' },
  { value: 'green',   cls: 'bg-emerald-400', label: 'Green' },
  { value: 'blue',    cls: 'bg-sky-400',     label: 'Blue' },
  { value: 'pink',    cls: 'bg-rose-400',    label: 'Pink' },
  { value: 'orange',  cls: 'bg-orange-400',  label: 'Orange' },
  { value: 'purple',  cls: 'bg-violet-500',  label: 'Purple' },
  { value: 'teal',    cls: 'bg-teal-400',    label: 'Teal' },
];

const colorBar: Record<NoteColor, string> = {
  yellow: 'bg-amber-400', green: 'bg-emerald-400', blue: 'bg-sky-400',
  pink: 'bg-rose-400', orange: 'bg-orange-400', purple: 'bg-violet-500',
  teal: 'bg-teal-400', default: 'bg-transparent',
};

const LANGUAGES = [
  'Arabic', 'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean',
  'Turkish', 'Dutch', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Greek', 'Hebrew', 'Hindi', 'Bengali', 'Urdu', 'Persian', 'Indonesian',
  'Malay', 'Thai', 'Vietnamese', 'Romanian', 'Hungarian', 'Czech', 'Ukrainian',
];

export default function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { updateNote, togglePin, archiveNote, deleteNote } = useNotes();
  const [title, setTitle]   = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showColors, setShowColors] = useState(false);
  const [tagInput, setTagInput]     = useState('');
  const [aiBusy, setAiBusy] = useState<null | 'enhance' | 'summarize' | 'autotag' | 'translate'>(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedLang, setSelectedLang]     = useState('Arabic');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleEnhance = async () => {
    if (!content.trim()) { toast.error('Nothing to enhance yet.'); return; }
    setAiBusy('enhance');
    try {
      const { content: enhanced } = await aiApi.enhance({ content });
      setContent(enhanced);
      updateNote(note.id, { content: enhanced });
      toast.success('Note enhanced');
    } catch (e: any) { toast.error(e.message || 'Enhance failed'); }
    finally { setAiBusy(null); }
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
    } catch (e: any) { toast.error(e.message || 'Summarize failed'); }
    finally { setAiBusy(null); }
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
    } catch (e: any) { toast.error(e.message || 'Auto-tag failed'); }
    finally { setAiBusy(null); }
  };

  const handleTranslate = async (lang: string) => {
    const text = content.trim() || title.trim();
    if (!text) { toast.error('Nothing to translate yet.'); return; }
    setShowLangPicker(false);
    setAiBusy('translate');
    try {
      const { translated } = await aiApi.translate(text, lang);
      const next = content.trim()
        ? `${content}\n\n---\n🌐 ${lang} translation:\n${translated}`
        : translated;
      setContent(next);
      updateNote(note.id, { content: next });
      toast.success(`Translated to ${lang}`);
    } catch (e: any) { toast.error(e.message || 'Translation failed'); }
    finally { setAiBusy(null); }
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

  const audioUrl = (note as any).audioUrl as string | null | undefined;
  const currentColorCls = colorOptions.find(c => c.value === note.color)?.cls ?? 'bg-slate-400';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={handleSave} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border flex flex-col overflow-hidden"
      >
        {/* Color stripe at top */}
        {note.color !== 'default' && (
          <div className={`h-1 w-full flex-shrink-0 ${colorBar[note.color]}`} />
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-0.5">
            {[Bold, Italic, Code, Heading1, Heading2, List, CheckSquare, Link].map((Icon, i) => (
              <button key={i} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => togglePin(note.id)}
              className={`p-1.5 rounded-md transition-colors ${note.isPinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { archiveNote(note.id); onClose(); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { deleteNote(note.id); onClose(); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button onClick={handleSave}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-bold text-foreground bg-transparent outline-none mb-4 placeholder:text-muted-foreground/50"
            placeholder="Note title..."
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {note.tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-secondary text-secondary-foreground">
                {tag.isAI && <Sparkles className="w-2.5 h-2.5 text-primary" />}
                {tag.name}
                <X className="w-2.5 h-2.5 ml-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => updateNote(note.id, { tags: note.tags.filter(t => t.id !== tag.id) })} />
              </span>
            ))}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-muted-foreground border border-dashed border-border hover:border-primary/40 transition-colors">
              <Tag className="w-2.5 h-2.5" />
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag" className="bg-transparent outline-none w-14" />
            </div>
          </div>

          {/* Audio player */}
          {note.isVoiceNote && audioUrl && (
            <div className="mb-4 p-3.5 rounded-xl bg-secondary border border-border flex items-center gap-3">
              <button onClick={() => {
                if (!audioRef.current) return;
                isPlaying ? audioRef.current.pause() : audioRef.current.play();
                setIsPlaying(!isPlaying);
              }} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0">
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-primary-foreground" /> : <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />}
              </button>
              <div className="flex-1 flex items-end gap-[2px] h-6">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className={`w-0.5 rounded-full ${isPlaying ? 'bg-primary animate-pulse' : 'bg-primary/30'}`}
                    style={{ height: `${Math.sin(i * 0.45) * 40 + 55}%` }} />
                ))}
              </div>
              {note.voiceDuration && (
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                  {Math.floor(note.voiceDuration / 60).toString().padStart(2, '0')}:{(note.voiceDuration % 60).toString().padStart(2, '0')}
                </span>
              )}
              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[340px] text-sm text-foreground bg-transparent outline-none resize-none leading-7 placeholder:text-muted-foreground/50"
            placeholder="Start writing..."
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Color picker */}
          <div className="relative">
            <button onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <div className={`w-3.5 h-3.5 rounded-full ${currentColorCls}`} />
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showColors && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-0 mb-2 p-3 bg-card border border-border rounded-xl z-50 shadow-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((c) => (
                      <button key={c.value} onClick={() => { updateNote(note.id, { color: c.value }); setShowColors(false); }}
                        title={c.label}
                        className={`w-8 h-8 rounded-lg ${c.cls} transition-all hover:scale-110 ${note.color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleEnhance} disabled={aiBusy !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors disabled:opacity-50">
            {aiBusy === 'enhance' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Enhance
          </button>

          <button onClick={handleSummarize} disabled={aiBusy !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
            {aiBusy === 'summarize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Summarize
          </button>

          <button onClick={handleAutoTag} disabled={aiBusy !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
            {aiBusy === 'autotag' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Auto-Tag
          </button>

          {/* Translate */}
          <div className="relative">
            <button onClick={() => setShowLangPicker(s => !s)} disabled={aiBusy !== null}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
              {aiBusy === 'translate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
              Translate <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl z-50 shadow-lg w-48 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Translate to</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto scrollbar-thin py-1">
                    {LANGUAGES.map((lang) => (
                      <button key={lang} onClick={() => { setSelectedLang(lang); handleTranslate(lang); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors ${selectedLang === lang ? 'text-primary font-medium' : 'text-foreground'}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />
          <button onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
