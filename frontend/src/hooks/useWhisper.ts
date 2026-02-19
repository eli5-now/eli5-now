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

  const stopRecorder = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Clean up on unmount: stop the recorder, release stream tracks, and clear
  // the auto-stop timer so nothing outlives the component.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopRecorder();
      // Safety net: stop stream tracks directly in case onstop doesn't fire
      // (MediaRecorder.stream is a standard readonly property)
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopRecorder();
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
        } catch (err) {
          console.error('Transcription failed:', err);
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
        stopRecorder();
        setIsRecording(false);
      }, MAX_RECORDING_MS);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        console.error('Failed to start recording:', err);
        setError('Could not start recording. Your browser may not support this feature.');
      }
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return { isRecording, isProcessing, transcript, error, start, stop, reset };
}
