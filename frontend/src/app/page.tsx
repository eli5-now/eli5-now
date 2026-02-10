'use client';

import { useState } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { askEli, StreamEvent } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (question: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare assistant message placeholder
    const assistantId = (Date.now() + 1).toString();
    let assistantContent = '';

    const handleEvent = (event: StreamEvent) => {
      if (event.type === 'thinking') {
        // Show thinking as temporary content
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          { id: assistantId, role: 'assistant', content: '🤔 ' + event.content },
        ]);
      } else if (event.type === 'text') {
        assistantContent = event.content;
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          { id: assistantId, role: 'assistant', content: assistantContent },
        ]);
      } else if (event.type === 'done') {
        setIsLoading(false);
      }
    };

    try {
      await askEli({ question }, handleEvent);
    } catch (error) {
      console.error('Error asking Eli:', error);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: 'Sorry, something went wrong. Please try again!' },
      ]);
      setIsLoading(false);
    }
  };

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
        <MessageList messages={messages} />
      </main>

      {/* Input area */}
      <footer
        className="p-4 border-t"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
      </footer>
    </div>
  );
}
