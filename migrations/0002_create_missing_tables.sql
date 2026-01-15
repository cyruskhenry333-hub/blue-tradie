-- Migration: Create missing analytics and AI cache tables
-- These tables were in 0000_motionless_cerise but were never created in production
-- Schema sources: shared/schema.ts

-- Create ai_responses table (AI response cache)
-- Schema source: shared/schema.ts lines 787-795
CREATE TABLE IF NOT EXISTS "ai_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" varchar(1000) NOT NULL,
	"response" text NOT NULL,
	"agent_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create analytics_events table
-- Schema source: shared/schema.ts lines 1052-1068
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"event_type" varchar(100) NOT NULL,
	"event_category" varchar(50),
	"event_data" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);

-- Create analytics_sessions table
-- Schema source: shared/schema.ts lines 1071-1087
CREATE TABLE IF NOT EXISTS "analytics_sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"page_views" integer DEFAULT 0,
	"events_count" integer DEFAULT 0,
	"device" varchar(50),
	"browser" varchar(50),
	"os" varchar(50),
	"country" varchar(2),
	"ip_address" varchar(45)
);

-- Add foreign key constraints (safe idempotent pattern)
DO $$
BEGIN
  -- analytics_events.user_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'analytics_events_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;
  END IF;

  -- analytics_sessions.user_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'analytics_sessions_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  END IF;
END $$;

-- Create indexes for analytics_events (from shared/schema.ts lines 1063-1068)
CREATE INDEX IF NOT EXISTS "idx_analytics_user_id"
ON "analytics_events" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_analytics_event_type"
ON "analytics_events" ("event_type");

CREATE INDEX IF NOT EXISTS "idx_analytics_created_at"
ON "analytics_events" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_analytics_session_id"
ON "analytics_events" ("session_id");

-- Create indexes for analytics_sessions (from shared/schema.ts lines 1084-1087)
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id"
ON "analytics_sessions" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_sessions_started_at"
ON "analytics_sessions" ("started_at");
