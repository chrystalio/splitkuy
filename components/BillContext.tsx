'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Bill, Person, Item, Discount, Tax, Fee } from '@/lib/types';
import { saveBill, loadBill } from '@/lib/storage';
import { computePerPersonSummary } from '@/lib/bill-calculator';

// --- State ---

function emptyBill(): Bill {
  return {
    people: [],
    items: [],
    discounts: [],
    taxes: [],
    fees: [],
  };
}

type BillAction =
  | { type: 'ADD_PERSON'; payload: { name: string } }
  | { type: 'REMOVE_PERSON'; payload: { id: string } }
  | { type: 'SET_HOST'; payload: { id: string } }
  | { type: 'ADD_ITEM'; payload: Omit<Item, 'id'> }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | {
      type: 'SET_ASSIGNMENT_QTY';
      payload: { itemId: string; personId: string; qty: number };
    }
  | { type: 'ADD_DISCOUNT'; payload: Omit<Discount, 'id'> }
  | { type: 'REMOVE_DISCOUNT'; payload: { id: string } }
  | { type: 'ADD_TAX'; payload: Omit<Tax, 'id'> }
  | { type: 'REMOVE_TAX'; payload: { id: string } }
  | { type: 'ADD_FEE'; payload: Omit<Fee, 'id'> }
  | { type: 'REMOVE_FEE'; payload: { id: string } }
  | { type: 'LOAD'; payload: Bill }
  | { type: 'RESET' };

function id() {
  return crypto.randomUUID();
}

function billReducer(state: Bill, action: BillAction): Bill {
  switch (action.type) {
    case 'ADD_PERSON': {
      const isFirst = state.people.length === 0;
      const person: Person = {
        id: id(),
        name: action.payload.name,
        isHost: isFirst,
      };
      return { ...state, people: [...state.people, person] };
    }

    case 'REMOVE_PERSON': {
      const people = state.people.filter((p) => p.id !== action.payload.id);
      let { items } = state;

      items = items.map((item) => ({
        ...item,
        assignments: item.assignments.filter(
          (a) => a.personId !== action.payload.id
        ),
      }));

      const removedWasHost = state.people.find(
        (p) => p.id === action.payload.id
      )?.isHost;
      if (removedWasHost && people.length > 0) {
        people[0] = { ...people[0], isHost: true };
      }

      return { ...state, people, items };
    }

    case 'SET_HOST': {
      const people = state.people.map((p) => ({
        ...p,
        isHost: p.id === action.payload.id,
      }));
      return { ...state, people };
    }

    case 'ADD_ITEM': {
      const item: Item = { id: id(), ...action.payload };
      return { ...state, items: [...state.items, item] };
    }

    case 'UPDATE_ITEM': {
      const items = state.items.map((i) =>
        i.id === action.payload.id ? action.payload : i
      );
      return { ...state, items };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };
    }

    case 'SET_ASSIGNMENT_QTY': {
      const { itemId, personId, qty } = action.payload;
      const items = state.items.map((item) => {
        if (item.id !== itemId) return item;

        if (qty === 0) {
          return {
            ...item,
            assignments: item.assignments.filter(
              (a) => a.personId !== personId
            ),
          };
        }

        const existing = item.assignments.find((a) => a.personId === personId);
        if (existing) {
          return {
            ...item,
            assignments: item.assignments.map((a) =>
              a.personId === personId ? { ...a, qty } : a
            ),
          };
        }

        return {
          ...item,
          assignments: [...item.assignments, { personId, qty }],
        };
      });
      return { ...state, items };
    }

    case 'ADD_DISCOUNT':
      return {
        ...state,
        discounts: [...state.discounts, { id: id(), ...action.payload }],
      };
    case 'REMOVE_DISCOUNT':
      return {
        ...state,
        discounts: state.discounts.filter((d) => d.id !== action.payload.id),
      };

    case 'ADD_TAX':
      return {
        ...state,
        taxes: [...state.taxes, { id: id(), ...action.payload }],
      };
    case 'REMOVE_TAX':
      return {
        ...state,
        taxes: state.taxes.filter((t) => t.id !== action.payload.id),
      };

    case 'ADD_FEE':
      return {
        ...state,
        fees: [...state.fees, { id: id(), ...action.payload }],
      };
    case 'REMOVE_FEE':
      return {
        ...state,
        fees: state.fees.filter((f) => f.id !== action.payload.id),
      };

    case 'LOAD':
      return action.payload;
    case 'RESET':
      return emptyBill();

    default:
      return state;
  }
}

// --- Context ---

interface BillContextValue {
  bill: Bill;
  dispatch: Dispatch<BillAction>;
  summaries: ReturnType<typeof computePerPersonSummary>;
}

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: ReactNode }) {
  const [bill, dispatch] = useReducer(billReducer, emptyBill(), (init) => {
    const saved = loadBill();
    return saved ?? init;
  });

  useEffect(() => {
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
