import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import SearchBar from '@/components/SearchBar';
import FilterChips from '@/components/FilterChips';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import CommandPalette from '@/components/CommandPalette';
import AIChatPanel from '@/components/AIChatPanel';
import CreateNoteModal from '@/components/CreateNoteModal';
import ArchiveView from '@/components/ArchiveView';
import TrashView from '@/components/TrashView';
import TagsView from '@/components/TagsView';
import Background3D from '@/components/Background3D';
import MindMap from '@/components/MindMap';
import { useNotes } from '@/store/NotesContext';
import type { Note } from '@/data/mockNotes';
import { Plus, Sparkles, StickyNote, Star, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { notes } = useNotes();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(o => !o); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setCreateOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (selectedNote) {
      const updated = notes.find(n => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
      else setSelectedNote(null);
    }
  }, [notes]);

  const activeNotes = useMemo(() => notes.filter(n => !n.isArchived && !n.isDeleted), [notes]);

  const counts = useMemo(() => ({
    all: activeNotes.length,
    pinned: activeNotes.filter(n => n.isPinned).length,
    archive: notes.filter(n => n.isArchived && !n.isDeleted).length,
    trash: notes.filter(n => n.isDeleted).length,
  }), [notes, activeNotes]);

  const filteredNotes = useMemo(() => {
    let result = activeView === 'pinned' ? activeNotes.filter(n => n.isPinned) : activeNotes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    if (activeFilter === 'Pinned') result = result.filter(n => n.isPinned);
    else if (activeFilter === 'With Code') result = result.filter(n => n.hasCode);
    else if (activeFilter === 'Checklists') result = result.filter(n => n.hasChecklist);
    else if (activeFilter === 'AI Tagged') result = result.filter(n => n.tags.some(t => t.isAI));
    else if (activeFilter === 'Recent') result = [...result].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  }, [activeView, activeNotes, searchQuery, activeFilter]);

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);
  const showNotesGrid = ['all', 'pinned'].includes(activeView);
  const viewTitle = activeView === 'all' ? 'All Notes' : activeView === 'pinned' ? 'Pinned' : activeView === 'mindmap' ? 'Mind Map' : '';

  return (
    <div className="min-h-screen bg-background grain">
      <Background3D />

      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        activeView={activeView}
        onViewChange={(v) => { setActiveView(v); setActiveFilter('All'); }}
        onNewNote={() => setCreateOpen(true)}
        counts={counts}
      />

      <main className="relative z-10 transition-all duration-200" style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}>
        <header className="sticky top-0 z-20 glass-strong px-6 py-4 flex items-center gap-4">
          <SearchBar onSearch={setSearchQuery} onCommandPalette={() => setCommandPaletteOpen(true)} />
          <div className="flex-1" />
          <button onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>
          <button onClick={() => supabase.auth.signOut()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {showNotesGrid && (
          <>
            <div className="px-6 py-3 flex items-center justify-between">
              <FilterChips active={activeFilter} onChange={setActiveFilter} />
            </div>
            <div className="px-6 pb-8">
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  {activeView === 'pinned' ? <Star className="w-12 h-12 text-muted-foreground/30 mb-4" /> : <StickyNote className="w-12 h-12 text-muted-foreground/30 mb-4" />}
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No notes match your search' : activeView === 'pinned' ? 'No pinned notes yet' : 'No notes yet'}
                  </p>
                  <button onClick={() => setCreateOpen(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" /> Create your first note
                  </button>
                </div>
              ) : (
                <>
                  {pinnedNotes.length > 0 && activeView !== 'pinned' && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pinned</p>
                      <div className="masonry mb-6">
                        {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onClick={setSelectedNote} />)}
                      </div>
                    </>
                  )}
                  {(activeView === 'pinned' ? pinnedNotes : otherNotes).length > 0 && (
                    <>
                      {pinnedNotes.length > 0 && activeView !== 'pinned' && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Others</p>
                      )}
                      <div className="masonry">
                        {(activeView === 'pinned' ? pinnedNotes : otherNotes).map(note => <NoteCard key={note.id} note={note} onClick={setSelectedNote} />)}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeView === 'mindmap' && (
          <div className="px-6 py-4">
            <MindMap notes={activeNotes} onNoteClick={setSelectedNote} />
          </div>
        )}

        {activeView === 'archive' && <ArchiveView onNoteClick={setSelectedNote} />}
        {activeView === 'trash' && <TrashView onNoteClick={setSelectedNote} />}
        {activeView === 'tags' && <TagsView onNoteClick={setSelectedNote} />}
        {activeView === 'ai-tags' && <TagsView onNoteClick={setSelectedNote} aiOnly />}

        <button onClick={() => setCreateOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:opacity-90 transition-opacity z-30">
          <Plus className="w-6 h-6" />
        </button>
      </main>

      <AnimatePresence>
        {selectedNote && <NoteEditor note={selectedNote} onClose={() => setSelectedNote(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {createOpen && <CreateNoteModal open={createOpen} onClose={() => setCreateOpen(false)} />}
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
