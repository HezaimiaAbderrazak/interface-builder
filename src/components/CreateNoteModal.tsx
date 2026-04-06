import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mic, MicOff, Square, Play, Pause, Sparkles, Bold, Italic, Code, List,
  CheckSquare, Link, Heading1, Heading2, Tag, Wand2, FileText, Palette
} from 'lucide-react';
import { useNotes } from '@/store/NotesContext';
import type { NoteColor } from '@/data/mockNotes';

interface CreateNoteModalProps {
  open: boolean;
  onClose: () => void;
}

const colors: { value: NoteColor; class: string }[] = [
  { value: 'default', class: 'bg-muted' },
  { value: 'yellow', class: 'bg-note-yellow' },
  { value: 'green', class: 'bg-note-green' },
  { value: 'blue', class: 'bg-note-blue' },
  { value: 'pink', class: 'bg-note-pink' },
  { value: 'orange', class: 'bg-note-orange' },
  { value: 'purple', class: 'bg-note-purple' },
  { value: 'teal', class: 'bg-note-teal' },
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

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle(''); setContent(''); setColor('default'); setTags([]);
      setMode('write'); setIsRecording(false); setRecordingTime(0);
      setAudioURL(null); setIsPlaying(false); setTagInput('');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioURL) return;
    if (isPlaying) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput(''); }
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !audioURL) return;
    addNote({
      title: title.trim() || (mode === 'voice' ? 'Voice Note' : 'Untitled'),
      content: content.trim() || (mode === 'voice' ? `🎙 Voice note (${formatTime(recordingTime)})` : ''),
      color,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      tags: tags.map(name => ({ id: crypto.randomUUID(), name, isAI: false })),
      isVoiceNote: mode === 'voice',
      voiceDuration: mode === 'voice' ? recordingTime : undefined,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-xl glass-strong rounded-2xl overflow-hidden"
      >
        {/* Mode Tabs */}
        <div className="flex border-b border-border">
          <button onClick={() => setMode('write')} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'write' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}>
            ✍️ Write
          </button>
          <button onClick={() => setMode('voice')} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'voice' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}>
            🎙 Voice
          </button>
        </div>

        <div className="p-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full text-lg font-semibold text-foreground bg-transparent outline-none mb-4 placeholder:text-muted-foreground"
          />

          {mode === 'write' ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border">
                {[Bold, Italic, Code, Heading1, Heading2, List, CheckSquare, Link].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your note..."
                className="w-full min-h-[180px] text-sm text-foreground bg-transparent outline-none resize-none leading-relaxed placeholder:text-muted-foreground"
              />
            </>
          ) : (
            /* Voice Recording */
            <div className="flex flex-col items-center py-8 gap-6">
              {/* Waveform visualization */}
              <div className="relative w-full h-20 flex items-center justify-center">
                {isRecording && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-primary"
                        animate={{ height: [8, Math.random() * 50 + 10, 8] }}
                        transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }}
                      />
                    ))}
                  </div>
                )}
                {!isRecording && audioURL && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="w-1 rounded-full bg-primary/40" style={{ height: Math.random() * 40 + 8 }} />
                    ))}
                  </div>
                )}
                {!isRecording && !audioURL && (
                  <p className="text-sm text-muted-foreground">Tap the mic to start recording</p>
                )}
              </div>

              {/* Timer */}
              <span className="text-2xl font-mono text-foreground">{formatTime(recordingTime)}</span>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {audioURL && !isRecording && (
                  <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5 text-foreground" /> : <Play className="w-5 h-5 text-foreground" />}
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
                  <button onClick={() => { setAudioURL(null); setRecordingTime(0); }} className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                )}
              </div>
              {audioURL && <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} />}

              {/* Transcription placeholder */}
              {audioURL && (
                <div className="w-full glass rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Transcription</span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Transcription will appear here... (or type manually)"
                    className="w-full min-h-[60px] text-sm text-foreground bg-transparent outline-none resize-none leading-relaxed placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-border">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {tag}
                <X className="w-3 h-3 ml-0.5 cursor-pointer hover:text-foreground" onClick={() => setTags(prev => prev.filter(t => t !== tag))} />
              </span>
            ))}
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-muted-foreground" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="bg-transparent text-xs text-foreground outline-none w-20 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              {/* Color picker */}
              <div className="relative">
                <button onClick={() => setShowColors(!showColors)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Palette className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showColors && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 p-2 glass-strong rounded-lg"
                    >
                      {colors.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => { setColor(c.value); setShowColors(false); }}
                          className={`w-6 h-6 rounded-full ${c.class} transition-transform ${color === c.value ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110' : 'hover:scale-110'}`}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                <Wand2 className="w-3.5 h-3.5" />
                AI Auto-Tag
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                Save Note
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
