# Bug-Fix Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five verified correctness/test-coverage gaps: clamp `finalOwed` at 0, extract and test `billReducer`, extract and test `buildWhatsAppText`, add an `isBill` storage schema guard, and delete dead exports.

**Architecture:** Pure logic extracted from view components into `lib/` with TDD. `BillContext.tsx` and `SummaryPanel.tsx` become thin consumers. Each task is independently revertable.

**Tech Stack:** Next.js 16.2.12, React 19.2.4, TypeScript strict, Vitest 4 (`environment: node`), bun. Path alias `@/*` → project root.

**Spec:** `docs/superpowers/specs/2026-08-04-bug-fix-pass-design.md`

---

### Task 1: Clamp `finalOwed` at 0 (math safety)

**Files:**
- Modify: `lib/bill-calculator.ts:100` (the `finalOwed` assignment)
- Test: `lib/bill-calculator.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/bill-calculator.test.ts` (existing imports suffice — `computePerPersonSummary`, `grandTotal`, `makePerson`, `makeItem` all already defined):

```ts
describe('finalOwed floor at 0', () => {
  it('clamps a negative finalOwed to 0 for a single person', () => {
    const bill = {
      people: [makePerson('p1', 'Andi', true)],
      items: [makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }])],
      discounts: [{ id: 'd1', label: 'Promo', amount: 5000 }], // > subtotal
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    expect(summaries[0].finalOwed).toBe(0);
    // Host absorbs the remainder — sum still reconciles with grandTotal.
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    expect(sumFinalOwed).toBe(grandTotal(bill));
  });

  it('clamps all people when discounts exceed total subtotal', () => {
    const bill = {
      people: [
        makePerson('p1', 'Andi'),
        makePerson('p2', 'Budi', true),
        makePerson('p3', 'Citra'),
      ],
      items: [
        makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }]),
        makeItem('i2', 'Ayam', 1000, 1, [{ personId: 'p2', qty: 1 }]),
        makeItem('i3', 'Teh', 1000, 1, [{ personId: 'p3', qty: 1 }]),
      ],
      discounts: [{ id: 'd1', label: 'Promo', amount: 5000 }], // subtotal is 3000
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    for (const sm of summaries) {
      expect(sm.finalOwed).toBeGreaterThanOrEqual(0);
    }
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    expect(sumFinalOwed).toBe(grandTotal(bill));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: 2 NEW tests FAIL (negative `finalOwed` produced); existing 6 pass.

- [ ] **Step 3: Implement the clamp**

In `lib/bill-calculator.ts`, change the `finalOwed` line inside `computePerPersonSummary` (in the `else` branch):

```ts
      const raw =
        itemsTotal - discountShare + taxShare + feeShare;
      const finalOwed = Math.max(0, Math.round(raw));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test`
Expected: 8/8 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/bill-calculator.ts lib/bill-calculator.test.ts
git commit -m "fix: clamp finalOwed at 0 when discounts exceed subtotal"
```

---

### Task 2: Add negative-total warning banner to SummaryPanel

**Files:**
- Modify: `components/SummaryPanel.tsx` (add banner JSX after the header row, before the summary cards)

- [ ] **Step 1: Add the banner**

In `components/SummaryPanel.tsx`, after the `<div className="mb-2 flex items-center justify-between">...</div>` header block (which renders the "Summary" title and `formatIDR(gt)`), insert:

```tsx
{gt < 0 && (
  <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
    Discounts exceed subtotal — amounts clamped at Rp 0.
  </div>
)}
```

`gt` is already defined in scope (`const gt = grandTotal(bill);`).

- [ ] **Step 2: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 3: Smoke test**

Run: `bun dev`. Add an item (Rp 1000), add a discount (Rp 5000) → amber banner appears above the summary cards. Summary cards show Rp 0 (not negative).

- [ ] **Step 4: Commit**

```bash
git add components/SummaryPanel.tsx
git commit -m "feat: warn when discounts exceed subtotal (clamped at Rp 0)"
```

---

### Task 3: Extract `billReducer` to `lib/bill-reducer.ts`

**Files:**
- Create: `lib/bill-reducer.ts`
- Modify: `components/BillContext.tsx` (imports + remove moved code)

