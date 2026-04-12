import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ColorBlindMode = 'none' | 'protanopia' | 'tritanopia';

export interface VisualSettings {
  theme: ThemeMode;
  blueLightFilter: number; // 0-100
  brightnessDimmer: number; // 0-100 (100 = full brightness)
  readingMode: boolean;
  colorBlindMode: ColorBlindMode;
  patternOverlays: boolean;
}

const defaults: VisualSettings = {
  theme: 'dark',
  blueLightFilter: 0,
  brightnessDimmer: 100,
  readingMode: false,
  colorBlindMode: 'none',
  patternOverlays: false,
};

interface VisualSettingsContextType {
  settings: VisualSettings;
  update: <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => void;
  reset: () => void;
}

const VisualSettingsContext = createContext<VisualSettingsContextType | null>(null);

const STORAGE_KEY = 'noteflow-visual-settings';

function load(): VisualSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
}

export function VisualSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VisualSettings>(load);

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
  }, [settings.theme]);

  // Apply reading mode font
  useEffect(() => {
    document.body.classList.toggle('reading-mode', settings.readingMode);
  }, [settings.readingMode]);

  // Apply colorblind mode
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-colorblind', settings.colorBlindMode);
    document.body.classList.toggle('pattern-overlays', settings.patternOverlays && settings.colorBlindMode !== 'none');
  }, [settings.colorBlindMode, settings.patternOverlays]);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback(<K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(defaults), []);

  return (
    <VisualSettingsContext.Provider value={{ settings, update, reset }}>
      {children}
      {/* Blue Light Filter Overlay */}
      {settings.blueLightFilter > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            backgroundColor: `rgba(255, 180, 50, ${settings.blueLightFilter * 0.004})`,
            mixBlendMode: 'multiply',
          }}
        />
      )}
      {/* Brightness Dimmer Overlay */}
      {settings.brightnessDimmer < 100 && (
        <div
          className="fixed inset-0 pointer-events-none z-[9998]"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${(100 - settings.brightnessDimmer) * 0.008})`,
          }}
        />
      )}
    </VisualSettingsContext.Provider>
  );
}

export function useVisualSettings() {
  const ctx = useContext(VisualSettingsContext);
  if (!ctx) throw new Error('useVisualSettings must be used within VisualSettingsProvider');
  return ctx;
}
