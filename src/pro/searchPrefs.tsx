import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePro } from './purchases';

const STORAGE_KEY = 'searchPrefs:v1';

export type DietaryId = 'vegetarian' | 'vegan' | 'halal' | 'glutenfree';

export const DIETARY_OPTIONS: { id: DietaryId; label: string; emoji: string; query: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥦', query: 'vegetarian' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱', query: 'vegan' },
  { id: 'halal', label: 'Halal', emoji: '🌙', query: 'halal' },
  { id: 'glutenfree', label: 'Gluten-Free', emoji: '🌾', query: 'gluten-free' },
];

/** Miles — kept as a short, discrete list rather than a slider, so no extra native
 * dependency is needed just for this. */
export const RADIUS_OPTIONS_MILES = [3, 5, 10, 15, 25];
export const DEFAULT_RADIUS_MILES = 5;

type SearchPrefsValue = {
  /** null = no dietary filter. */
  dietary: DietaryId | null;
  setDietary: (id: DietaryId | null) => void;
  radiusMiles: number;
  setRadiusMiles: (miles: number) => void;
};

const SearchPrefsContext = createContext<SearchPrefsValue | null>(null);

type Stored = { dietary: DietaryId | null; radiusMiles: number };

export function SearchPrefsProvider({ children }: { children: React.ReactNode }) {
  const { isPro, loading: proLoading } = usePro();
  const [dietary, setDietaryState] = useState<DietaryId | null>(null);
  const [radiusMiles, setRadiusMilesState] = useState(DEFAULT_RADIUS_MILES);
  const [loadedStored, setLoadedStored] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed: Stored = JSON.parse(raw);
          setDietaryState(parsed.dietary);
          setRadiusMilesState(parsed.radiusMiles);
        }
      })
      .catch(() => {})
      .finally(() => setLoadedStored(true));
  }, []);

  // Safety net, same pattern as wheel themes: fall back to defaults once Pro status
  // is actually known, if it turns out these aren't available after all.
  useEffect(() => {
    if (!loadedStored || proLoading || isPro) return;
    if (dietary !== null) setDietaryState(null);
    if (radiusMiles !== DEFAULT_RADIUS_MILES) setRadiusMilesState(DEFAULT_RADIUS_MILES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedStored, proLoading, isPro]);

  const persist = (next: Stored) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

  const setDietary = (id: DietaryId | null) => {
    if (!isPro) return; // UI should already prevent this; just a safety net
    setDietaryState(id);
    persist({ dietary: id, radiusMiles });
  };

  const setRadiusMiles = (miles: number) => {
    if (!isPro) return;
    setRadiusMilesState(miles);
    persist({ dietary, radiusMiles: miles });
  };

  return (
    <SearchPrefsContext.Provider value={{ dietary, setDietary, radiusMiles, setRadiusMiles }}>{children}</SearchPrefsContext.Provider>
  );
}

export function useSearchPrefs(): SearchPrefsValue {
  const ctx = useContext(SearchPrefsContext);
  if (!ctx) throw new Error('useSearchPrefs() must be used inside a <SearchPrefsProvider>');
  return ctx;
}
