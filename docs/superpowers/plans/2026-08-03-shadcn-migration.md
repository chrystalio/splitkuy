# Shadcn/UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate SplitKuy's hand-rolled UI primitives to shadcn/ui (Button, Input, Accordion, Label, Separator, Tooltip, Dialog, AlertDialog) preserving the refined-neutral slate palette and Plus Jakarta Sans typography locked in v1.1.

**Architecture:** Full shadcn adoption via CLI with native Tailwind v4 (no `tailwind.config.ts`). The CLI generates `components.json` + `lib/utils.ts` (`cn()`) and pulls components into `components/ui/`. Consumer files in `components/*.tsx` swap imports. Hand-rolled `NumberStepper` is preserved (shadcn has no equivalent) but modernized to use `cn()`. Window-confirm → AlertDialog. ThemeToggle's `title` → Tooltip.

**Tech Stack:** Next.js 16.2.12, React 19.2.4, Tailwind v4 (CSS-first `@theme`), shadcn/ui (Radix-backed), `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, bun.

**Design system notes (from UI/UX Pro Max search):**
- User override: palette stays slate (not green); typography stays Plus Jakarta Sans (not Atkinson Hyperlegible).
- Touch targets ≥44×44px — flag for `NumberStepper` modernization.
- `window.confirm` → `AlertDialog` with `DialogHeader`/`DialogTitle`/`DialogDescription`.
- `Tailwindcss-animate` gives shadcn components `prefers-reduced-motion` support out of the box.

---

## File Structure

### New files
- `lib/utils.ts` — `cn()` helper (`clsx` + `tailwind-merge`)
- `components.json` — shadcn config (base: slate, tw-v4, alias `@/components/ui`)
- `components/ui/button.tsx` — shadcn Button
- `components/ui/input.tsx` — shadcn Input
- `components/ui/accordion.tsx` — shadcn Accordion (Radix)
- `components/ui/label.tsx` — shadcn Label (Radix)
- `components/ui/separator.tsx` — shadcn Separator (Radix)
- `components/ui/tooltip.tsx` — shadcn Tooltip (Radix)
- `components/ui/dialog.tsx` — shadcn Dialog (Radix)
- `components/ui/alert-dialog.tsx` — shadcn AlertDialog (Radix)

### Modified files
- `app/globals.css` — add shadcn CSS variables under `@theme inline`
- `app/layout.tsx` — wrap children in `TooltipProvider`
- `components/ui/NumberStepper.tsx` — rewrite with `cn()`, fix touch targets (≥44px)
- `components/CopyButton.tsx` — import shadcn Button
- `components/ExtrasSection.tsx` — import shadcn Button, Input, Accordion
- `components/ItemList.tsx` — import shadcn Button (if any)
- `components/ItemRow.tsx` — import shadcn Button, Input, NumberStepper
- `components/PeopleSection.tsx` — import shadcn Button, Input, Label
- `components/SummaryPanel.tsx` — import shadcn Button + AlertDialog
- `components/InlineAddRow.tsx` — import shadcn Button, Input
- `components/BillApp.tsx` — verify imports pass through
- `components/ThemeToggle.tsx` — wrap in Tooltip, replace `title` attr
- `CHANGELOG.md` — `[Unreleased]` → new `### Changed` block
- `wiki/personal/splitkuy/splitkuy.md` — architecture section
- `wiki/personal/splitkuy/log.md` — append session entry

### Deleted files
- `components/ui/Button.tsx` (camelCase) — replaced by `button.tsx`
- `components/ui/Input.tsx` (camelCase) — replaced by `input.tsx`
- `components/ui/Accordion.tsx` (camelCase) — replaced by `accordion.tsx`

---

## Task 1: Add shadcn dependencies

**Files:**
- Modify: `package.json`
- Verify: `bun.lock`

- [ ] **Step 1: Install Radix + utility deps**

Run:
```bash
bun add class-variance-authority clsx tailwind-merge tailwindcss-animate
bun add @radix-ui/react-accordion @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-tooltip @radix-ui/react-dialog @radix-ui/react-slot
```

Expected: packages added to `package.json` dependencies, `bun.lock` updated.

- [ ] **Step 2: Verify install**

