// components/ItemRow.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { itemSubtotal } from '@/lib/bill-calculator';
import { formatIDR } from '@/lib/format';
import type { Item } from '@/lib/types';

export function ItemRow({ item }: { item: Item }) {
  const { bill, dispatch } = useBill();
  const [expanded, setExpanded] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState(item.quantity);
  const [editPrice, setEditPrice] = useState(String(item.unitPrice));
  const [editAssignments, setEditAssignments] = useState<
    Record<string, number>
  >(
    Object.fromEntries(item.assignments.map((a) => [a.personId, a.qty]))
  );

  const subtotal = itemSubtotal(item);

  const validPrice =
    Number.isFinite(Number(editPrice)) && Number(editPrice) > 0;
  const saveDisabled = !editName.trim() || !validPrice;

  function setQty(v: number) {
    const allocated = Object.values(editAssignments).reduce((s, n) => s + n, 0);
    setEditQty(Math.max(allocated, v));
  }

  function saveEdits() {
    const unitPrice = parseInt(editPrice, 10);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return;
    if (!editName.trim()) return;

    const liveIds = new Set(bill.people.map((p) => p.id));
    const assignments = Object.entries(editAssignments)
      .filter(([personId, qty]) => qty > 0 && liveIds.has(personId))
      .map(([personId, qty]) => ({ personId, qty }));

    dispatch({
      type: 'UPDATE_ITEM',
      payload: {
        ...item,
        name: editName.trim(),
        unitPrice,
        quantity: Math.max(1, editQty),
        assignments,
      },
    });
    setExpanded(false);
  }

  function deleteItem() {
    dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } });
  }

  function setAssignmentQty(personId: string, qty: number) {
    const allocated = Object.values(editAssignments).reduce((s, v) => s + v, 0);
    const current = editAssignments[personId] ?? 0;
    const delta = qty - current;
    if (allocated + delta > editQty) return;

    const next = { ...editAssignments };
    if (qty === 0) delete next[personId];
    else next[personId] = qty;
    setEditAssignments(next);
  }

  const assignedNames = item.assignments
    .map((a) => {
      const person = bill.people.find((p) => p.id === a.personId);
      return person ? `${person.name} ×${a.qty}` : null;
    })
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {item.name}
          </div>
          <div className="text-xs text-slate-500 truncate">{assignedNames}</div>
        </div>
        <div className="ml-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatIDR(subtotal)}
          </span>
          <span className="text-slate-400">{expanded ? '▾' : '▸'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
          <div className="mb-2 flex gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-[2] text-sm"
            />
            <Input
              value={editPrice}
              onChange={(e) =>
                setEditPrice(e.target.value.replace(/\D/g, ''))
              }
              className="flex-1 text-sm"
            />
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Qty:</span>
            <NumberStepper value={editQty} onChange={setQty} min={1} />
          </div>

          {bill.people.map((person) => {
            const qty = editAssignments[person.id] ?? 0;
            const allocated = Object.values(editAssignments).reduce(
              (s, v) => s + v,
              0
            );
            const canInc = allocated < editQty;
            return (
              <div
                key={person.id}
                className="mb-1 flex items-center justify-between rounded bg-blue-50 px-2 py-1 dark:bg-blue-950"
              >
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {person.name}
                </span>
                <NumberStepper
                  value={qty}
                  onChange={(v) => setAssignmentQty(person.id, v)}
                  min={0}
                  max={editQty}
                  disabled={qty === 0 && !canInc}
                />
              </div>
            );
          })}

          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={saveEdits} disabled={saveDisabled}>
              Save
            </Button>
            <Button size="sm" variant="danger" onClick={deleteItem}>
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
