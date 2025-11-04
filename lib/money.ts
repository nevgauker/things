const symbolMap: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  INR: '₹',
};

export function symbolForCurrency(code?: string | null): string | undefined {
  if (!code) return undefined;
  const c = code.toUpperCase();
  return symbolMap[c] || undefined;
}

export function formatAmount(code: string | undefined, amount: number | undefined): string {
  if (amount == null) return '';
  const sym = symbolForCurrency(code);
  return (sym || '') + amount;
}

