# Changelog

All notable changes to SplitKuy.

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
