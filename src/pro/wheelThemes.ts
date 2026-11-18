import { CUISINES } from '../cuisines';

export type WheelThemeId = 'classic' | 'midnight' | 'pastel' | 'neon';

export type WheelTheme = {
  id: WheelThemeId;
  name: string;
  pro: boolean; // false = available for free (Classic)
  /** Wedge color per cuisine id. */
  wedgeColors: Record<string, string>;
  hub: string; // center hub color
  rim: string; // outer ring color
};

// One color per cuisine, in CUISINES order, for each theme.
const ORDER = CUISINES.map((c) => c.id);

function paletteFor(colors: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  ORDER.forEach((id, i) => {
    map[id] = colors[i % colors.length];
  });
  return map;
}

export const WHEEL_THEMES: WheelTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    pro: false,
    wedgeColors: paletteFor(['#F26B1D', '#2F3F5C', '#F9C230', '#5E9E3A', '#E8431E', '#2F3F5C', '#E8431E', '#F9C230']),
    hub: '#E8431E',
    rim: '#F1E6DA',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    pro: true,
    wedgeColors: paletteFor(['#2A1B5C', '#0E2A47', '#4A1942', '#102A2A', '#3A1030', '#13203A', '#401E12', '#1E2A14']),
    hub: '#7C3AED',
    rim: '#2A2A3A',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    pro: true,
    wedgeColors: paletteFor(['#FFB3A7', '#B8C6E8', '#FFE29A', '#B5E3C6', '#F6C6D8', '#C9B8E8', '#FFD9B3', '#A7E0DC']),
    hub: '#FF9FB0',
    rim: '#FFFFFF',
  },
  {
    id: 'neon',
    name: 'Neon',
    pro: true,
    wedgeColors: paletteFor(['#FF2E63', '#08D9D6', '#FFD400', '#39FF14', '#FF2E63', '#08D9D6', '#B026FF', '#FFD400']),
    hub: '#08D9D6',
    rim: '#1A1A2E',
  },
];

export function wheelThemeById(id: WheelThemeId): WheelTheme {
  return WHEEL_THEMES.find((t) => t.id === id) ?? WHEEL_THEMES[0];
}
