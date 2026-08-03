# Shadcn/UI Migration — SplitKuy

**Date:** 2026-08-03
**Status:** Approved
**Approach:** Full adoption (B), refined-neutral palette (A), CLI install, Tailwind v4 native

## Motivation

SplitKuy's hand-rolled UI primitives (`components/ui/Button.tsx`, `Input.tsx`,
`Accordion.tsx`, `NumberStepper.tsx`) work but lack: Radix accessibility,
keyboard nav, focus-visible rings, variant composition via `cva`, and a class
merge utility (`cn()`). Migrating to shadcn/ui gives us:

- **Radix-backed primitives** — ARIA-correct, keyboard-navigable Accordion,
  focus-trapped modal Dialog, accessible Tooltip.
- **Variant composition** — `class-variance-authority` replaces hand-written
  `variantClasses` string maps.
- **A `cn()` utility** (`clsx` + `tailwind-merge`) — correct last-class-wins
  conflict resolution.
- **Future shadcn components** — `npx shadcn@latest add` keeps us current.

This is **not** a visual redesign — the refined-neutral slate palette locked in
v1.1 is preserved. Only the implementation layer changes.

## Approach

- **Full adoption** of shadcn conventions: `components/ui/`, `lib/utils.ts`
  (`cn()`), `components.json`.
- **Install via CLI** `npx shadcn@latest init` then `add` per component.
- **Tailwind v4 native** — no `tailwind.config.*`. shadcn generates CSS
  variables into `app/globals.css` via `@theme inline`; our existing `@theme`
  block is reconciled so both coexist.
- **Base color `slate`** to match the existing palette (minimal override work).

## Scope

### Replace (existing `components/ui/`)

| Existing (camelCase) | shadcn replacement | Notes |
|---|---|---|
| `Button.tsx` | `button.tsx` | variants `primary/secondary/ghost/danger`, sizes `sm/md/lg` mapped to shadcn variants |
| `Input.tsx` | `input.tsx` | form control styling |
| `Accordion.tsx` | `accordion.tsx` | Radix, single/multiple open |
| `NumberStepper.tsx` | *(keep, modernize)* | shadcn has no stepper; rewrite with `cn()` to match |

### Add (new `components/ui/`)

`label`, `separator`, `tooltip`, `dialog`, `alert-dialog` (5 new).

### Dependencies (`package.json`)

- `class-variance-authority`, `clsx`, `tailwind-merge`
- `tailwindcss-animate` (keyframes for Tooltip/Dialog)
- `@radix-ui/react-accordion`, `react-label`, `react-separator`,
  `react-tooltip`, `react-dialog`, `react-slot`

### Consumer migration (`components/*.tsx`)

All components currently importing the camelCase `components/ui/*` switch to the
new lowercase paths, e.g.:

```tsx
import { Button } from '@/components/ui/button'
```

Consumers include `CopyButton`, `ExtrasSection`, `ItemList`, `ItemRow`,
`PeopleSection`, `SummaryPanel`, `InlineAddRow`, `BillApp`, `ThemeToggle`.

### Config

`components.json` (new) — `base: slate`, `tw-v4: true`, `css: app/globals.css`,
`aliases: @/components/ui`, `utils: @/lib/utils`.

## Migration order (decoupled)

1. Add deps + `shadcn init` (generates `components.json`, `lib/utils.ts`)
2. `shadcn add button input accordion label separator tooltip dialog alert-dialog`
3. Reconcile `app/globals.css` — merge shadcn's CSS variables with existing
   `@theme` (slate base, keep `--font-plus-jakarta-sans` overrides)
4. Migrate `Button` consumers
5. Migrate `Input` + `Label` consumers
6. Migrate `Accordion` consumers
7. Migrate `reset bill` `window.confirm` → `AlertDialog`
8. Migrate `ThemeToggle` `title` → `Tooltip`
9. Modernize `NumberStepper` (use `cn()`)
10. Update wiki (`splitkuy.md`, `log.md`) + CHANGELOG

## Verification

- `bunx tsc --noEmit` — clean
- `bun lint` — clean
- `bun run test` — 6/6 pass (math untouched)
- `bun run build` — Next.js build clean
- Manual smoke: Reset bill dialog opens/closes + focus trap; theme toggle
  tooltip; Discounts/Taxes/Fees accordion toggles
- Console: no hydration warnings, no React warnings

## Documentation

- `CHANGELOG.md` `[Unreleased]` → new `### Changed` block
- `wiki/personal/splitkuy/splitkuy.md` → architecture section notes shadcn
- `wiki/personal/splitkuy/log.md` → append session entry
- This spec committed at `docs/superpowers/specs/2026-08-03-shadcn-migration-design.md`

## Out of scope (deferred)

- Adding `lucide-react` icon set (optional)
- `tailwind.config.*` (should already be absent with v4)
- Theme switcher palette rework (refined-neutral stays)
