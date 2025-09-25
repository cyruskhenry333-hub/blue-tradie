import 'express-session';

declare module 'express-session' {
  interface SessionData {
    pendingUser?: {
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      businessName: string;
      trade: string;
      serviceArea: string;
      country: string;
      isGstRegistered: boolean;
      plan: string;
    };
  }
}