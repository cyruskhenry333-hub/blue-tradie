/**
 * Market Lock Configuration
 *
 * Controls which countries/markets are allowed for new signups.
 * Set APP_MARKET_LOCK=NZ in production to restrict to New Zealand only.
 * Leave empty or unset in dev to allow all markets.
 *
 * Runtime config injection:
 * - Server: reads process.env.APP_MARKET_LOCK at runtime
 * - Client: reads window.__BT_CONFIG__.marketLock (injected by server)
 */

// TypeScript declaration for injected config
declare global {
  interface Window {
    __BT_CONFIG__?: {
      marketLock: string | null;
    };
  }
}

/**
 * Get market lock value at runtime
 * Works in both browser (via injected window.__BT_CONFIG__) and server (via process.env)
 */
function getMarketLock(): string | null {
  // In browser: read from injected config
  if (typeof window !== 'undefined') {
    return window.__BT_CONFIG__?.marketLock || null;
  }

  // On server: read from environment variable
  return process.env.APP_MARKET_LOCK || null;
}

export const ALL_COUNTRIES = ['Australia', 'New Zealand'] as const;
export type Country = typeof ALL_COUNTRIES[number];

/**
 * Get list of countries allowed based on market lock setting
 */
export function getAllowedCountries(): readonly string[] {
  const marketLock = getMarketLock();

  if (marketLock === 'NZ') {
    return ['New Zealand'];
  }
  if (marketLock === 'AU') {
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

/**
 * Market-specific UI defaults and placeholders
 *
 * These functions return appropriate defaults based on the current market lock.
 * When only NZ is allowed, returns NZ examples. When only AU, returns AU examples.
 * When both allowed, returns neutral or dual examples.
 */

/**
 * Get service area placeholder text
 */
export function getServiceAreaPlaceholder(): string {
  const defaultCountry = getDefaultCountry();

  if (defaultCountry === 'New Zealand') {
    return 'e.g., Auckland Central, Wellington';
  }
  if (defaultCountry === 'Australia') {
    return 'e.g., Sydney Metro, Melbourne CBD';
  }
  // Both allowed - show examples from both
  return 'e.g., Sydney Metro, Auckland Central';
}

/**
 * Get currency code for the default market
 */
export function getDefaultCurrency(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'NZD' : 'AUD';
}

/**
 * Get business ID label (ABN vs NZBN)
 */
export function getBusinessIdLabel(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'NZBN' : 'ABN';
}

/**
 * Get tax authority name (ATO vs IRD)
 */
export function getTaxAuthority(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'IRD' : 'ATO';
}

/**
 * Get tax forms label (BAS vs GST Returns)
 */
export function getTaxFormsLabel(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'GST Returns' : 'BAS';
}

/**
 * Get GST rate as string
 */
export function getGSTRate(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? '15%' : '10%';
}
