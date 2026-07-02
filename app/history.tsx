import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalysis } from '../context/AnalysisContext';
import {
  clearSwingHistory,
  deleteSwingRecord,
  getSwingHistory,
} from '../services/storage';
import { SwingRecord } from '../types';
import { COLORS } from '../constants';

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.primary;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

export default function HistoryScreen() {
  const { setAnalysis, setViewAngle } = useAnalysis();
  const [records, setRecords] = useState<SwingRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSwingHistory().then(setRecords);
    }, [])
  );

  const openRecord = (record: SwingRecord) => {
    setAnalysis(record.analysis);
    setViewAngle(record.viewAngle);
    router.push('/results');
  };

  const confirmDelete = (record: SwingRecord) => {
    Alert.alert('Delete Swing', 'Remove this swing from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteSwingRecord(record.id);
          setRecords(updated);
        },
      },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert('Clear History', 'Delete all saved swing analyses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await clearSwingHistory();
          setRecords([]);
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.gradientMid, COLORS.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Swing History</Text>
          {records.length > 0 ? (
            <TouchableOpacity style={styles.clearBtn} onPress={confirmClearAll}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {records.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="golf-outline" size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No swings yet</Text>
            <Text style={styles.emptyDesc}>
              Analyze your first swing and it will show up here so you can track
              your progress over time.
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.replace('/record')}
            >
              <Ionicons name="videocam" size={18} color="white" />
              <Text style={styles.emptyCtaText}>Analyze a Swing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => openRecord(item)}
                onLongPress={() => confirmDelete(item)}
                activeOpacity={0.8}
              >
                {item.thumbnail ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.thumbnail}` }}
                    style={styles.rowThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.rowThumb, styles.rowThumbFallback]}>
                    <Ionicons name="golf" size={22} color={COLORS.textMuted} />
                  </View>
                )}

                <View style={styles.rowInfo}>
                  <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.rowType} numberOfLines={1}>
                    {item.analysis.swingType}
                  </Text>
                  <Text style={styles.rowAngle}>
                    {item.viewAngle === 'face-on' ? 'Face-On' : 'Down-the-Line'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.rowScore,
                    {
                      backgroundColor: `${scoreColor(
                        item.analysis.overallScore
                      )}22`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rowScoreText,
                      { color: scoreColor(item.analysis.overallScore) },
                    ]}
                  >
                    {item.analysis.overallScore}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <Text style={styles.footerHint}>
                Long-press a swing to delete it
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

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
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  emptyCtaText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    gap: 12,
  },
  rowThumb: {
    width: 52,
    height: 68,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  rowThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, gap: 2 },
  rowDate: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowType: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  rowAngle: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  rowScore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowScoreText: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  footerHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
