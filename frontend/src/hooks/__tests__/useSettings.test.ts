import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getStoredProvider, setStoredProvider, getStoredTTSEnabled, setStoredTTSEnabled } from '../useSettings';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('returns "whisper" for an unrecognised stored value (corrupted storage)', () => {
    localStorage.setItem('voiceProvider', 'youtube');
    expect(getStoredProvider()).toBe('whisper');
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

// ---------------------------------------------------------------------------
// getStoredTTSEnabled
// ---------------------------------------------------------------------------

describe('getStoredTTSEnabled', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
  });

  it('returns false when nothing is stored', () => {
    expect(getStoredTTSEnabled()).toBe(false);
  });

  it('returns true when "true" is stored', () => {
    localStorage.setItem('ttsEnabled', 'true');
    expect(getStoredTTSEnabled()).toBe(true);
  });

  it('returns false for any value other than "true" (corrupted storage)', () => {
    localStorage.setItem('ttsEnabled', 'yes');
    expect(getStoredTTSEnabled()).toBe(false);
  });

  it('returns false when localStorage.getItem throws (e.g. private browsing)', () => {
    vi.stubGlobal('localStorage', mockLocalStorage({
      getItem: vi.fn(() => { throw new DOMException('SecurityError'); }),
    }));
    expect(getStoredTTSEnabled()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setStoredTTSEnabled
// ---------------------------------------------------------------------------

describe('setStoredTTSEnabled', () => {
  it('persists true to localStorage', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    setStoredTTSEnabled(true);
    expect(storage.setItem).toHaveBeenCalledWith('ttsEnabled', 'true');
  });

  it('persists false to localStorage', () => {
    const storage = mockLocalStorage();
    vi.stubGlobal('localStorage', storage);
    setStoredTTSEnabled(false);
    expect(storage.setItem).toHaveBeenCalledWith('ttsEnabled', 'false');
  });

  it('does not throw when localStorage.setItem throws (e.g. private browsing)', () => {
    vi.stubGlobal('localStorage', mockLocalStorage({
      setItem: vi.fn(() => { throw new DOMException('SecurityError'); }),
    }));
    expect(() => setStoredTTSEnabled(true)).not.toThrow();
  });
});
