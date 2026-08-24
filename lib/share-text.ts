// lib/share-text.ts
// Builds the plain-text bill summary for copying to any messaging app.

import type { Bill, Item, PerPersonSummary } from './types';
import { formatIDR } from './format';

/** Raw item subtotal: face value of all items, regardless of assignments. */
function rawItemSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Per-person math components. Combined into a single "Fees & Disc" net line
 * so the chat message stays compact while still explaining why the final
 * differs from the items alone.
 */
interface PersonBreakdown {
  itemsTotal: number;
  feesTotal: number;
  taxTotal: number;
  discountTotal: number; // positive number — display handles the minus sign
}

function buildPersonBreakdown(summary: PerPersonSummary): PersonBreakdown {
  return {
    itemsTotal: Math.round(summary.itemsTotal),
    feesTotal: Math.round(summary.feeShare),
    taxTotal: Math.round(summary.taxShare),
    discountTotal: Math.round(Math.abs(summary.discountShare)),
  };
}

/**
 * Renders one person's section. Example:
 *   👤 Kris (Host)
 *   • Americano J: Rp 32.000
 *   • Fees & Disc: + Rp 6.346
 *   👉 Total to pay: Rp 38.346
 *
 * Returns '' when the person has no items and no extras — nothing meaningful
 * to show, so the section is omitted entirely.
 */
function formatPersonSection(
  person: { id: string; name: string; isHost: boolean },
  finalOwed: number,
  bill: Bill,
  breakdown: PersonBreakdown
): string {
  const itemLines: Array<{ name: string; amount: number }> = bill.items
    .map((item) => {
      const assignment = item.assignments.find((a) => a.personId === person.id);
      if (!assignment) return null;
      return { name: item.name, amount: assignment.qty * item.unitPrice };
    })
    .filter(Boolean) as Array<{ name: string; amount: number }>;

  const netExtras =
    breakdown.feesTotal + breakdown.taxTotal - breakdown.discountTotal;

  // No section when person has no items and no extras.
  if (itemLines.length === 0 && netExtras === 0) return '';

  const lines: string[] = [];
  lines.push(person.isHost ? `👤 ${person.name} (Host)` : `👤 ${person.name}`);
  for (const item of itemLines) {
    lines.push(`• ${item.name}: ${formatIDR(item.amount)}`);
  }
  if (netExtras !== 0) {
    const sign = netExtras > 0 ? '+' : '−';
    // Label changes if there's tax but no fees, so the wording stays honest.
    const label =
      breakdown.feesTotal === 0 && breakdown.taxTotal > 0
        ? 'Tax & Disc'
        : 'Fees & Disc';
    lines.push(`• ${label}: ${sign} ${formatIDR(Math.abs(netExtras))}`);
  }
  lines.push(`👉 Total to pay: ${formatIDR(finalOwed)}`);

  return lines.join('\n');
}

export function buildShareText(
  bill: Bill,
  summaries: PerPersonSummary[]
): string {
  const subtotal = rawItemSubtotal(bill.items);
  const totalDiscounts = bill.discounts.reduce((s, d) => s + d.amount, 0);
  const totalTaxes = bill.taxes.reduce((s, t) => s + t.amount, 0);
  const totalFees = bill.fees.reduce((s, f) => s + f.amount, 0);
  const total = subtotal - totalDiscounts + totalTaxes + totalFees;

  const sections: string[] = [];
  for (const summary of summaries) {
    const person = bill.people.find((p) => p.id === summary.personId);
    if (!person) continue;

    const breakdown = buildPersonBreakdown(summary);
    const section = formatPersonSection(person, summary.finalOwed, bill, breakdown);
    if (section) sections.push(section);
  }

  // Receipt-level extras line, parenthesised with pipes.
  const extrasParts: string[] = [];
  extrasParts.push(`Subtotal: ${formatIDR(subtotal)}`);
  if (totalFees > 0) extrasParts.push(`Fees: ${formatIDR(totalFees)}`);
  if (totalTaxes > 0) extrasParts.push(`Tax: ${formatIDR(totalTaxes)}`);
  if (totalDiscounts > 0) extrasParts.push(`Discount: −${formatIDR(totalDiscounts)}`);

  const lines = [
    `🍽️ Split Bill — Total: ${formatIDR(total)}`,
    `(${extrasParts.join(' | ')})`,
    '',
    ...sections.flatMap((section, i) => (i === 0 ? [section] : ['', section])),
    '',
    '© 2026 SplitKuy | No accounts, no sign-ups, no drama.',
  ];

  return lines.join('\n');
}
