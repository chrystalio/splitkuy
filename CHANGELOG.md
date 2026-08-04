# Changelog

All notable changes to SplitKuy.

## [Unreleased]

### Features

- **Docker support** — `Dockerfile` + `.dockerignore` for self-hosting. Multi-stage build with `oven/bun:1` builder and `node:22-alpine` runtime, non-root user, HTTP liveness probe via curl. Build: `docker build -t splitkuy .` · Run: `docker run -p 3000:3000 splitkuy`.

### Changed

- **UI primitives migrated to shadcn/ui** — Button, Input, Accordion from `@/components/ui/{button,input,accordion}` (Radix-backed). New components added: `label`, `separator`, `tooltip`, `dialog`, `alert-dialog`. Hand-rolled `NumberStepper` preserved but modernized with `cn()` and 44×44px touch targets.
- **Reset confirmation** — `window.confirm()` replaced by `AlertDialog` with focus trap, keyboard dismissal, and ARIA-correct structure.
- **ThemeToggle** — HTML `title` attribute replaced by `Tooltip` (Radix-powered).
- **Styling utilities** — added `lib/utils.ts` (`cn()` = `clsx` + `tailwind-merge`). New deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `@radix-ui/react-{accordion,label,separator,tooltip,dialog,slot}`, `lucide-react`.
- **CSS variables** — `app/globals.css` now declares shadcn HSL variables (`--background`, `--foreground`, `--primary`, etc.) for the new components. Slate palette and Plus Jakarta Sans retained.
- `next.config.ts`: added `output: "standalone"` so the build emits a minimal `.next/standalone/` tree (only the runtime + traced deps).

### Fixed

- **finalOwed clamped at 0** — a discount larger than a person's subtotal share no longer produces a negative amount owed. When total discounts exceed subtotal, an amber banner ("Discounts exceed subtotal — amounts clamped at Rp 0") appears above the summary cards.
- **localStorage load hardened** — `loadBill` now validates the stored shape with `isBill()` instead of trusting a `JSON.parse` cast; corrupt or partial data falls back to a fresh bill instead of throwing.
- **Dead exports removed** — `parseNumericInput` (format) and `clearBill` (storage) deleted; both were unused.
- **Reducer and summary text now tested** — `billReducer` extracted to `lib/bill-reducer.ts`; `buildWhatsAppText` extracted to `lib/whatsapp.ts`. Both covered by Vitest (13 reducer tests, 4 whatsapp tests, 10 storage tests, 3 format tests).

## [1.1.0] — 2026-08-02

### Features

- **UI redesign** — monochrome slate design system (no gradients, no shadows, no emoji chrome). Plus Jakarta Sans typeface, flat neutral cards, uppercase section labels.
- **Three-way theme toggle** — cycle through system / light / dark. Persisted to `localStorage`, FOUC-safe on first load.
- **Host designation** — tap any person's name to set them as host. Host shown with a green dot on their chip.
- **Reset bill** — button in SummaryPanel to clear the entire bill with a confirmation prompt.
- **Footer credit** — "Made with ☕ by Chrystalio (Kristoff) · © {year}" at the bottom of the app.

### Fixes

- Taxes section title was invisible in dark mode (slate-900 text on slate-900 background).
- `formatIDR` was missing the "Rp" currency prefix.
- Per-person discount/tax/fee shares could display with Indonesian decimal commas (e.g. `Rp 33,333`) for fractional shares — now rounded to whole IDR before display.
- Hydration mismatch on `<html>` element caused by theme class applied before React hydrated.
- `setState` called inside `useEffect` in ThemeToggle — refactored to `useState(getInitialTheme)` form.
- Field widths in Discounts/Taxes/Fees rows were cutting off the amount — label now truncates to give the amount field room.
- Duplicate person name guard with case-insensitive check.

---

## [1.0.0] — 2026-08-02

### Features

- Add/remove participants (People section).
- Add items with per-person quantity assignment (split one item across multiple people).
- Multiple discounts, taxes, and fees — each applied proportionally per person.
- Proportional math with remainder-to-host reconciliation (breakdown always sums exactly to receipt total).
- Summary panel with per-person breakdown and items list.
- Copy summary to clipboard (plain text, WhatsApp-friendly).
- All state persisted to `localStorage`.
- Dark mode (via `prefers-color-scheme` media query).
