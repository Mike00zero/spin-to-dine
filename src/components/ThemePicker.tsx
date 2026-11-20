import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePro } from '../pro/purchases';
import { useWheelTheme } from '../pro/wheelThemeContext';
import { colors, radius, shadow } from '../theme';

/** A row of small wheel swatches under the wheel. Locked (Pro) themes show a 🔒 badge
 * and open the paywall instead of applying — never a dead tap. */
export function ThemePicker({ onLockedPress }: { onLockedPress: () => void }) {
  const { isPro } = usePro();
  const { theme, available, setThemeId } = useWheelTheme();

  return (
    <View style={styles.row}>
      {available.map((t) => {
        const locked = t.pro && !isPro;
        const active = t.id === theme.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => (locked ? onLockedPress() : setThemeId(t.id))}
            style={({ pressed }) => [styles.swatchWrap, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={`${t.name} wheel theme${locked ? ', Pro feature' : ''}`}
          >
            {/* The active ring and the clipped color circle are separate views — combining a
                border, overflow:hidden and a shadow on one view is what was clipping the
                circle oddly when unselected. */}
            <View style={[styles.ring, active && styles.ringActive]}>
              <View style={styles.swatch}>
                <View style={[styles.swatchHalf, { backgroundColor: Object.values(t.wedgeColors)[0] }]} />
                <View style={[styles.swatchHalf, { backgroundColor: Object.values(t.wedgeColors)[1] }]} />
              </View>
              {locked && (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              )}
            </View>
            <Text style={[styles.name, active && { color: colors.ink, fontWeight: '800' }]}>{t.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SWATCH = 40;
const RING = SWATCH + 8;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  swatchWrap: { alignItems: 'center', gap: 4 },
  // Just the selection ring — a plain circular border, nothing else, so it always
  // renders as a clean circle regardless of selection state.
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringActive: { borderColor: colors.ink },
  // The actual colored circle: sized, clipped, and shadowed on its own, with no border.
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow,
    shadowOpacity: 0.1,
  },
  swatchHalf: { width: SWATCH / 2, height: SWATCH },
  lockBadge: {
    position: 'absolute',
    // Sits at the visible swatch's corner, now that it's nested inside the larger ring.
    right: (RING - SWATCH) / 2 - 4,
    bottom: (RING - SWATCH) / 2 - 4,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.15,
  },
  lockText: { fontSize: 10 },
  name: { fontSize: 11, color: colors.muted, fontWeight: '600' },
});
