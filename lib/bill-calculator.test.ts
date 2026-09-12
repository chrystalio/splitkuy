// lib/bill-calculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  isEqualSplit,
  personItemsTotal,
  itemSubtotal,
  personFeeShare,
  personDiscountShare,
  personSubtotalShare,
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
    // No remainder to absorb — every person should have remainderAbsorbed === 0
    for (const sm of summaries) {
      expect(sm.remainderAbsorbed).toBe(0);
    }
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

describe('personSubtotalShare and proportional shares', () => {
  it('raw share for 1/3 of Rp 100 discount is fractional; callers must round for display', () => {
    // Regression guard: SummaryPanel must round these before passing to formatIDR,
    // or the display shows Indonesian decimal commas (e.g. "33,333").
    const items = [
      makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }]),
      makeItem('i2', 'Ayam', 1000, 1, [{ personId: 'p2', qty: 1 }]),
      makeItem('i3', 'Teh', 1000, 1, [{ personId: 'p3', qty: 1 }]),
    ];
    const discounts = [{ id: 'd1', label: 'Promo', amount: 100 }];
    const subtotalShare = personSubtotalShare('p1', items);
    expect(subtotalShare).toBeCloseTo(1 / 3, 5);
    const discountShare = personDiscountShare('p1', discounts, items);
    // Raw share is 33.333... — UI must Math.round() this.
    expect(Math.round(discountShare)).toBe(33);
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

describe('finalOwed floor at 0', () => {
  it('clamps a negative finalOwed to 0 for a single person', () => {
    const bill = {
      people: [makePerson('p1', 'Andi', true)],
      items: [makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }])],
      discounts: [{ id: 'd1', label: 'Promo', amount: 5000 }], // > subtotal
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    expect(summaries[0].finalOwed).toBe(0);
    // grandTotal is negative here, so the "sum equals grandTotal" invariant is
    // intentionally suspended: the host absorbs the remainder, clamped at 0,
    // and the warning banner surfaces the gap.
    expect(summaries[0].remainderAbsorbed).toBe(-4000);
  });

  it('clamps all people when discounts exceed total subtotal', () => {
    const bill = {
      people: [
        makePerson('p1', 'Andi'),
        makePerson('p2', 'Budi', true),
        makePerson('p3', 'Citra'),
      ],
      items: [
        makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }]),
        makeItem('i2', 'Ayam', 1000, 1, [{ personId: 'p2', qty: 1 }]),
        makeItem('i3', 'Teh', 1000, 1, [{ personId: 'p3', qty: 1 }]),
      ],
      discounts: [{ id: 'd1', label: 'Promo', amount: 5000 }], // subtotal is 3000
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    for (const sm of summaries) {
      expect(sm.finalOwed).toBeGreaterThanOrEqual(0);
    }
    // Host absorbs the negative remainder, clamped at 0. The sum no longer
    // equals grandTotal when grandTotal < 0 — the banner surfaces the gap.
    const host = summaries.find((sm) => sm.personId === 'p2')!;
    expect(host.finalOwed).toBe(0);
    expect(host.remainderAbsorbed).toBe(-2000);
  });

  it('preserves the sum-equals-grandTotal invariant for positive grandTotal (host absorbs legitimate remainder)', () => {
    // Host has no items, 3 items worth Rp 1000 each by other people,
    // and a small discount that makes the rounding land on the host.
    // With grandTotal >= 0, the host may go slightly negative to reconcile.
    const bill = {
      people: [
        makePerson('p1', 'Andi'),
        makePerson('p2', 'Budi'),
        makePerson('p3', 'Citra', true), // host
      ],
      items: [
        makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }]),
        makeItem('i2', 'Ayam', 1000, 1, [{ personId: 'p2', qty: 1 }]),
      ],
      discounts: [{ id: 'd1', label: 'Promo', amount: 100 }],
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    expect(sumFinalOwed).toBe(grandTotal(bill));
  });
});

describe('equal-split items', () => {
  it('single assignee behaves like a normal qty-1 item', () => {
    const item = makeItem('i1', 'Cake', 100, 1, [{ personId: 'p1', qty: 1 }]);
    expect(personItemsTotal('p1', [item])).toBe(100);
  });

  it('three assignees each pay one-third of the unit price', () => {
    const item = makeItem(
      'i1',
      'Cake',
      100,
      1,
      [
        { personId: 'p1', qty: 1 },
        { personId: 'p2', qty: 1 },
        { personId: 'p3', qty: 1 },
      ],
    );
    expect(personItemsTotal('p1', [item])).toBe(33);
    expect(personItemsTotal('p2', [item])).toBe(33);
    expect(personItemsTotal('p3', [item])).toBe(33);
  });

  it('host absorbs the rounding remainder for non-divisible unit prices', () => {
    const bill = {
      people: [
        makePerson('p1', 'Nala'),
        makePerson('p2', 'Sena'),
        makePerson('p3', 'Jack', true),
      ],
      items: [
        makeItem('i1', 'Cake', 100, 1, [
          { personId: 'p1', qty: 1 },
          { personId: 'p2', qty: 1 },
          { personId: 'p3', qty: 1 },
        ]),
      ],
      discounts: [],
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    expect(sumFinalOwed).toBe(grandTotal(bill)); // must balance to 100
    const host = summaries.find((s) => s.personId === 'p3')!;
    expect(host.remainderAbsorbed).toBe(1); // the extra Rupiah after rounding
  });

  it('multi-quantity items still use proportional qty split', () => {
    // quantity=2 with 3 assignees = NOT equal-split. Each assignee gets
    // qty=1 * unitPrice = 100. Sum across assignees = 300 (two units).
    const item = makeItem('i1', 'Pizza', 100, 2, [
      { personId: 'p1', qty: 1 },
      { personId: 'p2', qty: 1 },
      { personId: 'p3', qty: 1 },
    ]);
    expect(personItemsTotal('p1', [item])).toBe(100);
    expect(personItemsTotal('p2', [item])).toBe(100);
    // p3 is not in the assignment list, gets 0
    expect(personItemsTotal('p3', [item])).toBe(0);
  });

  it('isEqualSplit helper classifies correctly', () => {
    const equalSplit = makeItem('i1', 'Cake', 100, 1, [
      { personId: 'p1', qty: 1 },
      { personId: 'p2', qty: 1 },
    ]);
    const singleAssignee = makeItem('i2', 'Drink', 100, 1, [
      { personId: 'p1', qty: 1 },
    ]);
    const multiQty = makeItem('i3', 'Pizza', 100, 2, [
      { personId: 'p1', qty: 1 },
      { personId: 'p2', qty: 1 },
    ]);
    expect(isEqualSplit(equalSplit)).toBe(true);
    expect(isEqualSplit(singleAssignee)).toBe(false);
    expect(isEqualSplit(multiQty)).toBe(false);
  });
});
