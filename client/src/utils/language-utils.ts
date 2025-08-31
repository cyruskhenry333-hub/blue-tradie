// Language customization utilities for global tradie markets
// Extensible system for regional tone and expressions

export interface RegionalLanguage {
  greeting: string;
  casual_affirmation: string;
  completion_phrase: string;
  encouragement: string;
  no_problem: string;
  lets_go: string;
  all_done: string;
  thanks: string;
  get_started: string;
  welcome_back: string;
}

export interface CountrySettings {
  language: RegionalLanguage;
  tax: {
    gstRate: string;
    taxAuthority: string;
    businessRegistration: string;
    keyForms: string;
    workersComp: string;
  };
  legal: {
    employmentLaw: string;
    workersComp: string;
    consumerLaw: string;
  };
  currency: string;
  dateFormat: string;
}

export const countryConfigs: Record<string, CountrySettings> = {
  Australia: {
    language: {
      greeting: "G'day mate",
      casual_affirmation: "You're all sorted",
      completion_phrase: "Let's get this job done",
      encouragement: "You've got this",
      no_problem: "No dramas",
      lets_go: "Let's crack on",
      all_done: "All done and dusted",
      thanks: "Cheers mate",
      get_started: "Let's get started mate",
      welcome_back: "Welcome back mate"
    },
    tax: {
      gstRate: "10%",
      taxAuthority: "ATO",
      businessRegistration: "ABN (Australian Business Number)",
      keyForms: "BAS (Business Activity Statement)",
      workersComp: "WorkCover"
    },
    legal: {
      employmentLaw: "Fair Work Act 2009",
      workersComp: "WorkCover",
      consumerLaw: "Australian Consumer Law"
    },
    currency: "AUD",
    dateFormat: "DD/MM/YYYY"
  },
  "New Zealand": {
    language: {
      greeting: "Hey bro",
      casual_affirmation: "You're all good",
      completion_phrase: "Let's sort it out",
      encouragement: "Sweet as",
      no_problem: "No worries bro",
      lets_go: "Let's get into it",
      all_done: "Shot bro, all sorted",
      thanks: "Cheers bro",
      get_started: "Let's get started bro",
      welcome_back: "Good to see you back bro"
    },
    tax: {
      gstRate: "15%",
      taxAuthority: "IRD",
      businessRegistration: "NZBN (New Zealand Business Number)",
      keyForms: "GST Returns",
      workersComp: "ACC"
    },
    legal: {
      employmentLaw: "Employment Relations Act 2000",
      workersComp: "ACC (Accident Compensation Corporation)",
      consumerLaw: "Fair Trading Act"
    },
    currency: "NZD",
    dateFormat: "DD/MM/YYYY"
  },
  // Future expansion ready - structured for additional countries
  "United States": {
    language: {
      greeting: "Hey there",
      casual_affirmation: "You're all set",
      completion_phrase: "Let's get this done",
      encouragement: "You've got this",
      no_problem: "No problem",
      lets_go: "Let's do this",
      all_done: "All finished up",
      thanks: "Thanks",
      get_started: "Let's get started",
      welcome_back: "Welcome back"
    },
    tax: {
      gstRate: "varies by state",
      taxAuthority: "IRS",
      businessRegistration: "EIN (Employer Identification Number)",
      keyForms: "Quarterly Tax Returns",
      workersComp: "Workers' Compensation"
    },
    legal: {
      employmentLaw: "Federal Labor Standards Act",
      workersComp: "Workers' Compensation",
      consumerLaw: "Consumer Protection Laws"
    },
    currency: "USD",
    dateFormat: "MM/DD/YYYY"
  }
};

// Keep backward compatibility
export const regionalLanguage = {
  Australia: countryConfigs.Australia.language,
  "New Zealand": countryConfigs["New Zealand"].language
} as const;

export function getRegionalPhrase(
  country: string | undefined, 
  phraseKey: keyof RegionalLanguage
): string {
  const config = countryConfigs[country || "Australia"] || countryConfigs.Australia;
  return config.language[phraseKey];
}

export function getCountryConfig(country: string | undefined): CountrySettings {
  return countryConfigs[country || "Australia"] || countryConfigs.Australia;
}

export function getRegionalGreeting(country: string | undefined): string {
  return getRegionalPhrase(country, 'greeting');
}

export function getRegionalAffirmation(country: string | undefined): string {
  return getRegionalPhrase(country, 'casual_affirmation');
}

export function getRegionalCompletion(country: string | undefined): string {
  return getRegionalPhrase(country, 'completion_phrase');
}

export function getRegionalEncouragement(country: string | undefined): string {
  return getRegionalPhrase(country, 'encouragement');
}

export function getRegionalNoProblem(country: string | undefined): string {
  return getRegionalPhrase(country, 'no_problem');
}

export function getRegionalLetsGo(country: string | undefined): string {
  return getRegionalPhrase(country, 'lets_go');
}

export function getRegionalThanks(country: string | undefined): string {
  return getRegionalPhrase(country, 'thanks');
}

export function getRegionalGetStarted(country: string | undefined): string {
  return getRegionalPhrase(country, 'get_started');
}

export function getRegionalWelcomeBack(country: string | undefined): string {
  return getRegionalPhrase(country, 'welcome_back');
}