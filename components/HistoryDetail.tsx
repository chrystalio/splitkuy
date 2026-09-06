// components/HistoryDetail.tsx
'use client';

import type { HistoryEntry } from '@/lib/types';
import { formatIDR } from '@/lib/format';
import { Button } from '@/components/ui/button';

interface HistoryDetailProps {
  entry: HistoryEntry;
  onLoad: (entry: HistoryEntry) => void;
}

export function HistoryDetail({ entry, onLoad }: HistoryDetailProps) {
  const { bill, summaries, grandTotal } = entry;

  return (
    <div className="space-y-3">
      {/* Per-person breakdown */}
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
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
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
            {itemsForPerson && (
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {itemsForPerson}
              </div>
            )}
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
          </div>
        );
      })}

      {/* Grand total */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Grand Total
        </span>
        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {formatIDR(grandTotal)}
        </span>
      </div>

      {/* Items list */}
      {bill.items.length > 0 && (
        <div className="text-xs text-slate-400 dark:text-slate-500">
          <div className="font-semibold mb-1">Items:</div>
          {bill.items.map((item) => {
            const assignedPeople = item.assignments
              .map((a) => {
                const p = bill.people.find((pp) => pp.id === a.personId);
                return p ? `${p.name}×${a.qty}` : '?';
              })
              .join(', ');
            return (
              <div key={item.id}>
                {item.name} — {formatIDR(item.unitPrice)} × {item.quantity}
                {assignedPeople && ` (${assignedPeople})`}
              </div>
            );
          })}
        </div>
      )}

      {/* Extras */}
      {(bill.discounts.length > 0 ||
        bill.taxes.length > 0 ||
        bill.fees.length > 0) && (
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {bill.discounts.map((d) => (
            <div key={d.id}>
              Discount: {d.label} −{formatIDR(d.amount)}
            </div>
          ))}
          {bill.taxes.map((t) => (
            <div key={t.id}>
              Tax: {t.label} {formatIDR(t.amount)}
            </div>
          ))}
          {bill.fees.map((f) => (
            <div key={f.id}>
              Fee: {f.label} {formatIDR(f.amount)}
            </div>
          ))}
        </div>
      )}

      {/* Load button */}
      <Button
        type="button"
        onClick={() => onLoad(entry)}
        className="w-full"
      >
        Load into editor
      </Button>
    </div>
  );
}
