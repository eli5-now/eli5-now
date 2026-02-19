import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredProvider, setStoredProvider } from '../useSettings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockLocalStorage(overrides: Partial<Storage> = {}) {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    ...overrides,
  } as unknown as Storage;
}

// ---------------------------------------------------------------------------
// getStoredProvider
// ---------------------------------------------------------------------------

describe('getStoredProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
  });

  it('returns "whisper" when nothing is stored', () => {
    expect(getStoredProvider()).toBe('whisper');
  });

  it('returns the stored value when one exists', () => {
    localStorage.setItem('voiceProvider', 'webspeech');
    expect(getStoredProvider()).toBe('webspeech');
  });

  it('returns "whisper" when localStorage.getItem throws (e.g. private browsing)', () => {
    vi.stubGlobal('localStorage', mockLocalStorage({
      getItem: vi.fn(() => { throw new DOMException('SecurityError'); }),
    }));
    expect(getStoredProvider()).toBe('whisper');
  });
});

// ---------------------------------------------------------------------------
// setStoredProvider
// ---------------------------------------------------------------------------

describe('setStoredProvider', () => {
  it('persists the provider to localStorage', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    setStoredProvider('webspeech');
    expect(storage.setItem).toHaveBeenCalledWith('voiceProvider', 'webspeech');
  });

  it('does not throw when localStorage.setItem throws (e.g. private browsing)', () => {
    vi.stubGlobal('localStorage', mockLocalStorage({
      setItem: vi.fn(() => { throw new DOMException('SecurityError'); }),
    }));
    // Should not throw:
    expect(() => setStoredProvider('whisper')).not.toThrow();
  });
});
