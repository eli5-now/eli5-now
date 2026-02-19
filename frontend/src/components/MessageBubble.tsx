interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
  ttsEnabled?: boolean;
  isSpeaking?: boolean;
  onSpeak?: (text: string) => void;
  onStop?: () => void;
}

export function MessageBubble({ role, content, isThinking, ttsEnabled, isSpeaking, onSpeak, onStop }: MessageBubbleProps) {
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
        {!isUser && !isThinking && ttsEnabled && (
          <button
            onClick={isSpeaking ? onStop : () => onSpeak?.(content)}
            aria-label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            className="ml-2 text-base opacity-60 hover:opacity-100 transition-opacity"
            style={{ verticalAlign: 'middle' }}
          >
            {isSpeaking ? '⏸' : '🔊'}
          </button>
        )}
      </div>
    </div>
  );
}
