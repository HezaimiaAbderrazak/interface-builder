import { motion } from 'framer-motion';
import {
  X, Sparkles, Bold, Italic, Code, List, CheckSquare, Link,
  Heading1, Heading2, Tag, Wand2, FileText, Share2
} from 'lucide-react';
import type { Note } from '@/data/mockNotes';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
}

export default function NoteEditor({ note, onClose }: NoteEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      {/* Editor Panel */}
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
          <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          <input
            defaultValue={note.title}
            className="w-full text-xl font-semibold text-foreground bg-transparent outline-none mb-4 placeholder:text-muted-foreground"
            placeholder="Note title..."
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {note.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {tag.isAI && <Sparkles className="w-3 h-3 text-primary" />}
                {tag.name}
                <X className="w-3 h-3 ml-1 cursor-pointer hover:text-foreground" />
              </span>
            ))}
            <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-muted-foreground border border-dashed border-border hover:border-muted-foreground transition-colors">
              <Tag className="w-3 h-3" />
              Add tag
            </button>
          </div>

          {/* Body */}
          <textarea
            defaultValue={note.content}
            className="w-full min-h-[300px] text-sm text-foreground bg-transparent outline-none resize-none leading-relaxed placeholder:text-muted-foreground"
            placeholder="Start writing..."
          />
        </div>

        {/* AI Actions Bar */}
        <div className="px-6 py-3 border-t border-border flex items-center gap-2">
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
