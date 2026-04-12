import { motion, AnimatePresence } from 'framer-motion';
import {
  StickyNote, Sparkles, Archive, Trash2, Tag, Star,
  ChevronLeft, ChevronRight, Plus, Settings, Zap, Network
} from 'lucide-react';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  onNewNote: () => void;
  onOpenSettings?: () => void;
  counts?: { all: number; pinned: number; archive: number; trash: number };
}

const navItems = [
  { id: 'all', label: 'All Notes', icon: StickyNote },
  { id: 'pinned', label: 'Pinned', icon: Star },
  { id: 'mindmap', label: 'Mind Map', icon: Network },
  { id: 'ai-tags', label: 'AI Tags', icon: Sparkles },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function AppSidebar({ collapsed, onToggle, activeView, onViewChange, onNewNote, onOpenSettings, counts }: AppSidebarProps) {
  const getCount = (id: string) => {
    if (!counts) return null;
    if (id === 'all') return counts.all;
    if (id === 'pinned') return counts.pinned;
    if (id === 'archive') return counts.archive;
    if (id === 'trash') return counts.trash;
    return null;
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-30"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-semibold text-foreground whitespace-nowrap">NoteFlow AI</motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="px-3 mt-4">
        <button onClick={onNewNote} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap">New Note</motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const count = getCount(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap flex-1 text-left">{item.label}</motion.span>
                )}
              </AnimatePresence>
              {!collapsed && count !== null && count > 0 && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm">
          <Settings className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Settings</motion.span>
            )}
          </AnimatePresence>
        </button>
        <button onClick={onToggle} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Collapse</motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
