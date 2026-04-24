import type { Fee, Discount } from "@/types";

interface ApiFee {
  name: string;
  amount: number;
  type: "flat" | "percentage";
}

interface ApiDiscount {
  name: string;
  amount: number;
  type: "flat" | "percentage";
  appliesTo: "delivery" | "subtotal";
}

/**
 * Maps API fees/discounts to the store Fee and Discount types.
 * Note: This function is currently unused — fees come from the receipt
 * parsing in UploadReceipt.tsx directly. Kept for potential future use.
 */
export function mapApiFeesToStore(
  fees: ApiFee[],
  discounts: ApiDiscount[],
): { fees: Fee[]; discounts: Discount[] } {
  const mappedFees: Fee[] = fees.map((f) => ({
    id: crypto.randomUUID(),
    name: f.name,
    splitType: f.type === "percentage" ? "proportional" : "equal",
    amount: f.amount,
  }));

  const mappedDiscounts: Discount[] = discounts.map((d) => ({
    id: crypto.randomUUID(),
    name: d.name,
    type: d.type,
    appliesTo: d.appliesTo,
    amount: d.amount,
  }));

  return { fees: mappedFees, discounts: mappedDiscounts };
}
