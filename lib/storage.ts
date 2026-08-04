// lib/storage.ts

import type { Bill } from './types';

const STORAGE_KEY = 'splitkuy_bill_v1';

export function isBill(value: unknown): value is Bill {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    Array.isArray(b.people) &&
    Array.isArray(b.items) &&
    Array.isArray(b.discounts) &&
    Array.isArray(b.taxes) &&
    Array.isArray(b.fees) &&
    b.people.every((p) => {
      if (typeof p !== 'object' || p === null) return false;
      const person = p as Record<string, unknown>;
      return (
        typeof person.id === 'string' &&
        typeof person.name === 'string'
      );
    })
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
