'use client';

import { useEffect, useState } from 'react';
import { VoiceProvider, useVoiceInput } from '@/hooks/useVoiceInput';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  voiceProvider: VoiceProvider;
}

export function ChatInput({ onSubmit, disabled, voiceProvider }: ChatInputProps) {
  const [value, setValue] = useState('');
  const { isRecording, isProcessing, transcript, error, start, stop, reset } =
    useVoiceInput(voiceProvider);

  // Fill input field when transcript arrives
  useEffect(() => {
    if (transcript) {
      setValue(transcript);
      reset();
    }
  }, [transcript, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  const handleMic = () => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  };

  const micLabel = isProcessing ? '⏳' : isRecording ? '🔴' : '🎙';

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isProcessing ? 'Transcribing...' : 'Ask Eli anything...'}
          disabled={disabled}
          className="flex-1 rounded-full px-4 py-3 outline-none disabled:opacity-50"
          style={{
            backgroundColor: 'var(--surface-alt)',
            color: 'var(--foreground)',
          }}
        />
        <button
          type="button"
          onClick={handleMic}
          disabled={disabled || isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className="rounded-full px-4 py-3 font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: isRecording ? 'var(--secondary)' : 'var(--surface-alt)',
          }}
        >
          {micLabel}
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full px-6 py-3 font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
          }}
        >
          {disabled ? '...' : 'Ask'}
        </button>
      </form>
      {error && (
        <p className="text-xs px-4" style={{ color: 'var(--secondary)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
