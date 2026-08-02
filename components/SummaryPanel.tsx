// components/SummaryPanel.tsx
'use client';

import { useBill } from '@/hooks/useBill';
import { CopyButton } from '@/components/CopyButton';
import { grandTotal } from '@/lib/bill-calculator';
import { formatIDR } from '@/lib/format';

function buildWhatsAppText(
  bill: ReturnType<typeof useBill>['bill'],
  summaries: ReturnType<typeof useBill>['summaries']
): string {
  const gt = grandTotal(bill);
  const host = bill.people.find((p) => p.isHost);

  const parts: string[] = [];

  for (const summary of summaries) {
    const person = bill.people.find((p) => p.id === summary.personId);
    if (!person) continue;

    const itemsForPerson = bill.items
      .filter((item) =>
        item.assignments.some((a) => a.personId === person.id)
      )
      .map((item) => item.name)
      .join(' · ');

    const lines = [`• ${person.name}${person.isHost ? ' (host)' : ''}: ${formatIDR(summary.finalOwed)}`];
    if (itemsForPerson) lines.push(`  ${itemsForPerson}`);

    parts.push(lines.join('\n'));
  }

  const extras: string[] = [];
  const subtotal = bill.items.reduce((s, i) => {
    return (
      s +
      i.assignments.reduce((ss, a) => ss + a.qty * i.unitPrice, 0)
    );
  }, 0);
  extras.push(`Subtotal ${formatIDR(subtotal)}`);

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

export function SummaryPanel() {
  const { bill, summaries } = useBill();
  const gt = grandTotal(bill);
  const copyText = buildWhatsAppText(bill, summaries);
  const hasItems = bill.items.length > 0;

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Summary
        </h2>
        <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {formatIDR(gt)}
        </span>
      </div>

      {summaries.map((summary) => {
        const person = bill.people.find((p) => p.id === summary.personId);
        if (!person) return null;

        const itemsForPerson = bill.items
          .filter((item) =>
            item.assignments.some((a) => a.personId === person.id)
          )
          .map((item) => item.name)
          .join(' · ');

        return (
          <div
            key={person.id}
            className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={`text-sm font-semibold ${
                  person.isHost ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {person.name}
                {person.isHost && ' (host)'}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatIDR(summary.finalOwed)}
              </span>
            </div>
            <div className="text-xs text-slate-500">{itemsForPerson}</div>
            {summary.remainderAbsorbed !== 0 && (
              <div className="mt-1 text-xs text-red-500">
                *Host absorbs {Math.abs(summary.remainderAbsorbed)} stray
                Rupiahs
              </div>
            )}
          </div>
        );
      })}

      <CopyButton
        text={copyText}
        label="Copy summary → WhatsApp"
        disabled={!hasItems}
      />
    </section>
  );
}
