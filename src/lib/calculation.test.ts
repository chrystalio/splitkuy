import { describe, it, expect } from "vitest";
import { calculate } from "./calculation";
import type { Item, Person, Assignment, Fee, Discount } from "@/types";

const alice: Person = { id: "a", name: "Alice" };
const bob: Person = { id: "b", name: "Bob" };

function item(id: string, name: string, price: number, qty = 1): Item {
  return { id, name, price, quantity: qty };
}

function assign(itemId: string, personId: string, qty = 1): Assignment {
  return { itemId, personId, quantity: qty };
}

function fee(id: string, name: string, splitType: "equal" | "proportional", amount: number): Fee {
  return { id, name, splitType, amount };
}

function discount(id: string, name: string, type: "flat" | "percentage", appliesTo: "delivery" | "subtotal", amount: number): Discount {
  return { id, name, type, appliesTo, amount };
}

describe("calculate", () => {
  it("returns empty result with no people", () => {
    const result = calculate([item("1", "Pizza", 10)], [], [], [], []);
    expect(result.people).toHaveLength(0);
    expect(result.grandTotal).toBe(0);
  });

  it("splits 3 items between 2 people with no fees", () => {
    const items = [item("1", "Pizza", 10), item("2", "Burger", 8), item("3", "Salad", 6)];
    const assignments = [assign("1", "a"), assign("2", "b"), assign("3", "b")];
    const result = calculate(items, [alice, bob], assignments, [], []);

    expect(result.people).toHaveLength(2);
    const a = result.people.find((p) => p.personId === "a")!;
    const b = result.people.find((p) => p.personId === "b")!;

    expect(a.itemSubtotal).toBe(10);
    expect(b.itemSubtotal).toBe(14);
    expect(a.total).toBe(10);
    expect(b.total).toBe(14);
    expect(result.grandTotal).toBe(24);
  });

  it("splits equal fees between 2 people", () => {
    const items = [item("1", "Pizza", 20)];
    const assignments = [assign("1", "a")];
    const fees = [fee("f1", "Delivery", "equal", 10)];
    const result = calculate(items, [alice, bob], assignments, fees, []);

    // Alice: $20 subtotal + $5 equal share = $25
    // Bob: $0 subtotal + $5 equal share = $5
    expect(result.people.find((p) => p.personId === "a")!.itemSubtotal).toBe(20);
    expect(result.people.find((p) => p.personId === "b")!.itemSubtotal).toBe(0);
    expect(result.people.find((p) => p.personId === "a")!.total).toBe(25);
    expect(result.people.find((p) => p.personId === "b")!.total).toBe(5);
    expect(result.grandTotal).toBe(30);
  });

  it("splits proportional fees by subtotal share", () => {
    const items = [item("1", "Pizza", 30), item("2", "Burger", 70)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const fees = [fee("f1", "Service Charge", "proportional", 10)]; // 10% of total
    const result = calculate(items, [alice, bob], assignments, fees, []);

    // Alice: $30 of $100 → 30% of $10 = $3 proportional share
    // Bob: $70 of $100 → 70% of $10 = $7 proportional share
    expect(result.people.find((p) => p.personId === "a")!.proportionalShare).toBe(3);
    expect(result.people.find((p) => p.personId === "b")!.proportionalShare).toBe(7);
    expect(result.grandTotal).toBe(110);
  });

  it("handles qty > 1 with full assignment to one person", () => {
    const items = [item("1", "Drink", 5, 3)]; // 3x $5 = $15
    const assignments = [assign("1", "a", 3)]; // assign all 3 units to Alice
    const result = calculate(items, [alice], assignments, [], []);

    expect(result.people[0].itemSubtotal).toBe(15);
    expect(result.grandTotal).toBe(15);
  });

  it("splits qty=2 across two people (partial assignment)", () => {
    const items = [item("1", "Mie Ayam", 10, 2)]; // 2x $10 = $20
    // Andi gets 1 unit, Budi gets 1 unit
    const assignments = [assign("1", "a", 1), assign("1", "b", 1)];
    const result = calculate(items, [alice, bob], assignments, [], []);

    expect(result.people.find((p) => p.personId === "a")!.itemSubtotal).toBe(10);
    expect(result.people.find((p) => p.personId === "b")!.itemSubtotal).toBe(10);
    expect(result.grandTotal).toBe(20);
  });

  it("handles all items assigned to one person", () => {
    const items = [item("1", "Pizza", 15), item("2", "Drink", 5)];
    const assignments = [assign("1", "a"), assign("2", "a")];
    const fees = [fee("f1", "Tax", "equal", 2), fee("f2", "Service", "proportional", 4)];
    const result = calculate(items, [alice], assignments, fees, []);

    // Items: $20, equal fee: $2, proportional: $4 → total $26
    expect(result.people[0].itemSubtotal).toBe(20);
    expect(result.people[0].equalShare).toBe(2);
    expect(result.people[0].proportionalShare).toBe(4);
    expect(result.people[0].total).toBe(26);
    expect(result.grandTotal).toBe(26);
  });

  it("grand total matches expected sum of all components", () => {
    const items = [item("1", "Pizza", 25), item("2", "Pasta", 35)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const fees = [
      fee("f1", "Delivery", "equal", 6),
      fee("f2", "Tax", "proportional", 5),
    ];
    const result = calculate(items, [alice, bob], assignments, fees, []);

    // Subtotal: $60, equal fees: $6, proportional: $5 → grandTotal = $71
    const sumOfPersonTotals = result.people.reduce((s, p) => s + p.total, 0);
    expect(sumOfPersonTotals).toBe(result.grandTotal);
    expect(result.grandTotal).toBe(71);
  });

  it("handles zero fees gracefully", () => {
    const items = [item("1", "Pizza", 10)];
    const assignments = [assign("1", "a")];
    const result = calculate(items, [alice], assignments, [], []);

    expect(result.people[0].equalShare).toBe(0);
    expect(result.people[0].proportionalShare).toBe(0);
  });

  it("handles subtotal discounts proportionally", () => {
    const items = [item("1", "Pizza", 50), item("2", "Burger", 50)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const discounts = [discount("d1", "Voucher", "flat", "subtotal", 20)];
    const result = calculate(items, [alice, bob], assignments, [], discounts);

    // Subtotal: $100, discount: $20 off proportionally
    // Alice: $50 → 50% of $20 = $10 discount → $40
    // Bob: $50 → 50% of $20 = $10 discount → $40
    expect(result.people.find((p) => p.personId === "a")!.total).toBe(40);
    expect(result.people.find((p) => p.personId === "b")!.total).toBe(40);
    expect(result.grandTotal).toBe(80);
  });

  it("handles delivery discounts equally", () => {
    const items = [item("1", "Pizza", 50), item("2", "Burger", 50)];
    const assignments = [assign("1", "a"), assign("2", "b")];
    const discounts = [discount("d1", "Delivery Off", "flat", "delivery", 6)];
    const result = calculate(items, [alice, bob], assignments, [], discounts);

    // Equal split: $6 delivery discount / 2 = $3 each off their share
    // Alice: $50 - $3 = $47; Bob: $50 - $3 = $47
    expect(result.people.find((p) => p.personId === "a")!.total).toBe(47);
    expect(result.people.find((p) => p.personId === "b")!.total).toBe(47);
    expect(result.grandTotal).toBe(94);
  });
});
