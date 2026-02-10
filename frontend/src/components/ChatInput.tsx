'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask Eli anything..."
        disabled={disabled}
        className="flex-1 rounded-full px-4 py-3 outline-none disabled:opacity-50"
        style={{
          backgroundColor: 'var(--surface-alt)',
          color: 'var(--foreground)',
        }}
      />
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
  );
}
