import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Bot, User, ExternalLink } from 'lucide-react';

interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'What are my notes about authentication?',
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'Based on your notes, you have documented an **OAuth 2.0 with PKCE flow** for mobile authentication. Key points include:\n\n• Refresh token rotation for enhanced security\n• Biometric auth as a potential second factor\n• Integration with your API architecture',
    sources: ['API Authentication Flow', 'Project Architecture Notes'],
  },
];

export default function AIChatPanel({ open, onClose }: AIChatPanelProps) {
  const [input, setInput] = useState('');

  if (!open) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 h-screen w-full max-w-md glass-strong border-l border-border z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">AI Chat</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">RAG</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
        {mockMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} rounded-xl px-4 py-3 text-sm leading-relaxed`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.sources && (
                <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1">Sources</p>
                  {msg.sources.map((src) => (
                    <button key={src} className="flex items-center gap-1.5 text-xs opacity-75 hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3 h-3" />
                      {src}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-accent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5">
          <input
            type="text"
            placeholder="Ask about your notes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">AI searches across all your notes using semantic retrieval</p>
      </div>
    </motion.div>
  );
}
