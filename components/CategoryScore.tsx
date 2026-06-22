import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants';

interface CategoryScoreProps {
  label: string;
  score: number;
}

function getColor(score: number): string {
  if (score >= 80) return COLORS.primary;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
}

export default function CategoryScore({ label, score }: CategoryScoreProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: score,
      duration: 1000,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const color = getColor(score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.score, { color }]}>{score}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  score: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
