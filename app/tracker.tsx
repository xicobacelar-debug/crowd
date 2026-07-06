import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Plan data ----------
interface PlanBlock {
  id: number;
  title: string;
  drill: string;
}

interface Phase {
  name: string;
  weeks: number[];
  blocks: PlanBlock[];
}

const PHASES: Phase[] = [
  {
    name: 'Contact & Distance',
    weeks: [1, 2, 3, 4],
    blocks: [
      {
        id: 0,
        title: 'Approach — 40 min',
        drill:
          '8-iron only. 20 balls to a flag: count strikes inside a 15 m circle. Then 10 balls at 75% tempo, strike over distance. Film one swing.',
      },
      {
        id: 1,
        title: 'Chipping — 35 min',
        drill:
          'One club, one technique: ball back, weight forward, hands ahead. Landing-spot drill: towel 2–3 m onto green, 15 balls. Finish with 5 up-and-down attempts.',
      },
      {
        id: 2,
        title: 'Putting — 15 min',
        drill: 'Gate drill from 1 m (target 8/10), then one ladder set 5/10/15/20 m.',
      },
    ],
  },
  {
    name: 'Scoring Zone',
    weeks: [5, 6, 7, 8],
    blocks: [
      {
        id: 0,
        title: 'Approach — 40 min',
        drill:
          'One wedge, three swing lengths (half / ¾ / full) — learn each carry number. Last 10 balls: alternate 8-iron and wedge, new target every shot, full routine.',
      },
      {
        id: 1,
        title: 'Chipping — 35 min',
        drill:
          'Par-18: 9 chip-and-putt holes, each a par 2. Under 22 = good, under 20 = excellent. Add one uphill and one downhill lie set.',
      },
      {
        id: 2,
        title: 'Putting — 15 min',
        drill:
          'Clock drill: 8 balls at 1.2 m (target 7/8). Lag putts from 20 m — two-putt every time.',
      },
    ],
  },
  {
    name: 'Transfer to the Course',
    weeks: [9, 10, 11, 12],
    blocks: [
      {
        id: 0,
        title: 'Approach — 40 min',
        drill:
          'Simulated holes: driver → 8-iron → wedge, new target every ball, full routine. Count greens hit out of 10 simulated approaches.',
      },
      {
        id: 1,
        title: 'Chipping — 35 min',
        drill:
          'Mixed lies: rough, tight, up/downhill — 5 balls each. Bunker: 10 balls, out and on. Worst-ball up-and-downs to finish.',
      },
      {
        id: 2,
        title: 'Putting — 15 min',
        drill: 'Maintenance only: gate + ladder. Nothing new.',
      },
    ],
  },
];

const phaseForWeek = (w: number): Phase =>
  PHASES.find((p) => p.weeks.includes(w)) ?? PHASES[0];

interface WeekData {
  blocks: boolean[];
  yoga: boolean;
  approachKpi: string;
  par18Kpi: string;
}

interface Round {
  id: number;
  date: string;
  course: string;
  score: string;
  gir: string;
  udMade: string;
  udAtt: string;
  putts: string;
  blobs: string;
}

interface TrackerState {
  weeks: Record<number, WeekData>;
  rounds: Round[];
}

const emptyWeek = (): WeekData => ({
  blocks: [false, false, false],
  yoga: false,
  approachKpi: '',
  par18Kpi: '',
});

const DEFAULT_STATE: TrackerState = {
  weeks: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, emptyWeek()])
  ),
  rounds: [],
};

const EMPTY_FORM = {
  date: '',
  course: '',
  score: '',
  gir: '',
  udMade: '',
  udAtt: '',
  putts: '',
  blobs: '',
};

const STORAGE_KEY = 'golf-plan-12w';

const WEEK_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

const MILESTONES: [string, string][] = [
  ['Week 4', 'GIR ≥ 3 · U&D ≥ 2/round · blobs ≤ 8'],
  ['Week 8', 'GIR ≥ 4 · U&D rate ≥ 30% · score ≤ 105'],
  ['Week 12', 'GIR ≥ 5 · U&D rate ≥ 35% · score ≤ 100–103 · HCP trending 27–28'],
];

const ROUND_FIELDS: [keyof typeof EMPTY_FORM, string, boolean][] = [
  ['date', 'Date', false],
  ['course', 'Course', false],
  ['score', 'Score (gross)', true],
  ['putts', 'Putts', true],
  ['gir', 'GIRs / 18', true],
  ['blobs', 'Blob holes', true],
  ['udMade', 'U&D made', true],
  ['udAtt', 'U&D attempts', true],
];

