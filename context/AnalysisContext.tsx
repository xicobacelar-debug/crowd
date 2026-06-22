import React, { createContext, useContext, useState } from 'react';
import { AnalysisState, SwingAnalysis } from '../types';

interface AnalysisContextType {
  state: AnalysisState;
  setVideo: (uri: string) => void;
  setFrames: (frames: string[]) => void;
  setAnalysis: (analysis: SwingAnalysis) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setError: (error: string | null) => void;
  setViewAngle: (angle: 'face-on' | 'down-the-line') => void;
  reset: () => void;
}

const initialState: AnalysisState = {
  videoUri: null,
  frames: [],
  analysis: null,
  isAnalyzing: false,
  error: null,
  viewAngle: 'face-on',
};

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalysisState>(initialState);

  const setVideo = (uri: string) =>
    setState((prev) => ({ ...prev, videoUri: uri }));
  const setFrames = (frames: string[]) =>
    setState((prev) => ({ ...prev, frames }));
  const setAnalysis = (analysis: SwingAnalysis) =>
    setState((prev) => ({ ...prev, analysis }));
  const setAnalyzing = (isAnalyzing: boolean) =>
    setState((prev) => ({ ...prev, isAnalyzing }));
  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error }));
  const setViewAngle = (viewAngle: 'face-on' | 'down-the-line') =>
    setState((prev) => ({ ...prev, viewAngle }));
  const reset = () => setState(initialState);

  return (
    <AnalysisContext.Provider
      value={{
        state,
        setVideo,
        setFrames,
        setAnalysis,
        setAnalyzing,
        setError,
        setViewAngle,
        reset,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context)
    throw new Error('useAnalysis must be used within AnalysisProvider');
  return context;
}
