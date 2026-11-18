import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow } from '../../theme';
import { GameProps, PlayerIndex, RESULT_PAUSE_MS } from './types';

type Choice = 'rock' | 'paper' | 'scissors';
const CHOICES: { id: Choice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '✊', label: 'Rock' },
  { id: 'paper', emoji: '✋', label: 'Paper' },
  { id: 'scissors', emoji: '✌️', label: 'Scissors' },
];
// beats[a] = the choice `a` beats
const BEATS: Record<Choice, Choice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

type Step = { name: 'pick'; player: PlayerIndex } | { name: 'reveal' };

export function RockPaperScissors({ players, onWinner }: GameProps) {
  const [picks, setPicks] = useState<[Choice | null, Choice | null]>([null, null]);
  const [step, setStep] = useState<Step>({ name: 'pick', player: 0 });

  const tie = step.name === 'reveal' && picks[0] === picks[1];
  const winner: PlayerIndex | null =
    step.name === 'reveal' && picks[0] && picks[1] && picks[0] !== picks[1] ? (BEATS[picks[0]] === picks[1] ? 0 : 1) : null;

  const choose = (c: Choice) => {
    if (step.name !== 'pick') return;
    Haptics.selectionAsync().catch(() => {});
    const next: [Choice | null, Choice | null] = step.player === 0 ? [c, picks[1]] : [picks[0], c];
    setPicks(next);
    if (step.player === 0) setStep({ name: 'pick', player: 1 });
    else setStep({ name: 'reveal' });
  };

  useEffect(() => {
    if (winner === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const t = setTimeout(() => onWinner(winner), RESULT_PAUSE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  useEffect(() => {
    if (!tie) return;
    const t = setTimeout(() => {
      setPicks([null, null]);
      setStep({ name: 'pick', player: 0 });
    }, RESULT_PAUSE_MS);
    return () => clearTimeout(t);
  }, [tie]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.status}>
        {winner !== null
          ? `${players[winner].name} wins! ${CHOICES.find((c) => c.id === picks[winner])!.emoji} beats ${CHOICES.find((c) => c.id === picks[winner === 0 ? 1 : 0])!.emoji}`
          : tie
            ? `Tie! Both picked ${CHOICES.find((c) => c.id === picks[0])!.label}. Go again…`
            : step.name === 'pick'
              ? `${players[step.player].name}, make your pick!`
              : ''}
      </Text>
      {step.name === 'pick' && step.player === 1 && <Text style={styles.sub}>{players[0].name}'s pick is secret.</Text>}

      {step.name === 'reveal' ? (
        <View style={styles.revealRow}>
          {players.map((p, i) => (
            <View key={i} style={[styles.revealCard, { borderColor: winner === i ? p.color : 'transparent' }]}>
              <Text style={[styles.revealName, { color: p.color }]}>{p.name}</Text>
              <Text style={styles.revealEmoji}>{CHOICES.find((c) => c.id === picks[i])!.emoji}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.choices}>
          {CHOICES.map((c) => (
            <Pressable key={c.id} onPress={() => choose(c.id)} style={({ pressed }) => [styles.choiceBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.choiceEmoji}>{c.emoji}</Text>
              <Text style={styles.choiceLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch', alignSelf: 'stretch' },
  status: { fontSize: 20, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  sub: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  choices: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 24 },
  choiceBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    ...shadow,
  },
  choiceEmoji: { fontSize: 36 },
  choiceLabel: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  revealRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 },
  revealCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 3, padding: 18, alignItems: 'center', ...shadow },
  revealName: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  revealEmoji: { fontSize: 48 },
});