// ---------- Scorecard palette ----------
const C = {
  green: '#0E3B2E',
  green2: '#1C5943',
  paper: '#FCFBF6',
  line: '#D8D3C4',
  red: '#C8102E',
  sand: '#EFE9D8',
  ink: '#20241F',
  faint: '#7A796E',
};

const MONO = Platform.select({ ios: 'Courier', default: 'monospace' });

type Tab = 'week' | 'rounds' | 'progress';

export default function TrackerScreen() {
  const [state, setState] = useState<TrackerState | null>(null);
  const [tab, setTab] = useState<Tab>('week');
  const [week, setWeek] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const loaded: TrackerState = raw ? JSON.parse(raw) : DEFAULT_STATE;
        setState(loaded);
        const firstOpen = Object.entries(loaded.weeks).find(
          ([, w]) => !w.blocks.every(Boolean)
        );
        setWeek(firstOpen ? Number(firstOpen[0]) : 12);
      } catch {
        setState(DEFAULT_STATE);
      }
    })();
  }, []);

  const persist = async (next: TrackerState) => {
    setState(next);
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Tracker data is a nice-to-have; never block the UI over it
    }
    setSaving(false);
  };

  if (!state) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={styles.loadingText}>LOADING CARD…</Text>
      </View>
    );
  }

  const wd = state.weeks[week] ?? emptyWeek();
  const phase = phaseForWeek(week);
  const doneCount = (w: WeekData) => w.blocks.filter(Boolean).length;
  const weekComplete = (w: WeekData) => w.blocks.every(Boolean);
  const totalDone = Object.values(state.weeks).filter(weekComplete).length;

  const setWeekData = (patch: Partial<WeekData>) => {
    persist({
      ...state,
      weeks: { ...state.weeks, [week]: { ...wd, ...patch } },
    });
  };

  const toggleBlock = (i: number) => {
    const blocks = [...wd.blocks];
    blocks[i] = !blocks[i];
    setWeekData({ blocks });
  };

  const addRound = () => {
    if (!form.score) return;
    persist({ ...state, rounds: [...state.rounds, { ...form, id: Date.now() }] });
    setForm({ ...EMPTY_FORM });
  };

  const deleteRound = (id: number) =>
    persist({ ...state, rounds: state.rounds.filter((r) => r.id !== id) });

  const Check = ({ on, onPress }: { on: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.check, on && styles.checkOn]}
      activeOpacity={0.7}
    >
      {on && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <TouchableOpacity
      onPress={() => setTab(id)}
      style={[styles.tabBtn, tab === id && styles.tabBtnActive]}
    >
      <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.paper} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>HCP 31 → 25</Text>
              <Text style={styles.headerSub}>FRANCISCO BACELAR · 12-WEEK CARD</Text>
            </View>
            <Text style={styles.headerCount}>
              {saving ? 'saving…' : `${totalDone}/12 wks`}
            </Text>
          </View>

          {/* 12-week scorecard strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
          >
            {WEEK_NUMBERS.map((n) => {
              const w = state.weeks[n];
              const full = weekComplete(w);
              const part = doneCount(w) > 0 && !full;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => {
                    setWeek(n);
                    setTab('week');
                  }}
                  style={[
                    styles.weekCell,
                    part && styles.weekCellPart,
                    full && styles.weekCellFull,
                    n === week && styles.weekCellCurrent,
                  ]}
                >
                  <Text style={[styles.weekCellText, full && styles.weekCellTextFull]}>
                    {full ? '✓' : n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.tabRow}>
            <TabBtn id="week" label="THIS WEEK" />
            <TabBtn id="rounds" label="ROUNDS" />
            <TabBtn id="progress" label="PROGRESS" />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------- THIS WEEK ---------- */}
        {tab === 'week' && (
          <View>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {week}</Text>
              <Text style={styles.phaseLabel}>PHASE — {phase.name.toUpperCase()}</Text>
            </View>

            {phase.blocks.map((b, i) => (
              <View key={b.id} style={styles.blockRow}>
                <Check on={wd.blocks[i]} onPress={() => toggleBlock(i)} />
                <View style={styles.blockBody}>
                  <Text
                    style={[styles.blockTitle, wd.blocks[i] && styles.blockTitleDone]}
                  >
                    {b.title}
                  </Text>
                  <Text style={styles.blockDrill}>{b.drill}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.blockRow, styles.yogaRow]}>
              <Check on={wd.yoga} onPress={() => setWeekData({ yoga: !wd.yoga })} />
              <Text style={[styles.blockTitle, wd.yoga && styles.blockTitleDone]}>
                Sunday yoga — rotation & hips
              </Text>
            </View>

            {/* KPIs */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiHeading}>SESSION KPIS</Text>
              <View style={styles.kpiInputs}>
                <View style={styles.kpiField}>
                  <Text style={styles.fieldLabel}>Approach: inside zone / 20</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={wd.approachKpi}
                    onChangeText={(t) => setWeekData({ approachKpi: t })}
                    style={styles.input}
                    placeholder="—"
                    placeholderTextColor={C.faint}
                  />
                </View>
                <View style={styles.kpiField}>
                  <Text style={styles.fieldLabel}>Par-18 score (chipping game)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={wd.par18Kpi}
                    onChangeText={(t) => setWeekData({ par18Kpi: t })}
                    style={styles.input}
                    placeholder="—"
                    placeholderTextColor={C.faint}
                  />
                </View>
              </View>
            </View>

            {weekComplete(wd) && (
              <View style={styles.completeBanner}>
                <Text style={styles.completeText}>
                  WEEK {week} COMPLETE — HOLED OUT ✓
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ---------- ROUNDS ---------- */}
        {tab === 'rounds' && (
          <View>
            <Text style={styles.sectionTitle}>Log a round</Text>
            <View style={styles.formGrid}>
              {ROUND_FIELDS.map(([key, label, numeric]) => (
                <View key={key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    keyboardType={numeric ? 'number-pad' : 'default'}
                    value={form[key]}
                    onChangeText={(t) => setForm({ ...form, [key]: t })}
                    style={styles.input}
                    placeholder={key === 'date' ? 'YYYY-MM-DD' : ''}
                    placeholderTextColor={C.line}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={addRound}
              style={[styles.postBtn, !form.score && styles.postBtnDisabled]}
              activeOpacity={0.85}
            >
              <Text style={styles.postBtnText}>POST THE CARD</Text>
            </TouchableOpacity>

            <View style={styles.roundsList}>
              {state.rounds.length === 0 && (
                <Text style={styles.emptyText}>
                  No rounds posted yet. Baseline: Kurmitola 113 · GIR 1 · U&D 1/8.
                </Text>
              )}
              {[...state.rounds].reverse().map((r) => (
                <View key={r.id} style={styles.roundRow}>
                  <View style={styles.roundInfo}>
                    <Text style={styles.roundCourse}>
                      {r.course || 'Round'}{' '}
                      <Text style={styles.roundDate}>{r.date}</Text>
                    </Text>
                    <Text style={styles.roundStats}>
                      Score {r.score} · GIR {r.gir || '–'} · U&D {r.udMade || 0}/
                      {r.udAtt || 0} · Putts {r.putts || '–'} · Blobs {r.blobs || '–'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteRound(r.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ---------- PROGRESS ---------- */}
        {tab === 'progress' && (
          <View>
            <Text style={styles.sectionTitle}>Score trend</Text>
            {state.rounds.length === 0 ? (
              <Text style={styles.emptyText}>
                Post rounds to see the trend. Targets: ≤105 by week 8, ≤100–103 by
                week 12.
              </Text>
            ) : (
              <View style={styles.chart}>
                {state.rounds.map((r) => {
                  const s = Number(r.score) || 0;
                  const h = Math.max(8, Math.min(100, ((s - 80) / 40) * 100));
                  const good = s <= 105;
                  return (
                    <View key={r.id} style={styles.chartCol}>
                      <Text
                        style={[
                          styles.chartScore,
                          { color: good ? C.green : C.red },
                        ]}
                      >
                        {s}
                      </Text>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${h}%`,
                            backgroundColor: good ? C.green2 : C.red,
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={[styles.sectionTitle, styles.sectionGap]}>Weekly KPIs</Text>
            <View style={styles.kpiTable}>
              <View style={styles.kpiTableHead}>
                <Text style={[styles.kpiHeadCell, styles.kpiCellLeft]}>WEEK</Text>
                <Text style={styles.kpiHeadCell}>APPROACH /20</Text>
                <Text style={styles.kpiHeadCell}>PAR-18</Text>
              </View>
              {WEEK_NUMBERS.map((n) => {
                const w = state.weeks[n];
                return (
                  <View
                    key={n}
                    style={[styles.kpiTableRow, n % 2 === 0 && styles.kpiRowAlt]}
                  >
                    <Text style={[styles.kpiCell, styles.kpiCellLeft]}>
                      {n}
                      {weekComplete(w) ? ' ✓' : ''}
                    </Text>
                    <Text style={styles.kpiCell}>{w.approachKpi || '·'}</Text>
                    <Text style={styles.kpiCell}>{w.par18Kpi || '·'}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, styles.sectionGap]}>Milestones</Text>
            {MILESTONES.map(([wk, txt]) => (
              <View key={wk} style={styles.milestoneRow}>
                <Text style={styles.milestoneWeek}>{wk}</Text>
                <Text style={styles.milestoneText}>{txt}</Text>
              </View>
            ))}
            <Text style={styles.baselineNote}>
              Baseline May 2026: 113 (+41/+45) · GIR 1/18 · U&D ≤ 1 · consistency
              beats perfection.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.faint, fontSize: 16, letterSpacing: 2 },

  headerSafe: { backgroundColor: C.green },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginRight: 4,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: {
    color: C.paper,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerSub: {
    color: 'rgba(252,251,246,0.6)',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerCount: {
    color: C.paper,
    fontFamily: MONO,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },

  weekStrip: { gap: 4, paddingTop: 14, paddingBottom: 12 },
  weekCell: {
    width: 30,
    height: 34,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'rgba(252,251,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCellPart: { backgroundColor: 'rgba(252,251,246,0.18)' },
  weekCellFull: { backgroundColor: C.paper },
  weekCellCurrent: { borderColor: C.red },
  weekCellText: {
    color: C.paper,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  weekCellTextFull: { color: C.green },

  tabRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(252,251,246,0.2)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.red },
  tabLabel: {
    color: 'rgba(252,251,246,0.55)',
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
  },
  tabLabelActive: { color: C.paper },

  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  weekHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekTitle: { color: C.ink, fontSize: 22, fontWeight: '700' },
  phaseLabel: { color: C.red, fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },

  blockRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  yogaRow: { alignItems: 'center' },
  blockBody: { flex: 1 },
  blockTitle: { color: C.ink, fontSize: 16, fontWeight: '600' },
  blockTitleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  blockDrill: { color: C.faint, fontSize: 13, lineHeight: 19, marginTop: 4 },

  check: {
    width: 26,
    height: 26,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { borderColor: C.green, backgroundColor: C.green },
  checkMark: { color: C.paper, fontSize: 14, fontWeight: '700' },

  kpiCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: C.sand,
    borderRadius: 4,
  },
  kpiHeading: {
    color: C.green,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  kpiInputs: { flexDirection: 'row', gap: 12, marginTop: 8 },
  kpiField: { flex: 1 },
  fieldLabel: { color: C.faint, fontSize: 11 },
  input: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 3,
    fontFamily: MONO,
    fontSize: 15,
    color: C.ink,
    fontVariant: ['tabular-nums'],
  },

  completeBanner: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: C.green,
    borderRadius: 3,
    alignItems: 'center',
  },
  completeText: { color: C.paper, fontSize: 14, letterSpacing: 2, fontWeight: '600' },

  sectionTitle: { color: C.ink, fontSize: 19, fontWeight: '700' },
  sectionGap: { marginTop: 24 },

  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  formField: { width: '48.5%', marginBottom: 8 },

  postBtn: {
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: C.red,
    borderRadius: 3,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: C.line },
  postBtnText: { color: C.paper, fontSize: 14, letterSpacing: 2, fontWeight: '600' },

  roundsList: { marginTop: 24 },
  emptyText: {
    color: C.faint,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
    lineHeight: 19,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  roundInfo: { flex: 1, paddingRight: 8 },
  roundCourse: { color: C.ink, fontSize: 15, fontWeight: '600' },
  roundDate: { color: C.faint, fontWeight: '500' },
  roundStats: {
    color: C.faint,
    fontFamily: MONO,
    fontSize: 12,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 3,
  },
  deleteBtnText: { color: C.red, fontSize: 11 },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 128,
    marginTop: 12,
  },
  chartCol: {
    flex: 1,
    maxWidth: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartScore: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chartBar: {
    width: '100%',
    maxWidth: 40,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  kpiTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  kpiTableHead: {
    flexDirection: 'row',
    backgroundColor: C.green,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  kpiHeadCell: {
    flex: 1,
    color: C.paper,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  kpiTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: 'white',
  },
  kpiRowAlt: { backgroundColor: C.sand },
  kpiCell: {
    flex: 1,
    color: C.ink,
    fontFamily: MONO,
    fontSize: 13,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  kpiCellLeft: { textAlign: 'left' },

  milestoneRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
    marginTop: 4,
  },
  milestoneWeek: { color: C.red, fontWeight: '700', minWidth: 64, fontSize: 14 },
  milestoneText: { color: C.ink, fontSize: 13, flex: 1, lineHeight: 19 },

  baselineNote: { color: C.faint, fontSize: 11, marginTop: 16, lineHeight: 16 },
});
