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

const validFullBill = {
  people: [
    { id: 'p1', name: 'Andi', isHost: true },
    { id: 'p2', name: 'Budi' },
  ],
  items: [
    {
      id: 'i1',
      name: 'Nasi',
      unitPrice: 10000,
      quantity: 2,
      assignments: [
        { personId: 'p1', qty: 1 },
        { personId: 'p2', qty: 1 },
      ],
    },
  ],
  discounts: [{ id: 'd1', label: 'Promo', amount: 5000 }],
  taxes: [{ id: 't1', label: 'PPN', amount: 1100 }],
  fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
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

  it('returns a fully-populated bill when every field is valid', () => {
    mockStorage({ splitkuy_bill_v1: JSON.stringify(validFullBill) });
    expect(loadBill()).toEqual(validFullBill);
  });

  // --- Corrupt-data cases (the new deep validation) ---

  it('returns null when an item has a non-number unitPrice', () => {
    const corrupt = {
      ...validBill,
      items: [{ id: 'i1', name: 'Nasi', unitPrice: '10000', quantity: 1, assignments: [] }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when an item has non-array assignments', () => {
    const corrupt = {
      ...validBill,
      items: [{ id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1, assignments: 'oops' }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when assignment qty exceeds item quantity', () => {
    const corrupt = {
      ...validBill,
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 2,
        assignments: [
          { personId: 'p1', qty: 2 },
          { personId: 'p2', qty: 2 },
        ],
      }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when a discount amount is a string', () => {
    const corrupt = {
      ...validBill,
      discounts: [{ id: 'd1', label: 'Promo', amount: '5000' }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when an item has zero quantity', () => {
    const corrupt = {
      ...validBill,
      items: [{ id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 0, assignments: [] }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when an item has a negative unitPrice', () => {
    const corrupt = {
      ...validBill,
      items: [{ id: 'i1', name: 'Nasi', unitPrice: -10000, quantity: 1, assignments: [] }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when an item has a NaN/Infinity unitPrice', () => {
    const corrupt = {
      ...validBill,
      items: [{ id: 'i1', name: 'Nasi', unitPrice: Infinity, quantity: 1, assignments: [] }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when a person has an empty id', () => {
    const corrupt = {
      ...validBill,
      people: [{ id: '', name: 'Andi', isHost: true }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when a person has a non-boolean isHost', () => {
    const corrupt = {
      ...validBill,
      people: [{ id: 'p1', name: 'Andi', isHost: 'yes' }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when an assignment has a negative qty', () => {
    const corrupt = {
      ...validBill,
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: -1 }],
      }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when any of the five arrays is not an array', () => {
    mockStorage({ splitkuy_bill_v1: JSON.stringify({ ...validBill, fees: null }) });
    expect(loadBill()).toBeNull();
    mockStorage({ splitkuy_bill_v1: JSON.stringify({ ...validBill, taxes: 'taxes' }) });
    expect(loadBill()).toBeNull();
  });

  it('returns null when one item in a list is bad (not just the first)', () => {
    const corrupt = {
      ...validBill,
      items: [
        { id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1, assignments: [] },
        { id: 'i2', name: 'Bad', unitPrice: 'oops', quantity: 1, assignments: [] },
      ],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(corrupt) });
    expect(loadBill()).toBeNull();
  });

  it('accepts a person without isHost (defaults to false at runtime)', () => {
    const partial = {
      ...validBill,
      people: [{ id: 'p1', name: 'Andi' }],
    };
    mockStorage({ splitkuy_bill_v1: JSON.stringify(partial) });
    expect(loadBill()).toEqual(partial);
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
