import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import SettingsPanel from '@/components/SettingsPanel';
import { useNotes } from '@/store/NotesContext';
import type { Note } from '@/data/mockNotes';
import {
  Plus, Sparkles, StickyNote, Star, LogOut,
  Tag, Archive, Trash2, Network, Settings,
  X, Menu, Search, Zap, ChevronRight
} from 'lucide-react';
import { signOut } from '@/lib/auth';

interface IndexProps {
  onSignOut: () => void;
}

const bottomNavItems = [
  { id: 'all',    label: 'Notes',  icon: StickyNote },
  { id: 'pinned', label: 'Pinned', icon: Star },
  { id: 'ai',     label: 'AI',     icon: Sparkles },
  { id: 'tags',   label: 'Tags',   icon: Tag },
  { id: 'more',   label: 'More',   icon: Menu },
];

const moreMenuItems = [
  { id: 'mindmap', label: 'Mind Map',  icon: Network },
  { id: 'archive', label: 'Archive',   icon: Archive },
  { id: 'trash',   label: 'Trash',     icon: Trash2 },
  { id: 'settings',label: 'Settings',  icon: Settings },
];

export default function Index({ onSignOut }: IndexProps) {
  const { notes } = useNotes();
  const [activeTab, setActiveTab] = useState('all');
  const [activeView, setActiveView] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

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

  const handleSignOut = () => { signOut(); onSignOut(); };

  const handleTabChange = (id: string) => {
    if (id === 'ai') { setChatOpen(true); return; }
    if (id === 'more') { setShowMoreDrawer(true); return; }
    setActiveTab(id);
    setActiveView(id);
    setActiveFilter('All');
  };

  const handleMoreItem = (id: string) => {
    setShowMoreDrawer(false);
    if (id === 'settings') { setSettingsOpen(true); return; }
    setActiveTab('more-' + id);
    setActiveView(id);
  };

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
      result = result.filter(n => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
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

  const getPageTitle = () => {
    if (activeView === 'all') return 'My Notes';
    if (activeView === 'pinned') return 'Pinned';
    if (activeView === 'mindmap') return 'Mind Map';
    if (activeView === 'archive') return 'Archive';
    if (activeView === 'trash') return 'Trash';
    if (activeView === 'tags') return 'Tags';
    if (activeView === 'ai-tags') return 'AI Tags';
    return 'NoteFlow AI';
  };

  return (
    <div className="mobile-app-root">
      <Background3D />

      {/* Mobile Status Bar Spacer */}
      <div className="status-bar-spacer" />

      {/* Header */}
      <header className="mobile-header glass-strong">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.div key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1">
                <SearchBar onSearch={setSearchQuery} onCommandPalette={() => setCommandPaletteOpen(true)} autoFocus />
              </motion.div>
            ) : (
              <motion.h1 key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-base font-semibold text-foreground">
                {getPageTitle()}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1">
          {showSearch ? (
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleSignOut}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-content">
        {showNotesGrid && (
          <>
            <div className="px-4 pt-3 pb-2">
              <FilterChips active={activeFilter} onChange={setActiveFilter} />
            </div>
            <div className="px-4 pb-28">
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  {activeView === 'pinned'
                    ? <Star className="w-16 h-16 text-muted-foreground/20 mb-4" />
                    : <StickyNote className="w-16 h-16 text-muted-foreground/20 mb-4" />}
                  <p className="text-base font-medium text-foreground/70 mb-1">
                    {searchQuery ? 'No results found' : activeView === 'pinned' ? 'No pinned notes' : 'No notes yet'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">
                    {searchQuery ? 'Try a different search term' : 'Tap + to create your first note'}
                  </p>
                  {!searchQuery && (
                    <button onClick={() => setCreateOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 active:opacity-80 transition-opacity">
                      <Plus className="w-4 h-4" /> New Note
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {pinnedNotes.length > 0 && activeView !== 'pinned' && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Pinned</p>
                      <div className="mobile-masonry">
                        {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onClick={setSelectedNote} />)}
                      </div>
                    </div>
                  )}
                  {(activeView === 'pinned' ? pinnedNotes : otherNotes).length > 0 && (
                    <div>
                      {pinnedNotes.length > 0 && activeView !== 'pinned' && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Others</p>
                      )}
                      <div className="mobile-masonry">
                        {(activeView === 'pinned' ? pinnedNotes : otherNotes).map(note =>
                          <NoteCard key={note.id} note={note} onClick={setSelectedNote} />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeView === 'mindmap' && (
          <div className="px-4 py-4 pb-28">
            <MindMap notes={activeNotes} onNoteClick={setSelectedNote} />
          </div>
        )}
        {activeView === 'archive' && <div className="pb-28"><ArchiveView onNoteClick={setSelectedNote} /></div>}
        {activeView === 'trash' && <div className="pb-28"><TrashView onNoteClick={setSelectedNote} /></div>}
        {activeView === 'tags' && <div className="pb-28"><TagsView onNoteClick={setSelectedNote} /></div>}
        {activeView === 'ai-tags' && <div className="pb-28"><TagsView onNoteClick={setSelectedNote} aiOnly /></div>}
      </main>

      {/* FAB */}
      {(showNotesGrid || activeView === 'mindmap') && (
        <button onClick={() => setCreateOpen(true)}
          className="fab-button">
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav glass-strong">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id ||
            (item.id === 'more' && ['more-mindmap','more-archive','more-trash'].includes(activeTab));
          const count = item.id === 'all' ? counts.all : item.id === 'pinned' ? counts.pinned : null;

          return (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <div className="relative">
                <Icon className="w-6 h-6" />
                {count !== null && count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                {item.id === 'ai' && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-accent rounded-full" />
                )}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* More Drawer */}
      <AnimatePresence>
        {showMoreDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setShowMoreDrawer(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-strong rounded-t-3xl pb-safe"
            >
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-4" />
              <div className="px-4 pb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">More</p>
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const count = item.id === 'archive' ? counts.archive : item.id === 'trash' ? counts.trash : null;
                  return (
                    <button key={item.id} onClick={() => handleMoreItem(item.id)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-secondary/60 active:bg-secondary transition-colors mb-1">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                      {count !== null && count > 0 && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{count}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}

                <div className="mt-2 pt-3 border-t border-border/40">
                  <button onClick={() => { setShowMoreDrawer(false); handleSignOut(); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-destructive/10 active:bg-destructive/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-destructive" />
                    </div>
                    <span className="flex-1 text-left text-sm font-medium text-destructive">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
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
      <AnimatePresence>
        {settingsOpen && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
