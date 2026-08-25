// components/ItemRow.tsx
'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useBill } from '@/hooks/useBill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      {/* Header row — not a button anymore. Edit affordance is the explicit
          "Edit" button on the right so it's discoverable. */}
      <div className="flex w-full items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {item.name}
          </div>
          <div className="text-xs text-slate-500 truncate">{assignedNames || 'No one assigned'}</div>
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
          {formatIDR(subtotal)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? `Cancel editing ${item.name}` : `Edit ${item.name}`}
          className="shrink-0 gap-1.5 text-slate-600 dark:text-slate-300"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          <span>{expanded ? 'Cancel' : 'Edit'}</span>
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
          <div className="mb-2 flex gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Item name"
              className="flex-[2] text-sm"
              aria-label="Item name"
            />
            <Input
              value={editPrice}
              onChange={(e) =>
                setEditPrice(e.target.value.replace(/\D/g, ''))
              }
              placeholder="Price"
              inputMode="numeric"
              className="flex-1 text-sm"
              aria-label="Unit price (IDR)"
            />
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Qty:</span>
            <NumberStepper value={editQty} onChange={setQty} min={1} />
          </div>

          {bill.people.length === 0 ? (
            <p className="mb-2 text-xs text-slate-400 italic">
              Add a person to assign this item.
            </p>
          ) : (
            bill.people.map((person) => {
              const qty = editAssignments[person.id] ?? 0;
              const allocated = Object.values(editAssignments).reduce(
                (s, v) => s + v,
                0
              );
              const canInc = allocated < editQty;
              return (
                <div
                  key={person.id}
                  className="mb-1 flex items-center justify-between rounded bg-slate-50 px-2 py-1 dark:bg-slate-800"
                >
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
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
            })
          )}

          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={saveEdits} disabled={saveDisabled}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteItem}
              className="ml-auto gap-1.5"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
