'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { synthesizeSpeech } from '@/lib/api';
import { VoiceProvider } from './useVoiceInput';

export interface TTSHook {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  /** Call synchronously from a user-gesture handler to unlock audio in Safari. */
  unlock: () => void;
}

// ---------------------------------------------------------------------------
// Web Speech Synthesis (browser-native, free)
// ---------------------------------------------------------------------------

function useWebSpeechTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => { speechSynthesis.cancel(); };
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  }, []);

  // Safari also blocks SpeechSynthesis on first call — speak+cancel a blank
  // utterance from a user-gesture context to unlock it.
  const unlock = useCallback(() => {
    const u = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(u);
    speechSynthesis.cancel();
  }, []);

  return { isSpeaking, speak, stop, unlock };
}

// ---------------------------------------------------------------------------
// OpenAI TTS (nova voice, requires backend /tts endpoint)
// ---------------------------------------------------------------------------

function useOpenAITTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    audioRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    // Stop any in-progress playback first
    audioRef.current?.pause();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);

    try {
      const blob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
        setIsSpeaking(false);
      };

      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Safari requires the first audio.play() to be triggered by a user gesture.
  // Call unlock() synchronously inside a click/submit handler to play a silent
  // audio, which lifts the restriction for subsequent async plays.
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    const a = new Audio();
    // Minimal silent WAV (1 sample, 8-bit, 8kHz)
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    a.play().then(() => { unlockedRef.current = true; }).catch(() => {});
  }, []);

  return { isSpeaking, speak, stop, unlock };
}

// ---------------------------------------------------------------------------
// Unified hook — provider-aware, always calls both (React rules)
// ---------------------------------------------------------------------------

export function useTTS(provider: VoiceProvider): TTSHook {
  const openai = useOpenAITTS();
  const web = useWebSpeechTTS();

  // Stop the now-inactive provider when the user switches
  useEffect(() => {
    if (provider === 'whisper') web.stop();
    else openai.stop();
  }, [provider, web.stop, openai.stop]);

  return provider === 'whisper' ? openai : web;
}
