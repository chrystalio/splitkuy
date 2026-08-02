# SplitKuy MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working SplitKuy bill-splitting MVP: single-page Next.js app with per-person quantities, multiple extras, proportional math, and WhatsApp copy.

**Architecture:** `'use client'` components + React Context + `useReducer` for bill state; pure math functions in `lib/` with no React dependency; `localStorage` persistence; Tailwind CSS v4 for styling.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Vitest

**Spec:** `docs/superpowers/specs/2026-08-02-splitkuy-mvp-design.md`

---

## File Structure

```
app/
  page.tsx              # Server Component — renders <BillApp /> (modify)
  layout.tsx           # Root layout (unchanged)
  globals.css           # Tailwind + dark mode (unchanged)

components/
  BillApp.tsx           # Top-level client component, owns BillProvider
  PeopleSection.tsx     # Pill list + add-person input
  ExtrasSection.tsx     # Collapsible discount/tax/fee cards
  ItemList.tsx          # Items list + InlineAddRow
  ItemRow.tsx           # Single item compact view; tap to expand
  InlineAddRow.tsx      # Inline entry form (name, unit, qty, per-person)
  SummaryPanel.tsx      # Per-person breakdown + copy button
  CopyButton.tsx       # Clipboard copy with "Copied!" feedback
  ui/
    NumberStepper.tsx  # −/qty/+ stepper
    Accordion.tsx      # Collapsible card primitive
    Input.tsx          # Wrapped input with consistent styling
    Button.tsx         # Primary/secondary button variants

lib/
  bill-calculator.ts    # Pure math functions
  bill-calculator.test.ts # Vitest tests
  types.ts              # All TypeScript interfaces
  storage.ts           # localStorage get/set
  format.ts            # IDR formatting helpers
```

---

## Task 1: Project scaffolding

**Install Vitest, configure it, and add the `test` script to `package.json`.**

- Modify: `package.json`
- Test: `vitest.config.ts`

- [ ] **Step 1: Install Vitest and create config**

```bash
cd /Users/kristoff/Dev/personal-project/splitkuy
bun add -d vitest
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',   // pure functions, no DOM needed
    globals: true,
  },
});
```

- [ ] **Step 2: Add test script to package.json**

Add to the `scripts` block in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Run test to verify setup**

```bash
bun test
```
Expected: "No test files found" (config works, no tests yet)

- [ ] **Step 4: Commit**

```bash
git add package.json vitest.config.ts bun.lock
git commit -m "chore: add Vitest for unit testing"
```

---

## Task 2: TypeScript types

**Define all bill data structures.**

- Create: `lib/types.ts`
- Tests: none (types are declarative)

- [ ] **Step 1: Write types**

```typescript
// lib/types.ts

export interface Person {
  id: string;
  name: string;
  isHost: boolean;
}

export interface ItemAssignment {
  personId: string;
  qty: number; // always >= 1; qty 0 means the person is not in this array
}

export interface Item {
  id: string;
  name: string;
  unitPrice: number; // IDR, whole number
  quantity: number;  // total unit cap for this line
  assignments: ItemAssignment[]; // sparse — sum of qty <= quantity
}

export interface Discount {
  id: string;
  label: string;
  amount: number; // positive, display handles the minus sign
}

export interface Tax {
  id: string;
  label: string;
  amount: number;
}

export interface Fee {
  id: string;
  label: string;
  amount: number;
}

export interface Bill {
  people: Person[];
  items: Item[];
  discounts: Discount[];
  taxes: Tax[];
  fees: Fee[];
}

export interface PerPersonSummary {
  personId: string;
  itemsTotal: number;
  discountShare: number; // negative — discount reduces
  taxShare: number;
  feeShare: number;
  finalOwed: number; // after all math + remainder reconciliation
  remainderAbsorbed: number; // 0 for non-host, > 0 for host
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add TypeScript interfaces for bill data model"
```

---

## Task 3: Utility helpers

**Format and storage utilities. Pure functions, no React.**

- Create: `lib/format.ts`
- Create: `lib/storage.ts`
- Tests: none (trivial wrappers)

- [ ] **Step 1: Write lib/format.ts**

