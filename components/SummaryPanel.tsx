// components/SummaryPanel.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { CopyButton } from '@/components/CopyButton';
import { SaveBillDialog } from '@/components/SaveBillDialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { grandTotal } from '@/lib/bill-calculator';
import { formatIDR } from '@/lib/format';
import { buildShareText } from '@/lib/share-text';

export function SummaryPanel() {
  const { bill, summaries, dispatch, saveToHistory } = useBill();
  const gt = grandTotal(bill);
  const copyText = buildShareText(bill, summaries);
  const hasItems = bill.items.length > 0;
  const isEmpty =
    bill.people.length === 0 &&
    bill.items.length === 0 &&
    bill.discounts.length === 0 &&
    bill.taxes.length === 0 &&
    bill.fees.length === 0;
  const [resetOpen, setResetOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  function handleReset() {
    if (isEmpty) return;
    setResetOpen(true);
  }

  function confirmReset() {
    dispatch({ type: 'RESET' });
    setResetOpen(false);
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

      {gt < 0 && (
        <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Discounts exceed subtotal — amounts clamped at Rp 0.
        </div>
      )}

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
        onClick={() => setSaveOpen(true)}
        disabled={!hasItems}
        variant="secondary"
        className="mt-2 w-full"
      >
        Save to history
      </Button>
      <SaveBillDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={saveToHistory}
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
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the entire bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears all people, items, discounts, taxes, and fees. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
