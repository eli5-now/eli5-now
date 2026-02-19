'use client';

import { useState } from 'react';
import { VoiceProvider } from './useVoiceInput';

export function useSettings() {
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>(() => {
    if (typeof window === 'undefined') return 'whisper';
    return (localStorage.getItem('voiceProvider') as VoiceProvider) ?? 'whisper';
  });

  const updateVoiceProvider = (provider: VoiceProvider) => {
    setVoiceProvider(provider);
    localStorage.setItem('voiceProvider', provider);
  };

  return { voiceProvider, updateVoiceProvider };
}