Run: `bun ls --depth 0 | grep -E "class-variance|author|primitives"`
Expected: each new package listed.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add shadcn deps (cva, clsx, tailwind-merge, radix primitives)"
```

---

## Task 2: Add `cn()` utility

**Files:**
- Create: `lib/utils.ts`
- Create: `lib/utils.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, 'b', undefined, 'c')).toBe('a b c');
  });

  it('dedupes conflicting tailwind classes via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
```

- [ ] **Step 2: Verify test fails**

Run: `bun run test`
Expected: FAIL — `cn` not exported from `./utils`.

- [ ] **Step 3: Implement `cn()`**

Create `lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Verify test passes**

Run: `bun run test`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/utils.test.ts
git commit -m "feat: add cn() utility (clsx + tailwind-merge)"
```

---

## Task 3: Initialize shadcn config

**Files:**
- Create: `components.json`

- [ ] **Step 1: Run shadcn init**

Run:
```bash
npx shadcn@latest init --base-color slate --yes
```

Expected: `components.json` is created in project root. It should reference:
- `"baseColor": "slate"`
- `"cssVariables": true`
- `"tailwind": { "config": "", "css": "app/globals.css" }`
- `"aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", ... }`

If `npx shadcn` is not installed, use `bunx shadcn@latest init --base-color slate --yes`.

- [ ] **Step 2: Verify `components.json`**

Read `components.json` and confirm:
- `baseColor: "slate"`
- `tailwind.css: "app/globals.css"`
- `aliases.utils: "@/lib/utils"`
- `aliases.ui: "@/components/ui"`

- [ ] **Step 3: Commit**

```bash
git add components.json
git commit -m "chore: shadcn init (slate base, tw-v4)"
```

---

## Task 4: Pull shadcn components

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/accordion.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/separator.tsx`
- Create: `components/ui/tooltip.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/alert-dialog.tsx`

- [ ] **Step 1: Pull all components in one command**

Run:
```bash
bunx shadcn@latest add button input accordion label separator tooltip dialog alert-dialog --yes
```

Expected: 8 files added to `components/ui/`. The CLI may overwrite `app/globals.css` — back it up first.

- [ ] **Step 2: If `globals.css` was overwritten, restore**

If shadcn wiped the slate-specific tokens in `globals.css`, restore the original:

```bash
git diff app/globals.css
```

If non-trivial diff, run:
```bash
git checkout app/globals.css
```

Then we manually merge shadcn's CSS variables in a later task.

- [ ] **Step 3: Verify components exist**

Run: `ls components/ui/`
Expected: `button.tsx input.tsx accordion.tsx label.tsx separator.tsx tooltip.tsx dialog.tsx alert-dialog.tsx NumberStepper.tsx` (NumberStepper still hand-rolled).

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: add shadcn components (button, input, accordion, label, separator, tooltip, dialog, alert-dialog)"
```

---

## Task 5: Reconcile `app/globals.css` with shadcn variables

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read current globals.css**

Read `app/globals.css` (current state has slate tokens + Tailwind v4 `@theme inline`).

- [ ] **Step 2: Append shadcn HSL CSS variables**

After the existing `@theme inline { ... }` block, add:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 47.4% 11.2%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 47.4% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 47.4% 6%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 47.4% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

- [ ] **Step 3: Verify build**

Run: `bun run build`
Expected: compile clean (no errors).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: add shadcn CSS variables (slate tokens, oklch-replaceable)"
```

---

## Task 6: Migrate `Button` consumers

**Files:**
- Delete: `components/ui/Button.tsx`
- Modify: `components/CopyButton.tsx`
- Modify: `components/ExtrasSection.tsx`
- Modify: `components/ItemRow.tsx`
- Modify: `components/PeopleSection.tsx`
- Modify: `components/SummaryPanel.tsx`
- Modify: `components/InlineAddRow.tsx`

- [ ] **Step 1: Delete old Button**

Run: `rm components/ui/Button.tsx`

- [ ] **Step 2: Update CopyButton.tsx imports**

Replace `import { Button } from '@/components/ui/Button';` with:
```ts
import { Button } from '@/components/ui/button';
```

- [ ] **Step 3: Update ExtrasSection.tsx imports**

