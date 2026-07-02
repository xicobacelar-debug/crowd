import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalysis } from '../context/AnalysisContext';
import ScoreRing from '../components/ScoreRing';
import FeedbackCard from '../components/FeedbackCard';
import CategoryScore from '../components/CategoryScore';
import { COLORS, SCORE_LABELS, SCORE_COLORS } from '../constants';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const { state, reset } = useAnalysis();
  const analysis = state.analysis;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!analysis) {
    return (
      <View style={styles.noData}>
        <Text style={styles.noDataText}>No analysis data found.</Text>
        <TouchableOpacity
          style={styles.goHomeBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.goHomeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const overallLabel = (() => {
    if (analysis.overallScore >= 85) return 'Excellent Swing';
    if (analysis.overallScore >= 70) return 'Good Swing';
    if (analysis.overallScore >= 55) return 'Developing Swing';
    return 'Needs Practice';
  })();

  const overallColor = (() => {
    if (analysis.overallScore >= 80) return COLORS.primary;
    if (analysis.overallScore >= 60) return COLORS.warning;
    return COLORS.error;
  })();

  const metricQuality = (value: 'excellent' | 'good' | 'fair' | 'poor') => ({
    label: SCORE_LABELS[value],
    color: SCORE_COLORS[value],
  });

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.gradientMid, COLORS.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              reset();
              router.replace('/');
            }}
          >
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Swing Analysis</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Score section */}
          <Animated.View
            style={[
              styles.scoreSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LinearGradient
              colors={[COLORS.cardBg, '#0D1526']}
              style={styles.scoreCard}
            >
              <ScoreRing score={analysis.overallScore} size={180} />
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreLabel, { color: overallColor }]}>
                  {overallLabel}
                </Text>
                <Text style={styles.swingType}>{analysis.swingType}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Swing sequence frames */}
          {state.frames.length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Swing Sequence</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.frameStrip}
              >
                {state.frames.map((frame, i) => (
                  <View key={i} style={styles.frameItem}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${frame}` }}
                      style={styles.frameImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.frameLabel}>
                      {i + 1}/{state.frames.length}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Phase Scores */}
          {analysis.phases.length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Phase Breakdown</Text>
              <View style={styles.card}>
                {analysis.phases.map((phase, i) => (
                  <CategoryScore
                    key={i}
                    label={phase.name}
                    score={phase.score}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Body Metrics */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Body Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analysis.bodyMetrics.spineAngle}°
                </Text>
                <Text style={styles.metricLabel}>Spine Angle</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analysis.bodyMetrics.hipRotation}°
                </Text>
                <Text style={styles.metricLabel}>Hip Rotation</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analysis.bodyMetrics.shoulderTurn}°
                </Text>
                <Text style={styles.metricLabel}>Shoulder Turn</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analysis.bodyMetrics.kneeFlexScore}
                </Text>
                <Text style={styles.metricLabel}>Knee Flex</Text>
              </View>

              <View style={[styles.metricCard, styles.metricCardWide]}>
                <View style={styles.metricQualityRow}>
                  <View>
                    <Text style={styles.metricLabel}>Head Stability</Text>
                    <Text
                      style={[
                        styles.metricQuality,
                        {
                          color: metricQuality(
                            analysis.bodyMetrics.headStability
                          ).color,
                        },
                      ]}
                    >
                      {
                        metricQuality(analysis.bodyMetrics.headStability)
                          .label
                      }
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View>
                    <Text style={styles.metricLabel}>Weight Transfer</Text>
                    <Text
                      style={[
                        styles.metricQuality,
                        {
                          color: metricQuality(
                            analysis.bodyMetrics.weightTransfer
                          ).color,
                        },
                      ]}
                    >
                      {
                        metricQuality(analysis.bodyMetrics.weightTransfer)
                          .label
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.sectionTitle}>Strengths</Text>
              </View>
              {analysis.strengths.map((s, i) => (
                <FeedbackCard key={i} text={s} variant="strength" />
              ))}
            </Animated.View>
          )}

          {/* Issues */}
          {analysis.topIssues.length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning" size={18} color={COLORS.warning} />
                <Text style={styles.sectionTitle}>Areas to Improve</Text>
              </View>
              {analysis.topIssues.map((issue, i) => (
                <FeedbackCard key={i} text={issue} variant="issue" />
              ))}
            </Animated.View>
          )}

          {/* Tips */}
          {analysis.keyTips.length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={18} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Key Tips</Text>
              </View>
              {analysis.keyTips.map((tip, i) => (
                <FeedbackCard key={i} text={tip} variant="tip" />
              ))}
            </Animated.View>
          )}

          {/* Phase Details */}
          {analysis.phases.filter((p) => p.tips.length > 0).length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Phase Details</Text>
              {analysis.phases.map((phase, i) => (
                <View key={i} style={styles.phaseCard}>
                  <View style={styles.phaseHeader}>
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <View
                      style={[
                        styles.phaseScore,
                        {
                          backgroundColor:
                            phase.score >= 80
                              ? 'rgba(0,166,81,0.15)'
                              : phase.score >= 60
                              ? 'rgba(255,184,0,0.15)'
                              : 'rgba(255,68,68,0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.phaseScoreText,
                          {
                            color:
                              phase.score >= 80
                                ? COLORS.primary
                                : phase.score >= 60
                                ? COLORS.warning
                                : COLORS.error,
                          },
                        ]}
                      >
                        {phase.score}
                      </Text>
                    </View>
                  </View>
                  {phase.tips.map((tip, j) => (
                    <View key={j} style={styles.phaseTip}>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={COLORS.accent}
                      />
                      <Text style={styles.phaseTipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </Animated.View>
          )}

          {/* CTA */}
          <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.analyzeAgainBtn}
              onPress={() => {
                reset();
                router.replace('/record');
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.analyzeAgainGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="videocam" size={20} color="white" />
                <Text style={styles.analyzeAgainText}>Analyze Another Swing</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => {
                reset();
                router.replace('/');
              }}
            >
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  noData: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  goHomeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  goHomeBtnText: { color: 'white', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },

  scroll: { paddingBottom: 48 },

  scoreSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  scoreInfo: { alignItems: 'center', gap: 4 },
  scoreLabel: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  swingType: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  frameStrip: {
    gap: 8,
  },
  frameItem: {
    alignItems: 'center',
    gap: 4,
  },
  frameImage: {
    width: 96,
    height: 128,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
  },
  frameLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    width: (width - 46) / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricCardWide: {
    width: '100%',
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  metricQualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.cardBorder,
  },
  metricQuality: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },

  phaseCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  phaseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  phaseScore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  phaseScoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  phaseTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  phaseTipText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  ctaSection: {
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 12,
  },
  analyzeAgainBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  analyzeAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  analyzeAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  homeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  homeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
