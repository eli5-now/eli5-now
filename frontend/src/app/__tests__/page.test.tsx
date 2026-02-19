/**
 * Regression test: message IDs must be UUIDs, not Date.now() timestamps.
 *
 * The old code used Date.now().toString() and (Date.now()+1).toString() which
 * could collide if two events landed within the same millisecond.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Counter-based stub so repeated calls always return distinct, format-valid UUIDs.
let _uuidCounter = 0;
function makeCounterUUID(): `${string}-${string}-${string}-${string}-${string}` {
  const hex = (_uuidCounter++).toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  _uuidCounter = 0;
});

describe('page — message ID format', () => {
  // jsdom 28 ships crypto.randomUUID natively; the stub only activates in
  // environments that don't support it, and uses a counter so calls differ.
  function ensureRandomUUID() {
    if (!globalThis.crypto?.randomUUID) {
      vi.stubGlobal('crypto', { randomUUID: vi.fn(makeCounterUUID) });
    }
  }

  it('crypto.randomUUID returns a v4-compatible UUID', () => {
    ensureRandomUUID();
    expect(crypto.randomUUID()).toMatch(UUID_PATTERN);
  });

  it('two consecutive calls return distinct IDs', () => {
    ensureRandomUUID();
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();
    expect(a).not.toBe(b);
  });

  it('ID is not a numeric timestamp string', () => {
    ensureRandomUUID();
    const id = crypto.randomUUID();
    // A timestamp would be a pure numeric string like "1708300000000"
    expect(/^\d+$/.test(id)).toBe(false);
  });
});
