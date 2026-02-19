'use client';

import { useCallback, useRef, useState } from 'react';
import { VoiceInputHook } from './useVoiceInput';

// SpeechRecognition is not fully typed in standard TS DOM types
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
  }
}

export function useWebSpeech(): VoiceInputHook {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Accumulate results across continuous recognition events
  const accumulatedRef = useRef<string>('');

  const start = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser. Try switching to Whisper.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;   // Keep listening until manually stopped
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    accumulatedRef.current = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // Accumulate all final results (continuous mode fires multiple events)
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript + ' ';
        }
      }
      accumulatedRef.current += text;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else {
        setError(`Microphone error: ${event.error}`);
      }
      setIsRecording(false);
    };

    // Commit accumulated transcript when recognition ends
    recognition.onend = () => {
      const result = accumulatedRef.current.trim();
      if (result) setTranscript(result);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return { isRecording, isProcessing: false, transcript, error, start, stop, reset };
}
