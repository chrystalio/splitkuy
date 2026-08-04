// lib/whatsapp.test.ts

import { describe, it, expect } from 'vitest';
import { buildWhatsAppText } from './whatsapp';
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

function summary(personId: string, finalOwed: number): PerPersonSummary {
  return {
    personId,
    itemsTotal: 0,
    discountShare: 0,
    taxShare: 0,
    feeShare: 0,
    finalOwed,
    remainderAbsorbed: 0,
  };
}

describe('buildWhatsAppText', () => {
  it('renders a header, per-person bullets, and a subtotal', () => {
    const b = bill({
      people: [
        { id: 'p1', name: 'Andi', isHost: true },
        { id: 'p2', name: 'Budi', isHost: false },
      ],
      items: [
        {
          id: 'i1', name: 'Nasi Goreng', unitPrice: 25000, quantity: 1,
          assignments: [{ personId: 'p1', qty: 1 }],
        },
        {
          id: 'i2', name: 'Es Teh', unitPrice: 5000, quantity: 1,
          assignments: [{ personId: 'p2', qty: 1 }],
        },
      ],
    });
    const summaries = [summary('p1', 25000), summary('p2', 5000)];
    const text = buildWhatsAppText(b, summaries);

    expect(text).toContain('🍽️ Split bill — total Rp 30.000');
    expect(text).toContain('• Andi (host): Rp 25.000');
    expect(text).toContain('  Nasi Goreng Rp 25.000');
    expect(text).toContain('• Budi: Rp 5.000');
    expect(text).toContain('  Es Teh Rp 5.000');
    expect(text).toContain('Subtotal Rp 30.000');
  });

  it('includes discounts, taxes, and fees in the extras line', () => {
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
    const summaries = [summary('p1', 12100)]; // 10000 - 2000 + 1100 + 3000
    const text = buildWhatsAppText(b, summaries);

    expect(text).toContain('Discount −Rp 2.000');
    expect(text).toContain('Tax Rp 1.100');
    expect(text).toContain('Fees Rp 3.000');
    expect(text).toContain('Subtotal Rp 10.000');
  });

  it('omits the items line for a person with no assignments', () => {
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
    const text = buildWhatsAppText(b, summaries);

    expect(text).toContain('• Andi (host): Rp 10.000');
    expect(text).toContain('• Budi: Rp 0');
    // No "Nasi" line under Budi.
    expect(text).not.toMatch(/Budi[\s\S]*Nasi/);
  });

  it('returns header + extras only when there are no people', () => {
    const b = bill({
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [],
      }],
    });
    const text = buildWhatsAppText(b, []);
    expect(text).toContain('🍽️ Split bill — total Rp 10.000');
    expect(text).toContain('Subtotal Rp 10.000');
  });
});
