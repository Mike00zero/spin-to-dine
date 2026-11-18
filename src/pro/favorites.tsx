import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restaurant } from '../types';

const FAVORITES_KEY = 'favorites:v1';
const HISTORY_KEY = 'spinHistory:v1';
const MAX_FAVORITES = 50;
const MAX_HISTORY = 20;

export type HistoryEntry = { cuisineId: string; at: number };

type FavoritesContextValue = {
  favorites: Restaurant[];
  isFavorite: (id: string) => boolean;
  /** Also keeps the saved copy's details (reviews, hours…) fresh if it's already in the list. */
  toggleFavorite: (r: Restaurant) => void;
  history: HistoryEntry[];
  addHistory: (cuisineId: string) => void;
  clearHistory: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [favRaw, histRaw] = await Promise.all([AsyncStorage.getItem(FAVORITES_KEY), AsyncStorage.getItem(HISTORY_KEY)]);
        if (favRaw) setFavorites(JSON.parse(favRaw));
        if (histRaw) setHistory(JSON.parse(histRaw));
      } catch {
        // start empty — nothing to recover
      }
    })();
  }, []);

  const persistFavorites = (list: Restaurant[]) => {
    setFavorites(list);
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list)).catch(() => {});
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = (r: Restaurant) => {
    if (isFavorite(r.id)) persistFavorites(favorites.filter((f) => f.id !== r.id));
    else persistFavorites([r, ...favorites].slice(0, MAX_FAVORITES));
  };

  const addHistory = (cuisineId: string) => {
    const next = [{ cuisineId, at: Date.now() }, ...history].slice(0, MAX_HISTORY);
    setHistory(next);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
  };

  const clearHistory = () => {
    setHistory([]);
    AsyncStorage.removeItem(HISTORY_KEY).catch(() => {});
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, history, addHistory, clearHistory }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites() must be used inside a <FavoritesProvider>');
  return ctx;
}
