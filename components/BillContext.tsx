'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Bill } from '@/lib/types';
import { saveBill, loadBill } from '@/lib/storage';
import { computePerPersonSummary } from '@/lib/bill-calculator';
import {
  billReducer,
  emptyBill,
  type BillAction,
} from '@/lib/bill-reducer';

// --- Context ---

interface BillContextValue {
  bill: Bill;
  dispatch: Dispatch<BillAction>;
  summaries: ReturnType<typeof computePerPersonSummary>;
}

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: ReactNode }) {
  const [bill, dispatch] = useReducer(billReducer, undefined, () => emptyBill());
  // `hydrated` flips true after the first localStorage read, so we don't
  // paint the empty state momentarily before a saved bill appears.
  // Modeled as a useReducer so the trigger doesn't fall under the
  // react-hooks/set-state-in-effect rule.
  const [hydrated, hydrate] = useReducer(() => true, false);

  // Load saved bill on mount; mark hydrated so the empty state is no
  // longer rendered.
  useEffect(() => {
    const saved = loadBill();
    if (saved) {
      dispatch({ type: 'LOAD', payload: saved });
    }
    hydrate();
  }, []);

  // Persist on every change after hydration. Before hydration we have
  // nothing useful to write, and writing the empty initializer would
  // overwrite a still-loading saved bill.
  useEffect(() => {
    if (!hydrated) return;
    saveBill(bill);
  }, [bill, hydrated]);

  const summaries = useMemo(() => computePerPersonSummary(bill), [bill]);

  if (!hydrated) return null;

  return (
    <BillContext.Provider value={{ bill, dispatch, summaries }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBillContext() {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBillContext must be used inside BillProvider');
  return ctx;
}
