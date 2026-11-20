import { Cuisine } from './types';

/**
 * The 8 wedges of the wheel, listed CLOCKWISE starting at 12 o'clock. The wheel is
 * drawn in code (see SpinWheel.tsx), so this order is free to change — nothing is
 * tied to a fixed image layout. `color` is the default/Classic wheel color for this
 * wedge; Pro wheel themes (see src/pro/wheelThemes.ts) override it per theme.
 *
 * `query` is what we send to Google Places, so you can tune results here.
 */
export const CUISINES: Cuisine[] = [
  { id: 'steak', label: 'Steak', emoji: '🥩', query: 'steakhouse', color: '#F26B1D' },
  { id: 'italian', label: 'Italian', emoji: '🍝', query: 'italian restaurant', color: '#2F3F5C' },
  { id: 'chicken', label: 'Chicken', emoji: '🍗', query: 'fried chicken restaurant', color: '#F9C230' },
  { id: 'mexican', label: 'Mexican', emoji: '🌮', query: 'mexican restaurant tacos', color: '#5E9E3A' },
  { id: 'chinese', label: 'Chinese', emoji: '🥡', query: 'chinese restaurant', color: '#E8431E' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣', query: 'sushi restaurant', color: '#2F3F5C' },
  { id: 'burgers', label: 'Burgers', emoji: '🍔', query: 'burger restaurant', color: '#E8431E' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', query: 'pizza restaurant', color: '#F9C230' },
];

export function cuisineById(id: string): Cuisine {
  return CUISINES.find((c) => c.id === id) ?? CUISINES[0];
}

export const SEGMENT_DEGREES = 360 / CUISINES.length;
