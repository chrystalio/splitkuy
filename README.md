# SplitKuy

A mobile-first bill splitting web app for restaurant receipts. No accounts, no sign-ups, no drama.

Split the caffeine, not the headache.

- **Proportional math** — discounts and taxes split exactly by each person's share
- **Per-person quantity** — assign one item to multiple people with quantities
- **Indonesian Rupiah** — whole numbers, no decimals, stray Rupiahs reconciled to host
- **WhatsApp-ready** — copy a formatted summary to paste directly into chat
- **Offline** — everything runs in your browser, state persists in localStorage

## Tech Stack

Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript · bun

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Production build |
| `bun start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run Vitest suite |
| `bun run test:watch` | Watch mode |

## How It Works

1. Add participant names
2. Add items and assign each to one or more people with quantities
3. Add any discounts, taxes, or fees
4. Review per-person totals in real time
5. Copy summary and paste into WhatsApp

The math is always exact — if a discount or fee doesn't divide evenly across people, the host absorbs the 1–2 Rupiah discrepancy so the breakdown sums to the receipt total.

## Project Structure

```
splitkuy/
├── app/
│   ├── layout.tsx       # Root layout with fonts and metadata
│   ├── page.tsx         # App entry point
│   └── globals.css      # Tailwind v4 config and CSS variables
├── components/          # React components
│   ├── BillApp.tsx      # Main app container
│   ├── BillContext.tsx  # useReducer + localStorage state
│   ├── PeopleSection.tsx
│   ├── InlineAddRow.tsx
│   ├── ItemList.tsx
│   ├── ItemRow.tsx
│   ├── ExtrasSection.tsx
│   ├── SummaryPanel.tsx
│   ├── CopyButton.tsx
│   ├── ThemeToggle.tsx
│   └── ui/              # Primitives: Accordion, Button, Input, NumberStepper
├── hooks/
│   └── useBill.ts       # Convenience hook over BillContext
├── lib/
│   ├── bill-calculator.ts    # Core math (proportional split, remainder reconciliation)
│   ├── bill-calculator.test.ts
│   ├── format.ts            # IDR currency formatter
│   ├── types.ts             # TypeScript interfaces
│   └── storage.ts           # localStorage helpers
└── docs/
    └── PRD.md               # Product requirements document
```
