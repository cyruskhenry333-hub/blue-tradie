import type { AppUser, UserData } from "@shared/types/user";
import { DEFAULT_USER_VALUES } from "@shared/types/user";

/**
 * Safely converts unknown user data to AppUser with proper defaults
 * Handles cases where user data might be incomplete, null, or have different property names
 */
export function toAppUser(userData: any): AppUser | null {
  if (!userData || typeof userData !== 'object') {
    return null;
  }

  // Start with the base user data and add safe defaults
  const appUser: AppUser = {
    ...userData,
    ...DEFAULT_USER_VALUES,
    // Override with actual user data if it exists
    ...(userData.id && { id: userData.id }),
    ...(userData.email && { email: userData.email }),
    ...(userData.firstName && { firstName: userData.firstName }),
    ...(userData.lastName && { lastName: userData.lastName }),
    ...(userData.country && { country: userData.country }),
    
    // Handle boolean properties safely
    isGstRegistered: Boolean(userData.isGstRegistered ?? userData.is_gst_registered ?? DEFAULT_USER_VALUES.isGstRegistered),
    isOnboarded: Boolean(userData.isOnboarded ?? userData.is_onboarded ?? DEFAULT_USER_VALUES.isOnboarded),
    isBetaUser: Boolean(userData.isBetaUser ?? userData.is_beta_user ?? DEFAULT_USER_VALUES.isBetaUser),
    
    // Handle business setup checklist (map snake_case to camelCase)
    businessDetails: userData.businessDetails ?? userData.business_details_status ?? "pending",
    abnRegistration: userData.abnRegistration ?? userData.abn_registration_status ?? "pending",
    businessBanking: userData.businessBanking ?? userData.bank_account_status ?? "pending",
    insurance: userData.insurance ?? userData.insurance_setup_status ?? "pending",
    gstRegistration: userData.gstRegistration ?? userData.gst_registration_status ?? "pending",
    taxSetup: userData.taxSetup ?? userData.tax_setup_status ?? "pending",
  };

  return appUser;
}

/**
 * Safely gets a user property with optional chaining and defaults
 */
export function getUserProperty<T>(user: UserData, property: keyof AppUser, defaultValue: T): T {
  if (!user || typeof user !== 'object') {
    return defaultValue;
  }
  
  const value = user[property];
  return value !== null && value !== undefined ? value as T : defaultValue;
}

/**
 * Type guard to check if user data is valid
 */
export function isValidUser(userData: any): userData is AppUser {
  return userData && typeof userData === 'object' && typeof userData.id === 'string';
}