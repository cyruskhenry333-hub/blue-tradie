import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env.local first (takes precedence), then .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL or DRIZZLE_DATABASE_URL must be set, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
