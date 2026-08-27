# SplitKuy — History Feature Plan

**Repo:** `shadowbane/splitkuy` (fork of `chrystalio/splitkuy`)
**Date:** 2026-08-27
**Branch:** `feature/history`

---

## 1. Goal

Add a **Bill History** feature so users can review past split sessions. All data stays client-side in `localStorage` — no backend.

---

## 2. Current Architecture (relevant parts)

| Layer | File | Role |
|-------|------|------|
| Types | `lib/types.ts` | `Bill`, `Person`, `Item`, `PerPersonSummary` |
| Storage | `lib/storage.ts` | `saveBill` / `loadBill` — single active bill at `splitkuy_bill_v1` |
| Reducer | `lib/bill-reducer.ts` | All state mutations, includes `RESET` action |
| Calculator | `lib/bill-calculator.ts` | `computePerPersonSummary`, `grandTotal` |
| Context | `components/BillContext.tsx` | `BillProvider` — hydrates from localStorage, persists on change |
| App shell | `components/BillApp.tsx` | Composes `PeopleSection`, `ExtrasSection`, `ItemList`, `SummaryPanel` |

---

## 3. Data Model — `HistoryEntry`

```ts
// lib/types.ts (add)

export interface HistoryEntry {
  id: string;              // crypto.randomUUID()
  savedAt: string;         // ISO 8601 timestamp
  billLabel: string;       // user-provided label (e.g. "Lunch at Warung Padang")
  bill: Bill;              // snapshot of the full bill at save time
  summaries: PerPersonSummary[];  // pre-computed per-person breakdown
  grandTotal: number;      // pre-computed total
}
```

**localStorage key:** `splitkuy_history_v1`
**Storage shape:** `HistoryEntry[]` (newest first, capped at 50 entries)

---

## 4. New Files

| File | Purpose |
|------|---------|
| `lib/history-storage.ts` | CRUD for history entries in localStorage (with validation, 50-entry cap) |
| `lib/history-storage.test.ts` | Unit tests for history storage |
| `components/HistorySection.tsx` | List of past bills, expand to see details, delete individual entries |
| `components/HistorySection.test.tsx` | Component tests |
| `components/SaveBillDialog.tsx` | Modal to enter label + confirm save |
| `components/HistoryDetail.tsx` | Expanded view: people, items, per-person totals + "Load into Editor" button |

---

## 5. Modified Files

| File | Change |
|------|--------|
| `lib/types.ts` | Add `HistoryEntry` interface |
| `components/BillApp.tsx` | Add `<HistorySection />` below `<SummaryPanel />` |
| `components/SummaryPanel.tsx` | Add "Save to History" button |
| `components/BillContext.tsx` | Expose `saveToHistory(label)` function via context |

---

## 6. Implementation Steps

### Step 1 — Types & Storage Layer
- [ ] Add `HistoryEntry` to `lib/types.ts`
- [ ] Create `lib/history-storage.ts`:
  - `loadHistory(): HistoryEntry[]`
  - `saveHistoryEntry(entry: HistoryEntry): void`
  - `deleteHistoryEntry(id: string): void`
  - `clearHistory(): void`
  - Validates structure on load (like `isBill` does)
  - Caps at 50 entries (drops oldest)
- [ ] Write `lib/history-storage.test.ts`

### Step 2 — Save Flow
- [ ] Create `components/SaveBillDialog.tsx`:
  - Radix Dialog (already in deps)
  - Text input for label (required, max 80 chars)
  - "Save" and "Cancel" buttons
  - On save: snapshot current bill + summaries → write to history
- [ ] Add `saveToHistory(label)` to `BillContext`
- [ ] Add "Save to History" button in `SummaryPanel.tsx` (disabled if no people/items)

### Step 3 — History List & Detail
- [ ] Create `components/HistorySection.tsx`:
  - Accordion list (Radix Accordion already in deps)
  - Each entry shows: label, date, people count, grand total
  - Expand to see `HistoryDetail`
  - Delete button per entry (with confirm)
  - "Clear All" button at bottom
- [ ] Create `components/HistoryDetail.tsx`:
  - Table: person name → items total, discount, tax, fee, final owed
  - Item list with assignments
  - **"Load into Editor" button** — dispatches `LOAD` with the entry's `bill`
  - Overwrite guard dialog if current bill has data

### Step 4 — Integration
- [ ] Add `<HistorySection />` to `BillApp.tsx`
- [ ] Wire up context
- [ ] Run full test suite (`bun run test`)
- [ ] Manual smoke test in browser

---

## 7. Design Decisions

1. **Snapshot, not reference** — History stores a deep copy of `Bill` + `PerPersonSummary[]` at save time. Editing the current bill never mutates history.
2. **50-entry cap** — localStorage has ~5MB limit. Each entry is ~2-5KB. 50 entries ≈ 250KB max. Safe.
3. **Label required** — Forces users to name their session ("Lunch with team", "Coffee run"). Makes history scannable.
4. **Load + Edit** — History entries have a "Load into Editor" button that restores the full `Bill` into the active editor via the existing `LOAD` reducer action. Users can then edit anything (people, items, splits, taxes) and re-save as a new entry. This makes history both a **recall** and **template** tool.
5. **Overwrite guard** — If the current bill has data (people or items), loading from history shows a confirm dialog first. Prevents accidental data loss.
6. **Pre-computed summaries** — Avoids recalculating on display. The `bill-calculator` logic is deterministic, but storing summaries means history works even if calculator logic changes in a future version.

---

## 8. Testing Strategy

- **Unit:** `history-storage.ts` — CRUD, validation, cap enforcement, corrupt data handling
- **Component:** `SaveBillDialog` — opens, validates input, calls save
- **Component:** `HistorySection` — renders list, expand/collapse, delete
- **Integration:** Save a bill → reload page → history persists

---

## 9. Out of Scope (future)

- Export history as JSON/CSV
- Share history via URL
- Search/filter history
