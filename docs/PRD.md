Here is the formal Product Requirements Document for version 1.0 of the application.

### Product Requirements Document (PRD)

**Product:** Split Bill Web Application (MVP v1.0)
**Document Date:** August 2026
**Platform:** Mobile-First Web Application

---

## 1. Product Overview

A frictionless, client-side web application designed to help users accurately split restaurant bills among friends. The v1.0 MVP prioritizes speed and practicality by eliminating user account creation, backend data storage, and complex receipt scanning. The app focuses on mathematically perfect proportional splitting for taxes and discounts, ensuring fair distribution of costs.

## 2. Target Audience & Use Case

* **Target User:** The "Host" (the individual who paid the final bill and needs to collect exact amounts from friends).
* **Primary Use Case:** After a group meal, the Host opens the app, manually inputs the receipt details and participant names, and generates a formatted text summary to paste into a messaging app (e.g., WhatsApp).

## 3. Technical Stack (v1.0)

* **Frontend Framework:** Next.js (App Router).
* **Styling:** Tailwind CSS (Focus on a mobile-first, clean, utility-driven interface).
* **State Management:** React state (`useState`, Context API).
* **Data Persistence:** Browser `localStorage` (Prevents data loss upon accidental page refreshes).
* **Backend/Database:** None (Purely client-side execution for v1.0).

---

## 4. Core Features & Requirements

### 4.1 Data Entry

* **Participant Management:** The Host can add or remove friend names dynamically. Exactly one participant is designated as the Host (the person who paid).
* **Item Input:** The Host can input item names, unit prices, and a total quantity for the line.
* **Item Assignment:** Each item has a total quantity (cap) and per-person assignments (qty ≥ 1 per assigned person, sum ≤ total). Multiple participants can share an item — e.g., 2 es teh assigned to Andi (qty 2) and Budi (qty 1) from a qty-3 line. Uneven per-person quantities are supported.
* **Additional Costs:** All three categories (Discounts, Taxes, Fees) are arrays — multiple entries per category, each optional, each with a label and an amount. Discounts and taxes are applied proportionally to each person's subtotal share; fees are split evenly among all participants.

### 4.2 Output Generation

* **Summary Screen:** A clear breakdown showing exactly what each person owes.
* **Copy to Clipboard:** A single button that compiles the finalized breakdown into a clean, readable text format ready for messaging apps.

---

## 5. Mathematical Logic & Rules

### 5.1 Currency Standard

* The application processes calculations in Indonesian Rupiah (IDR).
* All final output numbers must be whole numbers (no decimal cents).

### 5.2 Proportional Calculation (Taxes & Discounts)

Discounts and taxes are applied proportionally based on the individual's subtotal share, rather than an even flat split.

$$\text{Ratio} = \frac{\text{Total Discount or Tax}}{\text{Subtotal}}$$

$$\text{Adjusted Item Price} = \text{Item Price} \pm (\text{Item Price} \times \text{Ratio})$$

### 5.3 Flat-Fee Calculation

General fees (e.g., delivery, service charges) are divided evenly among all participants.

$$\text{Fee per Person} = \frac{\text{Total Flat Fees}}{\text{Total Number of Participants}}$$

### 5.4 Remainder Reconciliation Logic

Due to proportional percentage math, decimal remainders will occur. The system must perfectly balance the sum of individual owed amounts with the receipt grand total.

1. Perform all calculations using exact floating-point decimals.
2. Round each participant's final owed amount to the nearest whole Rupiah.
3. Sum the rounded totals.
4. Subtract the sum from the actual inputted receipt grand total.
5. Apply any exact discrepancy (the "stray Rupiahs") directly to the **Host's** total to ensure mathematical perfection without user friction.

---

## 6. User Flow

1. **Initialization:** Host opens the web app (blank slate or loads from `localStorage`).
2. **Input Participants:** Host types in the names of everyone involved.
3. **Input Global Values:** Host inputs the Receipt Subtotal, Total Discount, Total Tax, and Total Fees.
4. **Input Items & Assign:** Host adds items and selects which participant ordered what.
5. **Review:** App displays the calculated totals per person in real-time.
6. **Export:** Host clicks "Copy Summary" and shares the text externally.

---

## 7. Out of Scope for v1.0 (Planned for v1.1+)

* Shareable URLs via dynamic routing and a lightweight key-value database.
* PDF invoice generation and export.
* Optical Character Recognition (OCR) / Receipt photo uploading.
* **Fractional split of a single item** (e.g., "Ayam Bakar Rp 50.000, Andi 30% / Budi 70%"). Workaround: enter as two separate line items with the desired amounts. Quantity-based multi-person assignment is in scope.

---

## 8. Reference

Detailed implementation spec (data model, math formulas, component breakdown, validation rules, testing approach): `docs/superpowers/specs/2026-08-02-splitkuy-mvp-design.md`