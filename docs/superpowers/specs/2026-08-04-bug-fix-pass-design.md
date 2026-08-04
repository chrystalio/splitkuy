# Bug-Fix Pass — Design Spec

**Date:** 2026-08-04
**Author:** Claude (design); Chrystalio (approved)
**Status:** Approved — ready to plan

## Overview

Five targeted fixes that close verified gaps in correctness and test coverage. Scope is intentionally bounded: this pass fixes what is broken and tests the critical path. It does not refactor UI structure, add features, or address cosmetic issues.

---

## Section 1 — Math safety: `finalOwed` floor at 0

### Problem

When `discountShare > itemsTotal` (i.e., a discount exceeds a person's subtotal share), the raw calculation can produce a negative `finalOwed`. A negative amount owed is nonsensical in a bill-splitting context and could confuse users.

### Solution

In `lib/bill-calculator.ts`, `computePerPersonSummary`, clamp each person's `finalOwed` at 0:

```ts
const raw = itemsTotal - discountShare + taxShare + feeShare;
const finalOwed = Math.max(0, Math.round(raw));
```

Remainder reconciliation continues on the clamped sum. The "sum equals grandTotal" invariant holds whenever `grandTotal ≥ 0`. When `grandTotal < 0` (total discounts exceed total items), the invariant breaks — the host absorbs the remainder and a warning banner surfaces the discrepancy (see below).

### Warning banner

In `components/SummaryPanel.tsx`, when `grandTotal < 0`:

```tsx
{gt < 0 && (
  <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
    Discounts exceed subtotal — amounts clamped at Rp 0.
  </div>
)}
```

Hides when `grandTotal >= 0`. Minimal visual treatment (amber, not red) — a signal, not an alarm.

### New test cases (`lib/bill-calculator.test.ts`)

1. **Negative raw finalOwed clamped:** 1 person, discount > subtotal → `finalOwed = 0`, host absorbs remainder.
2. **Multiple people clamped:** 3 people with proportional shares, combined discounts > subtotal → all clamped, host absorbs remainder, sum equals grandTotal.
3. Pre-existing tests (`"host absorbs stray Rupiahs"`, `"no remainder when even"`) stay green — no clamp triggered.

---

## Section 2 — Reducer extraction + tests

### Problem

`billReducer` in `components/BillContext.tsx` is ~180 lines of business logic (every action that mutates bill state) with zero test coverage. Every action handles real money. An incorrect `REMOVE_PERSON` (stale assignments), a wrong `SET_ASSIGNMENT_QTY` (sparse array maintenance), or a missing host-reassignment case would silently produce wrong splits.

### Solution

Extract to `lib/bill-reducer.ts`:

```ts
// exports
export type BillAction = ...
export function emptyBill(): Bill
export function billReducer(state: Bill, action: BillAction): Bill
// private
function id(): string { return crypto.randomUUID(); }
```

`components/BillContext.tsx` becomes a thin wrapper — imports `billReducer`, `emptyBill`, and `BillAction` from `@/lib/bill-reducer`. All dispatch calls, consumer hooks (`useBill`, `useBillContext`), and JSX remain identical.

### Test file: `lib/bill-reducer.test.ts`

Vitest `environment: node` (pure functions, no DOM).

| Action | Assertions |
|---|---|
| `ADD_PERSON` | First person → `isHost: true`. Subsequent → `isHost: false`. |
| `REMOVE_PERSON` | Person gone. Assignments stripped from every item. Removed was host + others remain → `people[0].isHost = true`. Last person removed → empty arrays. |
| `SET_HOST` | Exactly one host after dispatch. Previous host isHost = false. |
| `ADD_ITEM` / `UPDATE_ITEM` / `REMOVE_ITEM` | Correct shape and id in state. |
| `SET_ASSIGNMENT_QTY` | qty=0 → assignment removed. Existing person → qty updated. New person → added. Sequential calls accumulate correctly. |
| `ADD_DISCOUNT` / `REMOVE_DISCOUNT` | Persists correctly in `bill.discounts`. |
| `ADD_TAX` / `REMOVE_TAX` | Persists correctly in `bill.taxes`. |
| `ADD_FEE` / `REMOVE_FEE` | Persists correctly in `bill.fees`. |
| `RESET` | Returns `emptyBill()`. |
| `LOAD` | Replaces state with payload verbatim. |
| Default (unknown action) | State returned unchanged. |

IDs are not asserted (non-deterministic). Shape and logic are asserted.

---

## Section 3 — WhatsApp text extraction + tests

### Problem

`buildWhatsAppText` in `components/SummaryPanel.tsx` is the most business-critical text generation in the app. It formats the copy-able bill summary users share over WhatsApp. It is untested and embedded in a view component.

### Solution

Extract to `lib/whatsapp.ts`:

```ts
export function buildWhatsAppText(
  bill: Bill,
  summaries: PerPersonSummary[]
): string { ... }
```

Type signatures use concrete `Bill` and `PerPersonSummary[]` from `lib/types`, not `ReturnType<typeof useBill>['bill']`.

`SummaryPanel.tsx` imports and calls it; the JSX that renders the summary cards is unchanged.

### Test file: `lib/whatsapp.test.ts`

1. **2 people, 1 item each** → header `🍽️ Split bill — total …`, bullet per person with name + amount, items line per person, host labeled `(host)`, extras line with subtotal.
2. **Discount + tax + fee** → extras line includes all three with correct signs (`Discount −…`, `Tax …`, `Fees …`).
3. **Person with no assignments** → appears in people block with no items sub-line.
4. **Empty people** → header + extras only. Defensive (CopyButton is disabled in this case, but the function is pure and worth hardening).
5. `formatIDR` is not retested here — it is tested in `lib/format.ts` (currently untested; `parseNumericInput` removed below, `formatIDR` should be added to the test file as part of the storage test file).

---

## Section 4 — Storage schema guard + dead-code deletion

### Problem

`loadBill` in `lib/storage.ts` does `JSON.parse(raw) as Bill` — a cast, not a check. A corrupt entry from manual localStorage editing or a partial write throws at runtime. Additionally, `parseNumericInput` (format.ts) and `clearBill` (storage.ts) are exported and never imported anywhere.

### Solution

**Schema guard in `lib/storage.ts`:**

```ts
function isBill(value: unknown): value is Bill {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    Array.isArray(b.people) &&
    Array.isArray(b.items) &&
    Array.isArray(b.discounts) &&
    Array.isArray(b.taxes) &&
    Array.isArray(b.fees) &&
    b.people.every(
      (p: unknown) =>
        typeof p === 'object' && p !== null &&
        typeof (p as Record<string, unknown>).id === 'string' &&
        typeof (p as Record<string, unknown>).name === 'string'
    )
  );
}
```

`loadBill` uses it:

```ts
const parsed = JSON.parse(raw);
return isBill(parsed) ? parsed : null;
```

Depth is intentionally bounded (arrays + person fields). Item/discount/tax/fee shapes are not fully validated here — if we later need stricter validation, `isBill` is the place to extend it.

**Dead-code deletion:**

- `lib/format.ts`: Remove `parseNumericInput`. ItemRow and InlineAddRow use inline `.replace(/\D/g, '')`; the export is unused.
- `lib/storage.ts`: Remove `clearBill`. `RESET` action triggers the save effect which overwrites localStorage with the empty bill — functionally equivalent and already tested indirectly.

### Test file: `lib/storage.test.ts`

Mock `localStorage` with `vi.stubGlobal('localStorage', { ... })` before each test.

| Scenario | Expected |
|---|---|
| Nothing stored | `loadBill()` returns `null` |
| Invalid JSON | `loadBill()` returns `null` |
| `{}` (fails isBill) | `loadBill()` returns `null` |
| Partial shape `{ people: [] }` | `loadBill()` returns `null` |
| Valid bill | `loadBill()` returns the bill |
| `setItem` throws | `saveBill()` does not throw |
| `isBill` accepts valid bill | `true` |
| `isBill` rejects `null`, `[]`, `{ people: "not-array" }` | `false` |

Also add `formatIDR` test to this file (or a new `lib/format.test.ts`):
- `formatIDR(125000)` → `"Rp 125.000"`
- `formatIDR(0)` → `"Rp 0"`

---

## Section 5 — Files, verification, and commits

### Files created

| File | Purpose |
|---|---|
| `lib/bill-reducer.ts` | Extracted reducer |
| `lib/bill-reducer.test.ts` | Reducer tests |
| `lib/whatsapp.ts` | Extracted WhatsApp text builder |
| `lib/whatsapp.test.ts` | WhatsApp text tests |
| `lib/storage.test.ts` | Storage + isBill tests + formatIDR tests |

### Files modified

| File | Change |
|---|---|
| `lib/bill-calculator.ts` | `finalOwed` clamped at 0; 2 new test cases |
| `lib/format.ts` | Remove `parseNumericInput` |
| `lib/storage.ts` | Remove `clearBill`; add `isBill`; `loadBill` uses `isBill` |
| `components/BillContext.tsx` | Import from `lib/bill-reducer`; thin wrapper only |
| `components/SummaryPanel.tsx` | Import `buildWhatsAppText`; add negative-total warning banner |

### Files deleted

- `parseNumericInput` (function removed from `lib/format.ts`)
- `clearBill` (function removed from `lib/storage.ts`)

### Verification steps

```bash
bunx tsc --noEmit     # type check
bun lint               # ESLint
bun run test          # Vitest — all tests pass
bun run build         # Next.js production build
```

**Manual smoke test:**
1. `bun dev` → add 3 people, add item, assign quantities.
2. Enter a discount larger than subtotal → amber warning banner appears.
3. Summary cards show 0 (not negative) for affected person.
4. Reset bill → AlertDialog opens → confirms → bill clears.
5. Empty bill → Copy summary button disabled.

### Commits (5 atomic)

```
1. fix: clamp finalOwed at 0, add negative-total warning banner
2. refactor: extract billReducer to lib/bill-reducer.ts (with tests)
3. refactor: extract buildWhatsAppText to lib/whatsapp.ts (with tests)
4. fix: add isBill schema guard, remove dead exports (parseNumericInput, clearBill)
5. docs: update CHANGELOG + wiki for bug-fix pass
```

---

## Self-review checklist

- [ ] No `TBD` / `TODO` / placeholder left in spec.
- [x] Sections are internally consistent (type signatures match usage sites).
- [x] Scope is bounded — all items trace back to a confirmed bug or test gap.
- [x] Each commit is independently revertable.
- [x] Test files are in the same directory as the code they test (`lib/`).
- [x] `vitest environment: node` confirmed (no DOM needed; localStorage mocked via `vi.stubGlobal`).
- [x] Deleted exports (`parseNumericInput`, `clearBill`) verified unused by grep before deletion.
- [x] `parseNumericInput` removal leaves `.replace(/\D/g, '')` inline in ItemRow and InlineAddRow — no broken call sites.
- [x] `clearBill` removal leaves RESET path intact (save effect writes empty bill).
