import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

type Variant = 'strength' | 'issue' | 'tip';

interface FeedbackCardProps {
  text: string;
  variant: Variant;
}

const VARIANT_CONFIG: Record<
  Variant,
  { icon: string; color: string; bg: string }
> = {
  strength: {
    icon: 'checkmark-circle',
    color: COLORS.primary,
    bg: 'rgba(0,166,81,0.12)',
  },
  issue: {
    icon: 'warning',
    color: COLORS.warning,
    bg: 'rgba(255,184,0,0.12)',
  },
  tip: {
    icon: 'bulb',
    color: COLORS.accent,
    bg: 'rgba(0,212,255,0.12)',
  },
};

export default function FeedbackCard({ text, variant }: FeedbackCardProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={[styles.card, { backgroundColor: config.bg }]}>
      <Ionicons
        name={config.icon as any}
        size={18}
        color={config.color}
        style={styles.icon}
      />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  text: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
