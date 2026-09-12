# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Note: `AGENTS.md` enforces reading `node_modules/next/dist/docs/` before writing code — Next.js 16 in this repo has breaking changes vs. older versions. Do not skip this.

## Project Overview

**SplitKuy** — A mobile-first bill splitting web app for restaurant receipts. Client-side only (no backend), Indonesian Rupiah currency, mathematically perfect proportional splitting.

Product details: See `docs/PRD.md`

## Commands

```bash
bun dev      # Start development server (http://localhost:3000)
bun build    # Production build
bun start    # Start production server
bun lint     # Run ESLint
bunx tsc --noEmit   # TypeScript typecheck (noEmit is set in tsconfig)
bun run test  # Run Vitest suite (note: `bun test` invokes bun's native runner, NOT vitest — use `bun run test`)
```

Note: Project uses **bun** as package manager (bun.lock present).
Tests use **Vitest** (added 2026-08-02). Test files are co-located as `*.test.ts`.

## Tech Stack

- **Next.js 16** with App Router (see bundled docs in `node_modules/next/dist/docs/`)
- **React 19**
- **Tailwind CSS v4** (CSS-based config in `app/globals.css`, uses `@import "tailwindcss"` and `@theme` directive — NOT the old `tailwind.config.js`)
- **TypeScript** (strict mode, path alias `@/*` maps to project root)
- **ESLint** with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

## Architecture

```
app/                      # App Router pages
  layout.tsx              # Root layout (fonts, metadata, ErrorBoundary)
  page.tsx                # Home page
  globals.css             # Tailwind v4 imports + CSS variables (dark mode)
components/               # React components (use 'use client' where needed)
  ui/                     # shadcn/ui primitives (button, input, dialog, etc.)
  BillApp.tsx             # Main app shell
  BillContext.tsx         # Bill state provider
  ExtrasSection.tsx       # Tax/discount/fee inputs
  ItemList.tsx / ItemRow.tsx   # Item management
  PeopleSection.tsx       # Participant management
  SummaryPanel.tsx        # Per-person breakdown
  ErrorBoundary.tsx       # Error catching (also in app/)
hooks/
  useBill.ts              # Consumer hook for BillContext
lib/
  bill-calculator.ts      # Core math: proportional split, remainder to Host
  bill-reducer.ts         # Immutable state transitions
  types.ts                # TypeScript interfaces
  storage.ts              # localStorage persistence
  format.ts               # IDR number formatting
  share-text.ts          # WhatsApp/telegram share generation
  utils.ts                # General helpers
test-utils/               # Shared test utilities and mocks
public/
  sw.js                   # Service worker (PWA offline support)
  manifest.webmanifest    # PWA manifest
```

### Key Directories

| Directory | Purpose |
|----------|---------|
| `components/` | All UI components |
| `components/ui/` | shadcn/ui base components |
| `lib/` | Pure logic, no React dependencies |
| `hooks/` | React context consumers |
| `test-utils/` | Vitest helpers (render-with-bill, mocks) |
| `docs/` | PRD and design docs |

### Design Principles

- **Mobile-first**: Primary target is mobile browsers
- **Client-side only**: No API routes, no database. Use `localStorage` for persistence
- **Reactivity**: Real-time calculation as users input data
- **No auth**: Single "Host" user flow

### Key Files

| File | Purpose |
|------|---------|
| `docs/PRD.md` | Complete product requirements (currency, math logic, user flow) |
| `AGENTS.md` | Agent/instruction hooks (Next.js 16 breaking changes) |
| `lib/bill-calculator.ts` | Core proportional-split math |
| `lib/types.ts` | Core TypeScript types (`Person`, `Item`, `BillState`) |

### Mathematical Logic (from PRD)

- Currency: Indonesian Rupiah (IDR) — whole numbers only, no decimals
- Taxes/discounts: Proportional split based on each person's subtotal share
- Flat fees: Evenly divided among all participants
- Remainder reconciliation: Any "stray Rupiahs" go to the Host to ensure perfect balance

## Development Notes

- App Router uses React canary features (Server Components by default)
- For interactive components needing client state, add `'use client'` directive
- Dark mode supported via CSS variables in `globals.css`
- **PWA**: Hardened for mobile with `manifest.webmanifest` and `sw.js` for basic offline support.

## Gotchas & Quirks

- **IDR Precision**: Always use whole numbers (integers). Never use floating point for Rupiahs.
- **The "Stray Rupiah"**: Due to proportional splitting, totals may not sum perfectly. Always assign the remainder to the **Host** to maintain a perfect balance.
- **Next.js 16**: Heavily diverges from training data. Refer to `node_modules/next/dist/docs/` for any API questions.
- **Vitest**: Use `bun run test`, not `bun test`, to ensure the Vitest suite is executed.

**Code enforcing gotchas:**
- **IDR whole numbers**: All arithmetic uses integers — `item.unitPrice` is `number` but treated as IDR; `Math.round()` at `computePerPersonSummary:101` floors all per-person values.
- **Remainder to Host**: `computePerPersonSummary:115–134` — sums `finalOwed`, computes `remainder`, then adds it to `host.finalOwed` and sets `remainderAbsorbed`. See `bill-calculator.test.ts` → "stray rupiah" / "remainder absorbed" test cases.
- **Flat fees even split**: `personFeeShare:59` uses `Math.round(totalFees / people.length)` — rounds per person rather than proportionally.

---

## Knowledge Base

Project-scoped KB lives at `/Users/kristoff/SecondBrainVault/wiki/personal/splitkuy/`. Update it on project scans and significant decisions. See that partition for `notes.md` (inbox) and `log.md` (operation history).
