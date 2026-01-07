/**
 * Market Lock Configuration
 *
 * Controls which countries/markets are allowed for new signups.
 * Set APP_MARKET_LOCK=NZ in production to restrict to New Zealand only.
 * Leave empty or unset in dev to allow all markets.
 */

export const MARKET_LOCK = process.env.APP_MARKET_LOCK || null;

export const ALL_COUNTRIES = ['Australia', 'New Zealand'] as const;
export type Country = typeof ALL_COUNTRIES[number];

/**
 * Get list of countries allowed based on market lock setting
 */
export function getAllowedCountries(): readonly string[] {
  if (MARKET_LOCK === 'NZ') {
    return ['New Zealand'];
  }
  if (MARKET_LOCK === 'AU') {
    return ['Australia'];
  }
  // Default: allow all
  return ALL_COUNTRIES;
}

/**
 * Check if a country is currently allowed
 */
export function isCountryAllowed(country: string): boolean {
  return getAllowedCountries().includes(country);
}

/**
 * Get the default country for new signups
 */
export function getDefaultCountry(): string {
  const allowed = getAllowedCountries();
  return allowed[0]; // First allowed country
}
