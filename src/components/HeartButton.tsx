import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { usePro } from '../pro/purchases';
import { useFavorites } from '../pro/favorites';
import { Restaurant } from '../types';
import { shadow } from '../theme';

/** Save/unsave heart, shown on a restaurant card or details page. Tapping it when Pro
 * isn't unlocked opens the paywall instead of saving — never a silent no-op. */
export function HeartButton({
  restaurant,
  onLockedPress,
  size = 34,
  style,
}: {
  restaurant: Restaurant;
  onLockedPress: () => void;
  size?: number;
  style?: ViewStyle;
}) {
  const { isPro } = usePro();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isPro && isFavorite(restaurant.id);

  return (
    <Pressable
      onPress={() => (isPro ? toggleFavorite(restaurant) : onLockedPress())}
      hitSlop={10}
      style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove ${restaurant.name} from favorites` : `Save ${restaurant.name} to favorites`}
    >
      <Text style={{ fontSize: size * 0.52 }}>{saved ? '❤️' : '🤍'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.18,
  },
});
