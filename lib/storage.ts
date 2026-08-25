// lib/storage.ts

import type { Bill, Discount, Fee, Item, ItemAssignment, Person, Tax } from './types';

const STORAGE_KEY = 'splitkuy_bill_v1';

// --- Field validators ---
// Each returns true only when the value is structurally valid AND
// numerically sane (finite, non-negative where it makes sense).

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isNonNegativeFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function isNonNegativeInteger(v: unknown): v is number {
  return (
    typeof v === 'number' && Number.isInteger(v) && Number.isFinite(v) && v >= 0
  );
}

function isPositiveInteger(v: unknown): v is number {
  return (
    typeof v === 'number' && Number.isInteger(v) && Number.isFinite(v) && v >= 1
  );
}

// --- Entity validators ---

function isPerson(v: unknown): v is Person {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  if (!isNonEmptyString(p.id)) return false;
  if (typeof p.name !== 'string') return false;
  if (p.isHost !== undefined && typeof p.isHost !== 'boolean') return false;
  return true;
}

function isItemAssignment(v: unknown): v is ItemAssignment {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Record<string, unknown>;
  return isNonEmptyString(a.personId) && isNonNegativeInteger(a.qty);
}

function isItem(v: unknown): v is Item {
  if (typeof v !== 'object' || v === null) return false;
  const i = v as Record<string, unknown>;
  if (!isNonEmptyString(i.id)) return false;
  if (typeof i.name !== 'string') return false;
  if (!isNonNegativeFiniteNumber(i.unitPrice)) return false;
  if (!isPositiveInteger(i.quantity)) return false;
  if (!Array.isArray(i.assignments)) return false;
  if (!i.assignments.every(isItemAssignment)) return false;
  // Quantity invariant: sum of assigned qty must not exceed line qty.
  const assigned = (i.assignments as ItemAssignment[]).reduce(
    (s, a) => s + a.qty,
    0
  );
  if (assigned > i.quantity) return false;
  return true;
}

function isDiscount(v: unknown): v is Discount {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  return (
    isNonEmptyString(d.id) &&
    typeof d.label === 'string' &&
    isNonNegativeFiniteNumber(d.amount)
  );
}

function isTax(v: unknown): v is Tax {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    isNonEmptyString(t.id) &&
    typeof t.label === 'string' &&
    isNonNegativeFiniteNumber(t.amount)
  );
}

function isFee(v: unknown): v is Fee {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return (
    isNonEmptyString(f.id) &&
    typeof f.label === 'string' &&
    isNonNegativeFiniteNumber(f.amount)
  );
}

/**
 * Deep structural validator for a stored Bill. Rejects:
 * - missing or non-array top-level fields
 * - person/item/discount/tax/fee with wrong types
 * - non-finite or negative numbers where they don't make sense
 * - items whose assignments exceed the line quantity
 *
 * On rejection, returns false silently. The caller (loadBill) falls back
 * to a fresh bill — we'd rather lose a saved bill than crash on bad data.
 */
export function isBill(value: unknown): value is Bill {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    Array.isArray(b.people) &&
    Array.isArray(b.items) &&
    Array.isArray(b.discounts) &&
    Array.isArray(b.taxes) &&
    Array.isArray(b.fees) &&
    b.people.every(isPerson) &&
    b.items.every(isItem) &&
    b.discounts.every(isDiscount) &&
    b.taxes.every(isTax) &&
    b.fees.every(isFee)
  );
}

export function saveBill(bill: Bill): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadBill(): Bill | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBill(parsed) ? parsed : null;
  } catch {
    // corrupt data → start fresh
    return null;
  }
}
