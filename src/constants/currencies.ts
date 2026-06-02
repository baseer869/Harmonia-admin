/**
 * Supported currencies (curated). `decimals` is the ISO-4217 minor-unit
 * exponent — required to convert a price ⇄ integer minor units for payments
 * (e.g. EUR/MAD = 2, JPY = 0, KWD = 3).
 */
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
];

export const DEFAULT_CURRENCY = 'MAD';

export function currencyDecimals(code: string): number {
  return CURRENCIES.find((c) => c.code === code)?.decimals ?? 2;
}

/** Convert a human price (e.g. 250.5) to integer minor units for the currency. */
export function toMinorUnits(price: number, code: string): number {
  return Math.round(price * 10 ** currencyDecimals(code));
}

/** Convert integer minor units back to a human price for the currency. */
export function fromMinorUnits(cents: number, code: string): number {
  return cents / 10 ** currencyDecimals(code);
}
