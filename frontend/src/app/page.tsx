'use client';

import { useState } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useSettings } from '@/hooks/useSettings';
import { useTTS } from '@/hooks/useTTS';
import { askEli, StreamEvent } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { voiceProvider, updateVoiceProvider, ttsEnabled, updateTTSEnabled } = useSettings();
  const tts = useTTS(voiceProvider);

  const handleSubmit = async (question: string) => {
    // Build history from current messages (before adding new question)
    const history = messages.map(({ role, content }) => ({ role, content }));

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare assistant message placeholder
    const assistantId = crypto.randomUUID();
    let assistantContent = '';

    const handleEvent = (event: StreamEvent) => {
      if (event.type === 'thinking') {
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
        if (ttsEnabled && assistantContent) tts.speak(assistantContent);
      }
    };

    try {
      await askEli({ question, history }, handleEvent);
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
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <div className="w-8" /> {/* Spacer to centre title */}
        <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          ELI5 Now!
        </h1>
        <SettingsPanel
          voiceProvider={voiceProvider}
          onVoiceProviderChange={updateVoiceProvider}
          ttsEnabled={ttsEnabled}
          onTTSEnabledChange={updateTTSEnabled}
        />
      </header>

      {/* Message area */}
      <main
        className="flex-1 overflow-y-auto p-4"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <MessageList
          messages={messages}
          ttsEnabled={ttsEnabled}
          isSpeaking={tts.isSpeaking}
          onSpeak={tts.speak}
          onStop={tts.stop}
        />
      </main>

      {/* Input area */}
      <footer
        className="p-4 border-t"
        style={{ borderColor: 'var(--surface-alt)', backgroundColor: 'var(--surface)' }}
      >
        <ChatInput onSubmit={handleSubmit} disabled={isLoading} voiceProvider={voiceProvider} />
      </footer>
    </div>
  );
}
