// lib/bill-calculator.ts

import type { Bill, Item, PerPersonSummary } from './types';

export function itemSubtotal(item: Item): number {
  return item.assignments.reduce(
    (sum, a) => sum + a.qty * item.unitPrice,
    0
  );
}

export function billSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

export function personItemsTotal(personId: string, items: Item[]): number {
  return items.reduce((sum, item) => {
    const assignment = item.assignments.find((a) => a.personId === personId);
    return sum + (assignment ? assignment.qty * item.unitPrice : 0);
  }, 0);
}

export function personSubtotalShare(
  personId: string,
  items: Item[]
): number {
  const total = billSubtotal(items);
  if (total === 0) return 0;
  return personItemsTotal(personId, items) / total;
}

export function personDiscountShare(
  personId: string,
  discounts: { amount: number }[],
  items: Item[]
): number {
  const totalDiscount = discounts.reduce((s, d) => s + d.amount, 0);
  const share = personSubtotalShare(personId, items);
  return share * totalDiscount;
}

export function personTaxShare(
  personId: string,
  taxes: { amount: number }[],
  items: Item[]
): number {
  const totalTax = taxes.reduce((s, t) => s + t.amount, 0);
  const share = personSubtotalShare(personId, items);
  return share * totalTax;
}

export function personFeeShare(
  personId: string,
  fees: { amount: number }[],
  people: { id: string }[]
): number {
  if (people.length === 0) return 0;
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  return Math.round(totalFees / people.length);
}

export function grandTotal(bill: Bill): number {
  const subtotal = billSubtotal(bill.items);
  const totalDiscounts = bill.discounts.reduce((s, d) => s + d.amount, 0);
  const totalTaxes = bill.taxes.reduce((s, t) => s + t.amount, 0);
  const totalFees = bill.fees.reduce((s, f) => s + f.amount, 0);
  return subtotal - totalDiscounts + totalTaxes + totalFees;
}

export function computePerPersonSummary(
  bill: Bill
): PerPersonSummary[] {
  const subtotal = billSubtotal(bill.items);

  let summaries: PerPersonSummary[];

  if (subtotal === 0) {
    // Edge case: no items — everyone owes only their even fee share
    summaries = bill.people.map((p) => ({
      personId: p.id,
      itemsTotal: 0,
      discountShare: 0,
      taxShare: 0,
      feeShare: personFeeShare(p.id, bill.fees, bill.people),
      finalOwed: personFeeShare(p.id, bill.fees, bill.people),
      remainderAbsorbed: 0,
    }));
  } else {
    summaries = bill.people.map((person) => {
      const itemsTotal = personItemsTotal(person.id, bill.items);
      const discountShare = personDiscountShare(
        person.id,
        bill.discounts,
        bill.items
      );
      const taxShare = personTaxShare(person.id, bill.taxes, bill.items);
      const feeShare = personFeeShare(person.id, bill.fees, bill.people);

      const raw =
        itemsTotal - discountShare + taxShare + feeShare;
      const finalOwed = Math.max(0, Math.round(raw));

      return {
        personId: person.id,
        itemsTotal,
        discountShare,
        taxShare,
        feeShare,
        finalOwed,
        remainderAbsorbed: 0,
      };
    });
  }

  // Remainder reconciliation: sum rounded values, apply discrepancy to host
  const sumRounded = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
  const remainder = grandTotal(bill) - sumRounded;

  if (remainder !== 0) {
    const host = bill.people.find((p) => p.isHost);
    const target = host ?? bill.people[0];
    if (target) {
      const targetSummary = summaries.find(
        (s) => s.personId === target.id
      );
      if (targetSummary) {
        const isGrandTotalNegative = grandTotal(bill) < 0;
        targetSummary.finalOwed = isGrandTotalNegative
          ? Math.max(0, targetSummary.finalOwed + remainder)
          : targetSummary.finalOwed + remainder;
        targetSummary.remainderAbsorbed = remainder;
      }
    }
  }

  return summaries;
}
