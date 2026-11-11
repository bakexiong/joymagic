'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { MediaItem } from '@/shared/blocks/explore/media-card';

interface GenerationResult {
  url: string;
  type: 'image' | 'video';
  prompt: string;
  parameters: Record<string, any>;
  sceneUrl?: string;
  modelUrl?: string;
}

interface ExploreCaptureContextType {
  capturedResults: GenerationResult[];
  captureResult: (result: GenerationResult) => void;
  clearResults: () => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
}

const ExploreCaptureContext = createContext<ExploreCaptureContextType | undefined>(undefined);

export function ExploreCaptureProvider({ children }: { children: ReactNode }) {
  const [capturedResults, setCapturedResults] = useState<GenerationResult[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureResult = useCallback((result: GenerationResult) => {
    console.log('[ExploreCapture] Capturing result:', result);
    setCapturedResults(prev => [...prev, result]);
  }, []);

  const clearResults = useCallback(() => {
    setCapturedResults([]);
  }, []);

  return (
    <ExploreCaptureContext.Provider
      value={{
        capturedResults,
        captureResult,
        clearResults,
        isCapturing,
        setIsCapturing,
      }}
    >
      {children}
    </ExploreCaptureContext.Provider>
  );
}

export function useExploreCapture() {
  const context = useContext(ExploreCaptureContext);
  if (!context) {
    throw new Error('useExploreCapture must be used within ExploreCaptureProvider');
  }
  return context;
}
