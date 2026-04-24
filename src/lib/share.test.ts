import { describe, it, expect } from "vitest";
import { encodeShareUrl, decodeShareUrl } from "./share";
import type { SharePayload } from "@/types";

const sampleData: SharePayload = {
  items: [
    { id: "0", name: "Pizza", price: 12.5, quantity: 1 },
    { id: "1", name: "Burger", price: 8, quantity: 2 },
  ],
  people: [
    { id: "0", name: "Alice" },
    { id: "1", name: "Bob" },
  ],
  assignments: [
    { itemId: "0", personId: "0", quantity: 1 },
    { itemId: "1", personId: "1", quantity: 2 },
  ],
  fees: [
    { id: "0", name: "Delivery", splitType: "equal", amount: 5 },
    { id: "1", name: "Tax", splitType: "proportional", amount: 3 },
  ],
  discounts: [],
  currency: "USD",
};

describe("encodeShareUrl / decodeShareUrl", () => {
  it("round-trips data correctly", () => {
    const encoded = encodeShareUrl(sampleData);
    const decoded = decodeShareUrl(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.items).toHaveLength(2);
    expect(decoded!.people).toHaveLength(2);
    expect(decoded!.assignments).toHaveLength(2);
    expect(decoded!.fees).toHaveLength(2);

    expect(decoded!.items[0].name).toBe("Pizza");
    expect(decoded!.items[0].price).toBe(12.5);
    expect(decoded!.people[1].name).toBe("Bob");
    expect(decoded!.assignments[0].quantity).toBe(1);
    expect(decoded!.fees[0].splitType).toBe("equal");
  });

  it("produces a reasonably short URL", () => {
    const encoded = encodeShareUrl(sampleData);
    // With index-based encoding, even a multi-item bill should compress well
    expect(encoded.length).toBeLessThan(2000);
  });

  it("returns null for invalid hash", () => {
    expect(decodeShareUrl("not-valid-compressed-data")).toBeNull();
  });

  it("returns null for empty hash", () => {
    expect(decodeShareUrl("")).toBeNull();
  });

  it("handles data with no fees", () => {
    const data: SharePayload = {
      items: [{ id: "0", name: "Coffee", price: 4.5, quantity: 1 }],
      people: [{ id: "0", name: "Me" }],
      assignments: [{ itemId: "0", personId: "0", quantity: 1 }],
      fees: [],
      discounts: [],
      currency: "USD",
    };
    const encoded = encodeShareUrl(data);
    const decoded = decodeShareUrl(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.fees).toHaveLength(0);
    expect(decoded!.items[0].name).toBe("Coffee");
  });

  it("round-trips currency", () => {
    const data: SharePayload = { ...sampleData, currency: "IDR" };
    const encoded = encodeShareUrl(data);
    const decoded = decodeShareUrl(encoded);
    expect(decoded!.currency).toBe("IDR");
  });
});
