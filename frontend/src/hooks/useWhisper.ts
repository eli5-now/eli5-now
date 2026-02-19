'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '@/lib/api';
import { VoiceInputHook } from './useVoiceInput';

const MAX_RECORDING_MS = 30_000;

export function useWhisper(): VoiceInputHook {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount: stop the recorder and clear the auto-stop timer so
  // the mic indicator and background timer don't outlive the component.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        if (blob.size === 0) {
          // Nothing was captured (user stopped immediately or mic was silent).
          return;
        }

        setIsProcessing(true);
        try {
          const text = await transcribeAudio(blob);
          setTranscript(text);
        } catch {
          setError('Transcription failed. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);

      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(() => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      }, MAX_RECORDING_MS);
    } catch {
      setError('Microphone access denied. Please allow microphone access.');
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return { isRecording, isProcessing, transcript, error, start, stop, reset };
}
