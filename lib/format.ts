// lib/format.ts

/**
 * Format a number as Indonesian Rupiah string.
 * Input: 125000 → Output: "125.000"
 */
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