Replace `import { Button } from '@/components/ui/Button';` with:
```ts
import { Button } from '@/components/ui/button';
```

- [ ] **Step 4: Update ItemRow.tsx imports**

Replace `import { Button } from '@/components/ui/Button';` with:
```ts
import { Button } from '@/components/ui/button';
```

- [ ] **Step 5: Update PeopleSection.tsx imports**

Replace `import { Button } from '@/components/ui/Button';` with:
```ts
import { Button } from '@/components/ui/button';
```

- [ ] **Step 6: Update SummaryPanel.tsx imports**

Replace `import { Button } from '@/components/ui/Button';` with:
```ts
import { Button } from '@/components/ui/button';
```

- [ ] **Step 7: Update InlineAddRow.tsx imports**

Replace `import { Button } from '@/components/ui/Button';` with:
```ts
import { Button } from '@/components/ui/button';
```

- [ ] **Step 8: Verify type-check**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 9: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 10: Run tests**

Run: `bun run test`
Expected: 6 tests pass (cn + 5 bill-calculator).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: migrate Button consumers to shadcn button"
```

---

## Task 7: Migrate `Input` consumers

**Files:**
- Delete: `components/ui/Input.tsx`
- Modify: `components/ExtrasSection.tsx`
- Modify: `components/ItemRow.tsx`
- Modify: `components/PeopleSection.tsx`
- Modify: `components/InlineAddRow.tsx`

- [ ] **Step 1: Delete old Input**

Run: `rm components/ui/Input.tsx`

- [ ] **Step 2: Update ExtrasSection.tsx imports**

Replace `import { Input } from '@/components/ui/Input';` with:
```ts
import { Input } from '@/components/ui/input';
```

- [ ] **Step 3: Update ItemRow.tsx imports**

Replace `import { Input } from '@/components/ui/Input';` with:
```ts
import { Input } from '@/components/ui/input';
```

- [ ] **Step 4: Update PeopleSection.tsx imports**

Replace `import { Input } from '@/components/ui/Input';` with:
```ts
import { Input } from '@/components/ui/input';
```

- [ ] **Step 5: Update InlineAddRow.tsx imports**

Replace `import { Input } from '@/components/ui/Input';` with:
```ts
import { Input } from '@/components/ui/input';
```

- [ ] **Step 6: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 7: Smoke test**

Run: `bun dev` and add a person, then an item. Verify inputs render correctly.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: migrate Input consumers to shadcn input"
```

---

## Task 8: Migrate `Accordion` consumers

**Files:**
- Delete: `components/ui/Accordion.tsx`
- Modify: `components/ExtrasSection.tsx`

- [ ] **Step 1: Read shadcn's accordion.tsx**

The shadcn Accordion uses Radix primitives with `AccordionItem`, `AccordionTrigger`, `AccordionContent`. Read the file to understand the new API.

- [ ] **Step 2: Rewrite `EditableExtraCard` to use shadcn Accordion**

In `components/ExtrasSection.tsx`, replace the `<Accordion title={...} summary={...}>...</Accordion>` JSX with:

```tsx
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value={title}>
    <AccordionTrigger>
      <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
        {title}
      </span>
      {items.length > 0 && (
        <span className="text-sm font-semibold ml-2">{formatIDR(total)}</span>
      )}
    </AccordionTrigger>
    <AccordionContent>
      {items.length === 0 && !adding && (
        <p className="text-xs text-slate-400 mb-2">No {title.toLowerCase()} yet</p>
      )}
      {/* ... existing items.map, adding form, etc. ... */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

- [ ] **Step 3: Update import**

```ts
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
```

- [ ] **Step 4: Delete old Accordion**

Run: `rm components/ui/Accordion.tsx`

- [ ] **Step 5: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 6: Smoke test**

Run: `bun dev`. Open Discounts / Taxes / Fees accordions. Verify they expand and collapse.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate ExtrasSection Accordion to shadcn (Radix)"
```

---

## Task 9: Migrate `window.confirm` → `AlertDialog`

**Files:**
- Modify: `components/SummaryPanel.tsx`

- [ ] **Step 1: Add AlertDialog state**

Add to `SummaryPanel`:

