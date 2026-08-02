# SplitKuy MVP v1.0 — Design Specification

**Date:** 2026-08-02
**Status:** Approved — implementation pending

---

## 1. Overview

Mobile-first web application for splitting restaurant bills. The "Host" (person who paid) inputs receipt data and generates a per-person breakdown to paste into WhatsApp. Client-side only, Indonesian Rupiah currency, mathematically perfect proportional splitting.

---

## 2. Data Model

### Types (`lib/types.ts`)

```typescript
interface Person {
  id: string;       // UUID
  name: string;
  isHost: boolean;  // exactly one host per bill
}

interface ItemAssignment {
  personId: string;
  qty: number;      // always ≥ 1; if a person is here, they ordered at least one
}

interface Item {
  id: string;
  name: string;
  unitPrice: number;    // IDR, whole number only
  quantity: number;     // total units cap for this line
  assignments: ItemAssignment[];  // sparse — only people who ordered, Σ qty ≤ quantity
}

interface Discount {
  id: string;
  label: string;    // e.g. "Welcome 10%", "Birthday promo"
  amount: number;   // Rp amount (positive; display handles the − sign)
}

interface Tax {
  id: string;
  label: string;    // e.g. "PB1 11%"
  amount: number;
}

interface Fee {
  id: string;
  label: string;    // e.g. "Service", "Delivery"
  amount: number;
}

interface Bill {
  people: Person[];
  items: Item[];
  discounts: Discount[];
  taxes: Tax[];
  fees: Fee[];
}
```

**Key constraints:**
- Exactly one `isHost: true` at all times.
- `assignments[].qty ≥ 1` always.
- `Σ assignments[].qty ≤ item.quantity` always.
- `assignments` is **sparse** — if a person is not in the array, their qty is 0. No qty=0 entries exist.

---

## 3. Mathematical Logic (`lib/bill-calculator.ts`)

All functions are pure — no React, no DOM. Input/output only.

### 3.1 Subtotals

```typescript
itemSubtotal(item: Item): number
  → item.unitPrice × Σ(item.assignments[].qty)

billSubtotal(items: Item[]): number
  → Σ itemSubtotal(item) for all items
```

### 3.2 Per-person base share

Each person's share of the bill is proportional to their items subtotal:

```typescript
personItemsTotal(personId: string, items: Item[]): number
  → Σ (item.unitPrice × that person's qty on this item)

personSubtotalShare(personId: string, items: Item[]): number
  → personItemsTotal / billSubtotal
  // ratio from 0 to 1; dimensionless
```

### 3.3 Discounts — proportional split

Each discount applies to each person's items subtotal proportionally.

```typescript
personDiscountShare(personId: string, discounts: Discount[], items: Item[]): number
  → personSubtotalShare(personId, items) × Σ discount amounts
```

### 3.4 Taxes — proportional split

Same proportional treatment as discounts.

```typescript
personTaxShare(personId: string, taxes: Tax[], items: Item[]): number
  → personSubtotalShare(personId, items) × Σ tax amounts
```

### 3.5 Fees — even split

Fees are divided equally among all participants, regardless of what they ordered.

```typescript
personFeeShare(personId: string, fees: Fee[], people: Person[]): number
  → Σ fee amounts / people.length
```

### 3.6 Per-person final owed amount

```typescript
personFinalOwed(personId: string, bill: Bill): number
  → personItemsTotal
    + personDiscountShare   (negative — discounts reduce)
    + personTaxShare
    + personFeeShare
```

### 3.7 Remainder reconciliation

IDR has no decimals. After rounding each person's `personFinalOwed` to whole numbers, the sum may differ from the true grand total by 1–N Rupiahs due to fractional percentages. This discrepancy is always assigned to the Host.

```typescript
grandTotal(bill: Bill): number
  → billSubtotal
    + Σ discounts
    + Σ taxes
    + Σ fees

round(finalOwed: number): number
  → Math.round(finalOwed)  // nearest whole IDR

remainderReconciliation(bill: Bill): Map<string, number>
  // returns a Map of personId → adjustment (positive or negative)
  // adjustment for non-host = 0
  // adjustment for host = grandTotal - Σ(round(personFinalOwed)) for all people
  // after applying adjustments, Σ owed = grandTotal exactly
```

**Constraint:** `remainderReconciliation` result applied to all persons must sum to exactly `grandTotal`. The Host always absorbs the remainder.

---

## 4. User Flow

