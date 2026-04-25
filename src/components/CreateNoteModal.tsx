import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mic, Square, Play, Pause, Sparkles, Tag, Wand2, Palette
} from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import type { NoteColor } from '@/types';

interface CreateNoteModalProps {
  open: boolean;
  onClose: () => void;
}

const colors: { value: NoteColor; label: string; solid: string; ring: string }[] = [
  { value: 'default', label: 'Default', solid: 'bg-slate-500',   ring: 'ring-slate-400' },
  { value: 'yellow',  label: 'Yellow',  solid: 'bg-amber-400',   ring: 'ring-amber-400' },
  { value: 'green',   label: 'Green',   solid: 'bg-emerald-400', ring: 'ring-emerald-400' },
  { value: 'blue',    label: 'Blue',    solid: 'bg-sky-400',     ring: 'ring-sky-400' },
  { value: 'pink',    label: 'Pink',    solid: 'bg-rose-400',    ring: 'ring-rose-400' },
  { value: 'orange',  label: 'Orange',  solid: 'bg-orange-400',  ring: 'ring-orange-400' },
  { value: 'purple',  label: 'Purple',  solid: 'bg-violet-400',  ring: 'ring-violet-400' },
  { value: 'teal',    label: 'Teal',    solid: 'bg-teal-400',    ring: 'ring-teal-400' },
];

type Mode = 'write' | 'voice';

export default function CreateNoteModal({ open, onClose }: CreateNoteModalProps) {
  const { addNote } = useNotes();
  const [mode, setMode] = useState<Mode>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [showColors, setShowColors] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100);
    else {
      setTitle(''); setContent(''); setColor('default'); setTags([]);
      setMode('write'); setIsRecording(false); setRecordingTime(0);
      setAudioURL(null); setIsPlaying(false); setTagInput('');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { setAudioURL(URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' }))); stream.getTracks().forEach(t => t.stop()); };
      mr.start();
      setIsRecording(true); setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { alert('Microphone access denied'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) { setTags(p => [...p, t]); setTagInput(''); } };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !audioURL) return;
    addNote({
      title: title.trim() || (mode === 'voice' ? 'Voice Note' : 'Untitled'),
      content: content.trim() || (mode === 'voice' ? `🎙 Voice note (${formatTime(recordingTime)})` : ''),
      color, isPinned: false, isArchived: false, isDeleted: false,
      tags: tags.map(name => ({ id: crypto.randomUUID(), name, isAI: false })),
      isVoiceNote: mode === 'voice',
      voiceDuration: mode === 'voice' ? recordingTime : undefined,
    });
    onClose();
  };

  const selectedColor = colors.find(c => c.value === color)!;

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-lg glass-strong rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Mode tabs */}
        <div className="flex border-b border-border/60">
          {(['write', 'voice'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors capitalize flex items-center justify-center gap-2 ${mode === m ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {m === 'write' ? '✍️' : '🎙'} {m === 'write' ? 'Write' : 'Voice'}
            </button>
          ))}
        </div>

        <div className="p-5 pb-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); if (e.key === 'Escape') onClose(); }}
            placeholder="Note title..."
            className="w-full text-lg font-semibold text-foreground bg-transparent outline-none mb-3 placeholder:text-muted-foreground/60"
          />

          {mode === 'write' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind..."
              rows={5}
              className="w-full text-sm text-foreground bg-transparent outline-none resize-none leading-relaxed placeholder:text-muted-foreground/60"
            />
          ) : (
            <div className="flex flex-col items-center py-6 gap-5">
              <div className="relative w-full h-16 flex items-center justify-center">
                {isRecording ? (
                  <div className="flex items-end gap-[3px]">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <motion.div key={i} className="w-1 rounded-full bg-primary"
                        animate={{ height: [6, Math.random() * 44 + 8, 6] }}
                        transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04 }} />
                    ))}
                  </div>
                ) : audioURL ? (
                  <div className="flex items-end gap-[3px]">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div key={i} className="w-1 rounded-full bg-primary/40" style={{ height: Math.random() * 36 + 6 }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Tap the mic to start recording</p>
                )}
              </div>
              <span className="text-2xl font-mono tabular-nums text-foreground">{formatTime(recordingTime)}</span>
              <div className="flex items-center gap-4">
                {audioURL && !isRecording && (
                  <button onClick={() => { if (!audioRef.current) return; isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); }}
                    className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground" />}
                  </button>
                )}
                {!isRecording ? (
                  <button onClick={startRecording} className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-destructive/30">
                    <Mic className="w-7 h-7 text-destructive-foreground" />
                  </button>
                ) : (
                  <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-opacity animate-pulse shadow-lg shadow-destructive/30">
                    <Square className="w-6 h-6 text-destructive-foreground" />
                  </button>
                )}
                {audioURL && !isRecording && (
                  <button onClick={() => { setAudioURL(null); setRecordingTime(0); }}
                    className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                )}
              </div>
              {audioURL && <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} />}
              {audioURL && (
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Add a note or transcription..."
                  className="w-full min-h-[60px] text-sm text-foreground bg-secondary/50 rounded-xl p-3 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/60 border border-border/50" />
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 min-h-[28px]">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {tag}
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setTags(p => p.filter(t => t !== tag))} />
              </span>
            ))}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Tag className="w-3 h-3" />
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..." className="bg-transparent text-xs text-foreground outline-none w-20 placeholder:text-muted-foreground/60" />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-5 py-3 border-t border-border/60 flex items-center gap-2">
          {/* Color picker */}
          <div className="relative">
            <button onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-secondary transition-colors"
              title="Note color">
              <div className={`w-4 h-4 rounded-full ${selectedColor.solid}`} />
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showColors && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 p-3 glass-strong rounded-2xl z-50 shadow-2xl border border-border/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Pick a color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((c) => (
                      <button key={c.value} onClick={() => { setColor(c.value); setShowColors(false); }}
                        title={c.label}
                        className={`w-10 h-10 rounded-xl ${c.solid} transition-all hover:scale-110 hover:brightness-110
                          ${color === c.value ? `ring-2 ring-offset-2 ring-offset-background ${c.ring} scale-110` : ''}`} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
            <Wand2 className="w-3.5 h-3.5" />
            AI Tag
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Enhance
          </button>

          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={!title.trim() && !content.trim() && !audioURL}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 shadow-md shadow-primary/20">
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