```typescript
// lib/format.ts

/**
 * Format a number as Indonesian Rupiah string.
 * Input: 125000 → Output: "125.000"
 */
export function formatIDR(amount: number): string {
  return amount.toLocaleString('id-ID'); // Indonesian locale uses . as thousand separator
}

/**
 * Strip non-digit characters from a string input.
 * Input: "12.500" → Output: "12500"
 */
export function parseNumericInput(value: string): string {
  return value.replace(/\D/g, '');
}
```

- [ ] **Step 2: Write lib/storage.ts**

```typescript
// lib/storage.ts

import type { Bill } from './types';

const STORAGE_KEY = 'splitkuy_bill_v1';

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
    return JSON.parse(raw) as Bill;
  } catch {
    // corrupt data → start fresh
    return null;
  }
}

export function clearBill(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/format.ts lib/storage.ts
git commit -m "feat: add format and storage utility helpers"
```

---

## Task 4: Math engine — implementation

**Pure math functions. Core correctness requirement.**

- Create: `lib/bill-calculator.ts`
- See also: spec §3 for formulas

- [ ] **Step 1: Implement itemSubtotal and billSubtotal**

```typescript
// lib/bill-calculator.ts

import type { Bill, Item, PerPersonSummary } from './types';

export function itemSubtotal(item: Item): number {
  return item.assignments.reduce(
    (sum, a) => sum + a.qty * item.unitPrice,
    0
  );
}

export function billSubtotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}
```

- [ ] **Step 2: Implement per-person base share**

```typescript
export function personItemsTotal(personId: string, items: Item[]): number {
  return items.reduce((sum, item) => {
    const assignment = item.assignments.find((a) => a.personId === personId);
    return sum + (assignment ? assignment.qty * item.unitPrice : 0);
  }, 0);
}

export function personSubtotalShare(
  personId: string,
  items: Item[]
): number {
  const total = billSubtotal(items);
  if (total === 0) return 0;
  return personItemsTotal(personId, items) / total;
}
```

- [ ] **Step 3: Implement discount and tax shares**

```typescript
export function personDiscountShare(
  personId: string,
  discounts: { amount: number }[],
  items: Item[]
): number {
  const totalDiscount = discounts.reduce((s, d) => s + d.amount, 0);
  const share = personSubtotalShare(personId, items);
  return share * totalDiscount;
}

export function personTaxShare(
  personId: string,
  taxes: { amount: number }[],
  items: Item[]
): number {
  const totalTax = taxes.reduce((s, t) => s + t.amount, 0);
  const share = personSubtotalShare(personId, items);
  return share * totalTax;
}
```

- [ ] **Step 4: Implement fee share (even split)**

```typescript
export function personFeeShare(
  personId: string,
  fees: { amount: number }[],
  people: { id: string }[]
): number {
  if (people.length === 0) return 0;
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  return Math.round(totalFees / people.length);
}
```

- [ ] **Step 5: Implement grandTotal and remainder reconciliation**

```typescript
export function grandTotal(bill: Bill): number {
  const subtotal = billSubtotal(bill.items);
  const totalDiscounts = bill.discounts.reduce((s, d) => s + d.amount, 0);
  const totalTaxes = bill.taxes.reduce((s, t) => s + t.amount, 0);
  const totalFees = bill.fees.reduce((s, f) => s + f.amount, 0);
  return subtotal - totalDiscounts + totalTaxes + totalFees;
}

export function computePerPersonSummary(
  bill: Bill
): PerPersonSummary[] {
  const subtotal = billSubtotal(bill.items);
  if (subtotal === 0) {
    // Edge case: no items — everyone owes 0
    return bill.people.map((p) => ({
      personId: p.id,
      itemsTotal: 0,
      discountShare: 0,
      taxShare: 0,
      feeShare: personFeeShare(p.id, bill.fees, bill.people),
      finalOwed: personFeeShare(p.id, bill.fees, bill.people),
      remainderAbsorbed: 0,
    }));
  }

  const summaries: PerPersonSummary[] = bill.people.map((person) => {
    const itemsTotal = personItemsTotal(person.id, bill.items);
    const discountShare = personDiscountShare(
      person.id,
      bill.discounts,
      bill.items
    );
    const taxShare = personTaxShare(person.id, bill.taxes, bill.items);
    const feeShare = personFeeShare(person.id, bill.fees, bill.people);

    const raw =
      itemsTotal - discountShare + taxShare + feeShare;
    const finalOwed = Math.round(raw);

    return {
      personId: person.id,
      itemsTotal,
      discountShare,
      taxShare,
      feeShare,
      finalOwed,
      remainderAbsorbed: 0,
    };
  });

  // Remainder reconciliation: sum rounded values, apply discrepancy to host
  const sumRounded = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
  const remainder = grandTotal(bill) - sumRounded;

  if (remainder !== 0) {
    const host = bill.people.find((p) => p.isHost);
    if (host) {
      const hostSummary = summaries.find((s) => s.personId === host.id);
      if (hostSummary) {
        hostSummary.finalOwed += remainder;
        hostSummary.remainderAbsorbed = remainder;
      }
    }
  }

  return summaries;
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/bill-calculator.ts
git commit -m "feat: add bill calculation engine (proportional math, remainder reconciliation)"
```

