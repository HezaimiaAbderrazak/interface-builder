import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Send, Sparkles, Bot, User, Loader2, Bell, FileText, Tag,
  History, Plus, Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatStream, chatApi, aiApi, type ChatConversationSummary } from '@/lib/api';
import { useNotes } from '@/store/NotesContext';
import { toast } from 'sonner';

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { addNote, updateNote, notes } = useNotes();
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await chatApi.listConversations();
      setConversations(list);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open) refreshConversations();
  }, [open, refreshConversations]);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  const loadConversation = async (id: string) => {
    try {
      const { messages: msgs } = await chatApi.getConversation(id);
      setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
      setConversationId(id);
      setShowHistory(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load conversation');
    }
  };

  const removeConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      if (conversationId === id) startNewChat();
      refreshConversations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const parseActions = (text: string): NoteAction[] => {
    const actions: NoteAction[] = [];
    const regex = /```action\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        actions.push(JSON.parse(match[1].trim()));
      } catch { /* ignore */ }
    }
    return actions;
  };

  const executeActions = useCallback(async (actions: NoteAction[]) => {
    for (const action of actions) {
      if (action.type === 'create_note') {
        try {
          await addNote({
            title: action.title || 'AI Note',
            content: action.content || '',
            color: (action.color as any) || 'default',
            isPinned: false,
            isArchived: false,
            isDeleted: false,
            tags: [],
            isVoiceNote: false,
          });
          toast.success(`✅ Created note: "${action.title || 'AI Note'}"`);
        } catch (e: any) {
          toast.error('Failed to create note: ' + e.message);
        }
      } else if (action.type === 'search') {
        if (!action.query) continue;
        try {
          const { noteIds, explanation } = await aiApi.search(action.query);
          if (noteIds.length === 0) {
            toast.info('No matching notes found for: ' + action.query);
          } else {
            const found = notes.filter(n => noteIds.includes(n.id));
            const titles = found.map(n => `"${n.title || 'Untitled'}"`).join(', ');
            toast.success(`🔍 Found ${noteIds.length} note(s): ${titles}`);
          }
        } catch (e: any) {
          toast.error('Search failed: ' + e.message);
        }
      } else if (action.type === 'set_reminder') {
        if (!action.reminder_at) continue;
        try {
          if (action.query) {
            const { noteIds } = await aiApi.search(action.query);
            if (noteIds.length > 0) {
              await updateNote(noteIds[0], { reminderAt: action.reminder_at } as any);
              const note = notes.find(n => n.id === noteIds[0]);
              toast.success(`🔔 Reminder set for "${note?.title || 'note'}" at ${new Date(action.reminder_at).toLocaleString()}`);
            } else {
              const newNote = await addNote({
                title: action.query || 'Reminder',
                content: '',
                color: 'default',
                isPinned: false,
                isArchived: false,
                isDeleted: false,
                tags: [],
                isVoiceNote: false,
              });
              await updateNote(newNote.id, { reminderAt: action.reminder_at } as any);
              toast.success(`🔔 Created note with reminder at ${new Date(action.reminder_at).toLocaleString()}`);
            }
          }
        } catch (e: any) {
          toast.error('Failed to set reminder: ' + e.message);
        }
      }
    }
  }, [addNote, updateNote, notes]);

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
    let returnedConvId: string | null = conversationId;

    try {
      const resp = await chatStream([...messages, userMsg], conversationId);

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error((errData as any).error || 'Failed to connect to AI');
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
            if (parsed.conversationId && parsed.conversationId !== conversationId) {
              returnedConvId = parsed.conversationId;
              setConversationId(parsed.conversationId);
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      const actions = parseActions(assistantSoFar);
      if (actions.length > 0) executeActions(actions);
      if (returnedConvId) refreshConversations();

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message || 'Something went wrong'}` }]);
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
      <div className="flex items-center justify-between px-5 h-14 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">NoteFlow AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Live</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={startNewChat} title="New chat"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setShowHistory(s => !s)} title="History"
            className={`p-2 rounded-md transition-colors ${showHistory ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
            <History className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No previous conversations.</p>
          ) : (
            conversations.map(c => (
              <button key={c.id} onClick={() => loadConversation(c.id)}
                className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${c.id === conversationId ? 'bg-secondary' : 'hover:bg-secondary/60'}`}>
                <Bot className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.updatedAt).toLocaleString()}</p>
                </div>
                <button onClick={(e) => removeConversation(c.id, e)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>
      ) : messages.length === 0 ? (
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
      ) : (
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
