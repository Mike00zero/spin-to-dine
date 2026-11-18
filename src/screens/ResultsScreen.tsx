import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker } from 'react-native-maps';
import { DEFAULT_RADIUS_METERS, isDemoMode, searchAllRestaurants, searchRestaurants, sortRestaurants } from '../api/places';
import { CUISINES, cuisineById } from '../cuisines';
import { RestaurantCard } from '../components/RestaurantCard';
import { Button, formatDistance, Price } from '../components/ui';
import { usePro } from '../pro/purchases';
import { DEFAULT_RADIUS_MILES, DIETARY_OPTIONS, RADIUS_OPTIONS_MILES, useSearchPrefs } from '../pro/searchPrefs';
import { Coords, Cuisine, Restaurant, SortMode } from '../types';
import { colors, radius } from '../theme';

const METERS_PER_MILE = 1609.34;

const SORT_OPTIONS: { mode: SortMode; label: string; description: string }[] = [
  { mode: 'rating', label: '★ Top rated', description: 'Sorted by Google rating, highest first' },
  { mode: 'price', label: '$ Price', description: 'Sorted by price, cheapest first' },
  { mode: 'nearest', label: 'Nearest', description: 'Sorted by distance, nearest first' },
  { mode: 'farthest', label: 'Farthest', description: 'Sorted by distance, farthest first' },
];

type Props = {
  cuisine: Cuisine | null; // null = browse all cuisines
  coords: Coords;
  usingFallbackLocation: boolean;
  onBack: () => void;
  onOpen: (r: Restaurant) => void;
  /** Opens the paywall — passed down to each card's save heart. */
  onPro: () => void;
  // Keeps results when returning from the details screen.
  cache: Restaurant[] | null;
  setCache: (r: Restaurant[]) => void;
  sort: SortMode;
  setSort: (s: SortMode) => void;
  filter: string | null; // cuisine id, browse mode only
  setFilter: (id: string | null) => void;
};

