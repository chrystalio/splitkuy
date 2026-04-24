const NO_DECIMAL_CURRENCIES = new Set([
  "IDR", "JPY", "KRW", "VND", "CLP", "PYG", "UGX", "BIF",
  "GNF", "KMF", "MGA", "RWF", "XAF", "XOF", "XPF",
]);

const CURRENCY_SYMBOLS: Record<string, string> = {
  IDR: "Rp",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
  SGD: "S$",
  MYR: "RM",
  THB: "\u0E3F",
  AUD: "A$",
  CAD: "C$",
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const noDecimal = NO_DECIMAL_CURRENCIES.has(currency);

  if (noDecimal) {
    return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
  }

  return `${symbol}${amount.toFixed(2)}`;
}
