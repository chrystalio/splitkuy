import type {
  Item,
  Person,
  Fee,
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

export function calculate(
  items: Item[],
  people: Person[],
  assignments: Assignment[],
  fees: Fee[],
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
  let totalItemsCents = 0;
  for (const item of items) {
    const costCents = toCents(item.price) * item.quantity;
    itemCosts.set(item.id, costCents);
    totalItemsCents += costCents;
  }

  // Step 2-3: Allocate items to people and compute subtotals
  const personSubtotals = new Map<string, number>();
  const personItems = new Map<string, { itemId: string; name: string; costCents: number }[]>();
  for (const person of people) {
    personSubtotals.set(person.id, 0);
    personItems.set(person.id, []);
  }

  for (const item of items) {
    const personId = assignmentMap.get(item.id);
    if (!personId) continue;
    const costCents = itemCosts.get(item.id)!;
    personSubtotals.set(personId, (personSubtotals.get(personId) ?? 0) + costCents);
    personItems.get(personId)!.push({ itemId: item.id, name: item.name, costCents });
  }

  // Categorize fees
  const flatEqualFees = fees.filter((f) => f.type === "flat_equal");
  const proportionalFees = fees.filter((f) => f.type === "proportional");
  const flatDiscounts = fees.filter((f) => f.type === "flat_discount");

  // Step 4: Flat equal fee split
  let totalFlatEqualCents = 0;
  for (const fee of flatEqualFees) {
    totalFlatEqualCents += toCents(fee.amount);
  }
  const perPersonFlatCents = Math.floor(totalFlatEqualCents / people.length);
  const flatFeeRemainderCents = totalFlatEqualCents - perPersonFlatCents * people.length;

  // Step 5: Proportional fee split
  const totalProportionalCents = proportionalFees.reduce(
    (sum, f) => sum + toCents(f.amount),
    0,
  );

  // Step 6: Flat discount split
  const totalDiscountCents = flatDiscounts.reduce(
    (sum, f) => sum + toCents(f.amount),
    0,
  );

  // Build per-person results
  const personTotals: PersonTotal[] = [];
  let grandTotalCents = 0;

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const subtotalCents = personSubtotals.get(person.id) ?? 0;

    // Flat equal fee share — first person gets the rounding remainder
    const equalShareCents =
      perPersonFlatCents + (i === 0 ? flatFeeRemainderCents : 0);

    // Proportional fee share
    let proportionalShareCents = 0;
    if (totalItemsCents > 0 && totalProportionalCents > 0) {
      proportionalShareCents = Math.round(
        (subtotalCents * totalProportionalCents) / totalItemsCents,
      );
    }

    // Flat discount share
    let discountShareCents = 0;
    if (totalItemsCents > 0 && totalDiscountCents > 0) {
      discountShareCents = Math.round(
        (subtotalCents * totalDiscountCents) / totalItemsCents,
      );
    }

    const totalCents =
      subtotalCents + equalShareCents + proportionalShareCents - discountShareCents;

    grandTotalCents += totalCents;

    personTotals.push({
      personId: person.id,
      personName: person.name,
      itemSubtotal: toDollars(subtotalCents),
      equalFeeShare: toDollars(equalShareCents),
      proportionalFeeShare: toDollars(proportionalShareCents),
      discountShare: toDollars(discountShareCents),
      total: toDollars(totalCents),
    });
  }

  // Reconcile: the grand total from calc should match sum of items + fees - discounts
  const expectedGrandTotalCents =
    totalItemsCents + totalFlatEqualCents + totalProportionalCents - totalDiscountCents;
  const remainderCents = expectedGrandTotalCents - grandTotalCents;

  // Apply rounding remainder to first person
  if (remainderCents !== 0 && personTotals.length > 0) {
    personTotals[0].total = toDollars(
      toCents(personTotals[0].total) + remainderCents,
    );
    grandTotalCents += remainderCents;
  }

  return {
    people: personTotals,
    grandTotal: toDollars(grandTotalCents),
    remainder: toDollars(remainderCents),
  };
}