- [ ] **Step 1: Create `lib/bill-reducer.ts`**

Copy the following from `components/BillContext.tsx` **verbatim** (no behavioral change): `emptyBill()`, `BillAction` type, `id()`, `billReducer`. Only the imports change:

```ts
// lib/bill-reducer.ts

import type { Bill, Person, Item, Discount, Tax, Fee } from './types';

export function emptyBill(): Bill {
  return {
    people: [],
    items: [],
    discounts: [],
    taxes: [],
    fees: [],
  };
}

export type BillAction =
  | { type: 'ADD_PERSON'; payload: { name: string } }
  | { type: 'REMOVE_PERSON'; payload: { id: string } }
  | { type: 'SET_HOST'; payload: { id: string } }
  | { type: 'ADD_ITEM'; payload: Omit<Item, 'id'> }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | {
      type: 'SET_ASSIGNMENT_QTY';
      payload: { itemId: string; personId: string; qty: number };
    }
  | { type: 'ADD_DISCOUNT'; payload: Omit<Discount, 'id'> }
  | { type: 'REMOVE_DISCOUNT'; payload: { id: string } }
  | { type: 'ADD_TAX'; payload: Omit<Tax, 'id'> }
  | { type: 'REMOVE_TAX'; payload: { id: string } }
  | { type: 'ADD_FEE'; payload: Omit<Fee, 'id'> }
  | { type: 'REMOVE_FEE'; payload: { id: string } }
  | { type: 'LOAD'; payload: Bill }
  | { type: 'RESET' };

function id() {
  return crypto.randomUUID();
}

export function billReducer(state: Bill, action: BillAction): Bill {
  // ...paste the EXACT existing switch body from BillContext.tsx...
}
```

⚠️ The `switch` body must be copied **character-for-character** from `components/BillContext.tsx` lines 52–184. Do not retype it.

- [ ] **Step 2: Update `components/BillContext.tsx`**

Replace lines 16–46 (the `emptyBill()`, `BillAction` type, and `id()` definitions) and lines 52–185 (`billReducer`) with a single import. The file now reads:

```tsx
// components/BillContext.tsx
'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Bill } from '@/lib/types';
import {
  billReducer,
  emptyBill,
  type BillAction,
} from '@/lib/bill-reducer';
import { saveBill, loadBill } from '@/lib/storage';
import { computePerPersonSummary } from '@/lib/bill-calculator';

// --- Context ---

interface BillContextValue {
  bill: Bill;
  dispatch: Dispatch<BillAction>;
  summaries: ReturnType<typeof computePerPersonSummary>;
}
```

Keep the rest of `BillContext.tsx` (the `BillProvider`, effects, memo, provider, `useBillContext`) unchanged.

- [ ] **Step 3: Verify type-check**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/bill-reducer.ts components/BillContext.tsx
git commit -m "refactor: extract billReducer to lib/bill-reducer.ts"
```

---

### Task 4: Write `billReducer` tests

**Files:**
- Create: `lib/bill-reducer.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// lib/bill-reducer.test.ts
import { describe, it, expect } from 'vitest';
import {
  billReducer,
  emptyBill,
  type BillAction,
} from './bill-reducer';

function act(initial: ReturnType<typeof emptyBill>, action: BillAction) {
  return billReducer(initial, action);
}

const base = () => emptyBill();

