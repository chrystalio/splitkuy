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
app/
  layout.tsx    # Root layout with Geist fonts, metadata
  page.tsx      # Home page (currently default Next.js starter)
  globals.css   # Tailwind imports + CSS variables for theming
```

### Design Principles

- **Mobile-first**: Primary target is mobile browsers
- **Client-side only**: No API routes, no database. Use `localStorage` for persistence
- **Reactivity**: Real-time calculation as users input data
- **No auth**: Single "Host" user flow

### Key Files

| File | Purpose |
|------|---------|
| `docs/PRD.md` | Complete product requirements (currency, math logic, user flow) |
| `AGENTS.md` | Agent/instruction hooks for development |
| `app/layout.tsx` | Root layout with font setup and metadata |

### Mathematical Logic (from PRD)

- Currency: Indonesian Rupiah (IDR) — whole numbers only, no decimals
- Taxes/discounts: Proportional split based on each person's subtotal share
- Flat fees: Evenly divided among all participants
- Remainder reconciliation: Any "stray Rupiahs" go to the Host to ensure perfect balance

## Development Notes

- App Router uses React canary features (Server Components by default)
- For interactive components needing client state, add `'use client'` directive
- Dark mode supported via CSS variables in `globals.css`

---

## Knowledge Base

Project-scoped KB lives at `/Users/kristoff/SecondBrainVault/wiki/personal/splitkuy/`. Update it on project scans and significant decisions. See that partition for `notes.md` (inbox) and `log.md` (operation history).
