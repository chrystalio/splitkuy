import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { calculate } from "@/lib/calculation";
import type { Item, Person, Fee, Discount, Assignment, CalculationResult, SharePayload } from "@/types";

interface BillState {
  items: Item[];
  people: Person[];
  assignments: Assignment[];
  fees: Fee[];
  discounts: Discount[];
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

  setDiscounts: (discounts: Discount[]) => void;
  addDiscount: (discount: Discount) => void;
  removeDiscount: (id: string) => void;
  updateDiscount: (id: string, patch: Partial<Discount>) => void;

  recompute: () => void;
  loadFromShare: (data: SharePayload) => void;
  reset: () => void;
}

function uuid(): string {
  return crypto.randomUUID();
}

const initialState = {
  items: [] as Item[],
  people: [] as Person[],
  assignments: [] as Assignment[],
  fees: [] as Fee[],
  discounts: [] as Discount[],
  currency: "USD",
  result: null as CalculationResult | null,
};

export const useBillStore = create<BillState>()(
  immer((set, get) => ({
    ...initialState,

    setItems: (items, currency) =>
      set((state) => {
        state.items = items;
        if (currency) state.currency = currency;
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
        const item = state.items.find((i) => i.id === itemId);
        if (!item) return;
        const maxQty = item.quantity;

        const existingIdx = state.assignments.findIndex(
          (a) => a.itemId === itemId && a.personId === personId,
        );

        if (existingIdx !== -1) {
          // Toggle OFF: remove this person's assignment entirely
          state.assignments.splice(existingIdx, 1);
        } else {
          // ADD new assignment (additive — does NOT overwrite other people's assignments)
          // Assign the REMAINING unassigned quantity to this person
          const otherQty = state.assignments
            .filter((a) => a.itemId === itemId && a.personId !== personId)
            .reduce((sum, a) => sum + a.quantity, 0);
          const remainingQty = maxQty - otherQty;
          if (remainingQty > 0) {
            state.assignments.push({ itemId, personId, quantity: remainingQty });
          }
          // If remainingQty <= 0, item is fully assigned — do nothing
        }
      }),

    setFees: (fees) =>
      set((state) => {
        state.fees = fees;
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

    setDiscounts: (discounts) =>
      set((state) => {
        state.discounts = discounts;
      }),

    addDiscount: (discount) =>
      set((state) => {
        state.discounts.push(discount);
      }),

    removeDiscount: (id) =>
      set((state) => {
        state.discounts = state.discounts.filter((d) => d.id !== id);
      }),

    updateDiscount: (id, patch) =>
      set((state) => {
        const idx = state.discounts.findIndex((d) => d.id === id);
        if (idx !== -1) {
          Object.assign(state.discounts[idx], patch);
        }
      }),

    recompute: () =>
      set((state) => {
        state.result = calculate(
          state.items,
          state.people,
          state.assignments,
          state.fees,
          state.discounts,
        );
      }),

    loadFromShare: (data) =>
      set((state) => {
        state.items = data.items;
        state.people = data.people;
        state.assignments = data.assignments;
        state.fees = data.fees;
        state.discounts = data.discounts ?? [];
        state.currency = data.currency ?? "USD";
        state.result = calculate(
          data.items,
          data.people,
          data.assignments,
          data.fees,
          data.discounts ?? [],
        );
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  })),
);