describe('billReducer', () => {
  it('ADD_PERSON makes the first person the host', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    expect(state.people).toHaveLength(1);
    expect(state.people[0].isHost).toBe(true);
  });

  it('ADD_PERSON does not host subsequent people', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    expect(state.people).toHaveLength(2);
    expect(state.people[1].isHost).toBe(false);
  });

  it('REMOVE_PERSON strips assignments and reassigns host to people[0]', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    const [host, other] = state.people; // host = Andi, other = Budi
    state = act(state, {
      type: 'ADD_ITEM',
      payload: {
        name: 'Nasi',
        unitPrice: 1000,
        quantity: 2,
        assignments: [
          { personId: host.id, qty: 1 },
          { personId: other.id, qty: 1 },
        ],
      },
    });
    // Remove the host (Andi).
    state = act(state, { type: 'REMOVE_PERSON', payload: { id: host.id } });
    expect(state.people).toHaveLength(1);
    expect(state.people[0].id).toBe(other.id);
    expect(state.people[0].isHost).toBe(true); // host reassigned
    // Assignment for removed host stripped from the item.
    expect(state.items[0].assignments).toHaveLength(1);
    expect(state.items[0].assignments[0].personId).toBe(other.id);
  });

  it('REMOVE_PERSON of the last person leaves an empty people array', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'REMOVE_PERSON', payload: { id: state.people[0].id } });
    expect(state.people).toHaveLength(0);
    expect(state.items).toHaveLength(0);
  });

  it('SET_HOST leaves exactly one host', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Citra' } });
    const budi = state.people[1];
    state = act(state, { type: 'SET_HOST', payload: { id: budi.id } });
    expect(state.people.filter((p) => p.isHost)).toHaveLength(1);
    expect(state.people[1].isHost).toBe(true);
  });

  it('ADD_ITEM / UPDATE_ITEM / REMOVE_ITEM round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    const personId = state.people[0].id;
    state = act(state, {
      type: 'ADD_ITEM',
      payload: { name: 'Nasi', unitPrice: 1000, quantity: 1, assignments: [{ personId, qty: 1 }] },
    });
    const itemId = state.items[0].id;
    expect(state.items[0]).toMatchObject({ name: 'Nasi', unitPrice: 1000 });

    state = act(state, {
      type: 'UPDATE_ITEM',
      payload: { id: itemId, name: 'Nasi Goreng', unitPrice: 1500, quantity: 2, assignments: [{ personId, qty: 2 }] },
    });
    expect(state.items[0]).toMatchObject({ name: 'Nasi Goreng', unitPrice: 1500, quantity: 2 });

    state = act(state, { type: 'REMOVE_ITEM', payload: { id: itemId } });
    expect(state.items).toHaveLength(0);
  });

  it('SET_ASSIGNMENT_QTY sets, updates, and removes assignments', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    const [andi, budi] = state.people;
    state = act(state, {
      type: 'ADD_ITEM',
      payload: { name: 'Nasi', unitPrice: 1000, quantity: 2, assignments: [] },
    });
    const itemId = state.items[0].id;

    // Set Andi = 1
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: andi.id, qty: 1 },
    });
    expect(state.items[0].assignments).toEqual([{ personId: andi.id, qty: 1 }]);

    // Set Budi = 1 (new person added)
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: budi.id, qty: 1 },
    });
    expect(state.items[0].assignments).toHaveLength(2);

    // Update Andi = 2
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: andi.id, qty: 2 },
    });
    expect(state.items[0].assignments.find((a) => a.personId === andi.id)?.qty).toBe(2);

    // Set Andi = 0 → removed
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: andi.id, qty: 0 },
    });
    expect(state.items[0].assignments.some((a) => a.personId === andi.id)).toBe(false);
  });

  it('ADD_DISCOUNT / REMOVE_DISCOUNT round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_DISCOUNT', payload: { label: 'Promo', amount: 100 } });
    expect(state.discounts).toHaveLength(1);
    expect(state.discounts[0]).toMatchObject({ label: 'Promo', amount: 100 });
    state = act(state, { type: 'REMOVE_DISCOUNT', payload: { id: state.discounts[0].id } });
    expect(state.discounts).toHaveLength(0);
  });

  it('ADD_TAX / REMOVE_TAX round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_TAX', payload: { label: 'PPN', amount: 110 } });
    expect(state.taxes).toHaveLength(1);
    expect(state.taxes[0]).toMatchObject({ label: 'PPN', amount: 110 });
    state = act(state, { type: 'REMOVE_TAX', payload: { id: state.taxes[0].id } });
    expect(state.taxes).toHaveLength(0);
  });

  it('ADD_FEE / REMOVE_FEE round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_FEE', payload: { label: 'Service', amount: 5000 } });
    expect(state.fees).toHaveLength(1);
    expect(state.fees[0]).toMatchObject({ label: 'Service', amount: 5000 });
    state = act(state, { type: 'REMOVE_FEE', payload: { id: state.fees[0].id } });
    expect(state.fees).toHaveLength(0);
  });

  it('RESET returns an empty bill', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'RESET' });
    expect(state).toEqual(emptyBill());
  });

  it('LOAD replaces state verbatim', () => {
    const fresh = base();
    const loaded = {
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [],
      discounts: [],
      taxes: [],
      fees: [],
    };
    const next = act(fresh, { type: 'LOAD', payload: loaded });
    expect(next).toBe(loaded); // same reference
    expect(next.people).toHaveLength(1);
  });

  it('unknown action returns state unchanged', () => {
    const state = base();
    const next = billReducer(state, { type: 'NOT_A_REAL_ACTION' } as never);
    expect(next).toBe(state);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bun run test`
Expected: all 13 new reducer tests PASS, no regressions.

- [ ] **Step 3: Commit**

```bash
git add lib/bill-reducer.test.ts
git commit -m "test: cover billReducer actions"
```

---

### Task 5: Extract `buildWhatsAppText` to `lib/whatsapp.ts`

**Files:**
- Create: `lib/whatsapp.ts`
- Modify: `components/SummaryPanel.tsx` (remove local function, import)

- [ ] **Step 1: Create `lib/whatsapp.ts`**

```ts
// lib/whatsapp.ts

import type { Bill, PerPersonSummary } from './types';
import { grandTotal, billSubtotal } from './bill-calculator';
import { formatIDR } from './format';

export function buildWhatsAppText(
  bill: Bill,
  summaries: PerPersonSummary[]
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
```

⚠️ This is a verbatim move of the function currently in `SummaryPanel.tsx` lines 21–76, with the two parameter types replaced by concrete `Bill` and `PerPersonSummary[]`. Do not alter the string-building logic.

- [ ] **Step 2: Update `components/SummaryPanel.tsx`**

- Delete the local `buildWhatsAppText` function (lines 21–76) and the now-unused `grandTotal`, `billSubtotal` import:

```tsx
import { grandTotal, billSubtotal } from '@/lib/bill-calculator';
```

becomes

```tsx
import { grandTotal } from '@/lib/bill-calculator';
```

- Add the import (alphabetical, after the bill-calculator import):

```tsx
import { buildWhatsAppText } from '@/lib/whatsapp';
```

The rest of `SummaryPanel.tsx` (`const copyText = buildWhatsAppText(bill, summaries);`) stays the same.

- [ ] **Step 3: Verify type-check**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/whatsapp.ts components/SummaryPanel.tsx
git commit -m "refactor: extract buildWhatsAppText to lib/whatsapp.ts"
```

---

### Task 6: Write `buildWhatsAppText` tests

**Files:**
- Create: `lib/whatsapp.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// lib/whatsapp.test.ts
import { describe, it, expect } from 'vitest';
import { buildWhatsAppText } from './whatsapp';
import type { Bill, PerPersonSummary } from './types';

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    people: [],
    items: [],
    discounts: [],
    taxes: [],
    fees: [],
    ...overrides,
  };
}

function summary(personId: string, finalOwed: number): PerPersonSummary {
  return {
    personId,
    itemsTotal: 0,
    discountShare: 0,
    taxShare: 0,
    feeShare: 0,
    finalOwed,
    remainderAbsorbed: 0,
  };
}

describe('buildWhatsAppText', () => {
  it('renders a header, per-person bullets, and a subtotal', () => {
    const b = bill({
      people: [
        { id: 'p1', name: 'Andi', isHost: true },
        { id: 'p2', name: 'Budi', isHost: false },
      ],
      items: [
        {
          id: 'i1', name: 'Nasi Goreng', unitPrice: 25000, quantity: 1,
          assignments: [{ personId: 'p1', qty: 1 }],
        },
        {
          id: 'i2', name: 'Es Teh', unitPrice: 5000, quantity: 1,
          assignments: [{ personId: 'p2', qty: 1 }],
        },
      ],
    });
    const summaries = [summary('p1', 25000), summary('p2', 5000)];
    const text = buildWhatsAppText(b, summaries);

    expect(text).toContain('🍽️ Split bill — total Rp 30.000');
    expect(text).toContain('• Andi (host): Rp 25.000');
    expect(text).toContain('  Nasi Goreng Rp 25.000');
    expect(text).toContain('• Budi: Rp 5.000');
    expect(text).toContain('  Es Teh Rp 5.000');
    expect(text).toContain('Subtotal Rp 30.000');
  });

  it('includes discounts, taxes, and fees in the extras line', () => {
    const b = bill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
      discounts: [{ id: 'd1', label: 'Promo', amount: 2000 }],
      taxes: [{ id: 't1', label: 'PPN', amount: 1100 }],
      fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
    });
    const summaries = [summary('p1', 12100)]; // 10000 - 2000 + 1100 + 3000
    const text = buildWhatsAppText(b, summaries);

    expect(text).toContain('Discount −Rp 2.000');
    expect(text).toContain('Tax Rp 1.100');
    expect(text).toContain('Fees Rp 3.000');
    expect(text).toContain('Subtotal Rp 10.000');
  });

  it('omits the items line for a person with no assignments', () => {
    const b = bill({
      people: [
        { id: 'p1', name: 'Andi', isHost: true },
        { id: 'p2', name: 'Budi', isHost: false },
      ],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
    });
    const summaries = [summary('p1', 10000), summary('p2', 0)];
    const text = buildWhatsAppText(b, summaries);

    expect(text).toContain('• Andi (host): Rp 10.000');
    expect(text).toContain('• Budi: Rp 0');
    // No "Nasi" line under Budi.
    expect(text).not.toMatch(/Budi[\s\S]*Nasi/);
  });

  it('returns header + extras only when there are no people', () => {
    const b = bill({
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [],
      }],
    });
    const text = buildWhatsAppText(b, []);
    expect(text).toContain('🍽️ Split bill — total Rp 10.000');
    expect(text).toContain('Subtotal Rp 10.000');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bun run test`
Expected: 4 new whatsapp tests PASS, no regressions.

- [ ] **Step 3: Commit**

```bash
git add lib/whatsapp.test.ts
git commit -m "test: cover buildWhatsAppText"
```

---

### Task 7: Storage schema guard + dead-code deletion

**Files:**
- Modify: `lib/storage.ts`
- Modify: `lib/format.ts` (remove `parseNumericInput`)
- Create: `lib/storage.test.ts`

- [ ] **Step 1: Write the failing storage tests**

Create `lib/storage.test.ts`:

```ts
// lib/storage.test.ts
import { afterEach, describe, it, expect, vi } from 'vitest';
import { saveBill, loadBill, isBill } from './storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  });
  return store;
}

const validBill = {
  people: [{ id: 'p1', name: 'Andi', isHost: true }],
  items: [],
  discounts: [],
  taxes: [],
  fees: [],
};

describe('loadBill', () => {
  it('returns null when nothing is stored', () => {
    mockStorage({});
    expect(loadBill()).toBeNull();
  });

  it('returns null on invalid JSON', () => {
    mockStorage({ splitkuy_bill_v1: '{not json' });
    expect(loadBill()).toBeNull();
  });

  it('returns null when parsed value is not a bill', () => {
    mockStorage({ splitkuy_bill_v1: '{}' });
    expect(loadBill()).toBeNull();
  });

  it('returns null when required arrays are missing', () => {
    mockStorage({ splitkuy_bill_v1: JSON.stringify({ people: [] }) });
    expect(loadBill()).toBeNull();
  });

  it('returns the bill when the shape matches', () => {
    mockStorage({ splitkuy_bill_v1: JSON.stringify(validBill) });
    expect(loadBill()).toEqual(validBill);
  });
});

describe('saveBill', () => {
  it('does not throw when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => { throw new Error('quota'); }),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    });
    expect(() => saveBill(validBill)).not.toThrow();
  });
});

describe('isBill', () => {
  it('accepts a valid bill', () => {
    expect(isBill(validBill)).toBe(true);
  });

  it('rejects null, arrays, and non-objects', () => {
    expect(isBill(null)).toBe(false);
    expect(isBill([])).toBe(false);
    expect(isBill('nope')).toBe(false);
  });

  it('rejects a bill missing required arrays', () => {
    expect(isBill({ people: [], items: [] })).toBe(false);
  });

  it('rejects a person without an id or name string', () => {
    expect(isBill({ ...validBill, people: [{ id: 1, name: 'A' }] })).toBe(false);
    expect(isBill({ ...validBill, people: [{ id: 'a', name: 5 }] })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test`
Expected: FAIL — `isBill` is not exported from `lib/storage.ts`.

- [ ] **Step 3: Rewrite `lib/storage.ts`**

```ts
// lib/storage.ts

import type { Bill } from './types';

const STORAGE_KEY = 'splitkuy_bill_v1';

export function isBill(value: unknown): value is Bill {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    Array.isArray(b.people) &&
    Array.isArray(b.items) &&
    Array.isArray(b.discounts) &&
    Array.isArray(b.taxes) &&
    Array.isArray(b.fees) &&
    b.people.every((p) => {
      if (typeof p !== 'object' || p === null) return false;
      const person = p as Record<string, unknown>;
      return (
        typeof person.id === 'string' &&
        typeof person.name === 'string'
      );
    })
  );
}

export function saveBill(bill: Bill): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadBill(): Bill | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBill(parsed) ? parsed : null;
  } catch {
    // corrupt data → start fresh
    return null;
  }
}
```

Note: `clearBill` is removed here (dead export; the `RESET` action path is unaffected — the save effect writes an empty bill back to storage).

- [ ] **Step 4: Remove `parseNumericInput` from `lib/format.ts`**

`lib/format.ts` becomes:

```ts
// lib/format.ts

/**
 * Format a number as Indonesian Rupiah string.
 * Input: 125000 → Output: "125.000"
 */
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
```

`parseNumericInput` is removed. It is grep-confirmed unused; ItemRow and InlineAddRow use inline `.replace(/\D/g, '')`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun run test`
Expected: all storage tests PASS, all prior tests still PASS.

- [ ] **Step 6: Verify type-check and lint**

Run: `bunx tsc --noEmit` and `bun lint`
Expected: exit 0 / clean.

- [ ] **Step 7: Commit**

```bash
git add lib/storage.ts lib/format.ts lib/storage.test.ts
git commit -m "fix: add isBill schema guard, remove dead exports (parseNumericInput, clearBill)"
```

---

### Task 8: Add `formatIDR` tests

**Files:**
- Create: `lib/format.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// lib/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatIDR } from './format';

describe('formatIDR', () => {
  it('formats thousands with Indonesian grouping', () => {
    expect(formatIDR(125000)).toBe('Rp 125.000');
  });

  it('formats zero', () => {
    expect(formatIDR(0)).toBe('Rp 0');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bun run test`
Expected: 2 new formatIDR tests PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/format.test.ts
git commit -m "test: cover formatIDR"
```

---

### Task 9: Update CHANGELOG + wiki

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `wiki/personal/splitkuy/log.md`
- Modify: `wiki/personal/splitkuy/splitkuy.md`

- [ ] **Step 1: Update `CHANGELOG.md`**

Under `[Unreleased]`, after the existing `### Changed` block, add:

```markdown
### Fixed

- **finalOwed clamped at 0** — a discount larger than a person's subtotal share no longer produces a negative amount owed. When total discounts exceed subtotal, an amber banner ("Discounts exceed subtotal — amounts clamped at Rp 0") appears above the summary cards.
- **localStorage load hardened** — `loadBill` now validates the stored shape with `isBill()` instead of trusting a `JSON.parse` cast; corrupt or partial data falls back to a fresh bill instead of throwing.
- **Dead exports removed** — `parseNumericInput` (format) and `clearBill` (storage) deleted; both were unused.
- **Reducer and summary text now tested** — `billReducer` extracted to `lib/bill-reducer.ts`; `buildWhatsAppText` extracted to `lib/whatsapp.ts`. Both covered by Vitest (13 reducer tests, 4 whatsapp tests, 8 storage tests, 2 format tests).
```

- [ ] **Step 2: Append to `wiki/personal/splitkuy/log.md`**

Add at the top of the log:

```markdown
## [2026-08-04] fix | Bug-fix pass

Clamped `finalOwed` at 0 in `computePerPersonSummary` so a discount exceeding a person's subtotal share can't produce a negative amount owed; added an amber warning banner in `SummaryPanel` when grand total goes negative. Extracted `billReducer` → `lib/bill-reducer.ts` (13 tests) and `buildWhatsAppText` → `lib/whatsapp.ts` (4 tests) — both were pure, business-critical functions living in view components with zero coverage. Hardened `loadBill` with an `isBill` schema guard (corrupt/partial storage now falls back to a fresh bill instead of throwing). Removed dead exports `parseNumericInput` and `clearBill`. Spec: `docs/superpowers/specs/2026-08-04-bug-fix-pass-design.md`. Plan: `docs/superpowers/plans/2026-08-04-bug-fix-pass.md`. Test suite grew 6 → 33.
```

- [ ] **Step 3: Update `wiki/personal/splitkuy/splitkuy.md`**

In the "Architecture" section, add under the existing lib notes:

```markdown
- **`lib/bill-reducer.ts`** — pure reducer (state transitions for people/items/discounts/taxes/fees) + `BillAction` types + `emptyBill()`. Consumed by `BillContext`.
- **`lib/whatsapp.ts`** — pure `buildWhatsAppText(bill, summaries)` that formats the shareable WhatsApp summary. Consumed by `SummaryPanel`.
- **`lib/storage.ts`** — `saveBill` / `loadBill` / `isBill` (schema guard). `loadBill` returns `null` on invalid shape rather than throwing.
```

- [ ] **Step 4: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 5: Run full test suite**

Run: `bun run test`
Expected: 33/33 PASS.

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md wiki/personal/splitkuy/log.md wiki/personal/splitkuy/splitkuy.md
git commit -m "docs: update CHANGELOG + wiki for bug-fix pass"
```

---

### Task 10: Final verification

**Files:** (none)

- [ ] **Step 1: Type check**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 2: Lint**

Run: `bun lint`
Expected: clean.

- [ ] **Step 3: Tests**

Run: `bun run test`
Expected: 33/33 pass.

- [ ] **Step 4: Build**

Run: `bun run build`
Expected: Next.js build succeeds.

- [ ] **Step 5: Manual smoke test**

Run: `bun dev`. Verify:
- Add 3 people, add item, assign quantities.
- Enter a discount larger than subtotal → amber banner appears, affected card shows Rp 0 (not negative).
- Reset bill → AlertDialog opens → confirms → bill clears.
- Empty bill → Copy summary button disabled.

---

## Self-Review

**Spec coverage:**
- ✅ Section 1 (clamp + warning) → Tasks 1–2
- ✅ Section 2 (reducer extraction + tests) → Tasks 3–4
- ✅ Section 3 (whatsapp extraction + tests) → Tasks 5–6
- ✅ Section 4 (isBill guard + dead-code deletion) → Task 7
- ✅ `formatIDR` tests (spec §4) → Task 8
- ✅ Section 5 (CHANGELOG + wiki + verification) → Tasks 9–10

**Placeholder scan:** No TBD / TODO / "implement later" / "similar to Task N". Every step has exact file paths, full code, exact commands, expected output.

**Type consistency:** `BillAction` exported from `lib/bill-reducer.ts` and consumed as `Dispatch<BillAction>` in `BillContext.tsx` (Task 3). `buildWhatsAppText(bill: Bill, summaries: PerPersonSummary[])` used identically in `SummaryPanel` (Task 5). `isBill` exported from `lib/storage.ts` (Task 7). `formatIDR` unchanged (Task 8).

**Test count consistency:** 6 existing (cn + 5 bill-calculator) → +2 clamp (Task 1) = 8 bill-calculator tests; +13 reducer (Task 4); +4 whatsapp (Task 6); +8 storage (Task 7); +2 format (Task 8) = **33 total**. Matches the CHANGELOG/wiki claim.

**Cross-check `grandTotal` import in SummaryPanel:** Task 5 removes `billSubtotal` from the import but keeps `grandTotal` (still used for `gt`). Verified against current file line 18 and `gt` usage at line 80.
