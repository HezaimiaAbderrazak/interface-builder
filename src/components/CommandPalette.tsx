import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Sparkles, FileText, Tag, Archive, Settings, Zap, Moon, Hash
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const commands = [
  { id: 'new', label: 'New Note', icon: Plus, shortcut: '⌘N', group: 'Actions' },
  { id: 'search', label: 'Semantic Search', icon: Sparkles, shortcut: '⌘⇧F', group: 'Actions' },
  { id: 'ai-chat', label: 'Open AI Chat', icon: Zap, shortcut: '⌘/', group: 'Actions' },
  { id: 'summary', label: 'Summarize All Notes', icon: FileText, group: 'AI' },
  { id: 'auto-tag', label: 'Auto-Tag Selected', icon: Tag, group: 'AI' },
  { id: 'archive', label: 'Go to Archive', icon: Archive, group: 'Navigation' },
  { id: 'tags', label: 'Browse Tags', icon: Hash, group: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: '⌘,', group: 'Navigation' },
  { id: 'dark', label: 'Toggle Dark Mode', icon: Moon, group: 'Preferences' },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered.length, onClose]);

  if (!open) return null;

  const groups = [...new Set(filtered.map((c) => c.group))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]"
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="relative w-full max-w-lg bg-card rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto scrollbar-thin py-2">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              {filtered
                .filter((c) => c.group === group)
                .map((cmd) => {
                  const idx = filtered.indexOf(cmd);
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        idx === selectedIndex ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
                      }`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={onClose}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="text-[10px] text-muted-foreground font-mono">{cmd.shortcut}</span>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No commands found</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