---

## Task 5: Math engine — tests

**Test all calculation paths with Vitest.**

- Create: `lib/bill-calculator.test.ts`

- [ ] **Step 1: Write remainder reconciliation test (the critical path)**

```typescript
// lib/bill-calculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  itemSubtotal,
  billSubtotal,
  personItemsTotal,
  personSubtotalShare,
  personDiscountShare,
  personFeeShare,
  grandTotal,
  computePerPersonSummary,
} from './bill-calculator';

const makePerson = (id: string, name: string, isHost = false) => ({
  id,
  name,
  isHost,
});

const makeItem = (
  id: string,
  name: string,
  unitPrice: number,
  quantity: number,
  assignments: { personId: string; qty: number }[]
) => ({ id, name, unitPrice, quantity, assignments });

describe('remainder reconciliation', () => {
  it('host absorbs stray Rupiahs from fractional discount split', () => {
    // 3 people each with 1/3 share. Discount of 100 produces a fractional
    // 33.333 per-person share that rounds to 33, then sums to 99 (not 100).
    // The 1-Rupiah discrepancy must land on the host.
    const bill = {
      people: [
        makePerson('p1', 'Andi'),
        makePerson('p2', 'Budi'),
        makePerson('p3', 'Citra', true),
      ],
      items: [
        makeItem('i1', 'Nasi', 1000, 1, [{ personId: 'p1', qty: 1 }]),
        makeItem('i2', 'Ayam', 1000, 1, [{ personId: 'p2', qty: 1 }]),
        makeItem('i3', 'Teh', 1000, 1, [{ personId: 'p3', qty: 1 }]),
      ],
      discounts: [{ id: 'd1', label: 'Promo', amount: 100 }],
      taxes: [],
      fees: [],
    };

    const summaries = computePerPersonSummary(bill);
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    const gt = grandTotal(bill);

    // Sum of per-person owed must equal grand total exactly
    expect(sumFinalOwed).toBe(gt);
    // Host should have absorbed some non-zero remainder
    const hostSummary = summaries.find((s) => s.personId === 'p3')!;
    expect(hostSummary.remainderAbsorbed).not.toBe(0);
  });

  it('no remainder when amounts divide evenly', () => {
    // 3 people, subtotal 3000, fees 3000 → 1000 each, exact
    const bill = {
      people: [
        makePerson('p1', 'A'),
        makePerson('p2', 'B', true),
        makePerson('p3', 'C'),
      ],
      items: [makeItem('i1', 'Item', 3000, 1, [{ personId: 'p1', qty: 1 }])],
      discounts: [],
      taxes: [],
      fees: [{ id: 'f1', label: 'Service', amount: 3000 }],
    };

    const summaries = computePerPersonSummary(bill);
    const sumFinalOwed = summaries.reduce((s, sm) => s + sm.finalOwed, 0);
    expect(sumFinalOwed).toBe(grandTotal(bill));
  });
});

describe('itemSubtotal', () => {
  it('single assignment', () => {
    const item = makeItem('i1', 'Es Teh', 6000, 2, [{ personId: 'p1', qty: 2 }]);
    expect(itemSubtotal(item)).toBe(12000);
  });

  it('multiple assignments', () => {
    const item = makeItem('i1', 'Es Teh', 6000, 3, [
      { personId: 'p1', qty: 2 },
      { personId: 'p2', qty: 1 },
    ]);
    expect(itemSubtotal(item)).toBe(18000);
  });
});

describe('personFeeShare', () => {
  it('evenly divides fees across all people', () => {
    const fees = [{ id: 'f1', label: 'Delivery', amount: 15000 }];
    const people = [
      makePerson('p1', 'A'),
      makePerson('p2', 'B', true),
      makePerson('p3', 'C'),
    ];
    expect(personFeeShare('p1', fees, people)).toBe(5000);
    expect(personFeeShare('p2', fees, people)).toBe(5000);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
bun test
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add lib/bill-calculator.test.ts
git commit -m "test: add bill calculator unit tests (remainder reconciliation critical path)"
```

