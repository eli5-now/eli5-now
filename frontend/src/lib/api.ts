const API_URL = 'http://localhost:8000';

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  const res = await fetch(`${API_URL}/transcribe`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Transcription error: ${res.status}`);
  const data = await res.json();
  return data.transcript;
}

export interface StreamEvent {
  type: 'thinking' | 'text' | 'image' | 'done';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskRequest {
  question: string;
  age?: number;
  story_mode?: boolean;
  history?: Message[];
}

export async function askEli(
  request: AskRequest,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const response = await fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const event = JSON.parse(data) as StreamEvent;
          onEvent(event);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
}
