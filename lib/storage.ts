// lib/storage.ts

import type { Bill } from './types';

const STORAGE_KEY = 'splitkuy_bill_v1';

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
    return JSON.parse(raw) as Bill;
  } catch {
    // corrupt data → start fresh
    return null;
  }
}

export function clearBill(): void {
  localStorage.removeItem(STORAGE_KEY);
}
