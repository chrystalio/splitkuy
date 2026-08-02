# SplitKuy UI Redesign — Spec

> **Date:** 2026-08-02
> **Status:** Approved by user; ready for implementation plan
> **Scope:** Visual redesign of the existing MVP. No behavioral changes, no new features. Same components, same data model, same math — only the look changes.

## 1. Goal

Bring the existing SplitKuy MVP to a cleaner, more deliberate visual standard. Move from "default Next.js starter with random color coding" to a coherent minimalist monochrome system. Eliminate the AI-slop feel (competing colors, emoji as icon, dashed blue buttons) without sacrificing any existing functionality.

## 2. Design Principles (locked)

1. **Monochrome** — slate/black on white. No accent colors at all. The only exception is `text-red-500` for functional error states (duplicate name, stray-Rupiahs note). Zero brand colors to defend.
2. **No gradients. No shadows. No emoji-as-icon.** Borders are 1px slate-200 in light / slate-700 in dark. Radius ~10px on cards, 999px on chips. The food emoji 🍽️ in the WhatsApp copy is allowed (it's content, not UI chrome).
3. **Flat typography hierarchy.** Section labels are uppercase with letter-spacing for hierarchy, not color. Weights: 700 for the app title and per-person amounts, 600 for primary content, 500 for labels, 400 for body.
4. **Generous whitespace.** 24px between header and first section, 16px between sections, 12px inside cards. Mobile-first at 380px content width.
5. **Both modes treated equally.** Dark mode is not an afterthought — both palettes are refined, not just inverted.

## 3. Typography

- **Font family:** Plus Jakarta Sans (load from Google Fonts)
  - Weights: 400, 500, 600, 700
  - Replaces the current Geist font (which stays installed but is no longer used)
- **Layout:**
  - App title: 22px / 700
  - Tagline: 14px / 600
  - Description: 12px / 400, slate-400
  - Section labels (PEOPLE, SUMMARY): 12px / 600, uppercase, letter-spacing 0.06em, slate-500
  - Card titles (Discounts/Taxes/Fees): 13px / 500, slate-900
  - Person name: 13px / 600, slate-900
  - Person amount: 14px / 700, slate-900
  - Body / metadata: 11–12px / 400, slate-500 or slate-400

## 4. Color Palette

No custom token system is introduced — these values map 1:1 onto Tailwind's built-in slate scale (see §6). The table is a reference for what each utility resolves to, not a CSS token definition.

### Light mode (default)

| Tailwind utility | Value | Used for |
|---|---|---|
| `bg-slate-50` | `#fafafa` | Page background (`--bg-app`) |
| `bg-white` | `#ffffff` | Card background |
| `bg-slate-100` | `#f1f5f9` | Person chips, neutral surfaces |
| `text-slate-900` | `#0f172a` | Headings, primary text |
| `text-slate-600` | `#475569` | Tagline, secondary text |
| `text-slate-400` | `#94a3b8` | Body metadata |
| `text-slate-500` | `#64748b` | Section labels |
| `border-slate-200` | `#e2e8f0` | 1px borders on cards, inputs |
| `border-slate-300` | `#cbd5e1` | Add item button dashed border |

### Dark mode

| Tailwind utility | Value | Used for |
|---|---|---|
| `bg-slate-900` | `#0f172a` | Page background (`--bg-app`) |
| `bg-slate-800` | `#1e293b` | Card background (one step up) |
| `bg-slate-700` | `#334155` | Person chips |
| `text-slate-100` | `#f1f5f9` | Headings, primary text |
| `text-slate-300` | `#cbd5e1` | Tagline, secondary text |
| `text-slate-500` | `#64748b` | Body metadata |
| `text-slate-400` | `#94a3b8` | Section labels |
| `border-slate-700` | `#334155` | 1px borders on cards, inputs |
| `border-slate-600` | `#475569` | Add item button dashed border |

## 5. Component changes

### 5.1 App shell (`app/layout.tsx`, `app/page.tsx`, `components/BillApp.tsx`)

- Add Plus Jakarta Sans via `next/font/google` (replacing Geist)
- Page background changes from `bg-white` to `bg-[#fafafa]` (light) / `bg-[#0f172a]` (dark)
- Container `max-w-lg` stays, but `py-6` → `py-8`, `px-4` → `px-5`
- App title: `SplitKuy` (no emoji) at 22px / 700
- Add tagline: "Split the caffeine, not the headache." at 14px / 600, `text-slate-600 dark:text-slate-300`
- Add description: "A frictionless web app for team lunch and coffee runs with proportional tax math. No accounts, no sign-ups, no drama." at 12px / 400, `text-slate-400 dark:text-slate-500`
- Section order stays: People → Extras → Item list → Summary

### 5.2 People section (`components/PeopleSection.tsx`)

- Person chips become neutral: `bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100`
- All chips identical — no green dot, no host coloring. The host is functionally marked only by the muted `· host` suffix in the summary card (§5.5), and only because the host absorbs stray Rupiahs. Low emphasis by design.
- Remove the blue fill from non-host chips
- Section header: `PEOPLE` uppercase label, no count, no `▸` chevron
- Empty state: `text-slate-400 dark:text-slate-500` "No people yet"
- Input border: `border-slate-200 dark:border-slate-700`, focus ring `focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100`
- Add button: stays black/white primary, becomes `rounded-lg` to match input
- Keep duplicate-name error message (red, inline below input)

### 5.3 Extras section (`components/ExtrasSection.tsx`)

- All three cards (Discounts / Taxes / Fees) keep separate accordion structure
- Card title color: `#0f172a` (slate-900) in light, `#f1f5f9` (slate-100) in dark — no per-card colors
- Remove the `color={...}` prop from `EditableExtraCard` entirely
- Card border-radius bumps from 8px to 10px for consistency
- Discount amount rendering keeps the `−` prefix for negative sign
- Add row inputs and the `+ add {title}` link keep neutral styling

### 5.4 Item list (`components/ItemList.tsx`, `components/ItemRow.tsx`, `components/InlineAddRow.tsx`)

- **Add item button**: changes from blue dashed (`border-blue-300 bg-blue-50 text-blue-600`) to neutral dashed (`border-slate-300 dark:border-slate-600 bg-transparent text-slate-500 dark:text-slate-400`)
- Inline form: stays inside a white card with 1px border
- Item rows: stay minimal, white card with 1px border

### 5.5 Summary panel (`components/SummaryPanel.tsx`)

- Section header: `SUMMARY` uppercase label on left, total amount on right (no `▸`)
- Per-person cards: white bg, 1px slate-200 border, 10px radius, 12px padding
- Person name: `text-slate-900 dark:text-slate-100` (all names the same color)
- Host marker (low emphasis): inline `· host` text in `text-slate-400 dark:text-slate-500` at 11px / 500, after the name. Functional only (host absorbs stray Rupiahs); not visually privileged.
- Per-person amount: `font-bold text-slate-900 dark:text-slate-100`
- Breakdown lines (Items / Discounts / Tax / Fees): `text-slate-500 dark:text-slate-400` at 12px / 400
- "Host absorbs X stray Rupiahs" stays red (`text-red-500`) — functional error color, not brand
- Copy button: stays primary black, `rounded-lg`, full-width. Label is generic `"Copy summary"` — no WhatsApp reference at the call site. The button component (`CopyButton`) remains a reusable generic copy button (takes `text`/`label`/`disabled` props); the WhatsApp-formatted text is only assembled inside `buildWhatsAppText` and passed in.

### 5.6 Button component (`components/ui/Button.tsx`)

- Primary variant: `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900` (high contrast)
- Secondary variant: `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100`
- Ghost variant: `text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`
- Danger variant stays red (for destructive actions)
- Default radius: `rounded-lg` (8px) — small enough to feel like a button, not a card
- No hover scale, no transitions beyond `transition-colors duration-150`

### 5.7 Input component (`components/ui/Input.tsx`)

- Border: `border-slate-200 dark:border-slate-700`
- Focus: `focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent`
- Radius: `rounded-lg`
- Padding: `px-3 py-2`
- Background: `bg-white dark:bg-slate-800`
- Placeholder color: `placeholder:text-slate-400 dark:placeholder:text-slate-500`

### 5.8 NumberStepper component (`components/ui/NumberStepper.tsx`)

- Buttons use the Button component (already wired)
- Display number in `tabular-nums` to keep widths stable as values change
- No background color on the value — just text

### 5.9 Accordion component (`components/ui/Accordion.tsx`)

- Keep the right-aligned summary total when collapsed — removing it would hide info (discount/tax/fee totals) the user currently sees without expanding, violating the "no behavioral changes" constraint. The total renders in `text-slate-500 dark:text-slate-400`.
- Chevron stays (`▸` / `▾`)
- Border-radius: 10px
- Title color is always `text-slate-900 dark:text-slate-100` (the per-card `color` prop is removed)

## 6. CSS Variables (`app/globals.css`)

No custom Tailwind token system is introduced. The palette uses Tailwind's built-in slate scale directly. Only the body background needs explicit CSS variables (the page background differs from `bg-white` used inside cards):

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
}
```

Plus Jakarta Sans is loaded via `next/font/google` and the variable is added to `@theme` in place of Geist.

```css
@theme inline {
  --font-sans: var(--font-plus-jakarta-sans);
}
```

## 7. Out of scope

- Behavioral changes (no new features, no schema changes, no math changes)
- Mobile breakpoints beyond 380px (the app is single-column; desktop just shows whitespace)
- Custom illustrations or icons (no Lucide / Heroicons library added — plain text and Unicode characters only)
- Animation beyond `transition-colors duration-150`
- Light/dark mode toggle (still OS-driven via `prefers-color-scheme`)
- Tests for visual changes (no snapshot tests, no visual regression — the change is style-only and verified by eyeballing)

## 8. Reference

Mockup walkthrough captured at `.superpowers/brainstorm/53037-1785665666/content/design-direction.html` in the project. Each component decision traces back to one of the locked brainstorming screens (`current-state.html`, `people-section.html`, `add-item-button.html`, `decisions-so-far.html`).
