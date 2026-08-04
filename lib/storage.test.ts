// lib/storage.test.ts
import { afterEach, describe, it, expect, vi } from 'vitest';
import { saveBill, loadBill, isBill } from './storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
  return store;
}

const validBill = {
  people: [{ id: 'p1', name: 'Andi', isHost: true }],
  items: [],
  discounts: [],
  taxes: [],
  fees: [],
};

describe('loadBill', () => {
  it('returns null when nothing is stored', () => {
    mockStorage({});
    expect(loadBill()).toBeNull();
  });

  it('returns null on invalid JSON', () => {
    mockStorage({ splitkuy_bill_v1: '{not json' });
    expect(loadBill()).toBeNull();
  });

  it('returns null when parsed value is not a bill', () => {
    mockStorage({ splitkuy_bill_v1: '{}' });
    expect(loadBill()).toBeNull();
  });

  it('returns null when required arrays are missing', () => {
    mockStorage({ splitkuy_bill_v1: JSON.stringify({ people: [] }) });
    expect(loadBill()).toBeNull();
  });

  it('returns the bill when the shape matches', () => {
    mockStorage({ splitkuy_bill_v1: JSON.stringify(validBill) });
    expect(loadBill()).toEqual(validBill);
  });
});

describe('saveBill', () => {
  it('does not throw when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => { throw new Error('quota'); }),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    });
    expect(() => saveBill(validBill)).not.toThrow();
  });
});

describe('isBill', () => {
  it('accepts a valid bill', () => {
    expect(isBill(validBill)).toBe(true);
  });

  it('rejects null, arrays, and non-objects', () => {
    expect(isBill(null)).toBe(false);
    expect(isBill([])).toBe(false);
    expect(isBill('nope')).toBe(false);
  });

  it('rejects a bill missing required arrays', () => {
    expect(isBill({ people: [], items: [] })).toBe(false);
  });

  it('rejects a person without an id or name string', () => {
    expect(isBill({ ...validBill, people: [{ id: 1, name: 'A' }] })).toBe(false);
    expect(isBill({ ...validBill, people: [{ id: 'a', name: 5 }] })).toBe(false);
  });
});
