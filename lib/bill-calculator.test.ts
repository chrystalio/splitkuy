// lib/bill-calculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  itemSubtotal,
  billSubtotal,
  personItemsTotal,
  personSubtotalShare,
  personDiscountShare,
  personFeeShare,
  grandTotal,
  computePerPersonSummary,
} from './bill-calculator';

const makePerson = (id: string, name: string, isHost = false) => ({
  id,
  name,
  isHost,
});

const makeItem = (
  id: string,
  name: string,
  unitPrice: number,
  quantity: number,
  assignments: { personId: string; qty: number }[]
) => ({ id, name, unitPrice, quantity, assignments });

describe('remainder reconciliation', () => {
  it('host absorbs stray Rupiahs from fractional discount split', () => {
    // 3 people each with 1/3 share. Discount of 100 produces a fractional
    // 33.333 per-person share that rounds to 33, then sums to 99 (not 100).
    // The 1-Rupiah discrepancy must land on the host.
    const bill = {
      people: [
        makePerson('p1', 'Andi'),
        makePerson('p2', 'Budi'),
        makePerson('p3', 'Citra', true),
      ],
      items: [
        makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }]),
        makeItem('i2', 'Ayam', 1000, 1, [{ personId: 'p2', qty: 1 }]),
        makeItem('i3', 'Teh', 1000, 1, [{ personId: 'p3', qty: 1 }]),
      ],
      discounts: [{ id: 'd1', label: 'Promo', amount: 100 }],
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    const gt = grandTotal(bill);

    // Sum of per-person owed must equal grand total exactly
    expect(sumFinalOwed).toBe(gt);
    // Host should have absorbed some non-zero remainder
    const hostSummary = summaries.find((s) => s.personId === 'p3')!;
    expect(hostSummary.remainderAbsorbed).not.toBe(0);
  });

  it('no remainder when amounts divide evenly', () => {
    // 3 people, subtotal 3000, fees 3000 → 1000 each, exact
    const bill = {
      people: [
        makePerson('p1', 'A'),
        makePerson('p2', 'B', true),
        makePerson('p3', 'C'),
      ],
      items: [makeItem('i1', 'Item', 3000, 1, [{ personId: 'p1', qty: 1 }])],
      discounts: [],
      taxes: [],
      fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
    };

    const summaries = computePerPersonSummary(bill);
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    expect(sumFinalOwed).toBe(grandTotal(bill));
  });
});

describe('itemSubtotal', () => {
  it('single assignment', () => {
    const item = makeItem('i1', 'Es Teh', 6000, 2, [{ personId: 'p1', qty: 2 }]);
    expect(itemSubtotal(item)).toBe(12000);
  });

  it('multiple assignments', () => {
    const item = makeItem('i1', 'Es Teh', 6000, 3, [
      { personId: 'p1', qty: 2 },
      { personId: 'p2', qty: 1 },
    ]);
    expect(itemSubtotal(item)).toBe(18000);
  });
});

describe('personFeeShare', () => {
  it('evenly divides fees across all people', () => {
    const fees = [{ id: 'f1', label: 'Delivery', amount: 15000 }];
    const people = [
      makePerson('p1', 'A'),
      makePerson('p2', 'B', true),
      makePerson('p3', 'C'),
    ];
    expect(personFeeShare('p1', fees, people)).toBe(5000);
    expect(personFeeShare('p2', fees, people)).toBe(5000);
  });
});
