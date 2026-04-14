import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Sun, Moon, Eye, BookOpen, Palette, RotateCcw,
  Monitor, Glasses, CircleDot, Grip, Contrast
} from 'lucide-react';
import { useVisualSettings, type ThemeMode, type ColorBlindMode } from '@/store/VisualSettingsContext';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

function SettingSlider({ label, value, onChange, icon: Icon, min = 0, max = 100, suffix = '%' }: {
  label: string; value: number; onChange: (v: number) => void;
  icon: React.ElementType; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {label}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary accent-primary
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
      />
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange, icon: Icon }: {
  label: string; description: string; checked: boolean;
  onChange: (v: boolean) => void; icon: React.ElementType;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
        checked ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50 border border-transparent hover:bg-secondary'
      }`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${checked ? 'text-foreground' : 'text-foreground/80'}`}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className={`w-10 h-5 rounded-full flex-shrink-0 transition-colors relative mt-0.5 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </div>
    </button>
  );
}

const colorBlindOptions: { value: ColorBlindMode; label: string; description: string }[] = [
  { value: 'none', label: 'Standard', description: 'Default color palette' },
  { value: 'protanopia', label: 'Protanopia / Deuteranopia', description: 'Blue-yellow optimized palette' },
  { value: 'tritanopia', label: 'Tritanopia', description: 'Red-cyan optimized palette' },
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, update, reset } = useVisualSettings();

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-full max-w-md glass-strong border-l border-border flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Visual Comfort</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={reset}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Reset to defaults">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-8">

          {/* === THEME === */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'light' as ThemeMode, label: 'Eye-Soft Light', icon: Sun, desc: 'Soft off-white, reduced glare' },
                { value: 'dark' as ThemeMode, label: 'OLED Deep Dark', icon: Moon, desc: 'True black, minimal blue light' },
              ]).map((t) => (
                <button
                  key={t.value}
                  onClick={() => update('theme', t.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    settings.theme === t.value
                      ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10'
                      : 'bg-secondary/30 border-border/40 hover:bg-secondary/60'
                  }`}
                >
                  <t.icon className={`w-6 h-6 ${settings.theme === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium text-foreground">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center">{t.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* === EYE CARE === */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Eye-Care Suite</h3>
            <div className="space-y-5">
              <SettingSlider
                label="Blue Light Filter"
                value={settings.blueLightFilter}
                onChange={(v) => update('blueLightFilter', v)}
                icon={Monitor}
                suffix="%"
              />
              <SettingSlider
                label="Brightness Dimmer"
                value={settings.brightnessDimmer}
                onChange={(v) => update('brightnessDimmer', v)}
                icon={Sun}
                suffix="%"
              />
              <SettingToggle
                label="Reading Mode"
                description="Serif font with optimized line spacing for long-form reading"
                checked={settings.readingMode}
                onChange={(v) => update('readingMode', v)}
                icon={BookOpen}
              />
              <SettingToggle
                label="High Contrast"
                description="Removes all transparency and glassmorphism for maximum visual clarity"
                checked={settings.highContrast}
                onChange={(v) => update('highContrast', v)}
                icon={Contrast}
              />
            </div>
          </section>

          {/* === COLOR BLINDNESS === */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Color Blindness Support</h3>
            <div className="space-y-2 mb-4">
              {colorBlindOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update('colorBlindMode', opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    settings.colorBlindMode === opt.value
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-secondary/30 border border-transparent hover:bg-secondary/50'
                  }`}
                >
                  <Glasses className={`w-4 h-4 flex-shrink-0 ${
                    settings.colorBlindMode === opt.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  {settings.colorBlindMode === opt.value && (
                    <CircleDot className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {settings.colorBlindMode !== 'none' && (
              <SettingToggle
                label="Pattern Overlays"
                description="Add distinct patterns (stripes, dots) to note colors for identification without color"
                checked={settings.patternOverlays}
                onChange={(v) => update('patternOverlays', v)}
                icon={Grip}
              />
            )}
          </section>

          {/* Preview */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Color Preview</h3>
            <div className="flex gap-2 flex-wrap">
              {['yellow', 'green', 'blue', 'pink', 'orange', 'purple', 'teal'].map((c) => (
                <div key={c} className={`w-10 h-10 rounded-lg bg-note-${c} note-pattern-${c}`} title={c} />
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
