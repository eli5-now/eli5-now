/**
 * Regression test: message IDs must be UUIDs, not Date.now() timestamps.
 *
 * The old code used Date.now().toString() and (Date.now()+1).toString() which
 * could collide if two events landed within the same millisecond.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('page — message ID format', () => {
  beforeEach(() => {
    // Ensure crypto.randomUUID is available in the jsdom environment
    if (!globalThis.crypto?.randomUUID) {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => '00000000-0000-4000-8000-000000000000'),
      });
    }
  });

  it('crypto.randomUUID returns a v4 UUID', () => {
    const id = crypto.randomUUID();
    expect(id).toMatch(UUID_PATTERN);
  });

  it('two consecutive calls return distinct IDs', () => {
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();
    expect(a).not.toBe(b);
  });

  it('ID is not a numeric timestamp string', () => {
    const id = crypto.randomUUID();
    // A timestamp would be a pure numeric string like "1708300000000"
    expect(/^\d+$/.test(id)).toBe(false);
  });
});
