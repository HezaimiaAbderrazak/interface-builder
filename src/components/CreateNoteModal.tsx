import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mic, Square, Play, Pause, Tag, Wand2, Loader2, FileText, Palette, Sparkles
} from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';
import type { NoteColor } from '@/types';

interface CreateNoteModalProps {
  open: boolean;
  onClose: () => void;
}

const colors: { value: NoteColor; label: string; cls: string }[] = [
  { value: 'default', label: 'Default', cls: 'bg-slate-400' },
  { value: 'yellow',  label: 'Yellow',  cls: 'bg-amber-400' },
  { value: 'green',   label: 'Green',   cls: 'bg-emerald-400' },
  { value: 'blue',    label: 'Blue',    cls: 'bg-sky-400' },
  { value: 'pink',    label: 'Pink',    cls: 'bg-rose-400' },
  { value: 'orange',  label: 'Orange',  cls: 'bg-orange-400' },
  { value: 'purple',  label: 'Purple',  cls: 'bg-violet-500' },
  { value: 'teal',    label: 'Teal',    cls: 'bg-teal-400' },
];

type Mode = 'write' | 'voice';

export default function CreateNoteModal({ open, onClose }: CreateNoteModalProps) {
  const { addNote } = useNotes();
  const [mode, setMode]       = useState<Mode>('write');
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [color, setColor]     = useState<NoteColor>('default');
  const [showColors, setShowColors] = useState(false);
  const [tagInput, setTagInput]     = useState('');
  const [tags, setTags]             = useState<string[]>([]);

  const [isRecording, setIsRecording]     = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL]   = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<number | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const titleRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 80);
    else {
      setTitle(''); setContent(''); setColor('default'); setTags([]);
      setMode('write'); setIsRecording(false); setRecordingTime(0);
      setAudioURL(null); setAudioBlob(null); setIsPlaying(false); setTagInput('');
      setIsTranscribing(false); setIsSaving(false);
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
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
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

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const { transcript } = await aiApi.transcribe(base64, 'audio/webm');
          if (transcript) { setContent(transcript); toast.success('Transcription complete'); }
        } catch (e: any) {
          toast.error(e.message || 'Transcription failed');
        } finally { setIsTranscribing(false); }
      };
    } catch { setIsTranscribing(false); toast.error('Failed to read audio'); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags(p => [...p, t]); setTagInput(''); }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && !audioURL) return;
    setIsSaving(true);
    try {
      let audioDataUrl: string | null = null;
      if (audioBlob) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => { reader.onloadend = () => resolve(); reader.readAsDataURL(audioBlob); });
        audioDataUrl = reader.result as string;
      }
      await addNote({
        title: title.trim() || (mode === 'voice' ? 'Voice Note' : 'Untitled'),
        content: content.trim() || (mode === 'voice' ? `🎙 Voice note (${fmt(recordingTime)})` : ''),
        color, isPinned: false, isArchived: false, isDeleted: false,
        tags: tags.map(name => ({ id: crypto.randomUUID(), name, isAI: false })),
        isVoiceNote: mode === 'voice',
        voiceDuration: mode === 'voice' ? recordingTime : undefined,
        audioUrl: audioDataUrl,
      } as any);
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save note');
    } finally { setIsSaving(false); }
  };

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl"
      >
        {/* Mode tabs */}
        <div className="flex border-b border-border">
          {(['write', 'voice'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize flex items-center justify-center gap-2
                ${mode === m ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {m === 'write' ? '✍️ Write' : '🎙 Voice'}
            </button>
          ))}
        </div>

        <div className="p-5 pb-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            placeholder="Note title..."
            className="w-full text-base font-semibold text-foreground bg-transparent outline-none mb-3 placeholder:text-muted-foreground/60"
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
            <div className="flex flex-col items-center py-5 gap-4">
              <div className="flex items-end gap-[3px] h-12 w-full justify-center">
                {Array.from({ length: 28 }).map((_, i) => (
                  <motion.div key={i}
                    className={`w-1 rounded-full ${isRecording ? 'bg-primary' : audioURL ? 'bg-primary/30' : 'bg-muted'}`}
                    animate={isRecording ? { height: [4, Math.random() * 36 + 8, 4] } : { height: audioURL ? Math.sin(i * 0.5) * 18 + 20 : 4 }}
                    transition={isRecording ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.04 } : {}}
                  />
                ))}
              </div>

              <span className="text-xl font-mono tabular-nums text-foreground">{fmt(recordingTime)}</span>

              <div className="flex items-center gap-4">
                {audioURL && !isRecording && (
                  <button onClick={() => { if (!audioRef.current) return; isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); }}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
                {!isRecording ? (
                  <button onClick={startRecording}
                    className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-opacity shadow-md">
                    <Mic className="w-6 h-6 text-destructive-foreground" />
                  </button>
                ) : (
                  <button onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-opacity animate-pulse shadow-md">
                    <Square className="w-5 h-5 text-destructive-foreground" />
                  </button>
                )}
                {audioURL && !isRecording && (
                  <button onClick={() => { setAudioURL(null); setAudioBlob(null); setRecordingTime(0); }}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {audioURL && <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} />}

              {audioURL && !isRecording && (
                <div className="w-full flex flex-col gap-2">
                  <button onClick={handleTranscribe} disabled={isTranscribing}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors disabled:opacity-50">
                    {isTranscribing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing...</>
                      : <><FileText className="w-3.5 h-3.5" /> Transcribe with AI</>
                    }
                  </button>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder="Transcript or add a note..."
                    className="w-full min-h-[60px] text-sm text-foreground bg-secondary border border-border rounded-lg p-3 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary/40 transition-colors" />
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 min-h-[26px]">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-secondary text-secondary-foreground">
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center gap-2">
          {/* Color picker */}
          <div className="relative">
            <button onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-secondary transition-colors" title="Note color">
              <div className={`w-3.5 h-3.5 rounded-full ${colors.find(c => c.value === color)?.cls}`} />
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showColors && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-0 mb-2 p-3 bg-card border border-border rounded-xl z-50 shadow-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((c) => (
                      <button key={c.value} onClick={() => { setColor(c.value); setShowColors(false); }}
                        title={c.label}
                        className={`w-8 h-8 rounded-lg ${c.cls} transition-all hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary bg-primary/10 hover:bg-primary/15 transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> AI Tag
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors">
            <Wand2 className="w-3.5 h-3.5" /> Enhance
          </button>

          <div className="flex-1" />
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            disabled={(!title.trim() && !content.trim() && !audioURL) || isSaving}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5">
            {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
