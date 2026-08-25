# SplitKuy

A mobile-first bill splitting web app for restaurant receipts. No accounts, no sign-ups, no drama.

Split the caffeine, not the headache.

- **Proportional math** - discounts and taxes split exactly by each person's share
- **Per-person quantity** - assign one item to multiple people with quantities
- **Indonesian Rupiah** - whole numbers, no decimals, stray Rupiahs reconciled to host
- **Summary sharing** - copy a formatted breakdown to paste anywhere
- **Offline** - everything runs in your browser, state persists in localStorage

**Live**: https://splitkuy.krisdev.my.id/

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

## Deployment

### Docker

```bash
docker build -t splitkuy .
docker run -p 3000:3000 splitkuy
```

Multi-stage build (`oven/bun:1-alpine` for base → deps → builder → production), non-root user, standalone Next.js output. Healthcheck probes `/` every 30s.

### Jenkins

`Jenkinsfile` automates: checkout → build & push to Docker Hub → SSH-deploy to the target node. Required env vars: `DOCKER_HUB_USER`, `DEPLOY_TARGET_IP`. Required Jenkins credentials: `docker-hub-creds`, `jenkins-deploy-ssh`.

## How It Works

1. Add participant names
2. Add items and assign each to one or more people with quantities
3. Add any discounts, taxes, or fees
4. Review per-person totals in real time
5. Copy the summary and share it anywhere

The math is always exact. If a discount or fee doesn't divide evenly across people, the host absorbs the 1-2 Rupiah discrepancy so the breakdown sums to the receipt total.

## Project Structure

```
splitkuy/
├── app/
│   ├── layout.tsx       # Root layout with fonts, metadata, PWA manifest link
│   ├── page.tsx         # App entry point (renders BillApp inside ErrorBoundary)
│   ├── globals.css      # Tailwind v4 config and CSS variables
│   ├── robots.ts        # /robots.txt
│   └── sitemap.ts       # /sitemap.xml
├── components/          # React components
│   ├── BillApp.tsx      # Main app container
│   ├── BillContext.tsx  # useReducer + localStorage state with hydration gate
│   ├── ErrorBoundary.tsx# Catches render-time throws, recovery UI
│   ├── PeopleSection.tsx
│   ├── InlineAddRow.tsx
│   ├── ItemList.tsx
│   ├── ItemRow.tsx
│   ├── ExtrasSection.tsx
│   ├── SummaryPanel.tsx
│   ├── CopyButton.tsx
│   ├── ThemeToggle.tsx
│   ├── BillContext.test.tsx
│   ├── PeopleSection.test.tsx
│   ├── SummaryPanel.test.tsx
│   └── ui/              # shadcn/ui primitives (Radix + cva)
│       ├── NumberStepper.tsx   # Touch-optimized stepper (in-house)
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       └── tooltip.tsx
├── hooks/
│   └── useBill.ts       # Convenience hook over BillContext
├── lib/
│   ├── bill-calculator.ts    # Core math (proportional split, remainder reconciliation)
│   ├── bill-calculator.test.ts
│   ├── bill-reducer.ts       # Pure reducer for bill state transitions
│   ├── bill-reducer.test.ts
│   ├── format.ts             # IDR currency formatter
│   ├── format.test.ts
│   ├── storage.ts            # localStorage helpers with deep validation
│   ├── storage.test.ts
│   ├── types.ts              # TypeScript interfaces
│   ├── utils.ts              # cn() helper (clsx + tailwind-merge)
│   ├── utils.test.ts
│   ├── share-text.ts         # Builds the plain-text share summary
│   └── share-text.test.ts
├── test-utils/
│   └── render-with-bill.tsx  # Renders components inside a fresh BillProvider
├── public/
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service worker (app-shell caching)
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── og.png                # Open Graph image
├── vitest.config.ts          # jsdom test environment, @/ alias, react plugin
├── vitest.setup.ts           # jest-dom matchers + per-test cleanup
├── components.json           # shadcn/ui configuration
└── docs/
    ├── PRD.md                # Product requirements document
    └── superpowers/          # Design specs and implementation plans
```

## Testing

Pure logic tests run in Vitest's jsdom environment. Run them all:

```bash
bun run test            # one-shot
bun run test:watch      # watch mode
```

Coverage spans three layers:
- **Math / reducer / storage** — `lib/*.test.ts`. Deep validation, proportional split math, remainder reconciliation, share-text formatting.
- **Components** — `components/*.test.tsx` mount real React trees via `renderWithBill()` and exercise the UI flows (add/remove person, host swap, reset dialog, hydration gate).
- **Setup** — `vitest.setup.ts` wires `@testing-library/jest-dom` matchers and clears `localStorage` between tests so state never bleeds.