1. Open app → blank slate or rehydrated from `localStorage`
2. Add participant names → designate Host (exactly one)
3. Add receipt extras → discounts, taxes, fees (all optional, multiple of each)
4. Add items → each item: name, unit price, quantity, assign people with per-person qty
5. Review per-person totals → live recalculate as data changes
6. Tap "Copy summary" → WhatsApp-formatted text → paste into messaging app

---

## 5. UI Architecture

### 5.1 Screen structure

Single scrolling page, top to bottom:

```
┌─────────────────────────────────┐
│  Header: "SplitKuy"             │
├─────────────────────────────────┤
│  People pills + "+ add"         │
├─────────────────────────────────┤
│  Receipt extras (collapsed)     │
│    ▸ Discounts                  │
│    ▸ Taxes                      │
│    ▸ Fees (expanded)           │
├─────────────────────────────────┤
│  Items list                      │
│    [item row]                   │
│    [item row]                   │
│    + tap to add item (inline)   │
├─────────────────────────────────┤
│  Per-person summary panel       │
├─────────────────────────────────┤
│  [Copy summary → WhatsApp]      │
└─────────────────────────────────┘
```

### 5.2 Inline add-item flow

When the Host taps "+ add item", the add row expands inline below the items list (no modal, no navigation):

```
① [Item name input     ] [Unit price]
② [−][2][+]  ← quantity stepper (total cap)
③ Who? (sum ≤ 2)     ← per-person qty steppers
   [Andi] [−][2][+]  ← qty steppers per person
   [Budi] [−][1][+]
   [Citra] disabled (greyed out, cap reached)
   Allocated: 3/3 units  ← live count
   [Add item]
```

- Quantity stepper: min 1, max unbounded
- Per-person steppers: min 0, max capped by remaining unallocated units
  - **Decrementing a person's qty to 0 removes them from `assignments`** (sparse model — a qty-0 entry is never stored)
- Add button: disabled until `allocated ≥ 1`
- Adding a person to `people[]` does not mutate any `assignments[]` (sparse model)

### 5.3 Receipt extras

Three collapsible cards. Each card shows:
- A header with label and total amount (right-aligned)
- An expanded state with rows for each entry
- A "+ add" CTA inside the header

Empty state:
- Collapsed card with "No discounts yet · + add"
- Same for taxes and fees

All three (discounts, taxes, fees) are **arrays** — zero, one, or many entries.

### 5.4 Summary panel

Per-person breakdown. For each person:
```
Andi: Rp 31.880
  Items: Nasi Goreng 25.000
  Discounts: −2.870
  Tax: 320
  Fees: 8.117
```

Host shows a note if they absorbed a remainder: `*Host absorbs Rp N stray Rupiahs*`

### 5.5 WhatsApp copy format

Grouped by person, compact:

```
🍽️ Split bill — total Rp 96.570

• Andi: Rp 31.880
  Nasi Goreng 25.000
• Budi (host): Rp 57.340
  Es Teh 6.000 · Ayam Bakar 50.000
• Citra: Rp 7.350
  Es Teh 6.000

Subtotal 87.000 · Discount −28.700
Tax 11.961 · Fees 24.350
```

- Markdown-ish format (• bullet, · separator) — renders cleanly on WhatsApp
- Items listed under each person for verification
- Per-person item lines show name only (no qty unless > 1)
- No stray-Rupiah line in the output (internal math)
- Grand total + extras summary at bottom

---

## 6. Component Architecture

```
app/
  page.tsx              # Server Component — renders <BillApp />
  layout.tsx           # Root layout (unchanged)
  globals.css           # Tailwind + dark mode (unchanged)

components/
  BillApp.tsx           # Top-level client component, owns <BillProvider>
  PeopleSection.tsx      # Pill list + add-person input
  ExtrasSection.tsx      # Discounts, Taxes, Fees accordion cards
  ItemList.tsx          # Items list + InlineAddRow
  ItemRow.tsx           # Single item — compact view; tap to expand inline
  InlineAddRow.tsx      # The inline entry form (name, unit, qty, assignments)
  SummaryPanel.tsx       # Per-person breakdown + copy button
  CopyButton.tsx        # Clipboard copy with "Copied!" feedback
  ui/                   # Generic: Button, Input, NumberStepper, Badge, Accordion

lib/
  bill-calculator.ts    # Pure math functions (see §3)
  types.ts              # Interfaces (see §2)
  storage.ts            # localStorage get/set with version key
  format.ts             # IDR formatting (thousand-separator)

hooks/
  useBill.ts            # useContext wrapper: returns bill state + dispatch
  useBillCalculator.ts  # Derives per-person summaries from bill state
```

