'use client';

import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';

const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Why is the sky blue?',
  },
  {
    id: '2',
    role: 'assistant' as const,
    content:
      "Great question! The sky is blue because of the way sunlight plays with the air. Sunlight looks white, but it's actually made of all the colors of the rainbow mixed together. When sunlight hits the tiny bits of air way up high, the blue part of the light bounces around the most — like a ball bouncing off walls! That's why when you look up, you see blue everywhere.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-center py-4 border-b"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          ELI5 Now!
        </h1>
      </header>

      {/* Message area */}
      <main
        className="flex-1 overflow-y-auto p-4"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <MessageList messages={mockMessages} />
      </main>

      {/* Input area */}
      <footer
        className="p-4 border-t"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <ChatInput onSubmit={(msg) => console.log('User asked:', msg)} />
      </footer>
    </div>
  );
}
