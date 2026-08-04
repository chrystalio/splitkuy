'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
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

  // Load saved bill on mount (after hydration)
  useEffect(() => {
    const saved = loadBill();
    if (saved) {
      dispatch({ type: 'LOAD', payload: saved });
    }
  }, []);

  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    saveBill(bill);
  }, [bill]);

  const summaries = useMemo(() => computePerPersonSummary(bill), [bill]);

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
