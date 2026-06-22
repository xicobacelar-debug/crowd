import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAnalysis } from '../context/AnalysisContext';
import { extractVideoFrames } from '../services/videoProcessor';
import { analyzeGolfSwing } from '../services/claudeAnalysis';
import { COLORS, ANALYSIS_STEPS } from '../constants';

export default function AnalysisScreen() {
  const { state, setFrames, setAnalysis, setError } = useAnalysis();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();

    runAnalysis();
  }, []);

  const advanceStep = (step: number) => {
    setCurrentStep(step);
    setCompletedSteps((prev) => [...prev, step - 1]);
    Animated.timing(progressAnim, {
      toValue: (step / ANALYSIS_STEPS.length) * 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const runAnalysis = async () => {
    if (!state.videoUri) {
      Alert.alert('Error', 'No video selected.', [
        { text: 'Go Back', onPress: () => router.replace('/') },
      ]);
      return;
    }

    try {
      // Step 1: Extract frames
      advanceStep(0);
      const frames = await extractVideoFrames(state.videoUri, 6);
      setFrames(frames);
      if (frames.length > 0) setThumbnail(frames[0]);

      // Step 2: Detect pose
      advanceStep(1);

      // Step 3: Analyze swing
      advanceStep(2);
      const apiKey = await SecureStore.getItemAsync('anthropic_api_key');
      if (!apiKey) {
        Alert.alert(
          'API Key Required',
          'Please add your Claude API key in Settings to enable AI analysis.',
          [
            { text: 'Settings', onPress: () => router.replace('/settings') },
            { text: 'Cancel', onPress: () => router.replace('/'), style: 'cancel' },
          ]
        );
        return;
      }

      // Step 4: Generate feedback
      advanceStep(3);
      const analysis = await analyzeGolfSwing(frames, apiKey, state.viewAngle);
      setAnalysis(analysis);

      setCompletedSteps([0, 1, 2, 3]);
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Brief pause to show completion before navigating
      setTimeout(() => {
        router.replace('/results');
      }, 800);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Analysis failed';
      setError(message);
      Alert.alert('Analysis Failed', message, [
        { text: 'Try Again', onPress: () => router.replace('/record') },
        { text: 'Home', onPress: () => router.replace('/'), style: 'cancel' },
      ]);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.gradientMid, COLORS.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Video thumbnail */}
          {thumbnail && (
            <Animated.View style={[styles.thumbnailContainer, { opacity: fadeAnim }]}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${thumbnail}` }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', COLORS.background]}
                style={styles.thumbnailOverlay}
              />
              <View style={styles.thumbnailBadge}>
                <Ionicons name="golf" size={14} color={COLORS.primary} />
                <Text style={styles.thumbnailBadgeText}>
                  {state.viewAngle === 'face-on' ? 'Face-On' : 'Down-the-Line'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Spinner */}
          <Animated.View style={[styles.spinnerContainer, { opacity: fadeAnim }]}>
            <Animated.View
              style={[styles.spinnerOuter, { transform: [{ rotate: spin }] }]}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent, 'transparent']}
                style={styles.spinnerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <View style={styles.spinnerInner}>
              <Ionicons name="golf" size={28} color={COLORS.primary} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.title}>Analyzing Your Swing</Text>
            <Text style={styles.subtitle}>
              Our AI coach is reviewing every frame
            </Text>
          </Animated.View>

          {/* Progress bar */}
          <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </Animated.View>

          {/* Steps */}
          <Animated.View style={[styles.stepsContainer, { opacity: fadeAnim }]}>
            {ANALYSIS_STEPS.map((step, index) => {
              const isDone = completedSteps.includes(index);
              const isCurrent = currentStep === index;

              return (
                <View key={index} style={styles.step}>
                  <View
                    style={[
                      styles.stepIcon,
                      isDone && styles.stepIconDone,
                      isCurrent && !isDone && styles.stepIconActive,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="white"
                      />
                    ) : isCurrent ? (
                      <Animated.View
                        style={[
                          styles.stepDot,
                          { transform: [{ rotate: spin }] },
                        ]}
                      />
                    ) : (
                      <View style={styles.stepDotInactive} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      isDone && styles.stepTextDone,
                      isCurrent && !isDone && styles.stepTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </Animated.View>

          {/* Tip */}
          <Animated.View style={[styles.tipContainer, { opacity: fadeAnim }]}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.warning} />
            <Text style={styles.tipText}>
              Analyzing {state.viewAngle === 'face-on' ? 'face-on' : 'down-the-line'} view
              · Using claude-opus-4-8
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },

  thumbnailContainer: {
    width: 220,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  thumbnailBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  spinnerContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  spinnerGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  spinnerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  stepsContainer: {
    width: '100%',
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: {
    backgroundColor: COLORS.primary,
  },
  stepIconActive: {
    backgroundColor: 'rgba(0,166,81,0.2)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
  },
  stepDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  stepTextActive: {
    color: COLORS.text,
  },
  stepTextDone: {
    color: COLORS.textSecondary,
  },

  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
