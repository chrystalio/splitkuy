// components/HistorySection.tsx
'use client';

import { useState, useEffect } from 'react';
import type { HistoryEntry } from '@/lib/types';
import { loadHistory, deleteHistoryEntry, clearHistory } from '@/lib/history-storage';
import { useBill } from '@/hooks/useBill';
import { formatIDR } from '@/lib/format';
import { HistoryDetail } from '@/components/HistoryDetail';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

export function HistorySection() {
  const { bill, dispatch } = useBill();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [loadConfirm, setLoadConfirm] = useState<HistoryEntry | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Refresh after mutations
  function refresh() {
    setHistory(loadHistory());
  }

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    refresh();
    setDeleteId(null);
  }

  function handleClearAll() {
    clearHistory();
    refresh();
    setClearOpen(false);
  }

  function handleLoadRequest(entry: HistoryEntry) {
    const hasData =
      bill.people.length > 0 || bill.items.length > 0;
    if (hasData) {
      setLoadConfirm(entry);
    } else {
      doLoad(entry);
    }
  }

  function doLoad(entry: HistoryEntry) {
    dispatch({ type: 'LOAD', payload: entry.bill });
    setLoadConfirm(null);
  }

  if (history.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          History
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setClearOpen(true)}
          className="h-auto px-2 py-1 text-xs text-slate-400 hover:text-red-500"
        >
          Clear all
        </Button>
      </div>

      <Accordion type="multiple" className="rounded-lg border border-slate-200 dark:border-slate-700">
        {history.map((entry) => (
          <AccordionItem key={entry.id} value={entry.id}>
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex flex-1 items-center justify-between pr-2">
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {entry.billLabel}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(entry.savedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}
                    {entry.bill.people.length} people
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                  {formatIDR(entry.grandTotal)}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3">
              <HistoryDetail entry={entry} onLoad={handleLoadRequest} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(entry.id)}
                className="mt-2 h-auto px-2 py-1 text-xs text-slate-400 hover:text-red-500"
              >
                Delete this entry
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Delete single entry confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this bill from history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirm */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all saved bills. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleClearAll}>
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load overwrite confirm */}
      <AlertDialog
        open={loadConfirm !== null}
        onOpenChange={() => setLoadConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current bill?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an active bill with data. Loading from history will
              replace it. Your current bill is auto-saved, so you can always
              reload the page to get it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => loadConfirm && doLoad(loadConfirm)}
            >
              Load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
