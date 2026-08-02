# SplitKuy UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-08-02-splitkuy-ui-redesign.md`
> **Type:** Style-only redesign. No behavioral changes, no schema changes, no math changes. All changes are CSS class swaps and copy updates.

**Goal:** Apply the approved minimalist monochrome design to the existing SplitKuy MVP. Same components, same logic, new look.

**Architecture:** Single-file-per-component changes, no new files. CSS foundation in `globals.css` and `layout.tsx`, UI chrome in each component file. No new dependencies.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (CSS-based `@theme`), TypeScript strict mode.

---

## Task Map

| # | File | Changes |
|---|---|---|
| 1 | `app/globals.css` | `--bg-app` variable, new body background, updated `@theme` |
| 2 | `app/layout.tsx` | Replace Geist with Plus Jakarta Sans |
| 3 | `components/BillApp.tsx` | Container padding, app title (no emoji), tagline + description |
| 4 | `components/PeopleSection.tsx` | Neutral chips, no host color, no "(host)" text, uppercase section label |
| 5 | `components/ExtrasSection.tsx` | Remove per-card `color` prop, flat neutral titles |
| 6 | `components/ItemList.tsx` + `components/InlineAddRow.tsx` | Neutral dashed add-item button, uppercase "Items" label |
| 7 | `components/SummaryPanel.tsx` | Muted `· host` marker, host name in neutral color, updated section header |
| 8 | `components/ui/Button.tsx` + `components/ui/Input.tsx` | Update variants and border/focus styles |
| 9 | `components/ui/Accordion.tsx` | Border-radius 10px, neutral title color (verify no per-card color leakage) |

---

## Before starting

```bash
cd /Users/kristoff/Dev/personal-project/splitkuy
git checkout feat/mvp-implementation   # working on the existing feature branch
# All commits go on this branch
```

---

### Task 1: CSS foundation

**File:** `app/globals.css`

- [ ] **Step 1: Add `--bg-app` variable and update body**

```css
:root {
  --bg-app: #fafafa;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-app: #0f172a;
  }
}

body {
  background: var(--bg-app);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add bg-app variable and body background"
```

---

### Task 2: Font — replace Geist with Plus Jakarta Sans

**File:** `app/layout.tsx`

- [ ] **Step 1: Import Plus Jakarta Sans instead of Geist**

```tsx
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});
```

- [ ] **Step 2: Update `@theme` variable to use the new font**

```tsx
@theme inline {
  --font-sans: var(--font-plus-jakarta-sans);
  /* keep any existing --color-* tokens if present */
}
```

- [ ] **Step 3: Remove Geist imports and variable**

Remove `Geist` and `Geist_Mono` imports and their variable declarations.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "style: replace Geist with Plus Jakarta Sans"
```

---

### Task 3: App shell header

**File:** `components/BillApp.tsx`

- [ ] **Step 1: Update container padding**

Change `max-w-lg px-4 py-6` → `max-w-lg px-5 py-8`

- [ ] **Step 2: Replace title block**

Remove `SplitKuy 🍽️` at 24px/700. Replace with three lines:

```tsx
<h1 className="mb-1 text-[22px] font-bold text-slate-900 dark:text-slate-100">
  SplitKuy
</h1>
<p className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
  Split the caffeine, not the headache.
</p>
<p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
  A frictionless web app for team lunch and coffee runs with proportional tax math.{" "}
  No accounts, no sign-ups, no drama.
</p>
```

- [ ] **Step 3: Commit**

```bash
git add components/BillApp.tsx
git commit -m "style: add tagline and description to app header"
```

---

### Task 4: People section — neutral chips

**File:** `components/PeopleSection.tsx`

- [ ] **Step 1: Replace chip class**

Current chip:
```tsx
person.isHost
  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  : 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
```

Replace with:
```tsx
'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
```

- [ ] **Step 2: Remove "(host)" text from chip**

Remove:
```tsx
{person.isHost && (
  <span className="text-xs opacity-70">(host)</span>
)}
```

- [ ] **Step 3: Update section header label**

Replace `People ({bill.people.length})` with uppercase label:
```tsx
<h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
  People
</h2>
```

Remove the `flex items-center justify-between` wrapper if it's now empty.

- [ ] **Step 4: Update empty state**

```tsx
<p className="text-sm text-slate-400 dark:text-slate-500">No people yet</p>
```

- [ ] **Step 5: Commit**

```bash
git add components/PeopleSection.tsx
git commit -m "style: neutral chips, remove host color, uppercase section label"
```

---

### Task 5: Extras section — flat neutral titles

**File:** `components/ExtrasSection.tsx`

- [ ] **Step 1: Remove `color` prop from all three `EditableExtraCard` calls**

```tsx
// Before
<EditableExtraCard
  title="Discounts"
  color="#dc2626"
  negative
  ...
/>
// After — remove color prop entirely (title color handled inside component)
<EditableExtraCard
  title="Discounts"
  negative
  ...
/>
```

Do the same for Taxes (`color="#475569"`) and Fees (`color="#0369a1"`).

- [ ] **Step 2: Update `EditableExtraCard` title rendering**

Inside the component, change the `title` span from:
```tsx
<span style={{ color }} className="font-semibold text-sm">
  {title}
</span>
```
to:
```tsx
<span className="font-medium text-sm text-slate-900 dark:text-slate-100">
  {title}
