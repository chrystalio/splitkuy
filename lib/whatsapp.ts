// lib/whatsapp.ts

import type { Bill, Item, PerPersonSummary } from './types';
import { formatIDR } from './format';

/** Raw item subtotal: face value of all items, regardless of assignments. */
function rawItemSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function buildWhatsAppText(
  bill: Bill,
  summaries: PerPersonSummary[]
): string {
  const subtotal = rawItemSubtotal(bill.items);
  const totalDiscounts = bill.discounts.reduce((s, d) => s + d.amount, 0);
  const totalTaxes = bill.taxes.reduce((s, t) => s + t.amount, 0);
  const totalFees = bill.fees.reduce((s, f) => s + f.amount, 0);
  const total = subtotal - totalDiscounts + totalTaxes + totalFees;

  const parts: string[] = [];

  for (const summary of summaries) {
    const person = bill.people.find((p) => p.id === summary.personId);
    if (!person) continue;

    const itemsForPerson = bill.items
      .map((item) => {
        const assignment = item.assignments.find(
          (a) => a.personId === person.id
        );
        if (!assignment) return null;
        const amount = assignment.qty * item.unitPrice;
        return `${item.name} ${formatIDR(amount)}`;
      })
      .filter(Boolean)
      .join(' · ');

    const lines = [
      `• ${person.name}${person.isHost ? ' (host)' : ''}: ${formatIDR(summary.finalOwed)}`,
    ];
    if (itemsForPerson) lines.push(`  ${itemsForPerson}`);

    parts.push(lines.join('\n'));
  }

  const extras: string[] = [];
  extras.push(`Subtotal ${formatIDR(subtotal)}`);

  if (bill.discounts.length > 0) {
    extras.push(`Discount −${formatIDR(totalDiscounts)}`);
  }
  if (bill.taxes.length > 0) {
    extras.push(`Tax ${formatIDR(totalTaxes)}`);
  }
  if (bill.fees.length > 0) {
    extras.push(`Fees ${formatIDR(totalFees)}`);
  }

  return [
    `🍽️ Split bill — total ${formatIDR(total)}`,
    '',
    ...parts,
    '',
    extras.join(' · '),
  ].join('\n');
}
