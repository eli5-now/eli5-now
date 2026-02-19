'use client';

import { useWebSpeech } from './useWebSpeech';
import { useWhisper } from './useWhisper';

export type VoiceProvider = 'whisper' | 'webspeech';

export interface VoiceInputHook {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// Always call both hooks (React rules), return the active one.
export function useVoiceInput(provider: VoiceProvider): VoiceInputHook {
  const webSpeech = useWebSpeech();
  const whisper = useWhisper();
  return provider === 'whisper' ? whisper : webSpeech;
}
