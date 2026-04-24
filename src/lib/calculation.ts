import type {
  Item,
  Person,
  Fee,
  Discount,
  Assignment,
  PersonTotal,
  CalculationResult,
} from "@/types";

function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Grouped Split Calculation
 *
 * Rule A — Equal Split (Flat Fees & Delivery Offsets):
 *   Fees and discounts in this group are divided EQUALLY among all participants,
 *   regardless of what they ordered.
 *   - Fees: Delivery fee, Order fee, Packaging charge, Small order fee
 *   - Linked Discounts: Any discount where appliesTo === "delivery"
 *   Formula: (Sum of Group A Fees - Sum of Group A Delivery Discounts) / Participant Count
 *
 * Rule B — Proportional Split (Taxes & Food Discounts):
 *   Fees and discounts in this group are split based on each person's share of the subtotal.
 *   - Fees: VAT, Service Charge, Tax (percentage-based)
 *   - Linked Discounts: Discounts where appliesTo === "subtotal"
 *   Formula: (Person Subtotal / Total Subtotal) * (Sum of Group B Fees - Sum of Group B Subtotal Discounts)
 */
export function calculate(
  items: Item[],
  people: Person[],
  assignments: Assignment[],
  fees: Fee[],
  discounts: Discount[],
): CalculationResult {
  if (people.length === 0) {
    return { people: [], grandTotal: 0, remainder: 0 };
  }

  // Build assignment map: itemId -> personId
  const assignmentMap = new Map<string, string>();
  for (const a of assignments) {
    assignmentMap.set(a.itemId, a.personId);
  }

  // Step 1: Calculate each item's cost in cents
  const itemCosts = new Map<string, number>();
  let totalSubtotalCents = 0;
  for (const item of items) {
    const costCents = toCents(item.price) * item.quantity;
    itemCosts.set(item.id, costCents);
    totalSubtotalCents += costCents;
  }

  // Step 2: Compute per-person subtotals
  // Group assignments by item so we can handle multi-person assignments (qty > 1 split across people)
  const itemAssignments = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = itemAssignments.get(a.itemId) ?? [];
    list.push(a);
    itemAssignments.set(a.itemId, list);
  }

  const personSubtotals = new Map<string, number>();
  for (const person of people) {
    personSubtotals.set(person.id, 0);
  }
  for (const item of items) {
    const assigns = itemAssignments.get(item.id) ?? [];
    const itemCost = itemCosts.get(item.id)!;
    const perUnitCost = itemCost / item.quantity;
    for (const a of assigns) {
      const qty = a.quantity ?? item.quantity;
      personSubtotals.set(
        a.personId,
        (personSubtotals.get(a.personId) ?? 0) + perUnitCost * qty,
      );
    }
  }

  // Step 3: Separate fees into Rule A (equal) and Rule B (proportional)
  const ruleAFees = fees.filter((f) => f.splitType === "equal");
  const ruleBFees = fees.filter((f) => f.splitType === "proportional");

  // Step 4: Separate discounts into Rule A (delivery) and Rule B (subtotal)
  const ruleADiscounts = discounts.filter((d) => d.appliesTo === "delivery");
  const ruleBDiscounts = discounts.filter((d) => d.appliesTo === "subtotal");

  // Step 5: Compute Rule A — Equal split
  // Sum of all flat equal-split fees (convert % fees to absolute amounts)
  let totalRuleAFeesCents = 0;
  for (const fee of ruleAFees) {
    if (fee.amount > 0 && fee.amount <= 1) {
      // Treat as decimal multiplier (e.g. 0.1 = 10%)
      totalRuleAFeesCents += Math.round(totalSubtotalCents * fee.amount);
    } else {
      totalRuleAFeesCents += toCents(fee.amount);
    }
  }

  // Sum of all delivery discounts (flat amounts only for Rule A)
  let totalRuleADiscountsCents = 0;
  for (const disc of ruleADiscounts) {
    if (disc.type === "percentage") {
      // Percentage of subtotal, applied as discount
      totalRuleADiscountsCents += Math.round(totalSubtotalCents * (disc.amount / 100));
    } else {
      totalRuleADiscountsCents += toCents(disc.amount);
    }
  }

  const netRuleACents = totalRuleAFeesCents - totalRuleADiscountsCents;
  const perPersonEqualCents = Math.trunc(netRuleACents / people.length);
  const equalRemainderCents = netRuleACents - perPersonEqualCents * people.length;

  // Step 6: Compute Rule B — Proportional split
  // Sum of all proportional fees
  let totalRuleBFeesCents = 0;
  for (const fee of ruleBFees) {
    if (fee.amount > 0 && fee.amount <= 1) {
      totalRuleBFeesCents += Math.round(totalSubtotalCents * fee.amount);
    } else {
      totalRuleBFeesCents += toCents(fee.amount);
    }
  }

  // Sum of all subtotal discounts
  let totalRuleBDiscountsCents = 0;
  for (const disc of ruleBDiscounts) {
    if (disc.type === "percentage") {
      totalRuleBDiscountsCents += Math.round(totalSubtotalCents * (disc.amount / 100));
    } else {
      totalRuleBDiscountsCents += toCents(disc.amount);
    }
  }

  const netRuleBCents = totalRuleBFeesCents - totalRuleBDiscountsCents;

  // Step 7: Build per-person results
  const personTotals: PersonTotal[] = [];
  let grandTotalCents = 0;

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const subtotalCents = personSubtotals.get(person.id) ?? 0;

    // Rule A: equal split share (first person absorbs rounding remainder)
    const equalShareCents = perPersonEqualCents + (i === 0 ? equalRemainderCents : 0);

    // Rule B: proportional fees ADD to share, proportional discounts REDUCE share
    let proportionalFeesCents = 0;
    if (totalSubtotalCents > 0 && totalRuleBFeesCents > 0) {
      proportionalFeesCents = Math.round((subtotalCents * totalRuleBFeesCents) / totalSubtotalCents);
    }
    let proportionalDiscountsCents = 0;
    if (totalSubtotalCents > 0 && totalRuleBDiscountsCents > 0) {
      proportionalDiscountsCents = Math.round((subtotalCents * totalRuleBDiscountsCents) / totalSubtotalCents);
    }
    const proportionalShareCents = proportionalFeesCents - proportionalDiscountsCents;

    const totalCents = subtotalCents + equalShareCents + proportionalShareCents;
    grandTotalCents += totalCents;

    personTotals.push({
      personId: person.id,
      personName: person.name,
      itemSubtotal: toDollars(subtotalCents),
      equalShare: toDollars(equalShareCents),
      proportionalShare: toDollars(proportionalShareCents),
      total: toDollars(totalCents),
    });
  }

  // Step 8: Reconcile rounding
  const expectedGrandCents =
    totalSubtotalCents + totalRuleAFeesCents - totalRuleADiscountsCents + totalRuleBFeesCents - totalRuleBDiscountsCents;
  const remainderCents = expectedGrandCents - grandTotalCents;

  if (remainderCents !== 0 && personTotals.length > 0) {
    personTotals[0].total = toDollars(toCents(personTotals[0].total) + remainderCents);
    grandTotalCents += remainderCents;
  }

  return {
    people: personTotals,
    grandTotal: toDollars(grandTotalCents),
    remainder: toDollars(remainderCents),
  };
}