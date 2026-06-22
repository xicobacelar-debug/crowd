export const COLORS = {
  primary: '#00A651',
  primaryDark: '#007A3D',
  primaryLight: '#00C962',
  background: '#0A0E1A',
  cardBg: '#141827',
  cardBorder: '#1E2840',
  text: '#FFFFFF',
  textSecondary: '#8B95B0',
  textMuted: '#4A5568',
  accent: '#00D4FF',
  success: '#00A651',
  warning: '#FFB800',
  error: '#FF4444',
  gold: '#FFD700',
  gradientStart: '#0A0E1A',
  gradientMid: '#0D1526',
  gradientEnd: '#0A0E1A',
};

export const SWING_PHASES = [
  'Address',
  'Takeaway',
  'Backswing',
  'Downswing',
  'Impact',
  'Follow-through',
];

export const FRAME_TIMESTAMPS_MS = [0, 400, 800, 1200, 1600, 2200];

export const SCORE_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Needs Work',
  poor: 'Poor',
};

export const SCORE_COLORS: Record<string, string> = {
  excellent: '#00A651',
  good: '#4CAF50',
  fair: '#FFB800',
  poor: '#FF4444',
};

export const ANALYSIS_STEPS = [
  'Extracting video frames',
  'Detecting body pose',
  'Analyzing swing mechanics',
  'Generating personalized feedback',
];
