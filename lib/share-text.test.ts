// lib/share-text.test.ts

import { describe, it, expect } from 'vitest';
import { buildShareText } from './share-text';
import type { Bill, PerPersonSummary } from './types';

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    people: [],
    items: [],
    discounts: [],
    taxes: [],
    fees: [],
    ...overrides,
  };
}

function summary(
  personId: string,
  finalOwed: number,
  overrides: Partial<Pick<PerPersonSummary, 'itemsTotal' | 'discountShare' | 'taxShare' | 'feeShare' | 'remainderAbsorbed'>> = {}
): PerPersonSummary {
  return {
    personId,
    itemsTotal: 0,
    discountShare: 0,
    taxShare: 0,
    feeShare: 0,
    remainderAbsorbed: 0,
    ...overrides,
    finalOwed,
  };
}

describe('buildShareText', () => {
  it('renders the bug-report scenario with header, extras, per-person sections, and footer', () => {
    // Bug-report scenario: Elia's Americano was Rp 20.000 but final was Rp 28.654.
    const b = bill({
      people: [
        { id: 'p1', name: 'Kris', isHost: true },
        { id: 'p2', name: 'Elia', isHost: false },
      ],
      items: [
        {
          id: 'i1', name: 'Americano J', unitPrice: 32000, quantity: 1,
          assignments: [{ personId: 'p1', qty: 1 }],
        },
        {
          id: 'i2', name: 'Americano R', unitPrice: 20000, quantity: 1,
          assignments: [{ personId: 'p2', qty: 1 }],
        },
      ],
      discounts: [{ id: 'd1', label: 'Promo', amount: 10000 }],
      fees: [{ id: 'f1', label: 'Service', amount: 25000 }],
    });
    const summaries = [
      summary('p1', 38346, {
        itemsTotal: 32000, discountShare: -6154, feeShare: 12500,
      }),
      summary('p2', 28654, {
        itemsTotal: 20000, discountShare: -3846, feeShare: 12500,
      }),
    ];
    const text = buildShareText(b, summaries);

    expect(text).toBe(
      [
        '🍽️ Split Bill — Total: Rp 67.000',
        '(Subtotal: Rp 52.000 | Fees: Rp 25.000 | Discount: −Rp 10.000)',
        '',
        '👤 Kris (Host)',
        '• Americano J: Rp 32.000',
        '• Fees & Disc: + Rp 6.346',
        '👉 Total to pay: Rp 38.346',
        '',
        '👤 Elia',
        '• Americano R: Rp 20.000',
        '• Fees & Disc: + Rp 8.654',
        '👉 Total to pay: Rp 28.654',
        '',
        '© 2026 SplitKuy | No accounts, no sign-ups, no drama.',
      ].join('\n')
    );
  });

  it('omits the per-person section entirely when there is nothing to show', () => {
    const b = bill({
      people: [
        { id: 'p1', name: 'Andi', isHost: true },
        { id: 'p2', name: 'Budi', isHost: false },
      ],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
    });
    const summaries = [summary('p1', 10000), summary('p2', 0)];
    const text = buildShareText(b, summaries);

    expect(text).toContain('👤 Andi (Host)');
    expect(text).not.toContain('👤 Budi');
    expect(text).not.toMatch(/Budi[\s\S]*Nasi/);
  });

  it('renders the parenthesised extras line with all components', () => {
    const b = bill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
      discounts: [{ id: 'd1', label: 'Promo', amount: 2000 }],
      taxes: [{ id: 't1', label: 'PPN', amount: 1100 }],
      fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
    });
    const summaries = [summary('p1', 12100, {
      itemsTotal: 10000, discountShare: -2000, taxShare: 1100, feeShare: 3000,
    })];
    const text = buildShareText(b, summaries);

    expect(text).toContain(
      '(Subtotal: Rp 10.000 | Fees: Rp 3.000 | Tax: Rp 1.100 | Discount: −Rp 2.000)'
    );
  });

  it('uses Tax & Disc label when only tax is present (no fees)', () => {
    const b = bill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
      taxes: [{ id: 't1', label: 'PB1', amount: 1100 }],
    });
    const summaries = [summary('p1', 11100, { itemsTotal: 10000, taxShare: 1100 })];
    const text = buildShareText(b, summaries);

    expect(text).toContain('• Tax & Disc: + Rp 1.100');
    expect(text).not.toContain('• Fees & Disc');
  });

  it('uses Fees & Disc label when only fees are present (no tax)', () => {
    const b = bill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
      fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
    });
    const summaries = [summary('p1', 13000, { itemsTotal: 10000, feeShare: 3000 })];
    const text = buildShareText(b, summaries);

    expect(text).toContain('• Fees & Disc: + Rp 3.000');
    expect(text).not.toContain('Tax & Disc');
  });

  it('shows a minus sign when discount exceeds fees', () => {
    const b = bill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
      discounts: [{ id: 'd1', label: 'Big Promo', amount: 5000 }],
      fees: [{ id: 'f1', label: 'Service', amount: 2000 }],
    });
    // fees 2000 - discount 5000 = -3000 → negative net extras
    const summaries = [summary('p1', 7000, {
      itemsTotal: 10000, discountShare: -5000, feeShare: 2000,
    })];
    const text = buildShareText(b, summaries);

    expect(text).toContain('• Fees & Disc: − Rp 3.000');
    expect(text).toContain('👉 Total to pay: Rp 7.000');
  });

  it('omits the Fees & Disc line entirely when net extras are zero', () => {
    const b = bill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
    });
    const summaries = [summary('p1', 10000, { itemsTotal: 10000 })];
    const text = buildShareText(b, summaries);

    expect(text).toContain('• Nasi: Rp 10.000');
    expect(text).toContain('👉 Total to pay: Rp 10.000');
    expect(text).not.toContain('Fees & Disc');
    expect(text).not.toContain('Tax & Disc');
  });

  it('renders header + extras + footer when there are no people', () => {
    const b = bill({
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [],
      }],
    });
    const text = buildShareText(b, []);
    expect(text).toContain('🍽️ Split Bill — Total: Rp 10.000');
    expect(text).toContain('(Subtotal: Rp 10.000)');
    expect(text).toContain('© 2026 SplitKuy | No accounts, no sign-ups, no drama.');
  });
});