import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LoadingScreen } from './src/components/LoadingScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { BattleScreen } from './src/screens/BattleScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { ProProvider } from './src/pro/purchases';
import { WheelThemeProvider } from './src/pro/wheelThemeContext';
import { FavoritesProvider } from './src/pro/favorites';
import { SearchPrefsProvider } from './src/pro/searchPrefs';
import { useLocation } from './src/hooks/useLocation';
import { Cuisine, Restaurant, SortMode } from './src/types';
import { cuisineById } from './src/cuisines';
import { colors } from './src/theme';

// A handful of screens, so a tiny state machine is all the navigation we need.
// cuisine === null means "browse everything" (the user skipped the spin).
type Route =
  | { name: 'home' }
  | { name: 'battle' }
  | { name: 'paywall' }
  | { name: 'favorites' }
  | { name: 'results'; cuisine: Cuisine | null }
  // `from: 'favorites'` means Back should return to the Favorites list, not a results
  // screen — opening a saved restaurant never came from a search in the first place.
  | { name: 'details'; cuisine: Cuisine | null; restaurant: Restaurant; from?: 'favorites' };

// Keep the native splash up until LoadingScreen is on screen to take over from it.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <ProProvider>
      <WheelThemeProvider>
        <FavoritesProvider>
          <SearchPrefsProvider>
            <AppInner />
          </SearchPrefsProvider>
        </FavoritesProvider>
      </WheelThemeProvider>
    </ProProvider>
  );
}

function AppInner() {
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => setLoading(false), []);
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [cache, setCache] = useState<Restaurant[] | null>(null);
  // Lives here so the chosen sort survives a trip to the details screen.
  const [sort, setSort] = useState<SortMode>('rating');
  // Cuisine filter for browse mode; null = all.
  const [filter, setFilter] = useState<string | null>(null);
  const { coords, usingFallback } = useLocation();

  const goBack = () => {
    if (route.name === 'details') {
      setRoute(route.from === 'favorites' ? { name: 'favorites' } : { name: 'results', cuisine: route.cuisine });
    } else if (route.name === 'results' || route.name === 'battle' || route.name === 'paywall' || route.name === 'favorites') {
      setRoute({ name: 'home' });
    }
  };

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  });

  const showResults = (cuisine: Cuisine | null) => {
    setCache(null);
    setSort('rating');
    setFilter(null);
    setRoute({ name: 'results', cuisine });
  };

  const openPaywall = () => setRoute({ name: 'paywall' });

  let screen: React.ReactNode;
  if (route.name === 'home') {
    screen = (
      <HomeScreen
        onFindPlaces={showResults}
        onBattle={() => setRoute({ name: 'battle' })}
        onPro={openPaywall}
        onFavorites={() => setRoute({ name: 'favorites' })}
      />
    );
  } else if (route.name === 'paywall') {
    screen = <PaywallScreen onBack={goBack} />;
  } else if (route.name === 'favorites') {
    screen = (
      <FavoritesScreen
        onBack={goBack}
        onPro={openPaywall}
        onOpen={(restaurant) => setRoute({ name: 'details', cuisine: null, restaurant, from: 'favorites' })}
        onSpinCuisine={(id) => showResults(cuisineById(id))}
      />
    );
  } else if (route.name === 'battle') {
    // Rendered before the location check: food-type battles don't need location.
    screen = (
      <BattleScreen
        coords={coords}
        onBack={goBack}
        onCuisine={showResults}
        onPro={openPaywall}
        onRestaurant={(restaurant, list) => {
          // Land on the winner's details; "back" goes to the battle's restaurant list.
          setCache(list);
          setSort('rating');
          setFilter(null);
          setRoute({ name: 'details', cuisine: null, restaurant });
        }}
      />
    );
  } else if (!coords) {
    screen = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  } else {
    const cuisine = route.cuisine;
    const results = (
      <ResultsScreen
        cuisine={cuisine}
        coords={coords}
        usingFallbackLocation={usingFallback}
        cache={cache}
        setCache={setCache}
        sort={sort}
        setSort={setSort}
        filter={filter}
        setFilter={setFilter}
        onBack={goBack}
        onPro={openPaywall}
        onOpen={(restaurant) => setRoute({ name: 'details', cuisine, restaurant })}
      />
    );
    const details = route.name === 'details' && (
      <DetailsScreen restaurant={route.restaurant} cuisine={cuisineById(route.restaurant.cuisineId)} onBack={goBack} onPro={openPaywall} />
    );
    screen =
      route.name === 'results' ? (
        results
      ) : route.from === 'favorites' ? (
        details // opened from Favorites, not a search — nothing to reveal behind it
      ) : (
        // Results stay rendered underneath so swiping the details page aside reveals them.
        <View style={{ flex: 1 }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {results}
          </View>
          {details}
        </View>
      );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {screen}
      {loading && <LoadingScreen onDone={finishLoading} />}
    </SafeAreaProvider>
  );
}
