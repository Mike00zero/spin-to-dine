import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow } from '../../theme';
import { GameProps, PlayerIndex, RESULT_PAUSE_MS } from './types';

type Face = 'heads' | 'tails';
const FLIP_MS = 1100;

export function CoinFlip({ players, onWinner }: GameProps) {
  const [call, setCall] = useState<Face | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Face | null>(null);
  const spin = useRef(new Animated.Value(0)).current;

  const winner: PlayerIndex | null = result && call ? (call === result ? 0 : 1) : null;

  const makeCall = (face: Face) => {
    if (call) return;
    Haptics.selectionAsync().catch(() => {});
    setCall(face);
    setFlipping(true);
    const outcome: Face = Math.random() < 0.5 ? 'heads' : 'tails';
    const turns = 4 + Math.floor(Math.random() * 2); // a few extra full flips
    spin.setValue(0);
    Animated.timing(spin, { toValue: turns, duration: FLIP_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      setFlipping(false);
      setResult(outcome);
    });
  };

  useEffect(() => {
    if (winner === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const t = setTimeout(() => onWinner(winner), RESULT_PAUSE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const faceShown = result ?? 'heads';

  return (
    <View style={styles.wrap}>
      <Text style={styles.status}>
        {winner !== null
          ? `${players[winner].name} called it! It's ${result === 'heads' ? 'Heads' : 'Tails'}.`
          : flipping
            ? 'Flipping…'
            : `${players[0].name}, call it in the air!`}
      </Text>
      {!call && <Text style={styles.sub}>Winner is whoever calls the flip correctly.</Text>}

      <View style={styles.coinArea}>
        <Animated.View style={[styles.coin, { transform: [{ perspective: 800 }, { rotateY }] }]}>
          <Text style={styles.coinEmoji}>{flipping ? '🪙' : faceShown === 'heads' ? '🙂' : '⭐'}</Text>
        </Animated.View>
      </View>

      {!call && (
        <View style={styles.choices}>
          <Pressable onPress={() => makeCall('heads')} style={({ pressed }) => [styles.choiceBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.choiceLabel}>🙂 Heads</Text>
          </Pressable>
          <Pressable onPress={() => makeCall('tails')} style={({ pressed }) => [styles.choiceBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.choiceLabel}>⭐ Tails</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch', alignSelf: 'stretch' },
  status: { fontSize: 20, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  sub: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  coinArea: { alignItems: 'center', justifyContent: 'center', marginTop: 24, height: 110 },
  coin: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.yellow,
    borderWidth: 4,
    borderColor: '#D99A10',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  coinEmoji: { fontSize: 44 },
  choices: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 24 },
  choiceBtn: { backgroundColor: colors.card, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 24, ...shadow },
  choiceLabel: { fontWeight: '800', color: colors.ink, fontSize: 16 },
});
