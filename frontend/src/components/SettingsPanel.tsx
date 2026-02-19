'use client';

import { useState } from 'react';
import { VoiceProvider } from '@/hooks/useVoiceInput';

interface SettingsPanelProps {
  voiceProvider: VoiceProvider;
  onVoiceProviderChange: (p: VoiceProvider) => void;
  ttsEnabled: boolean;
  onTTSEnabledChange: (enabled: boolean) => void;
}

export function SettingsPanel({
  voiceProvider,
  onVoiceProviderChange,
  ttsEnabled,
  onTTSEnabledChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-full hover:opacity-70 transition-opacity"
        aria-label="Settings"
        style={{ color: 'var(--foreground-muted)' }}
      >
        ⚙️
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-56 rounded-xl shadow-lg p-3 z-10"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-alt)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
            Voice mode
          </p>
          {(['whisper', 'webspeech'] as VoiceProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => { onVoiceProviderChange(p); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-opacity hover:opacity-70"
              style={{
                backgroundColor: voiceProvider === p ? 'var(--primary)' : 'transparent',
                color: voiceProvider === p ? 'white' : 'var(--foreground)',
              }}
            >
              {p === 'whisper' ? '🤖 OpenAI (Whisper + TTS)' : '🌐 Browser built-in'}
            </button>
          ))}

          <hr className="my-2" style={{ borderColor: 'var(--surface-alt)' }} />

          <button
            onClick={() => onTTSEnabledChange(!ttsEnabled)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-opacity hover:opacity-70"
            style={{
              backgroundColor: ttsEnabled ? 'var(--primary)' : 'transparent',
              color: ttsEnabled ? 'white' : 'var(--foreground)',
            }}
          >
            {ttsEnabled ? '🔊 Read aloud: on' : '🔇 Read aloud: off'}
          </button>
        </div>
      )}
    </div>
  );
}
