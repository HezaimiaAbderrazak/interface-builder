import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import SearchBar from '@/components/SearchBar';
import FilterChips from '@/components/FilterChips';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import CommandPalette from '@/components/CommandPalette';
import AIChatPanel from '@/components/AIChatPanel';
import { mockNotes, type Note } from '@/data/mockNotes';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function Index() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredNotes = mockNotes.filter((note) => {
    if (activeView === 'pinned') return note.isPinned;
    if (activeFilter === 'Pinned') return note.isPinned;
    if (activeFilter === 'With Code') return note.hasCode;
    if (activeFilter === 'Checklists') return note.hasChecklist;
    if (activeFilter === 'AI Tagged') return note.tags.some((t) => t.isAI);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-background grain">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <main
        className="relative z-10 transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 glass-strong px-6 py-4 flex items-center gap-4">
          <SearchBar onSearch={setSearchQuery} onCommandPalette={() => setCommandPaletteOpen(true)} />
          <div className="flex-1" />
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>
        </header>

        {/* Filter Chips */}
        <div className="px-6 py-3">
          <FilterChips active={activeFilter} onChange={setActiveFilter} />
        </div>

        {/* Notes Grid */}
        <div className="px-6 pb-8">
          {pinnedNotes.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pinned</p>
              <div className="masonry mb-6">
                {pinnedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} onClick={setSelectedNote} />
                ))}
              </div>
            </>
          )}

          {otherNotes.length > 0 && (
            <>
              {pinnedNotes.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Others</p>
              )}
              <div className="masonry">
                {otherNotes.map((note) => (
                  <NoteCard key={note.id} note={note} onClick={setSelectedNote} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* FAB for mobile */}
        <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-30 sm:hidden">
          <MessageSquare className="w-6 h-6" />
        </button>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {selectedNote && <NoteEditor note={selectedNote} onClose={() => setSelectedNote(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {chatOpen && <AIChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
