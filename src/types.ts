export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Person {
  id: string;
  name: string;
}

export type FeeType = "flat_equal" | "proportional" | "flat_discount";

export interface Fee {
  id: string;
  name: string;
  type: FeeType;
  amount: number;
}

export interface Assignment {
  itemId: string;
  personId: string;
}

export interface PersonTotal {
  personId: string;
  personName: string;
  itemSubtotal: number;
  equalFeeShare: number;
  proportionalFeeShare: number;
  discountShare: number;
  total: number;
}

export interface CalculationResult {
  people: PersonTotal[];
  grandTotal: number;
  remainder: number;
}

export interface SharePayload {
  items: Item[];
  people: Person[];
  assignments: Assignment[];
  fees: Fee[];
  currency: string;
}