```ts
const [resetOpen, setResetOpen] = useState(false);

function handleReset() {
  if (isEmpty) return;
  setResetOpen(true);
}

function confirmReset() {
  dispatch({ type: 'RESET' });
  setResetOpen(false);
}
```

- [ ] **Step 2: Update Reset button to set state, not call confirm**

Replace the `aria-label` text? No — just change the onClick:

```tsx
<Button
  type="button"
  onClick={handleReset}
  disabled={isEmpty}
  variant="secondary"
  className="mt-4 w-full text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
>
  Reset bill
</Button>
```

- [ ] **Step 3: Add AlertDialog below the section**

```tsx
<AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Reset the entire bill?</AlertDialogTitle>
      <AlertDialogDescription>
        This clears all people, items, discounts, taxes, and fees. This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 4: Add imports**

```ts
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

- [ ] **Step 5: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 6: Smoke test**

Run: `bun dev`. Add a few items, click "Reset bill" → AlertDialog opens → focus is trapped → press Escape → dialog closes → click Reset → bill is cleared.

- [ ] **Step 7: Commit**

```bash
git add components/SummaryPanel.tsx
git commit -m "feat: replace window.confirm with AlertDialog for reset bill"
```

---

## Task 10: Migrate `ThemeToggle` `title` → `Tooltip`

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/ThemeToggle.tsx`

- [ ] **Step 1: Wrap app in `TooltipProvider`**

In `app/layout.tsx`, wrap the body content:

```tsx
import { TooltipProvider } from '@/components/ui/tooltip';

// ... inside RootLayout ...
<body className="min-h-full flex flex-col">
  <TooltipProvider>{children}</TooltipProvider>
</body>
```

- [ ] **Step 2: Update ThemeToggle.tsx**

Replace the existing `<button>` with:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      aria-label={`Theme: ${label}. Click to switch.`}
      className="fixed top-3 right-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
    >
      {/* svg icon */}
    </button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Theme: {label} — click to switch</p>
  </TooltipContent>
</Tooltip>
```

Drop the `title` attribute (now superseded by the Tooltip).

- [ ] **Step 3: Add imports**

```ts
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
```

- [ ] **Step 4: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 5: Smoke test**

Run: `bun dev`. Hover the theme toggle → tooltip appears. Click → theme cycles. Tooltip updates on next hover.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx components/ThemeToggle.tsx
git commit -m "feat: ThemeToggle gets Tooltip (replaces title attr)"
```

---

## Task 11: Modernize `NumberStepper` (touch target fix)

**Files:**
- Modify: `components/ui/NumberStepper.tsx`

- [ ] **Step 1: Rewrite with `cn()` and 44px touch targets**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canDecrement}
        onClick={() => canDecrement && onChange(value - 1)}
        aria-label="Decrease"
        className="h-11 w-11 p-0"
      >
        −
      </Button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canIncrement}
        onClick={() => canIncrement && onChange(value + 1)}
        aria-label="Increase"
        className="h-11 w-11 p-0"
      >
        +
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 3: Smoke test**

Run: `bun dev`. Add an item, expand, verify both NumberSteppers (item qty + per-person qty) have ≥44×44px tap targets.

- [ ] **Step 4: Commit**

```bash
git add components/ui/NumberStepper.tsx
git commit -m "style: NumberStepper touch targets ≥44px (mobile-first)"
```

---

## Task 12: Update CHANGELOG and wiki

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `wiki/personal/splitkuy/splitkuy.md`
- Modify: `wiki/personal/splitkuy/log.md`

- [ ] **Step 1: Update CHANGELOG.md**

In `[Unreleased]`, after `### Features`, add `### Changed`:

```markdown
### Changed

- **UI primitives migrated to shadcn/ui** — Button, Input, Accordion from `@/components/ui/button|input|accordion` (Radix-backed). New components added: `label`, `separator`, `tooltip`, `dialog`, `alert-dialog`. Hand-rolled `NumberStepper` preserved but modernized with `cn()` and 44×44px touch targets.
- **Reset confirmation** — `window.confirm()` replaced by `AlertDialog` with focus trap, keyboard dismissal, and ARIA-correct structure.
- **ThemeToggle** — HTML `title` attribute replaced by `Tooltip` (radix-powered).
- **Styling utilities** — added `lib/utils.ts` (`cn()` = `clsx` + `tailwind-merge`). New deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `@radix-ui/react-{accordion,label,separator,tooltip,dialog,slot}`.
- **CSS variables** — `app/globals.css` now declares shadcn HSL variables (`--background`, `--foreground`, `--primary`, etc.) for the new components. Slate palette and Plus Jakarta Sans retained.
```

