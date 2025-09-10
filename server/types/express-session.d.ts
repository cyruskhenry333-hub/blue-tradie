import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: import("../../shared/types/user").AppUser;
    testUser?: any;
    isTestAuthenticated?: boolean;
    currentOrgId?: string;
    mode?: string;
  }
}