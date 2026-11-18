import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePro } from './purchases';
import { WHEEL_THEMES, WheelTheme, WheelThemeId, wheelThemeById } from './wheelThemes';

const STORAGE_KEY = 'wheelTheme:v1';

type WheelThemeContextValue = {
  theme: WheelTheme;
  available: WheelTheme[];
  /** Fails silently (keeps the current theme) if `id` is a Pro theme and Pro isn't unlocked. */
  setThemeId: (id: WheelThemeId) => void;
};

const WheelThemeContext = createContext<WheelThemeContextValue | null>(null);

export function WheelThemeProvider({ children }: { children: React.ReactNode }) {
  const { isPro, loading: proLoading } = usePro();
  const [themeId, setThemeIdState] = useState<WheelThemeId>('classic');
  const [loadedStored, setLoadedStored] = useState(false);

  // Load the saved choice once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setThemeIdState(raw as WheelThemeId);
      })
      .catch(() => {})
      .finally(() => setLoadedStored(true));
  }, []);

  // Safety net: if Pro was lost or never unlocked (e.g. a restore on a new device,
  // or Pro turns out not configured in this build) fall back to the free theme,
  // but only once we actually know the real Pro status — not on the first render.
  useEffect(() => {
    if (!loadedStored || proLoading) return;
    const current = wheelThemeById(themeId);
    if (current.pro && !isPro) setThemeIdState('classic');
  }, [loadedStored, proLoading, isPro, themeId]);

  const setThemeId = (id: WheelThemeId) => {
    const target = wheelThemeById(id);
    if (target.pro && !isPro) return; // UI should already prevent this; just a safety net
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  };

  return (
    <WheelThemeContext.Provider value={{ theme: wheelThemeById(themeId), available: WHEEL_THEMES, setThemeId }}>
      {children}
    </WheelThemeContext.Provider>
  );
}

export function useWheelTheme(): WheelThemeContextValue {
  const ctx = useContext(WheelThemeContext);
  if (!ctx) throw new Error('useWheelTheme() must be used inside a <WheelThemeProvider>');
  return ctx;
}