---

## Task 6: UI primitives

**Generic reusable components. Used throughout the app.**

- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/NumberStepper.tsx`
- Create: `components/ui/Accordion.tsx`

- [ ] **Step 1: Write Button.tsx**

```tsx
// components/ui/Button.tsx
'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800',
  danger: 'text-red-600 hover:bg-red-50 active:bg-red-100',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

- [ ] **Step 2: Write Input.tsx**

```tsx
// components/ui/Input.tsx
'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={[
          'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500',
          className,
        ].join(' ')}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
```

- [ ] **Step 3: Write NumberStepper.tsx**

```tsx
// components/ui/NumberStepper.tsx
'use client';

import { Button } from './Button';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
}: NumberStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={!canDecrement}
        onClick={() => canDecrement && onChange(value - 1)}
        className={[
          'flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium',
          canDecrement
            ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            : 'border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-800',
        ].join(' ')}
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={!canIncrement}
        onClick={() => canIncrement && onChange(value + 1)}
        className={[
          'flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium',
          canIncrement
            ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            : 'border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-800',
        ].join(' ')}
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write Accordion.tsx**

```tsx
// components/ui/Accordion.tsx
'use client';

import { useState, ReactNode } from 'react';

interface AccordionProps {
  title: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Accordion({
  title,
  summary,
  defaultOpen = false,
  children,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {summary && !open && (
            <span className="text-slate-500">{summary}</span>
          )}
          <span className="text-slate-400">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: add UI primitives (Button, Input, NumberStepper, Accordion)"
```

---

## Task 7: BillContext (state management)

**React Context + useReducer. Owns all bill state and persistence.**

- Create: `components/BillContext.tsx`
- Create: `hooks/useBill.ts`

- [ ] **Step 1: Write BillContext.tsx**

```tsx
// components/BillContext.tsx
'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import type { Bill, Person, Item, Discount, Tax, Fee } from '@/lib/types';
import { saveBill, loadBill, clearBill } from '@/lib/storage';
import { computePerPersonSummary } from '@/lib/bill-calculator';

// --- State ---

function emptyBill(): Bill {
  return {
    people: [],
    items: [],
    discounts: [],
    taxes: [],
    fees: [],
  };
}

type BillAction =
  | { type: 'ADD_PERSON'; payload: { name: string } }
  | { type: 'REMOVE_PERSON'; payload: { id: string } }
  | { type: 'SET_HOST'; payload: { id: string } }
  | { type: 'ADD_ITEM'; payload: Omit<Item, 'id'> }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'SET_ASSIGNMENT_QTY'; payload: { itemId: string; personId: string; qty: number } }
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

function billReducer(state: Bill, action: BillAction): Bill {
  switch (action.type) {
    case 'ADD_PERSON': {
      const isFirst = state.people.length === 0;
      const person: Person = {
        id: id(),
        name: action.payload.name,
        isHost: isFirst,
      };
      return { ...state, people: [...state.people, person] };
    }

    case 'REMOVE_PERSON': {
      const people = state.people.filter((p) => p.id !== action.payload.id);
      let { items } = state;

      // Remove person from all assignments
      items = items.map((item) => ({
        ...item,
        assignments: item.assignments.filter(
          (a) => a.personId !== action.payload.id
        ),
      }));

      // If removed person was host, reassign to first remaining
      const removedWasHost = state.people.find(
        (p) => p.id === action.payload.id
      )?.isHost;
      if (removedWasHost && people.length > 0) {
        people[0] = { ...people[0], isHost: true };
      }

      return { ...state, people, items };
    }

    case 'SET_HOST': {
      const people = state.people.map((p) => ({
        ...p,
        isHost: p.id === action.payload.id,
      }));
      return { ...state, people };
    }

    case 'ADD_ITEM': {
      const item: Item = { id: id(), ...action.payload };
      return { ...state, items: [...state.items, item] };
    }

    case 'UPDATE_ITEM': {
      const items = state.items.map((i) =>
        i.id === action.payload.id ? action.payload : i
      );
      return { ...state, items };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };
    }

    case 'SET_ASSIGNMENT_QTY': {
      const { itemId, personId, qty } = action.payload;
      const items = state.items.map((item) => {
        if (item.id !== itemId) return item;

        if (qty === 0) {
          // Remove from sparse array (qty 0 = not ordered)
          return {
            ...item,
            assignments: item.assignments.filter(
              (a) => a.personId !== personId
            ),
          };
        }

        const existing = item.assignments.find((a) => a.personId === personId);
        if (existing) {
          return {
            ...item,
            assignments: item.assignments.map((a) =>
              a.personId === personId ? { ...a, qty } : a
            ),
          };
        }

        return {
          ...item,
          assignments: [...item.assignments, { personId, qty }],
        };
      });
      return { ...state, items };
    }

    case 'ADD_DISCOUNT':
      return {
        ...state,
        discounts: [...state.discounts, { id: id(), ...action.payload }],
      };
    case 'REMOVE_DISCOUNT':
      return {
        ...state,
        discounts: state.discounts.filter((d) => d.id !== action.payload.id),
      };

    case 'ADD_TAX':
      return {
        ...state,
        taxes: [...state.taxes, { id: id(), ...action.payload }],
      };
    case 'REMOVE_TAX':
      return {
        ...state,
        taxes: state.taxes.filter((t) => t.id !== action.payload.id),
      };

    case 'ADD_FEE':
      return {
        ...state,
        fees: [...state.fees, { id: id(), ...action.payload }],
      };
    case 'REMOVE_FEE':
      return {
        ...state,
        fees: state.fees.filter((f) => f.id !== action.payload.id),
      };

    case 'LOAD':
      return action.payload;
    case 'RESET':
      return emptyBill();

    default:
      return state;
  }
}

// --- Context ---

interface BillContextValue {
  bill: Bill;
  dispatch: React.Dispatch<BillAction>;
  summaries: ReturnType<typeof computePerPersonSummary>;
}

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: ReactNode }) {
  const [bill, dispatch] = useReducer(billReducer, emptyBill(), (init) => {
    const saved = loadBill();
    return saved ?? init;
  });

  // Persist on every change
  useEffect(() => {
    saveBill(bill);
  }, [bill]);

  const summaries = useMemo(() => computePerPersonSummary(bill), [bill]);

  return (
    <BillContext.Provider value={{ bill, dispatch, summaries }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBillContext() {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBillContext must be used inside BillProvider');
  return ctx;
}
```

- [ ] **Step 2: Write useBill.ts**

```tsx
// hooks/useBill.ts
import { useBillContext } from '@/components/BillContext';

export function useBill() {
  const { bill, dispatch, summaries } = useBillContext();
  return { bill, dispatch, summaries };
}
```

- [ ] **Step 3: Commit**

```bash
git add components/BillContext.tsx hooks/useBill.ts
git commit -m "feat: add BillContext (useReducer + localStorage persistence)"
```

---

## Task 8: PeopleSection

**Pill list with add-person input. Designate host on long-press or swipe.**

- Create: `components/PeopleSection.tsx`

- [ ] **Step 1: Write PeopleSection.tsx**

```tsx
// components/PeopleSection.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function PeopleSection() {
  const { bill, dispatch } = useBill();
  const [name, setName] = useState('');

  function addPerson() {
    if (!name.trim()) return;
    dispatch({ type: 'ADD_PERSON', payload: { name: name.trim() } });
    setName('');
  }

  function removePerson(id: string) {
    dispatch({ type: 'REMOVE_PERSON', payload: { id } });
  }

  function setHost(id: string) {
    dispatch({ type: 'SET_HOST', payload: { id } });
  }

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          People ({bill.people.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {bill.people.map((person) => (
          <div
            key={person.id}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
              person.isHost
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
            ].join(' ')}
          >
            {person.name}
            {person.isHost && (
              <span className="text-xs opacity-70">(host)</span>
            )}
            <button
              type="button"
              onClick={() => removePerson(person.id)}
              className="ml-1 text-slate-400 hover:text-slate-600"
              aria-label={`Remove ${person.name}`}
            >
              ×
            </button>
          </div>
        ))}

        {bill.people.length === 0 && (
          <p className="text-sm text-slate-400">No people yet</p>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          placeholder="Add person name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          className="flex-1"
        />
        <Button onClick={addPerson} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PeopleSection.tsx
git commit -m "feat: add PeopleSection (pill list + add-person)"
```

---

## Task 9: ExtrasSection

**Three collapsible cards for discounts, taxes, and fees. Each accepts label + amount.**

- Create: `components/ExtrasSection.tsx`

- [ ] **Step 1: Write ExtrasSection.tsx**

```tsx
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
}: {
  label: string;
  amount: number;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Input
        value={label}
        readOnly
        className="flex-1 text-sm"
      />
      <Input
        value={formatIDR(amount)}
        readOnly
        className="w-24 text-sm text-right"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 text-sm"
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
  color,
}: {
  title: string;
  items: { id: string; label: string; amount: number }[];
  onAdd: (label: string, amount: number) => void;
  onRemove: (id: string) => void;
  color: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  function submit() {
    if (!newLabel.trim() || !newAmount) return;
    onAdd(newLabel.trim(), parseInt(newAmount, 10));
    setNewLabel('');
    setNewAmount('');
    setAdding(false);
  }

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Accordion
      title={
        <span style={{ color }} className="font-semibold text-sm">
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
        />
      ))}

      {adding ? (
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 text-sm"
          />
          <Input
            placeholder="Rp"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
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
          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
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
        color="#dc2626"
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
        color="#0f172a"
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
        color="#0369a1"
      />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ExtrasSection.tsx
git commit -m "feat: add ExtrasSection (collapsible discounts/taxes/fees)"
```

---

## Task 10: InlineAddRow

**The inline item entry form. Name → unit price → quantity → per-person assignments.**

- Create: `components/InlineAddRow.tsx`
- See spec §5.2 for UI details

- [ ] **Step 1: Write InlineAddRow.tsx**

```tsx
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
              className="flex-2"
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
```

- [ ] **Step 2: Commit**

```bash
git add components/InlineAddRow.tsx
git commit -m "feat: add InlineAddRow (inline item entry with per-person qty)"
```

---

## Task 11: ItemRow and ItemList

**ItemRow shows compact item; tap to expand inline for editing. ItemList renders all items + InlineAddRow.**

- Create: `components/ItemRow.tsx`
- Create: `components/ItemList.tsx`

- [ ] **Step 1: Write ItemRow.tsx**

```tsx
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

  function saveEdits() {
    const assignments = Object.entries(editAssignments)
      .filter(([, qty]) => qty > 0)
      .map(([personId, qty]) => ({ personId, qty }));

    dispatch({
      type: 'UPDATE_ITEM',
      payload: {
        ...item,
        name: editName.trim(),
        unitPrice: parseInt(editPrice, 10),
        quantity: editQty,
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
              className="flex-2 text-sm"
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
            <NumberStepper value={editQty} onChange={setEditQty} min={1} />
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
            <Button size="sm" onClick={saveEdits}>
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
```

- [ ] **Step 2: Write ItemList.tsx**

```tsx
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
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Items ({bill.items.length})
        </h2>
        {bill.items.length > 0 && (
          <span className="text-xs text-slate-500">
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
```

- [ ] **Step 3: Commit**

```bash
git add components/ItemRow.tsx components/ItemList.tsx
git commit -m "feat: add ItemRow and ItemList components"
```

---

## Task 12: CopyButton and SummaryPanel

**Clipboard copy with "Copied!" feedback. Per-person breakdown with WhatsApp formatting.**

- Create: `components/CopyButton.tsx`
- Create: `components/SummaryPanel.tsx`

- [ ] **Step 1: Write CopyButton.tsx**

```tsx
// components/CopyButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CopyButtonProps {
  text: string;
  label?: string;
  disabled?: boolean;
}

export function CopyButton({ text, label = 'Copy', disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <Button onClick={handleCopy} disabled={disabled} className="w-full">
      {copied ? '✓ Copied!' : label}
    </Button>
  );
}
```

- [ ] **Step 2: Write SummaryPanel.tsx**

```tsx
// components/SummaryPanel.tsx
'use client';

import { useBill } from '@/hooks/useBill';
import { CopyButton } from '@/components/CopyButton';
import { grandTotal } from '@/lib/bill-calculator';
import { formatIDR } from '@/lib/format';

function buildWhatsAppText(
  bill: ReturnType<typeof useBill>['bill'],
  summaries: ReturnType<typeof useBill>['summaries']
): string {
  const gt = grandTotal(bill);
  const host = bill.people.find((p) => p.isHost);

  const parts: string[] = [];

  for (const summary of summaries) {
    const person = bill.people.find((p) => p.id === summary.personId);
    if (!person) continue;

    const itemsForPerson = bill.items
      .filter((item) =>
        item.assignments.some((a) => a.personId === person.id)
      )
      .map((item) => item.name)
      .join(' · ');

    const lines = [`• ${person.name}${person.isHost ? ' (host)' : ''}: ${formatIDR(summary.finalOwed)}`];
    if (itemsForPerson) lines.push(`  ${itemsForPerson}`);

    parts.push(lines.join('\n'));
  }

  const extras: string[] = [];
  const subtotal = bill.items.reduce((s, i) => {
    return (
      s +
      i.assignments.reduce((ss, a) => ss + a.qty * i.unitPrice, 0)
    );
  }, 0);
  extras.push(`Subtotal ${formatIDR(subtotal)}`);

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
  const { bill, summaries } = useBill();
  const gt = grandTotal(bill);
  const copyText = buildWhatsAppText(bill, summaries);
  const hasItems = bill.items.length > 0;

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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
              <span
                className={`text-sm font-semibold ${
                  person.isHost ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {person.name}
                {person.isHost && ' (host)'}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatIDR(summary.finalOwed)}
              </span>
            </div>
            <div className="text-xs text-slate-500">{itemsForPerson}</div>
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
        label="Copy summary → WhatsApp"
        disabled={!hasItems}
      />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/CopyButton.tsx components/SummaryPanel.tsx
git commit -m "feat: add CopyButton and SummaryPanel with WhatsApp formatting"
```

---

## Task 13: BillApp and page update

**Top-level component. Replace the default Next.js starter page.**

- Create: `components/BillApp.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write BillApp.tsx**

```tsx
// components/BillApp.tsx
'use client';

import { BillProvider } from './BillContext';
import { PeopleSection } from './PeopleSection';
import { ExtrasSection } from './ExtrasSection';
import { ItemList } from './ItemList';
import { SummaryPanel } from './SummaryPanel';

export function BillApp() {
  return (
    <BillProvider>
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
          SplitKuy 🍽️
        </h1>
        <PeopleSection />
        <ExtrasSection />
        <ItemList />
        <SummaryPanel />
      </main>
    </BillProvider>
  );
}
```

- [ ] **Step 2: Replace app/page.tsx**

```tsx
// app/page.tsx
import { BillApp } from '@/components/BillApp';

export default function Home() {
  return <BillApp />;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/BillApp.tsx app/page.tsx
git commit -m "feat: wire BillApp into page.tsx, replace default starter"
```

---

## Task 14: Verify and build

- Run: `bun build`
- Run: `bun lint`
- Run: `bun test`

- [ ] **Step 1: Run full test suite**

```bash
bun test
```
Expected: all tests pass

- [ ] **Step 2: Run lint**

```bash
bun lint
```
Expected: no errors

- [ ] **Step 3: Run build**

```bash
bun build
```
Expected: successful production build, no type errors

- [ ] **Step 4: Start dev server and manual smoke test**

```bash
bun dev
```
Expected: app loads at http://localhost:3000 with the SplitKuy interface. Add people, add items, verify totals.

- [ ] **Step 5: Commit build artifacts**

```bash
git add -A && git commit -m "feat: SplitKuy MVP v1.0 complete"
```
