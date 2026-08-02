// components/ExtrasSection.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { Accordion } from '@/components/ui/Accordion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatIDR } from '@/lib/format';

function ExtraRow({
  label,
  amount,
  onRemove,
  negative = false,
}: {
  label: string;
  amount: number;
  onRemove: () => void;
  negative?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Input value={label} readOnly className="flex-1 text-sm" />
      <Input
        value={(negative ? '−' : '') + formatIDR(amount)}
        readOnly
        className="w-24 text-sm text-right"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 text-sm"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </div>
  );
}

function EditableExtraCard({
  title,
  items,
  onAdd,
  onRemove,
  negative = false,
}: {
  title: string;
  items: { id: string; label: string; amount: number }[];
  onAdd: (label: string, amount: number) => void;
  onRemove: (id: string) => void;
  negative?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  function submit() {
    if (!newLabel.trim() || !newAmount) return;
    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onAdd(newLabel.trim(), amount);
    setNewLabel('');
    setNewAmount('');
    setAdding(false);
  }

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Accordion
      title={
        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
          {title}
        </span>
      }
      summary={
        items.length > 0 ? (
          <span className="text-sm font-semibold">{formatIDR(total)}</span>
        ) : undefined
      }
    >
      {items.length === 0 && !adding && (
        <p className="text-xs text-slate-400 mb-2">No {title.toLowerCase()} yet</p>
      )}

      {items.map((item) => (
        <ExtraRow
          key={item.id}
          label={item.label}
          amount={item.amount}
          onRemove={() => onRemove(item.id)}
          negative={negative}
        />
      ))}

      {adding ? (
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') setAdding(false);
            }}
            className="flex-1 text-sm"
          />
          <Input
            placeholder="Rp"
            inputMode="numeric"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') setAdding(false);
            }}
            aria-label="Amount in IDR"
            className="w-24 text-sm"
          />
          <Button size="sm" onClick={submit}>
            ✓
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            ×
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mt-1"
        >
          + add {title.toLowerCase()}
        </button>
      )}
    </Accordion>
  );
}

export function ExtrasSection() {
  const { bill, dispatch } = useBill();

  return (
    <section className="mb-4 space-y-2">
      <EditableExtraCard
        title="Discounts"
        items={bill.discounts}
        onAdd={(label, amount) =>
          dispatch({ type: 'ADD_DISCOUNT', payload: { label, amount } })
        }
        onRemove={(id) =>
          dispatch({ type: 'REMOVE_DISCOUNT', payload: { id } })
        }
        negative
      />
      <EditableExtraCard
        title="Taxes"
        items={bill.taxes}
        onAdd={(label, amount) =>
          dispatch({ type: 'ADD_TAX', payload: { label, amount } })
        }
        onRemove={(id) =>
          dispatch({ type: 'REMOVE_TAX', payload: { id } })
        }
      />
      <EditableExtraCard
        title="Fees"
        items={bill.fees}
        onAdd={(label, amount) =>
          dispatch({ type: 'ADD_FEE', payload: { label, amount } })
        }
        onRemove={(id) =>
          dispatch({ type: 'REMOVE_FEE', payload: { id } })
        }
      />
    </section>
  );
}
