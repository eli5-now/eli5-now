'use client';

import { useState } from 'react';
import { VoiceProvider } from './useVoiceInput';

const PROVIDER_KEY = 'voiceProvider';
const TTS_ENABLED_KEY = 'ttsEnabled';
const VALID_PROVIDERS: VoiceProvider[] = ['whisper', 'webspeech'];

// Exported so they can be unit-tested independently of the hook.
export function getStoredProvider(): VoiceProvider {
  try {
    const stored = localStorage.getItem(PROVIDER_KEY);
    return VALID_PROVIDERS.includes(stored as VoiceProvider)
      ? (stored as VoiceProvider)
      : 'whisper';
  } catch {
    return 'whisper';
  }
}

export function setStoredProvider(provider: VoiceProvider): void {
  try {
    localStorage.setItem(PROVIDER_KEY, provider);
  } catch {
    // Silently ignore — in-memory state still works for the session.
  }
}

export function getStoredTTSEnabled(): boolean {
  try {
    return localStorage.getItem(TTS_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredTTSEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(TTS_ENABLED_KEY, String(enabled));
  } catch {
    // Silently ignore.
  }
}

export function useSettings() {
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>(() => {
    if (typeof window === 'undefined') return 'whisper';
    return getStoredProvider();
  });

  const [ttsEnabled, setTTSEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return getStoredTTSEnabled();
  });

  const updateVoiceProvider = (provider: VoiceProvider) => {
    setVoiceProvider(provider);
    setStoredProvider(provider);
  };

  const updateTTSEnabled = (enabled: boolean) => {
    setTTSEnabled(enabled);
    setStoredTTSEnabled(enabled);
  };

  return { voiceProvider, updateVoiceProvider, ttsEnabled, updateTTSEnabled };
}
