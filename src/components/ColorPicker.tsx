import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import type { NoteColor } from '@/data/mockNotes';

const presetColors: { value: NoteColor; hex: string; label: string }[] = [
  { value: 'default', hex: '#6b7280', label: 'Default' },
  { value: 'yellow', hex: '#eab308', label: 'Yellow' },
  { value: 'green', hex: '#22c55e', label: 'Green' },
  { value: 'blue', hex: '#3b82f6', label: 'Blue' },
  { value: 'pink', hex: '#ec4899', label: 'Pink' },
  { value: 'orange', hex: '#f97316', label: 'Orange' },
  { value: 'purple', hex: '#a855f7', label: 'Purple' },
  { value: 'teal', hex: '#14b8a6', label: 'Teal' },
];

interface ColorPickerProps {
  currentColor: NoteColor;
  onColorChange: (color: NoteColor) => void;
}

export default function ColorPicker({ currentColor, onColorChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Palette className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 p-3 glass-strong rounded-xl min-w-[200px] z-50"
            style={{
              boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Note Color</p>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { onColorChange(c.value); setOpen(false); }}
                  className="relative w-10 h-10 rounded-lg transition-all hover:scale-110 flex items-center justify-center"
                  style={{
                    backgroundColor: c.hex + '20',
                    border: currentColor === c.value ? `2px solid ${c.hex}` : '2px solid transparent',
                    boxShadow: currentColor === c.value ? `0 0 12px ${c.hex}40` : 'none',
                  }}
                  title={c.label}
                >
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.hex }} />
                  {currentColor === c.value && (
                    <Check className="absolute w-3 h-3 text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
