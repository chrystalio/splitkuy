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

/** How a fee is split among participants */
export type SplitType = "equal" | "proportional";

/** A fee or charge from the receipt */
export interface Fee {
  id: string;
  name: string;
  /** "equal" = split equally among all, "proportional" = split by subtotal share */
  splitType: SplitType;
  amount: number;
}

/** A discount from the receipt */
export interface Discount {
  id: string;
  name: string;
  /** "flat" = fixed amount, "percentage" = % of appliesTo base */
  type: "flat" | "percentage";
  /** "delivery" = offsets delivery/flat fees equally, "subtotal" = offsets proportionally */
  appliesTo: "delivery" | "subtotal";
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
  equalShare: number;      // Rule A: net equal-split fees (Group A fees - Group A discounts) / n
  proportionalShare: number; // Rule B: net proportional-share fees and subtotal discounts
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
  discounts: Discount[];
  currency: string;
}
