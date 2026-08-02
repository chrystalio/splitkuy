// lib/format.ts

/**
 * Format a number as Indonesian Rupiah string.
 * Input: 125000 → Output: "125.000"
 */
export function formatIDR(amount: number): string {
  return amount.toLocaleString('id-ID'); // Indonesian locale uses . as thousand separator
}

/**
 * Strip non-digit characters from a string input.
 * Input: "12.500" → Output: "12500"
 */
export function parseNumericInput(value: string): string {
  return value.replace(/\D/g, '');
}
