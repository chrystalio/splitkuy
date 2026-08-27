// lib/history-storage.test.ts
import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  loadHistory,
  saveHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
} from './history-storage';
import type { HistoryEntry } from './types';

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
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

const validEntry: HistoryEntry = {
  id: 'h1',
  savedAt: '2026-08-27T10:00:00.000Z',
  billLabel: 'Lunch',
  bill: validBill,
  summaries: [
    {
      personId: 'p1',
      itemsTotal: 0,
      discountShare: 0,
      taxShare: 0,
      feeShare: 0,
      finalOwed: 0,
      remainderAbsorbed: 0,
    },
  ],
  grandTotal: 0,
};

const validFullEntry: HistoryEntry = {
  id: 'h2',
  savedAt: '2026-08-27T12:00:00.000Z',
  billLabel: 'Dinner with friends',
  bill: {
    people: [
      { id: 'p1', name: 'Andi', isHost: true },
      { id: 'p2', name: 'Budi', isHost: false },
    ],
    items: [
      {
        id: 'i1',
        name: 'Nasi Goreng',
        unitPrice: 25000,
        quantity: 2,
        assignments: [
          { personId: 'p1', qty: 1 },
          { personId: 'p2', qty: 1 },
        ],
      },
    ],
    discounts: [{ id: 'd1', label: 'Promo', amount: 5000 }],
    taxes: [{ id: 't1', label: 'PPN', amount: 2200 }],
    fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
  },
  summaries: [
    {
      personId: 'p1',
      itemsTotal: 25000,
      discountShare: 2500,
      taxShare: 1100,
      feeShare: 1500,
      finalOwed: 25100,
      remainderAbsorbed: 0,
    },
    {
      personId: 'p2',
      itemsTotal: 25000,
      discountShare: 2500,
      taxShare: 1100,
      feeShare: 1500,
      finalOwed: 25100,
      remainderAbsorbed: 0,
    },
  ],
  grandTotal: 50200,
};

// --- loadHistory ---

describe('loadHistory', () => {
  it('returns empty array when nothing is stored', () => {
    mockStorage({});
    expect(loadHistory()).toEqual([]);
  });

  it('returns empty array on invalid JSON', () => {
    mockStorage({ splitkuy_history_v1: '{not json' });
    expect(loadHistory()).toEqual([]);
  });

  it('returns empty array when stored value is not an array', () => {
    mockStorage({ splitkuy_history_v1: '{}' });
    expect(loadHistory()).toEqual([]);
  });

  it('returns valid entries', () => {
    mockStorage({
      splitkuy_history_v1: JSON.stringify([validEntry]),
    });
    expect(loadHistory()).toEqual([validEntry]);
  });

  it('filters out corrupt entries but keeps valid ones', () => {
    const corrupt = { id: 'bad', savedAt: '', billLabel: '', bill: {}, summaries: [], grandTotal: -1 };
    mockStorage({
      splitkuy_history_v1: JSON.stringify([validEntry, corrupt, validFullEntry]),
    });
    const result = loadHistory();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('h1');
    expect(result[1].id).toBe('h2');
  });

  it('rejects entry with missing bill', () => {
    const bad = { ...validEntry, bill: null };
    mockStorage({ splitkuy_history_v1: JSON.stringify([bad]) });
    expect(loadHistory()).toEqual([]);
  });

  it('rejects entry with non-array summaries', () => {
    const bad = { ...validEntry, summaries: 'nope' };
    mockStorage({ splitkuy_history_v1: JSON.stringify([bad]) });
    expect(loadHistory()).toEqual([]);
  });

  it('rejects entry with negative grandTotal', () => {
    const bad = { ...validEntry, grandTotal: -100 };
    mockStorage({ splitkuy_history_v1: JSON.stringify([bad]) });
    expect(loadHistory()).toEqual([]);
  });

  it('rejects entry with empty label', () => {
    const bad = { ...validEntry, billLabel: '' };
    mockStorage({ splitkuy_history_v1: JSON.stringify([bad]) });
    expect(loadHistory()).toEqual([]);
  });
});

// --- saveHistoryEntry ---

describe('saveHistoryEntry', () => {
  it('saves a new entry', () => {
    mockStorage({});
    saveHistoryEntry(validEntry);
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('h1');
  });

  it('prepends new entries (newest first)', () => {
    mockStorage({});
    saveHistoryEntry(validEntry);
    saveHistoryEntry(validFullEntry);
    const history = loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe('h2'); // newest
    expect(history[1].id).toBe('h1');
  });

  it('caps at 50 entries, dropping oldest', () => {
    mockStorage({});
    // Save 52 entries
    for (let i = 0; i < 52; i++) {
      saveHistoryEntry({
        ...validEntry,
        id: `h${i}`,
        savedAt: new Date(2026, 0, i + 1).toISOString(),
      });
    }
    const history = loadHistory();
    expect(history).toHaveLength(50);
    // The newest (h51) should be first
    expect(history[0].id).toBe('h51');
    // The oldest kept should be h2 (h0 and h1 dropped)
    expect(history[49].id).toBe('h2');
  });

  it('does not throw when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
      getItem: vi.fn(() => '[]'),
      removeItem: vi.fn(),
    });
    expect(() => saveHistoryEntry(validEntry)).not.toThrow();
  });
});

// --- deleteHistoryEntry ---

describe('deleteHistoryEntry', () => {
  it('deletes an entry by id', () => {
    mockStorage({
      splitkuy_history_v1: JSON.stringify([validEntry, validFullEntry]),
    });
    deleteHistoryEntry('h1');
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('h2');
  });

  it('does nothing when id does not exist', () => {
    mockStorage({
      splitkuy_history_v1: JSON.stringify([validEntry]),
    });
    deleteHistoryEntry('nonexistent');
    expect(loadHistory()).toHaveLength(1);
  });

  it('does not throw when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
      getItem: vi.fn(() => '[]'),
      removeItem: vi.fn(),
    });
    expect(() => deleteHistoryEntry('h1')).not.toThrow();
  });
});

// --- clearHistory ---

describe('clearHistory', () => {
  it('removes all history', () => {
    mockStorage({
      splitkuy_history_v1: JSON.stringify([validEntry, validFullEntry]),
    });
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it('does not throw when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(() => {
        throw new Error('quota');
      }),
    });
    expect(() => clearHistory()).not.toThrow();
  });
});
