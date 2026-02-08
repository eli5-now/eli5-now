import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <p
        className="text-center mt-8"
        style={{ color: 'var(--foreground-subtle)' }}
      >
        Ask Eli anything!
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
        />
      ))}
    </div>
  );
}
