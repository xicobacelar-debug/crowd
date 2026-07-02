import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalysis } from '../context/AnalysisContext';
import { getSwingHistory } from '../services/storage';
import { SwingRecord } from '../types';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'body-outline' as const,
    title: 'AI Pose Detection',
    desc: 'Tracks 33 body keypoints through your swing',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Instant Feedback',
    desc: 'Professional analysis in under 30 seconds',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Swing Score',
    desc: 'Objective 0-100 score for every swing',
  },
  {
    icon: 'layers-outline' as const,
    title: 'Phase Breakdown',
    desc: 'Address through follow-through analysis',
  },
];

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.primary;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
}

export default function HomeScreen() {
  const { setAnalysis, setViewAngle } = useAnalysis();
  const [recentSwings, setRecentSwings] = useState<SwingRecord[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      getSwingHistory().then((history) => setRecentSwings(history.slice(0, 3)));
    }, [])
  );

  const openRecord = (record: SwingRecord) => {
    setAnalysis(record.analysis);
    setViewAngle(record.viewAngle);
    router.push('/results');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[COLORS.primary, '#00D4FF']}
                style={styles.logoIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="golf" size={26} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.logoText}>SwingIQ</Text>
                <Text style={styles.logoSub}>AI Golf Coach</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/settings')}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Hero */}
          <Animated.View
            style={[
              styles.hero,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Decorative circle */}
            <Animated.View
              style={[styles.heroBg, { transform: [{ rotate: rotation }] }]}
            >
              <LinearGradient
                colors={['rgba(0,166,81,0.15)', 'rgba(0,212,255,0.05)']}
                style={styles.heroBgGradient}
              />
            </Animated.View>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Perfect Your{'\n'}Golf Swing</Text>
              <Text style={styles.heroSubtitle}>
                AI-powered biomechanical analysis gives you instant,{' '}
                professional-grade swing coaching
              </Text>
            </View>
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            style={[
              styles.ctaSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/record')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="videocam" size={22} color="white" />
                <Text style={styles.primaryButtonText}>Analyze My Swing</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Info badge */}
          <Animated.View
            style={[styles.infoBadge, { opacity: fadeAnim }]}
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoBadgeText}>
              Record or upload a video of your swing — results in ~20 seconds
            </Text>
          </Animated.View>

          {/* Recent Swings */}
          {recentSwings.length > 0 && (
            <Animated.View
              style={[styles.recentSection, { opacity: fadeAnim }]}
            >
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Swings</Text>
                <TouchableOpacity onPress={() => router.push('/history')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {recentSwings.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={styles.recentRow}
                  onPress={() => openRecord(record)}
                  activeOpacity={0.8}
                >
                  {record.thumbnail ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${record.thumbnail}`,
                      }}
                      style={styles.recentThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.recentThumb, styles.recentThumbFallback]}>
                      <Ionicons name="golf" size={18} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentDate}>
                      {new Date(record.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.recentType} numberOfLines={1}>
                      {record.analysis.swingType}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.recentScore,
                      { color: scoreColor(record.analysis.overallScore) },
                    ]}
                  >
                    {record.analysis.overallScore}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Features Grid */}
          <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>What We Analyze</Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconBg}>
                    <Ionicons
                      name={feature.icon}
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Recording tips */}
          <Animated.View style={[styles.tipsCard, { opacity: fadeAnim }]}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={18} color={COLORS.warning} />
              <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            </View>
            {[
              'Record from face-on or down-the-line angle',
              'Ensure full body is visible in frame',
              'Good lighting — avoid backlit shots',
              'Record at least 2 full seconds of swing',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.3,
    left: -width * 0.1,
    opacity: 0.5,
  },
  heroBgGradient: {
    flex: 1,
    borderRadius: width * 0.6,
  },
  heroContent: { position: 'relative' },
  heroTitle: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 14,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: width * 0.75,
  },

  ctaSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: 16,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 10,
    marginBottom: 8,
  },
  recentThumb: {
    width: 40,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  recentThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1, gap: 2 },
  recentDate: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  recentType: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  recentScore: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  featureIconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(0,166,81,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  tipsCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
  },
});
