/**
 * Tests for the blob-size guard in useWhisper.
 *
 * Verifies that transcribeAudio is NOT called when the recorded blob is empty
 * (i.e. the user started and immediately stopped without speaking).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock @/lib/api before the hook is imported
// ---------------------------------------------------------------------------
const mockTranscribeAudio = vi.fn().mockResolvedValue('hello');

vi.mock('@/lib/api', () => ({
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
}));

// ---------------------------------------------------------------------------
// Class-based MediaRecorder mock (Vitest requires a class/function for `new`)
// ---------------------------------------------------------------------------
function makeMediaRecorderClass(audioBytes: number) {
  return class MockMediaRecorder {
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    mimeType = 'audio/webm';
    state: RecordingState = 'inactive';

    start() {
      this.state = 'recording';
      // Fire a single data chunk synchronously so chunks accumulate before stop
      this.ondataavailable?.({
        data: new Blob([new Uint8Array(audioBytes)], { type: 'audio/webm' }),
      });
    }

    stop() {
      this.state = 'inactive';
      this.onstop?.();
    }
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockTranscribeAudio.mockClear();
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] };
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules(); // Ensure the hook is re-imported fresh each test
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useWhisper — empty blob guard', () => {
  it('calls transcribeAudio when audio data is captured', async () => {
    vi.stubGlobal('MediaRecorder', makeMediaRecorderClass(1024));

    const { useWhisper } = await import('../useWhisper');
    const { result } = renderHook(() => useWhisper());

    await act(async () => { await result.current.start(); });
    act(() => { result.current.stop(); });

    await waitFor(() => expect(mockTranscribeAudio).toHaveBeenCalledOnce());
  });

  it('does NOT call transcribeAudio when blob is empty (user stopped immediately)', async () => {
    vi.stubGlobal('MediaRecorder', makeMediaRecorderClass(0));

    const { useWhisper } = await import('../useWhisper');
    const { result } = renderHook(() => useWhisper());

    await act(async () => { await result.current.start(); });
    act(() => { result.current.stop(); });

    // Give any pending microtasks a chance to run
    await act(async () => {});

    expect(mockTranscribeAudio).not.toHaveBeenCalled();
  });
});