**State management:** `useReducer` at the `BillApp` level via React Context. Actions: `ADD_PERSON`, `REMOVE_PERSON`, `SET_HOST`, `ADD_ITEM`, `UPDATE_ITEM`, `REMOVE_ITEM`, `SET_ASSIGNMENT_QTY`, `ADD_DISCOUNT`, `REMOVE_DISCOUNT`, `ADD_TAX`, `REMOVE_TAX`, `ADD_FEE`, `REMOVE_FEE`. Persistence to `localStorage` on every dispatch via a middleware-style pattern.

**Client boundary:** Only components that need bill state or user interaction are `'use client'`. Layout and page are Server Components.

---

## 7. Persistence

```typescript
// lib/storage.ts
const STORAGE_KEY = 'splitkuy_bill_v1';

function saveBill(bill: Bill): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
}

function loadBill(): Bill | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Bill;
  } catch {
    return null;  // corrupt data → start fresh, silently
  }
}
```

- Save on every state change (inside dispatch or via a context subscriber).
- Load on app mount → hydrate initial state.
- Corrupt `localStorage` falls back to empty bill silently.

---

## 8. Input Validation

| Field | Rule |
|-------|------|
| Name inputs | Strings, no constraints |
| Numeric inputs (price, qty, amounts) | Strip non-digit characters on input. Accept empty (= 0). |
| Quantity stepper | Min 1, unbounded upward |
| Per-person qty stepper | Min 0, max = remaining unallocated units |
| Add item button | Disabled until `allocated ≥ 1` |
| Copy button | Disabled when `items.length === 0` |
| Person deletion | If deleted person is the host, reassign host to the first remaining person. If the deleted person was the *only* person, no host exists (empty state). |
| Host assignment | First person added is the host by default. Exactly one host at all times. |

---

## 9. Testing (`vitest`)

**Test file:** `lib/bill-calculator.test.ts`

**Setup:** Vitest with TypeScript. Run with `bunx vitest`.

**Required test cases:**

| Function | Cases |
|----------|-------|
| `itemSubtotal` | Empty assignments, single assignment, multiple assignments |
| `billSubtotal` | Empty items, single item, multiple items |
| `personItemsTotal` | Person with no items, one item, multiple items |
| `personSubtotalShare` | Even split, uneven split, person with 0 items |
| `personDiscountShare` | Single discount, multiple discounts, person with 0 items |
| `personTaxShare` | Single tax, multiple taxes |
| `personFeeShare` | Even split, single person (they pay all), 5 people |
| `personFinalOwed` | Combines all above |
| `grandTotal` | Matches sum of all items + extras |
| `remainderReconciliation` | **Critical path**: exact-match case, remainder → host (1Rp, >1Rp), multiple people, fractional percentages |

**Edge cases to test:**
- Zero subtotal with discounts (divide-by-zero: ratio = 0)
- All items assigned to one person
- Single-person bill (no fee split, no remainder possible)
- Very large numbers (IDR caps are high, but test overflow safety)

---

## 10. Out of Scope

- Single menu item split by percentage (e.g. "Ayam Bakar Rp 50.000, Andi 30% Budi 70%") — not supported in v1.0. Workaround: enter as two separate items with the desired amounts.
- Server-side persistence, shareable URLs, authentication
- OCR / receipt photo upload
- PDF export
- Cross-device sync
- Multiple currencies

---

## 11. Open Questions (resolved during design)

| Question | Resolution |
|----------|------------|
| Single quantity or per-person quantities? | Per-person quantities. Line has a `quantity` cap; each person assigned their own `qty ≥ 1`; sum ≤ cap. |
| Uneven per-person split (Andi 2, Budi 1)? | Supported. Each person has their own stepper. |
| Fractional split of one item (Andi 50%, Budi 50%)? | Not supported in v1.0. Enter as two items. |
| Multiple discounts / taxes / fees? | Yes — all arrays. Collapsible cards. |
| Extras collapse or expand by default? | Collapsed by default. "+ add" CTA inside each header. |
| Show stray Rupiahs in WhatsApp output? | No — internal math, not shown to payers. |
| Summary screen: items listed per person or flat? | Grouped by person. |
| Sparse or dense assignments? | Sparse — only people who ordered the item. No qty=0 entries. |
| Test framework? | Vitest. |
| Package manager? | bun (already in use). |