export function ResultsScreen({ cuisine, coords, usingFallbackLocation, onBack, onOpen, onPro, cache, setCache, sort, setSort, filter, setFilter }: Props) {
  const { isPro } = usePro();
  const { dietary, setDietary, radiusMiles, setRadiusMiles } = useSearchPrefs();
  const radiusMeters = isPro ? radiusMiles * METERS_PER_MILE : DEFAULT_RADIUS_METERS;
  const dietaryQuery = isPro ? DIETARY_OPTIONS.find((d) => d.id === dietary)?.query ?? null : null;
  const [tab, setTab] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState<Restaurant[] | null>(cache);
  const browsing = cuisine === null;
  const activeFilterCount =
    (browsing && filter ? 1 : 0) + (dietary ? 1 : 0) + (radiusMiles !== DEFAULT_RADIUS_MILES ? 1 : 0);
  const items = useMemo(() => {
    if (!results) return null;
    const shown = browsing && filter ? results.filter((r) => r.cuisineId === filter) : results;
    return sortRestaurants(shown, sort);
  }, [results, sort, filter, browsing]);
  const filterLabel = (filter ? cuisineById(filter).label : 'restaurant').toLowerCase();
  const [error, setError] = useState<string | null>(null);
  const map = useRef<MapView>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(
    (force: boolean) => {
      const opts = { force, dietary: dietaryQuery, radiusMeters };
      return cuisine ? searchRestaurants(cuisine, coords, opts) : searchAllRestaurants(coords, opts);
    },
    [cuisine, coords, dietaryQuery, radiusMeters],
  );

  const load = useCallback(async () => {
    setError(null);
    setResults(null);
    try {
      const list = await fetchList(false); // served from cache when possible
      setResults(list);
      setCache(list);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    }
  }, [fetchList, setCache]);

  // Pull-to-refresh: bypass the cache but keep the current list on screen meanwhile.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await fetchList(true);
      setResults(list);
      setCache(list);
    } catch {
      // keep showing what we have
    } finally {
      setRefreshing(false);
    }
  }, [fetchList, setCache]);

  useEffect(() => {
    if (!cache) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dietary filter and radius are query-changing (unlike sort/cuisine-filter, which only
  // re-sort what's already loaded), so changing either re-fetches. Skips the first run,
  // since the effect above already covers the initial load.
  const isFirstPrefs = useRef(true);
  useEffect(() => {
    if (isFirstPrefs.current) {
      isFirstPrefs.current = false;
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietaryQuery, radiusMeters]);

  const fitMap = () => {
    if (!items?.length) return;
    map.current?.fitToCoordinates([coords, ...items.map((r) => r.location)], {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: false,
    });
  };

  // Re-frame the map when the cuisine filter changes the set of pins.
  useEffect(() => {
    if (tab === 'map') fitMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹ Spin</Text>
        </Pressable>
        <Text style={styles.title}>
          {cuisine ? `${cuisine.emoji} ${cuisine.label}` : '🍽️ Restaurants'} near you
        </Text>
        <Text style={styles.sub}>
          {SORT_OPTIONS.find((o) => o.mode === sort)!.description}
          {usingFallbackLocation ? ' · location off, showing NYC' : ''}
        </Text>
        <View style={styles.tabs}>
          {(['list', 'map'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'list' ? 'List' : 'Map'}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sorts}>
          {SORT_OPTIONS.map((o) => {
            const active = o.mode === sort;
            return (
              <Pressable
                key={o.mode}
                onPress={() => setSort(o.mode)}
                style={[styles.sortChip, active && styles.sortChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable onPress={() => setFiltersOpen(true)} style={({ pressed }) => [styles.filtersBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.filtersBtnText}>🔍 Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
        {isDemoMode && <Text style={styles.demo}>Demo data · add a Google API key to see real restaurants</Text>}
      </View>

      <Modal visible={filtersOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFiltersOpen(false)}>
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Pressable onPress={() => setFiltersOpen(false)} hitSlop={10}>
              <Text style={styles.sheetDone}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {browsing && (
              <>
                <Text style={styles.sheetSection}>Food type</Text>
                <View style={styles.chipGrid}>
                  {[null, ...CUISINES].map((c) => {
                    const active = (c?.id ?? null) === filter;
                    return (
                      <Pressable
                        key={c?.id ?? 'all'}
                        onPress={() => setFilter(c?.id ?? null)}
                        style={[styles.sortChip, active && styles.filterChipActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.sortText, active && styles.sortTextActive]}>
                          {c ? `${c.emoji} ${c.label}` : 'All'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.sheetSection}>Dietary</Text>
            <View style={styles.chipGrid}>
              {[null, ...DIETARY_OPTIONS].map((d) => {
                const active = (d?.id ?? null) === dietary;
                const locked = !isPro && d !== null;
                return (
                  <Pressable
                    key={d?.id ?? 'any'}
                    onPress={() => (locked ? onPro() : setDietary(d?.id ?? null))}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={locked ? `${d.label}, Pro feature` : undefined}
                  >
                    <Text style={[styles.sortText, active && styles.sortTextActive]}>
                      {d ? `${d.emoji} ${d.label}` : '🍴 Any diet'}
                      {locked ? ' 🔒' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetSection}>Distance</Text>
            <View style={styles.chipGrid}>
              {RADIUS_OPTIONS_MILES.map((mi) => {
                const active = mi === radiusMiles;
                const locked = !isPro && mi !== radiusMiles;
                return (
                  <Pressable
                    key={mi}
                    onPress={() => (locked ? onPro() : setRadiusMiles(mi))}
                    style={[styles.sortChip, active && styles.sortChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={locked ? `${mi} miles, Pro feature` : undefined}
                  >
                    <Text style={[styles.sortText, active && styles.sortTextActive]}>
                      📍 {mi} mi{locked ? ' 🔒' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeFilterCount > 0 && (
              <Pressable
                onPress={() => {
                  setFilter(null);
                  setDietary(null);
                  setRadiusMiles(DEFAULT_RADIUS_MILES);
                }}
                style={{ marginTop: 24, alignSelf: 'center' }}
                hitSlop={8}
              >
                <Text style={styles.clearFilters}>Clear all filters</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title="Try again" onPress={load} />
        </View>
      ) : !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.sub}>Finding the best {cuisine ? cuisine.label.toLowerCase() : 'food'} nearby…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.title}>No {cuisine ? cuisine.label.toLowerCase() : filterLabel} spots nearby</Text>
          {browsing && filter ? (
            <Button title="Show all restaurants" onPress={() => setFilter(null)} />
          ) : (
            <Button title={browsing ? 'Back' : 'Spin again'} onPress={onBack} />
          )}
        </View>
      ) : tab === 'list' ? (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          // Every card shows a billed Places photo. FlatList's defaults render about ten
          // screens ahead, so keep the window small: cards (and photos) load as you scroll.
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          refreshing={refreshing}
          onRefresh={isDemoMode ? undefined : refresh}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <RestaurantCard
              restaurant={item}
              rank={index + 1}
              cuisine={cuisineById(item.cuisineId)}
              onPress={() => onOpen(item)}
              onLockedFavorite={onPro}
            />
          )}
          ListFooterComponent={<Text style={styles.attrib}>Ratings, reviews & photos from Google</Text>}
        />
      ) : (
        <MapView
          ref={map}
          style={{ flex: 1 }}
          showsUserLocation
          onMapReady={fitMap}
          initialRegion={{ ...coords, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        >
          {items.map((r, i) => (
            <Marker key={r.id} coordinate={r.location} pinColor={i === 0 ? colors.red : colors.orange}>
              <Callout onPress={() => onOpen(r)}>
                <View style={{ maxWidth: 220, padding: 4 }}>
                  <Text style={{ fontWeight: '800' }}>
                    #{i + 1} {r.name}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    ★ {r.rating.toFixed(1)} · {formatDistance(r.distanceKm)}
                  </Text>
                  <Price level={r.priceLevel} />
                  <Text style={{ color: colors.orange, fontWeight: '700', marginTop: 4 }}>View details ›</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { paddingVertical: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 17, color: colors.orange, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink, textAlign: 'left' },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  demo: { fontSize: 12, color: colors.navy, marginTop: 8, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#F3E6D0', borderRadius: radius.pill, padding: 4, marginTop: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.ink },
  sorts: { gap: 8, marginTop: 10 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  sortChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  sortText: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  filterChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  sortTextActive: { color: '#fff' },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  filtersBtnText: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  filterBadge: { backgroundColor: colors.orange, borderRadius: radius.pill, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sheet: { flex: 1, backgroundColor: colors.cream },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  sheetDone: { color: colors.orange, fontWeight: '800', fontSize: 16 },
  sheetSection: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.muted, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clearFilters: { color: colors.red, fontWeight: '700', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  error: { color: colors.red, textAlign: 'center' },
  attrib: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 6 },
});
