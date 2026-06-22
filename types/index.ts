export interface SwingPhase {
  name: string;
  score: number;
  issues: string[];
  tips: string[];
}

export interface BodyMetrics {
  spineAngle: number;
  hipRotation: number;
  shoulderTurn: number;
  headStability: 'excellent' | 'good' | 'fair' | 'poor';
  kneeFlexScore: number;
  weightTransfer: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SwingAnalysis {
  overallScore: number;
  swingType: string;
  phases: SwingPhase[];
  bodyMetrics: BodyMetrics;
  topIssues: string[];
  keyTips: string[];
  strengths: string[];
}

export interface AnalysisState {
  videoUri: string | null;
  frames: string[];
  analysis: SwingAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  viewAngle: 'face-on' | 'down-the-line';
}
