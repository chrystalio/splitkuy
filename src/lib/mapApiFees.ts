import type { Fee } from "@/types";

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

export function mapApiFeesToStore(
  fees: ApiFee[],
  discounts: ApiDiscount[],
): Fee[] {
  const result: Fee[] = [];

  for (const fee of fees) {
    result.push({
      id: crypto.randomUUID(),
      name: fee.name,
      type: fee.type === "percentage" ? "proportional" : "flat_equal",
      amount: fee.amount,
    });
  }

  for (const disc of discounts) {
    if (disc.appliesTo === "delivery") {
      result.push({
        id: crypto.randomUUID(),
        name: disc.name,
        type: "flat_equal",
        amount: -disc.amount,
      });
    } else {
      result.push({
        id: crypto.randomUUID(),
        name: disc.name,
        type: "flat_discount",
        amount: disc.amount,
      });
    }
  }

  return result;
}
