import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { SharePayload } from "@/types";

export function encodeShareUrl(data: SharePayload): string {
  // Map to compact indices: replace IDs with array indices
  const itemIds = data.items.map((i) => i.id);
  const personIds = data.people.map((p) => p.id);

  const compact = {
    c: data.currency,
    i: data.items.map((item) => [item.name, item.price, item.quantity]),
    p: data.people.map((person) => person.name),
    a: data.assignments.map((a) => [
      itemIds.indexOf(a.itemId),
      personIds.indexOf(a.personId),
    ]),
    f: data.fees.map((fee) => [fee.name, fee.type, fee.amount]),
  };

  const compressed = compressToEncodedURIComponent(JSON.stringify(compact));
  return compressed;
}

export function decodeShareUrl(hash: string): SharePayload | null {
  const decompressed = decompressFromEncodedURIComponent(hash);
  if (!decompressed) return null;

  try {
    const compact = JSON.parse(decompressed);

    if (!Array.isArray(compact.i) || !Array.isArray(compact.p)) return null;

    const items = compact.i.map(
      ([name, price, quantity]: [string, number, number], idx: number) => ({
        id: String(idx),
        name,
        price,
        quantity,
      }),
    );

    const people = compact.p.map((name: string, idx: number) => ({
      id: String(idx),
      name,
    }));

    const assignments = (compact.a ?? []).map(
      ([itemIdx, personIdx]: [number, number]) => ({
        itemId: String(itemIdx),
        personId: String(personIdx),
      }),
    );

    const fees = (compact.f ?? []).map(
      ([name, type, amount]: [string, string, number], idx: number) => ({
        id: String(idx),
        name,
        type,
        amount,
      }),
    );

    return { items, people, assignments, fees, currency: compact.c ?? "USD" };
  } catch {
    return null;
  }
}
