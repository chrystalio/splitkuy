// components/SummaryPanel.tsx
'use client';

import { useBill } from '@/hooks/useBill';
import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { grandTotal, billSubtotal } from '@/lib/bill-calculator';
import { formatIDR } from '@/lib/format';

function buildWhatsAppText(
  bill: ReturnType<typeof useBill>['bill'],
  summaries: ReturnType<typeof useBill>['summaries']
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

export function SummaryPanel() {
  const { bill, summaries, dispatch } = useBill();
  const gt = grandTotal(bill);
  const copyText = buildWhatsAppText(bill, summaries);
  const hasItems = bill.items.length > 0;
  const isEmpty =
    bill.people.length === 0 &&
    bill.items.length === 0 &&
    bill.discounts.length === 0 &&
    bill.taxes.length === 0 &&
    bill.fees.length === 0;

  function handleReset() {
    if (isEmpty) return;
    const ok = window.confirm('Clear the entire bill? This cannot be undone.');
    if (ok) dispatch({ type: 'RESET' });
  }

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {person.name}
                {person.isHost && (
                  <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">
                    {' · host'}
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatIDR(summary.finalOwed)}
              </span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{itemsForPerson}</div>
            <div className="mt-1 space-y-0.5 text-xs text-slate-400 dark:text-slate-500">
              <div>Items: {formatIDR(summary.itemsTotal)}</div>
              {summary.discountShare !== 0 && (
                <div>
                  Discounts: −
                  {formatIDR(Math.round(Math.abs(summary.discountShare)))}
                </div>
              )}
              {summary.taxShare !== 0 && (
                <div>Tax: {formatIDR(Math.round(summary.taxShare))}</div>
              )}
              {summary.feeShare !== 0 && (
                <div>Fees: {formatIDR(Math.round(summary.feeShare))}</div>
              )}
            </div>
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
        label="Copy summary"
        disabled={!hasItems}
      />
      <Button
        type="button"
        onClick={handleReset}
        disabled={isEmpty}
        variant="secondary"
        className="mt-4 w-full text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
      >
        Reset bill
      </Button>
    </section>
  );
}
