import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isDebugPro, usePro } from '../pro/purchases';
import { Button } from '../components/ui';
import { colors, radius, shadow } from '../theme';

const FEATURES: { emoji: string; title: string; blurb: string }[] = [
  { emoji: '🎨', title: 'Wheel themes', blurb: 'Midnight, Pastel, and Neon color sets for the wheel — pick your favorite look.' },
  { emoji: '🎮', title: 'More Food Battle games', blurb: 'Rock-Paper-Scissors and Coin Flip, plus a Best of 5 option.' },
  { emoji: '❤️', title: 'Favorites & history', blurb: "Save restaurants you like and revisit your past spins." },
  { emoji: '🥗', title: 'Dietary filters & radius', blurb: 'Filter by vegetarian, vegan, halal, gluten-free, and set your own search distance.' },
];

export function PaywallScreen({ onBack }: { onBack: () => void }) {
  const { isPro, loading, package: pkg, purchasePro, restorePurchases } = usePro();
  const [busy, setBusy] = useState(false);

  const priceLabel = pkg?.product.priceString ?? '—';

  const handlePurchase = async () => {
    setBusy(true);
    const result = await purchasePro();
    setBusy(false);
    if (result.success) {
      Alert.alert("You're Pro! 🎉", 'All Pro features are unlocked.', [{ text: 'Nice', onPress: onBack }]);
    } else if (result.error) {
      Alert.alert('Purchase failed', result.error);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const result = await restorePurchases();
    setBusy(false);
    if (result.success) {
      Alert.alert('Restored!', 'Your Pro purchase has been restored.', [{ text: 'Great', onPress: onBack }]);
    } else {
      Alert.alert('Nothing to restore', result.error ?? 'No previous purchase was found.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>⭐ SPIN TO DINE PRO</Text>
        <Text style={styles.title}>Unlock everything</Text>
        <Text style={styles.lead}>One payment. No subscription. Yours forever.</Text>

        <View style={styles.card}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBlurb}>{f.blurb}</Text>
              </View>
            </View>
          ))}
        </View>

        {isPro ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>✓ You already own Pro{isDebugPro ? ' (test build)' : ''}</Text>
          </View>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
            ) : (
              <Button
                title={busy ? 'Please wait…' : `Unlock Pro — ${priceLabel}`}
                onPress={handlePurchase}
                disabled={busy}
                style={{ marginTop: 24 }}
              />
            )}
            <Pressable onPress={handleRestore} disabled={busy} style={{ marginTop: 14, alignItems: 'center' }} hitSlop={8}>
              <Text style={styles.restoreText}>Restore purchases</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 17, color: colors.orange, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 48, alignItems: 'center' },
  kicker: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: colors.orange, marginTop: 8 },
  title: { fontSize: 32, fontWeight: '900', color: colors.ink, marginTop: 6, textAlign: 'center' },
  lead: { fontSize: 15, color: colors.muted, marginTop: 4, textAlign: 'center' },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 24,
    gap: 16,
    ...shadow,
  },
  featureRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  featureEmoji: { fontSize: 26, lineHeight: 30 },
  featureTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  featureBlurb: { fontSize: 13, color: colors.muted, marginTop: 2 },
  restoreText: { color: colors.muted, fontWeight: '700', fontSize: 14 },
  ownedBadge: {
    marginTop: 24,
    backgroundColor: colors.green,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ownedText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
