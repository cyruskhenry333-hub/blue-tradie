// Regional asset management for culturally authentic user experiences
import { useAuth } from "@/hooks/useAuth";
import blueTradieLogo from "@assets/Blue Tradie Logo_1753253697164.png";
import blueTradieModelAU from "@assets/Blue Tradie Model_1753253708299.png";
// Māori Blue Tradie model for New Zealand users
import blueTradieModelNZ from "@assets/Maori Blue Tradie Model_1753291751305.png";

export interface RegionalAssets {
  hero: {
    model: string;
    alt: string;
  };
  logo: string;
  testimonial: {
    model: string;
    alt: string;
  };
}

export function useRegionalAssets(): RegionalAssets {
  const { user } = useAuth();
  const userCountry = user?.country || "Australia";
  
  // Default to Australian assets, switch for NZ users
  const isNewZealand = userCountry === "New Zealand";
  
  return {
    hero: {
      model: isNewZealand 
        ? blueTradieModelNZ
        : blueTradieModelAU,
      alt: isNewZealand 
        ? "Professional Māori tradie with orange hard hat and high-vis vest - Blue Tradie representative for New Zealand"
        : "Professional Australian tradie - Blue Tradie representative"
    },
    logo: blueTradieLogo,
    testimonial: {
      model: isNewZealand 
        ? blueTradieModelNZ
        : blueTradieModelAU,
      alt: isNewZealand
        ? "Satisfied Kiwi tradie customer testimonial - Māori Blue Tradie representative"
        : "Satisfied Aussie tradie customer testimonial"
    }
  };
}

// For non-authenticated users (landing page), detect from geolocation or default to AU
export function usePublicRegionalAssets(countryHint?: string): RegionalAssets {
  const isNewZealand = countryHint === "New Zealand";
  
  return {
    hero: {
      model: isNewZealand 
        ? blueTradieModelNZ
        : blueTradieModelAU,
      alt: isNewZealand 
        ? "Professional Māori tradie with orange hard hat and high-vis vest - Blue Tradie for Kiwi tradies"
        : "Professional Australian tradie - Blue Tradie for Aussie tradies"
    },
    logo: blueTradieLogo,
    testimonial: {
      model: isNewZealand 
        ? blueTradieModelNZ
        : blueTradieModelAU,
      alt: isNewZealand
        ? "Satisfied Kiwi tradie using Blue Tradie - Māori representative with thumbs up"
        : "Satisfied Aussie tradie using Blue Tradie"
    }
  };
}

// Helper function to get country-specific welcome message
export function getRegionalWelcomeMessage(country?: string): string {
  switch (country) {
    case "New Zealand":
      return "Kia ora! Welcome to Blue Tradie - built for Kiwi tradies";
    case "Australia":
      return "G'day! Welcome to Blue Tradie - built for Aussie tradies";
    default:
      return "Welcome to Blue Tradie - built for Aussie & Kiwi tradies";
  }
}