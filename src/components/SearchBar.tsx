import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Command, Mic, MicOff, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCommandPalette: () => void;
  onAISearch?: (noteIds: string[], explanation: string) => void;
}

export default function SearchBar({ onSearch, onCommandPalette, onAISearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const recognitionRef = useRef<any>(null);

  const runAISearch = async () => {
    const q = query.trim();
    if (!q || !onAISearch) return;
    setAiSearching(true);
    try {
      const { noteIds, explanation } = await aiApi.search(q);
      onAISearch(noteIds, explanation);
      if (noteIds.length === 0) toast.info('AI search found no relevant notes.');
    } catch (e: any) {
      toast.error(e.message || 'AI search failed');
    } finally {
      setAiSearching(false);
    }
  };

  const toggleLiveAudio = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setIsTranscribing(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setQuery(transcript);
      onSearch(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsTranscribing(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="relative max-w-2xl w-full">
      <motion.div
        animate={{ scale: focused ? 1.01 : 1 }}
        className={`bg-card flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
          focused ? 'border-primary/40' : ''
        }`}
      >
        {focused ? (
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <input
          type="text"
          placeholder="Search notes semantically..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runAISearch(); } }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />

        {onAISearch && query.trim() && (
          <button
            onClick={runAISearch}
            disabled={aiSearching}
            title="AI semantic search"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {aiSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">AI</span>
          </button>
        )}

        {/* Live Audio Button */}
        <button
          onClick={toggleLiveAudio}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isListening
              ? 'bg-destructive/20 text-destructive animate-pulse'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {isTranscribing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{isListening ? 'Stop' : 'Voice'}</span>
        </button>

        <button
          onClick={onCommandPalette}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs hover:bg-secondary/80 transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>
      </motion.div>
    </div>
  );
}
