# SplitKuy - Your receipt, their problem.

SplitKuy is an AI-powered bill splitting app. Snap a photo of your receipt, assign items to people, and get fair splits instantly. No accounts, no database, no drama.

## How It Works

```mermaid
flowchart LR
    A[Upload Receipt] --> B[Review Items]
    B --> C[Add People]
    C --> D[Assign Items]
    D --> E[Fees & Discounts]
    E --> F[Results & Share]
    A -.->|Manual Entry| E
```

1. **Upload** - Take a photo of your receipt (or skip for manual entry)
2. **Review** - AI extracts items and prices. Edit if needed.
3. **People** - Type names. No accounts, no sign-up.
4. **Assign** - Tap a person, check off their items. 1 item = 1 person.
5. **Fees** - Add delivery, tax, discounts. Optional - skip if none apply.
6. **Results** - Per-person breakdown. Copy summary or share a link.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **AI:** Google Gemini 1.5 Flash (receipt OCR)

## Status

Work in progress.
