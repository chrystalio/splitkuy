// components/InlineAddRow.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { NumberStepper } from '@/components/ui/NumberStepper';

export function InlineAddRow() {
  const { bill, dispatch } = useBill();
  const [expanded, setExpanded] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  // personId -> qty
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  function toggleExpanded() {
    setExpanded(!expanded);
    if (expanded) {
      // Reset form on close
      setName('');
      setUnitPrice('');
      setQuantity(1);
      setAssignments({});
    }
  }

  function setQty(personId: string, qty: number) {
    // cap at remaining unallocated units
    const allocated = Object.values(assignments).reduce((s, v) => s + v, 0);
    const current = assignments[personId] ?? 0;
    const delta = qty - current;
    if (allocated + delta > quantity) return; // would exceed cap

    if (qty === 0) {
      const next = { ...assignments };
      delete next[personId];
      setAssignments(next);
    } else {
      setAssignments({ ...assignments, [personId]: qty });
    }
  }

  const allocated = Object.values(assignments).reduce((s, v) => s + v, 0);
  const canAdd =
    name.trim() && unitPrice && allocated >= 1 && allocated <= quantity;

  function addItem() {
    if (!canAdd) return;
    const itemAssignments = Object.entries(assignments).map(
      ([personId, qty]) => ({ personId, qty })
    );
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        name: name.trim(),
        unitPrice: parseInt(unitPrice, 10),
        quantity,
        assignments: itemAssignments,
      },
    });
    setName('');
    setUnitPrice('');
    setQuantity(1);
    setAssignments({});
    setExpanded(false);
  }

  return (
    <div className="mb-4">
      {!expanded ? (
        <button
          type="button"
          onClick={toggleExpanded}
          className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-100 transition-colors dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400"
        >
          + tap to add item
        </button>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700">
          <div className="mb-3 flex gap-2">
            <Input
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-[2]"
              autoFocus
            />
            <Input
              placeholder="Unit Rp"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value.replace(/\D/g, ''))}
              className="flex-1"
            />
          </div>

          <div className="mb-3">
            <div className="mb-1 text-xs text-slate-500 uppercase tracking-wide">
              How many? (total cap)
            </div>
            <NumberStepper
              value={quantity}
              onChange={setQuantity}
              min={1}
            />
            <div className="mt-1 text-xs text-slate-400">
              {quantity} units total
            </div>
          </div>

          {bill.people.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs text-slate-500 uppercase tracking-wide">
                Who? (sum ≤ {quantity})
              </div>
              <div className="space-y-1">
                {bill.people.map((person) => {
                  const qty = assignments[person.id] ?? 0;
                  const canIncrement =
                    Object.values(assignments).reduce((s, v) => s + v, 0) <
                    quantity;
                  return (
                    <div
                      key={person.id}
                      className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-1.5 dark:bg-blue-950"
                    >
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {person.name}
                      </span>
                      <NumberStepper
                        value={qty}
                        onChange={(v) => setQty(person.id, v)}
                        min={0}
                        max={quantity}
                        disabled={qty === 0 && !canIncrement}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Allocated: {allocated} / {quantity} units
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={addItem}
              disabled={!canAdd}
              className="flex-1"
            >
              Add item
            </Button>
            <Button variant="ghost" onClick={toggleExpanded}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
