'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
}

export function ChatInput({ onSubmit }: ChatInputProps) {
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
        className="flex-1 rounded-full px-4 py-3 outline-none"
        style={{
          backgroundColor: 'var(--surface-alt)',
          color: 'var(--foreground)',
        }}
      />
      <button
        type="submit"
        className="rounded-full px-6 py-3 font-medium transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
        }}
      >
        Ask
      </button>
    </form>
  );
}
