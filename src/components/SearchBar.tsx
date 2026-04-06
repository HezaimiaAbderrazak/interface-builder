import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Command } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCommandPalette: () => void;
}

export default function SearchBar({ onSearch, onCommandPalette }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative max-w-2xl w-full">
      <motion.div
        animate={{ scale: focused ? 1.01 : 1 }}
        className={`glass-strong flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
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
