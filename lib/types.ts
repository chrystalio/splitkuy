// lib/types.ts

export interface Person {
  id: string;
  name: string;
  isHost: boolean;
}

export interface ItemAssignment {
  personId: string;
  qty: number; // always >= 1; qty 0 means the person is not in this array
}

export interface Item {
  id: string;
  name: string;
  unitPrice: number; // IDR, whole number
  quantity: number;  // total unit cap for this line
  assignments: ItemAssignment[]; // sparse — sum of qty <= quantity
}

export interface Discount {
  id: string;
  label: string;
  amount: number; // positive, display handles the minus sign
}

export interface Tax {
  id: string;
  label: string;
  amount: number;
}

export interface Fee {
  id: string;
  label: string;
  amount: number;
}

export interface Bill {
  people: Person[];
  items: Item[];
  discounts: Discount[];
  taxes: Tax[];
  fees: Fee[];
}

export interface PerPersonSummary {
  personId: string;
  itemsTotal: number;
  discountShare: number; // negative — discount reduces
  taxShare: number;
  feeShare: number;
  finalOwed: number; // after all math + remainder reconciliation
  remainderAbsorbed: number; // 0 for non-host, > 0 for host
}
