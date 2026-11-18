import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RestaurantCard } from '../components/RestaurantCard';
import { useFavorites } from '../pro/favorites';
import { cuisineById } from '../cuisines';
import { Restaurant } from '../types';
import { colors, radius, shadow } from '../theme';

/** Roughly formats "3h ago", "2d ago", etc. — this list is short, so no library needed. */
function timeAgo(at: number): string {
  const mins = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function FavoritesScreen({
  onBack,
  onOpen,
  onPro,
  onSpinCuisine,
}: {
  onBack: () => void;
  onOpen: (r: Restaurant) => void;
  onPro: () => void;
  onSpinCuisine: (cuisineId: string) => void;
}) {
  const { favorites, history, clearHistory } = useFavorites();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Spin</Text>
        </Pressable>
        <Text style={styles.title}>❤️ Favorites</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          history.length > 0 ? (
            <View style={styles.historyBlock}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.sectionTitle}>Recent spins</Text>
                <Pressable onPress={clearHistory} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.historyRow}>
                {history.map((h, i) => {
                  const c = cuisineById(h.cuisineId);
                  return (
                    <Pressable key={i} onPress={() => onSpinCuisine(h.cuisineId)} style={({ pressed }) => [styles.historyChip, pressed && { opacity: 0.8 }]}>
                      <Text style={styles.historyEmoji}>{c.emoji}</Text>
                      <Text style={styles.historyLabel}>{c.label}</Text>
                      <Text style={styles.historyTime}>{timeAgo(h.at)}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Saved restaurants</Text>
            </View>
          ) : favorites.length > 0 ? (
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Saved restaurants</Text>
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <RestaurantCard
            restaurant={item}
            rank={index + 1}
            cuisine={cuisineById(item.cuisineId)}
            onPress={() => onOpen(item)}
            onLockedFavorite={onPro}
          />
        )}
        ListEmptyComponent={
          history.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🤍</Text>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptyText}>Tap the heart on any restaurant to save it here.</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No saved restaurants yet — tap the heart on one to add it here.</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { paddingVertical: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 17, color: colors.orange, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '900', color: colors.red },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.muted, textTransform: 'uppercase' },
  historyBlock: { marginBottom: 14 },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...shadow,
    shadowOpacity: 0.06,
  },
  historyEmoji: { fontSize: 16 },
  historyLabel: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  historyTime: { color: colors.muted, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  emptyText: { color: colors.muted, textAlign: 'center', paddingHorizontal: 20 },
});
