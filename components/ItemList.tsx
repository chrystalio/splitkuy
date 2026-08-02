// components/ItemList.tsx
'use client';

import { useBill } from '@/hooks/useBill';
import { ItemRow } from './ItemRow';
import { InlineAddRow } from './InlineAddRow';
import { billSubtotal } from '@/lib/bill-calculator';
import { formatIDR } from '@/lib/format';

export function ItemList() {
  const { bill } = useBill();
  const subtotal = billSubtotal(bill.items);

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Items
        </h2>
        {bill.items.length > 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatIDR(subtotal)}
          </span>
        )}
      </div>

      {bill.items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}

      {bill.people.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:bg-slate-900 dark:border-slate-700">
          Add people first to start adding items
        </p>
      )}

      {bill.people.length > 0 && <InlineAddRow />}
    </section>
  );
}
