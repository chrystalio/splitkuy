import { describe, it, expect } from "vitest";
import { calculate } from "./calculation";
import type { Item, Person, Assignment, Fee } from "@/types";

const alice: Person = { id: "a", name: "Alice" };
const bob: Person = { id: "b", name: "Bob" };

function item(id: string, name: string, price: number, qty = 1): Item {
  return { id, name, price, quantity: qty };
}

function assign(itemId: string, personId: string): Assignment {
  return { itemId, personId };
}

function fee(id: string, name: string, type: Fee["type"], amount: number): Fee {
  return { id, name, type, amount };
}

describe("calculate", () => {
  it("returns empty result with no people", () => {
    const result = calculate([item("1", "Pizza", 10)], [], [], []);
    expect(result.people).toHaveLength(0);
    expect(result.grandTotal).toBe(0);
  });

  it("splits 3 items between 2 people with no fees", () => {
    const items = [item("1", "Pizza", 10), item("2", "Burger", 8), item("3", "Salad", 6)];
    const assignments = [assign("1", "a"), assign("2", "b"), assign("3", "b")];
    const result = calculate(items, [alice, bob], assignments, []);

    expect(result.people).toHaveLength(2);
    const a = result.people.find((p) => p.personId === "a")!;
    const b = result.people.find((p) => p.personId === "b")!;

    expect(a.itemSubtotal).toBe(10);
    expect(b.itemSubtotal).toBe(14);
    expect(a.total).toBe(10);
    expect(b.total).toBe(14);
    expect(result.grandTotal).toBe(24);
  });

  it("splits flat equal fees (delivery, tax)", () => {
    const items = [item("1", "Pizza", 20)];
    const assignments = [assign("1", "a")];
    const fees = [fee("f1", "Delivery", "flat_equal", 5)];
    const result = calculate(items, [alice], assignments, fees);

    expect(result.people[0].itemSubtotal).toBe(20);
    expect(result.people[0].equalFeeShare).toBe(5);
    expect(result.people[0].total).toBe(25);
    expect(result.grandTotal).toBe(25);
  });

  it("handles flat equal fee rounding remainder", () => {
    const items = [item("1", "Pizza", 10), item("2", "Burger", 10)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const fees = [fee("f1", "Delivery", "flat_equal", 10)];
    const result = calculate(items, [alice, bob], assignments, fees);

    // $10 / 2 = $5 each, no remainder
    expect(result.people[0].equalFeeShare).toBe(5);
    expect(result.people[1].equalFeeShare).toBe(5);
    expect(result.remainder).toBe(0);
  });

  it("handles 1-cent remainder on equal split", () => {
    const items = [item("1", "Pizza", 10), item("2", "Burger", 10), item("3", "Salad", 10)];
    const carol: Person = { id: "c", name: "Carol" };
    const assignments = [assign("1", "a"), assign("2", "b"), assign("3", "c")];
    const fees = [fee("f1", "Delivery", "flat_equal", 0.01)];
    const result = calculate(items, [alice, bob, carol], assignments, fees);

    // $0.01 / 3 = $0.00 each floor, $0.01 remainder to first person
    expect(result.people[0].equalFeeShare).toBe(0.01);
    expect(result.people[1].equalFeeShare).toBe(0);
    expect(result.people[2].equalFeeShare).toBe(0);
  });

  it("splits proportional fees (service charge %)", () => {
    const items = [item("1", "Pizza", 30), item("2", "Burger", 70)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const fees = [fee("f1", "Service Charge", "proportional", 10)]; // 10% of total
    const result = calculate(items, [alice, bob], assignments, fees);

    // Alice: $30 of $100 → 30% of $10 = $3
    expect(result.people[0].proportionalFeeShare).toBe(3);
    // Bob: $70 of $100 → 70% of $10 = $7
    expect(result.people[1].proportionalFeeShare).toBe(7);
    expect(result.grandTotal).toBe(110);
  });

  it("splits flat discounts proportionally", () => {
    const items = [item("1", "Pizza", 30), item("2", "Burger", 70)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const fees = [fee("f1", "Coupon", "flat_discount", 20)];
    const result = calculate(items, [alice, bob], assignments, fees);

    // Alice: $30 of $100 → 30% of $20 = $6 discount
    expect(result.people[0].discountShare).toBe(6);
    // Bob: $70 of $100 → 70% of $20 = $14 discount
    expect(result.people[1].discountShare).toBe(14);

    expect(result.people[0].total).toBe(24); // 30 - 6
    expect(result.people[1].total).toBe(56); // 70 - 14
    expect(result.grandTotal).toBe(80); // 100 - 20
  });

  it("handles single person with all items", () => {
    const items = [item("1", "Pizza", 15), item("2", "Drink", 5)];
    const assignments = [assign("1", "a"), assign("2", "a")];
    const fees = [fee("f1", "Tax", "flat_equal", 2), fee("f2", "Tip", "proportional", 4)];
    const result = calculate(items, [alice], assignments, fees);

    // Items: $20, flat fee: $2, proportional: $4 → total $26
    expect(result.people[0].itemSubtotal).toBe(20);
    expect(result.people[0].equalFeeShare).toBe(2);
    expect(result.people[0].proportionalFeeShare).toBe(4);
    expect(result.people[0].total).toBe(26);
    expect(result.grandTotal).toBe(26);
  });

  it("handles quantity > 1", () => {
    const items = [item("1", "Drink", 5, 3)]; // 3x $5 = $15
    const assignments = [assign("1", "a")];
    const result = calculate(items, [alice], assignments, []);

    expect(result.people[0].itemSubtotal).toBe(15);
    expect(result.grandTotal).toBe(15);
  });

  it("grand total matches expected sum of all components", () => {
    const items = [item("1", "Pizza", 25), item("2", "Pasta", 35)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const fees = [
      fee("f1", "Delivery", "flat_equal", 3),
      fee("f2", "Tax", "proportional", 5),
      fee("f3", "Voucher", "flat_discount", 10),
    ];
    const result = calculate(items, [alice, bob], assignments, fees);

    // Expected: $60 + $3 + $5 - $10 = $58
    const sumOfPersonTotals = result.people.reduce((s, p) => s + p.total, 0);
    expect(sumOfPersonTotals).toBe(result.grandTotal);
    expect(result.grandTotal).toBe(58);
  });

  it("handles zero fees gracefully", () => {
    const items = [item("1", "Pizza", 10)];
    const assignments = [assign("1", "a")];
    const result = calculate(items, [alice], assignments, []);

    expect(result.people[0].equalFeeShare).toBe(0);
    expect(result.people[0].proportionalFeeShare).toBe(0);
    expect(result.people[0].discountShare).toBe(0);
  });
});