</span>
```

- [ ] **Step 3: Commit**

```bash
git add components/ExtrasSection.tsx
git commit -m "style: flat neutral titles, remove per-card accent colors"
```

---

### Task 6: Add item button — neutral dashed

**Files:** `components/ItemList.tsx`, `components/InlineAddRow.tsx`

- [ ] **Step 1: Update Items section label (ItemList.tsx)**

Replace the entire header `<div>` (including `<h2>` with `Items ({bill.items.length})` and the conditional subtotal `<span>`) with:
```tsx
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
```

- [ ] **Step 2: Update collapsed add-item button (ItemList.tsx)**

Current:
```tsx
className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-100 ..."
```

Replace with:
```tsx
className="w-full rounded-[10px] border-2 border-dashed border-slate-300 bg-transparent py-3 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 transition-colors duration-150"
```

- [ ] **Step 3: Update expanded form card border (InlineAddRow.tsx)**

Current:
```tsx
className="rounded-lg border border-slate-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700"
```

Replace with:
```tsx
className="rounded-[10px] border border-slate-200 bg-white p-3 dark:bg-slate-800 dark:border-slate-700"
```

- [ ] **Step 4: Update person assignment row background (InlineAddRow.tsx)**

Current:
```tsx
className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-1.5 dark:bg-blue-950"
```

Replace with:
```tsx
className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
```

- [ ] **Step 5: Commit**

```bash
git add components/ItemList.tsx components/InlineAddRow.tsx
git commit -m "style: neutral dashed add-item button, uppercase Items label"
```

---

### Task 9: Accordion — verify neutral and 10px radius

**File:** `components/ui/Accordion.tsx`

- [ ] **Step 1: Verify the outer container uses `rounded-[10px]`**

Current:
```tsx
className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
```

Replace with:
```tsx
className="rounded-[10px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
```

- [ ] **Step 2: Verify the trigger row title has no inherited color leak**

The `title` prop is rendered inside a `<span>{title}</span>`. Per `EditableExtraCard`, titles now render with explicit `text-slate-900 dark:text-slate-100` classes (set in Task 5 Step 2), so the accordion itself doesn't need to enforce title color.

- [ ] **Step 3: Verify collapsed total summary stays visible**

The `summary` prop already renders inside `text-slate-500` per the current Accordion code — leave it. Confirms spec §5.9 requirement that totals are preserved when collapsed.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Accordion.tsx
git commit -m "style: accordion rounded-[10px], dark card background slate-800"
```

---

### Task 7: Summary panel — muted host marker, neutral names

**File:** `components/SummaryPanel.tsx`

- [ ] **Step 1: Update section header**

Current:
```tsx
<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
  Summary
</h2>
```

Replace with:
```tsx
<h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
  Summary
</h2>
```

Move the grand total amount to the right of the header row, keep the `flex justify-between` wrapper.

- [ ] **Step 2: Update person name — remove green host color**

Current:
```tsx
person.isHost
  ? 'text-green-700 dark:text-green-300'
  : 'text-slate-900 dark:text-slate-100'
```

Replace with:
```tsx
'text-slate-900 dark:text-slate-100'
```

- [ ] **Step 3: Replace "(host)" with muted "· host"**

Current:
```tsx
{person.isHost && ' (host)'}
```

Replace with:
```tsx
{person.isHost && (
  <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">
    {' · host'}
  </span>
)}
```

- [ ] **Step 4: Update breakdown label colors**

Change all `text-slate-500` breakdown labels to `text-slate-400 dark:text-slate-500`:
```tsx
<div className="text-xs text-slate-400 dark:text-slate-500">
  Items: {formatIDR(summary.itemsTotal)}
</div>
```
(and similarly for Discounts, Tax, Fees lines)

- [ ] **Step 5: Update copy button label**

```tsx
label="Copy summary"
```

- [ ] **Step 6: Commit**

```bash
git add components/SummaryPanel.tsx
git commit -m "style: muted host marker, neutral person names, uppercase section label"
```

---

### Task 8: Button and Input — updated variants

**Files:** `components/ui/Button.tsx`, `components/ui/Input.tsx`

**Button.tsx:**
- [ ] **Step 1: Update primary variant**

Current:
```tsx
primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
```

Replace with:
```tsx
primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:active:bg-slate-300',
```

- [ ] **Step 2: Update secondary variant**

Current:
```tsx
secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
```

Replace with:
```tsx
secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 dark:active:bg-slate-600',
```

- [ ] **Step 3: Update ghost variant**

Current:
```tsx
ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800',
```

Replace with:
```tsx
ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700',
```

- [ ] **Step 4: Update danger variant** (unchanged — red is functional for destructive actions)

**Input.tsx:**
- [ ] **Step 4: Update border and focus**

Current:
```tsx
className={[
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
  'placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500',
  className,
].join(' ')}
```

Replace with:
```tsx
className={[
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
  'placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent',
  'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100',
  className,
].join(' ')}
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/Button.tsx components/ui/Input.tsx
git commit -m "style: updated Button variants and Input border/focus styles"
```

---

## Final verification

After all tasks:

```bash
bun run build        # must compile cleanly
bun run lint         # no new warnings
bun run test         # all tests pass (no logic changes)
```

Open `http://localhost:3000` in both light and dark mode (devtools → emulation) and do a visual pass:

1. App title "SplitKuy" at 22px, no emoji
2. Tagline + description visible
3. People chips are all neutral gray (no green, no blue)
4. Extras cards have neutral titles (no red/blue accent colors)
5. Add item button is dashed gray (not blue)
6. Summary section has "SUMMARY" uppercase, muted "· host" text
7. Copy button label says "Copy summary"
8. Dark mode matches the spec palette

---

## Order of operations

Tasks 1–3 are independent of each other and can run in any order. Tasks 4–8 are all independent of each other — apply them in any sequence. Commit after each task.

After all 9 tasks: one final build + test + smoke test, then open PR from `feat/mvp-implementation`.
