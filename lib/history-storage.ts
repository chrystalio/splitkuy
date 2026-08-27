// lib/history-storage.ts

import type { Bill, HistoryEntry, PerPersonSummary } from './types';
import { isBill } from './storage';

const HISTORY_KEY = 'splitkuy_history_v1';
const MAX_ENTRIES = 50;

// --- Field validators ---

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isNonNegativeFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

// --- Entity validators ---

function isPerPersonSummary(v: unknown): v is PerPersonSummary {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    isNonEmptyString(s.personId) &&
    typeof s.itemsTotal === 'number' &&
    typeof s.discountShare === 'number' &&
    typeof s.taxShare === 'number' &&
    typeof s.feeShare === 'number' &&
    typeof s.finalOwed === 'number' &&
    typeof s.remainderAbsorbed === 'number'
  );
}

function isHistoryEntry(v: unknown): v is HistoryEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    isNonEmptyString(e.id) &&
    isNonEmptyString(e.savedAt) &&
    isNonEmptyString(e.billLabel) &&
    isBill(e.bill) &&
    Array.isArray(e.summaries) &&
    e.summaries.every(isPerPersonSummary) &&
    isNonNegativeFiniteNumber(e.grandTotal)
  );
}

// --- CRUD ---

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any corrupt entries rather than discarding the whole list
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  try {
    const history = loadHistory();
    // Prepend (newest first), cap at MAX_ENTRIES
    history.unshift(entry);
    if (history.length > MAX_ENTRIES) {
      history.length = MAX_ENTRIES;
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function deleteHistoryEntry(id: string): void {
  try {
    const history = loadHistory();
    const filtered = history.filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    // silently ignore
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // silently ignore
  }
}
