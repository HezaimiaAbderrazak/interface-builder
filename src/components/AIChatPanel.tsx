import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Bot, User, Loader2, Bell, FileText, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useNotes } from '@/store/NotesContext';

interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
}

type Msg = { role: 'user' | 'assistant'; content: string };

interface NoteAction {
  type: 'create_note' | 'search' | 'set_reminder';
  title?: string;
  content?: string;
  color?: string;
  query?: string;
  reminder_at?: string | null;
}

export default function AIChatPanel({ open, onClose }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addNote } = useNotes();
  const scrollRef = useRef<HTMLDivElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  const parseActions = (text: string): NoteAction[] => {
    const actions: NoteAction[] = [];
    const regex = /```action\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        actions.push(JSON.parse(match[1].trim()));
      } catch { /* skip malformed */ }
    }
    return actions;
  };

  const executeActions = useCallback((actions: NoteAction[]) => {
    for (const action of actions) {
      if (action.type === 'create_note') {
        addNote({
          title: action.title || 'AI Note',
          content: action.content || '',
          color: (action.color as any) || 'default',
          isPinned: false,
          isArchived: false,
          isDeleted: false,
          tags: [],
          isVoiceNote: false,
        });
      }
    }
  }, [addNote]);

  const cleanResponse = (text: string): string => {
    return text.replace(/```action\n[\s\S]*?```/g, '').trim();
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to connect to AI');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Execute any actions found in the response
      const actions = parseActions(assistantSoFar);
      if (actions.length > 0) executeActions(actions);

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message || 'Something went wrong'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

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
          <span className="text-sm font-medium text-foreground">NoteFlow AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Live</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Welcome state */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">NoteFlow AI Assistant</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I can create notes, set reminders, search your knowledge base, and organize your thoughts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: FileText, label: 'Create a meeting note' },
              { icon: Bell, label: 'Remind me at 3pm' },
              { icon: Tag, label: 'Tag all design notes' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => { setInput(label); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} rounded-xl px-4 py-3 text-sm leading-relaxed`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{cleanResponse(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5">
          <input
            type="text"
            placeholder="Create a note, set a reminder..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Powered by AI • Natural language commands supported</p>
      </div>
    </motion.div>
  );
}
