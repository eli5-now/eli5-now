interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isUser ? 'var(--bubble-user)' : 'var(--bubble-eli)',
          color: 'var(--foreground)',
          boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {content}
      </div>
    </div>
  );
}
