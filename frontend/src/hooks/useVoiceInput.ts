'use client';

import { useEffect } from 'react';
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

  // When the provider changes, stop the now-inactive hook so it doesn't
  // keep holding the mic with no way for the user to stop it.
  useEffect(() => {
    if (provider === 'whisper') {
      webSpeech.stop();
    } else {
      whisper.stop();
    }
  }, [provider, webSpeech.stop, whisper.stop]);

  return provider === 'whisper' ? whisper : webSpeech;
}
