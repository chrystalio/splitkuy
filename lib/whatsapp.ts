// lib/whatsapp.ts

import type { Bill, PerPersonSummary } from './types';
import { grandTotal, billSubtotal } from './bill-calculator';
import { formatIDR } from './format';

export function buildWhatsAppText(
  bill: Bill,
  summaries: PerPersonSummary[]
): string {
  const gt = grandTotal(bill);

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
  extras.push(`Subtotal ${formatIDR(billSubtotal(bill.items))}`);

  if (bill.discounts.length > 0) {
    const totalDisc = bill.discounts.reduce((s, d) => s + d.amount, 0);
    extras.push(`Discount −${formatIDR(totalDisc)}`);
  }
  if (bill.taxes.length > 0) {
    const totalTax = bill.taxes.reduce((s, t) => s + t.amount, 0);
    extras.push(`Tax ${formatIDR(totalTax)}`);
  }
  if (bill.fees.length > 0) {
    const totalFees = bill.fees.reduce((s, f) => s + f.amount, 0);
    extras.push(`Fees ${formatIDR(totalFees)}`);
  }

  return [
    `🍽️ Split bill — total ${formatIDR(gt)}`,
    '',
    ...parts,
    '',
    extras.join(' · '),
  ].join('\n');
}
