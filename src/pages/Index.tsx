import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import CommandPalette from '@/components/CommandPalette';
import AIChatPanel from '@/components/AIChatPanel';
import CreateNoteModal from '@/components/CreateNoteModal';
import ArchiveView from '@/components/ArchiveView';
import TrashView from '@/components/TrashView';
import TagsView from '@/components/TagsView';
import MindMap from '@/components/MindMap';
import SettingsPanel from '@/components/SettingsPanel';
import { useNotes } from '@/store/NotesContext';
import type { Note } from '@/types';
import {
  Plus, Sparkles, StickyNote, Star, LogOut,
  Tag, Archive, Trash2, Network, Settings,
  X, Menu, Search, Zap, ChevronRight, Pin
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';

interface IndexProps {
  onSignOut: () => void;
}

const bottomNavItems = [
  { id: 'all',    label: 'Notes',  icon: StickyNote },
  { id: 'pinned', label: 'Pinned', icon: Star },
  { id: 'ai',     label: 'AI Chat', icon: Sparkles },
  { id: 'tags',   label: 'Tags',   icon: Tag },
  { id: 'more',   label: 'More',   icon: Menu },
];

const moreMenuItems = [
  { id: 'mindmap',  label: 'Mind Map',  icon: Network },
  { id: 'archive',  label: 'Archive',   icon: Archive },
  { id: 'trash',    label: 'Trash',     icon: Trash2 },
  { id: 'settings', label: 'Settings',  icon: Settings },
];

export default function Index({ onSignOut }: IndexProps) {
  const { notes } = useNotes();
  const [activeTab, setActiveTab]       = useState('all');
  const [activeView, setActiveView]     = useState('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);
  const [createOpen, setCreateOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSearch, setShowSearch]     = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [aiSearchIds, setAiSearchIds]   = useState<string[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

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

  const handleTabChange = (id: string) => {
    if (id === 'ai')   { setChatOpen(true); return; }
    if (id === 'more') { setShowMoreDrawer(true); return; }
    setActiveTab(id);
    setActiveView(id);
  };

  const handleMoreItem = (id: string) => {
    setShowMoreDrawer(false);
    if (id === 'settings') { setSettingsOpen(true); return; }
    setActiveTab('more-' + id);
    setActiveView(id);
  };

  const handleSignOut = () => { signOut(); onSignOut(); };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q) { setAiSearchIds(null); return; }
    if (q.length < 3) return;
    setSearchLoading(true);
    try {
      const { noteIds } = await aiApi.search(q);
      setAiSearchIds(noteIds);
    } catch {
      setAiSearchIds(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const activeNotes = useMemo(() => notes.filter(n => !n.isArchived && !n.isDeleted), [notes]);
  const counts = useMemo(() => ({
    all:     activeNotes.length,
    pinned:  activeNotes.filter(n => n.isPinned).length,
    archive: notes.filter(n => n.isArchived && !n.isDeleted).length,
    trash:   notes.filter(n => n.isDeleted).length,
  }), [notes, activeNotes]);

  const filteredNotes = useMemo(() => {
    let result = activeView === 'pinned'
      ? activeNotes.filter(n => n.isPinned)
      : activeNotes;
    if (aiSearchIds) {
      const set = new Set(aiSearchIds);
      result = result.filter(n => set.has(n.id));
    } else if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeView, activeNotes, searchQuery, aiSearchIds]);

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes  = filteredNotes.filter(n => !n.isPinned);
  const showGrid = ['all', 'pinned'].includes(activeView);

  const getTitle = () => {
    if (activeView === 'all')     return 'My Notes';
    if (activeView === 'pinned')  return 'Pinned';
    if (activeView === 'mindmap') return 'Mind Map';
    if (activeView === 'archive') return 'Archive';
    if (activeView === 'trash')   return 'Trash';
    if (activeView === 'tags')    return 'Tags';
    return 'NoteFlow AI';
  };

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>

        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.h1 key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 text-base font-semibold text-foreground">
              {getTitle()}
            </motion.h1>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-0.5">
          {showSearch ? (
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); setAiSearchIds(null); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Search className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleSignOut}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* AI search banner */}
      {aiSearchIds && (
        <div className="mx-4 mt-3 px-3 py-2 bg-primary/8 border border-primary/20 rounded-xl flex items-center gap-2 text-xs text-primary">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">AI found {aiSearchIds.length} matching note{aiSearchIds.length !== 1 ? 's' : ''}</span>
          <button onClick={() => { setAiSearchIds(null); setSearchQuery(''); setShowSearch(false); }}
            className="hover:opacity-70 transition-opacity"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Main content */}
      <main className="app-content pb-4">
        {showGrid && (
          <div className="px-4 pt-3 pb-24">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                {activeView === 'pinned'
                  ? <Pin className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  : <StickyNote className="w-12 h-12 text-muted-foreground/20 mb-3" />}
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {searchQuery ? 'No results found' : activeView === 'pinned' ? 'No pinned notes' : 'No notes yet'}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-5">
                  {searchQuery ? 'Try a different search term' : 'Tap + to create your first note'}
                </p>
                {!searchQuery && (
                  <button onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm active:opacity-80 transition-opacity">
                    <Plus className="w-4 h-4" /> New Note
                  </button>
                )}
              </div>
            ) : (
              <>
                {pinnedNotes.length > 0 && activeView !== 'pinned' && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pinned</p>
                    <div className="mobile-masonry">
                      {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onClick={setSelectedNote} />)}
                    </div>
                  </div>
                )}
                {(activeView === 'pinned' ? pinnedNotes : otherNotes).length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && activeView !== 'pinned' && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Others</p>
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
        )}

        {activeView === 'mindmap' && (
          <div className="px-4 py-4 pb-24">
            <MindMap notes={activeNotes} onNoteClick={setSelectedNote} />
          </div>
        )}
        {activeView === 'archive' && <div className="pb-24"><ArchiveView onNoteClick={setSelectedNote} /></div>}
        {activeView === 'trash'   && <div className="pb-24"><TrashView onNoteClick={setSelectedNote} /></div>}
        {activeView === 'tags'    && <div className="pb-24"><TagsView onNoteClick={setSelectedNote} /></div>}
      </main>

      {/* FAB */}
      {(showGrid || activeView === 'mindmap') && (
        <button onClick={() => setCreateOpen(true)} className="fab-button">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id ||
            (item.id === 'more' && ['more-mindmap', 'more-archive', 'more-trash'].includes(activeTab));
          const count = item.id === 'all' ? counts.all : item.id === 'pinned' ? counts.pinned : null;

          return (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {count !== null && count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {count > 99 ? '99+' : count}
                  </span>
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
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowMoreDrawer(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl pb-safe"
            >
              <div className="w-8 h-1 bg-muted rounded-full mx-auto mt-3 mb-5" />
              <div className="px-4 pb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">More</p>
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const count = item.id === 'archive' ? counts.archive : item.id === 'trash' ? counts.trash : null;
                  return (
                    <button key={item.id} onClick={() => handleMoreItem(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary active:bg-secondary transition-colors mb-0.5">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5 text-foreground" />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                      {count !== null && count > 0 && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{count}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}

                <div className="mt-3 pt-3 border-t border-border">
                  <button onClick={() => { setShowMoreDrawer(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-destructive/10 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-destructive/15 flex items-center justify-center">
                      <LogOut className="w-4.5 h-4.5 text-destructive" />
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