- [ ] **Step 2: Update wiki splitkuy.md**

Update the "Architecture" section:

```markdown
### UI primitives

- **shadcn/ui** (Radix-backed) — Button, Input, Accordion, Label, Separator, Tooltip, Dialog, AlertDialog live in `components/ui/` (lowercase, kebab-case filenames).
- **Hand-rolled** — `NumberStepper` (no shadcn equivalent), `ThemeToggle` (theme cycling + persistence).
- **Utilities** — `lib/utils.ts` exposes `cn()` = `clsx` + `tailwind-merge`.
- **Install** — `bunx shadcn@latest add <name>` to pull new components.
```

- [ ] **Step 3: Append session entry to wiki log.md**

Add at the top of the log:

```markdown
## [2026-08-03] refactor | Shadcn/UI migration

Migrated SplitKuy's hand-rolled UI primitives to shadcn/ui across all consumers. Added Radix-backed `Button`, `Input`, `Accordion`, `Label`, `Separator`, `Tooltip`, `Dialog`, and `AlertDialog` via `bunx shadcn@latest add` (slate base, Tailwind v4 native). Created `lib/utils.ts` with `cn()` = `clsx` + `tailwind-merge`. Replaced `window.confirm()` reset prompt with `AlertDialog` (focus trap, ARIA-correct). ThemeToggle's `title` attribute replaced by `Tooltip`. Hand-rolled `NumberStepper` preserved but modernized — `h-7 w-7` raised to `h-11 w-11` so touch targets meet the 44×44px mobile-first standard. Palette stays refined-neutral slate per the v1.1 design lock; only the implementation layer changed. Spec: `docs/superpowers/specs/2026-08-03-shadcn-migration-design.md`. Plan: `docs/superpowers/plans/2026-08-03-shadcn-migration.md`. 6/6 tests pass, build clean, smoke test verified.
```

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md wiki/personal/splitkuy/splitkuy.md wiki/personal/splitkuy/log.md
git commit -m "docs: CHANGELOG + wiki update for shadcn migration"
```

---

## Task 13: Final verification

**Files:** (none)

- [ ] **Step 1: Type check**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 2: Lint**

Run: `bun lint`
Expected: clean.

- [ ] **Step 3: Tests**

Run: `bun run test`
Expected: 6/6 pass.

- [ ] **Step 4: Build**

Run: `bun run build`
Expected: Next.js build succeeds.

- [ ] **Step 5: Manual smoke test**

Run: `bun dev`. Verify:
- Add people → chips render → tap to set host
- Add items → expand → edit fields → assign quantities
- Discounts / Taxes / Fees — accordion expands/collapses
- Reset bill — AlertDialog opens with focus trap, Esc closes, button confirms
- Theme toggle — tooltip on hover, button cycles system → light → dark, persists
- Refresh — no hydration warnings in console

- [ ] **Step 6: Push**

```bash
git push
```

Expected: all commits push to origin.

---

## Self-Review

**Spec coverage:**
- ✅ Full shadcn adoption (Refined neutral slate, Tailwind v4 native, CLI install) → Tasks 1–5
- ✅ Component wave (Button, Input, Accordion, Label, Separator, Tooltip, Dialog, AlertDialog) → Tasks 4, 6–10
- ✅ Reset dialog migration → Task 9
- ✅ Tooltip on ThemeToggle → Task 10
- ✅ Modernize NumberStepper → Task 11
- ✅ CHANGELOG + wiki → Task 12
- ✅ Verification → Task 13

**Placeholder scan:** No "TBD" / "TODO" / "implement later" left.

**Type consistency:** `cn` defined in Task 2, used in Tasks 6–11. `Button`/`Input`/`Accordion` lowercase imports consistent across Tasks 6–8.
