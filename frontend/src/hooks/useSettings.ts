'use client';

import { useState } from 'react';
import { VoiceProvider } from './useVoiceInput';

const STORAGE_KEY = 'voiceProvider';
const VALID_PROVIDERS: VoiceProvider[] = ['whisper', 'webspeech'];

// Exported so they can be unit-tested independently of the hook.
export function getStoredProvider(): VoiceProvider {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_PROVIDERS.includes(stored as VoiceProvider)
      ? (stored as VoiceProvider)
      : 'whisper';
  } catch {
    // localStorage is unavailable in private/incognito mode on some browsers.
    return 'whisper';
  }
}

export function setStoredProvider(provider: VoiceProvider): void {
  try {
    localStorage.setItem(STORAGE_KEY, provider);
  } catch {
    // Silently ignore — the in-memory state still works for the session.
  }
}

export function useSettings() {
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>(() => {
    if (typeof window === 'undefined') return 'whisper';
    return getStoredProvider();
  });

  const updateVoiceProvider = (provider: VoiceProvider) => {
    setVoiceProvider(provider);
    setStoredProvider(provider);
  };

  return { voiceProvider, updateVoiceProvider };
}
