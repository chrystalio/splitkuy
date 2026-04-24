import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { calculate } from "@/lib/calculation";
import type { Item, Person, Fee, Assignment, CalculationResult, SharePayload } from "@/types";

interface BillState {
  items: Item[];
  people: Person[];
  assignments: Assignment[];
  fees: Fee[];
  currency: string;
  result: CalculationResult | null;

  setItems: (items: Item[], currency?: string) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;

  addPerson: (name: string) => void;
  removePerson: (id: string) => void;

  toggleAssignment: (itemId: string, personId: string) => void;

  setFees: (fees: Fee[]) => void;
  addFee: (fee: Fee) => void;
  removeFee: (id: string) => void;
  updateFee: (id: string, patch: Partial<Fee>) => void;

  recompute: () => void;
  loadFromShare: (data: SharePayload) => void;
  reset: () => void;
}

function uuid(): string {
  return crypto.randomUUID();
}

const initialState = {
  items: [],
  people: [],
  assignments: [],
  fees: [],
  currency: "USD",
  result: null,
};

export const useBillStore = create<BillState>()(
  immer((set, get) => ({
    ...initialState,

    setItems: (items, currency) =>
      set((state) => {
        state.items = items;
        if (currency) state.currency = currency;
        // Remove assignments for items that no longer exist
        const itemIds = new Set(items.map((i) => i.id));
        state.assignments = state.assignments.filter((a) => itemIds.has(a.itemId));
      }),

    addItem: (item) =>
      set((state) => {
        state.items.push(item);
      }),

    removeItem: (id) =>
      set((state) => {
        state.items = state.items.filter((i) => i.id !== id);
        state.assignments = state.assignments.filter((a) => a.itemId !== id);
      }),

    updateItem: (id, patch) =>
      set((state) => {
        const idx = state.items.findIndex((i) => i.id === id);
        if (idx !== -1) {
          Object.assign(state.items[idx], patch);
        }
      }),

    addPerson: (name) =>
      set((state) => {
        state.people.push({ id: uuid(), name });
      }),

    removePerson: (id) =>
      set((state) => {
        state.people = state.people.filter((p) => p.id !== id);
        state.assignments = state.assignments.filter((a) => a.personId !== id);
      }),

    toggleAssignment: (itemId, personId) =>
      set((state) => {
        const existingIdx = state.assignments.findIndex((a) => a.itemId === itemId);
        if (existingIdx !== -1) {
          const existing = state.assignments[existingIdx];
          if (existing.personId === personId) {
            // Toggle off: remove assignment
            state.assignments.splice(existingIdx, 1);
          } else {
            // Reassign to different person
            existing.personId = personId;
          }
        } else {
          // New assignment
          state.assignments.push({ itemId, personId });
        }
      }),

    addFee: (fee) =>
      set((state) => {
        state.fees.push(fee);
      }),

    removeFee: (id) =>
      set((state) => {
        state.fees = state.fees.filter((f) => f.id !== id);
      }),

    updateFee: (id, patch) =>
      set((state) => {
        const idx = state.fees.findIndex((f) => f.id === id);
        if (idx !== -1) {
          Object.assign(state.fees[idx], patch);
        }
      }),

    recompute: () =>
      set((state) => {
        state.result = calculate(
          state.items,
          state.people,
          state.assignments,
          state.fees,
        );
      }),

    loadFromShare: (data) =>
      set((state) => {
        state.items = data.items;
        state.people = data.people;
        state.assignments = data.assignments;
        state.fees = data.fees;
        state.currency = data.currency ?? "USD";
        state.result = calculate(data.items, data.people, data.assignments, data.fees);
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  })),
);
