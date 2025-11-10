CREATE TABLE "ai_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" varchar(1000) NOT NULL,
	"response" text NOT NULL,
	"agent_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
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
--> statement-breakpoint
CREATE TABLE "analytics_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_date" timestamp NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"metric_value" numeric(15, 2) NOT NULL,
	"dimensions" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_sessions" (
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
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "automation_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"error_message" text,
	"trigger_data" jsonb,
	"job_id" integer,
	"invoice_id" integer,
	"quote_id" integer,
	"generated_content" text,
	"ai_tokens_used" integer,
	"action_result" jsonb,
	"scheduled_for" timestamp,
	"executed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"trigger_type" varchar NOT NULL,
	"trigger_conditions" jsonb,
	"delay_days" integer DEFAULT 0,
	"delay_hours" integer DEFAULT 0,
	"action_type" varchar NOT NULL,
	"action_config" jsonb,
	"use_ai" boolean DEFAULT false,
	"ai_prompt" text,
	"static_content" text,
	"execution_count" integer DEFAULT 0,
	"last_executed_at" timestamp,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bas_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"quarter" varchar NOT NULL,
	"g1_total_sales" numeric(15, 2) DEFAULT '0',
	"g2_export_sales" numeric(15, 2) DEFAULT '0',
	"g3_other_gst_free" numeric(15, 2) DEFAULT '0',
	"g4_input_taxed" numeric(15, 2) DEFAULT '0',
	"g10_capital_purchases" numeric(15, 2) DEFAULT '0',
	"g11_non_capital_purchases" numeric(15, 2) DEFAULT '0',
	"g1a_gst_on_sales" numeric(15, 2) DEFAULT '0',
	"g1b_gst_on_purchases" numeric(15, 2) DEFAULT '0',
	"total_gst_payable" numeric(15, 2) DEFAULT '0',
	"status" varchar DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"paid_at" timestamp,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "beta_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar NOT NULL,
	"email" varchar,
	"is_used" boolean DEFAULT false,
	"used_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	CONSTRAINT "beta_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "business_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"metric_date" timestamp NOT NULL,
	"total_revenue" numeric(15, 2) DEFAULT '0',
	"invoices_sent" integer DEFAULT 0,
	"invoices_paid" integer DEFAULT 0,
	"payments_received" integer DEFAULT 0,
	"jobs_created" integer DEFAULT 0,
	"jobs_completed" integer DEFAULT 0,
	"quotes_created" integer DEFAULT 0,
	"quotes_accepted" integer DEFAULT 0,
	"ai_chats_count" integer DEFAULT 0,
	"tokens_used" integer DEFAULT 0,
	"new_customers" integer DEFAULT 0,
	"repeat_customers" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"location" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"all_day" boolean DEFAULT false,
	"timezone" varchar DEFAULT 'Australia/Sydney',
	"job_id" integer,
	"customer_id" varchar,
	"customer_name" varchar,
	"event_type" varchar DEFAULT 'job',
	"status" varchar DEFAULT 'scheduled',
	"color" varchar DEFAULT '#3b82f6',
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"recurrence_end_date" timestamp,
	"parent_event_id" integer,
	"google_event_id" varchar,
	"outlook_event_id" varchar,
	"last_synced_at" timestamp,
	"sync_status" varchar DEFAULT 'not_synced',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"google_enabled" boolean DEFAULT false,
	"google_access_token" text,
	"google_refresh_token" text,
	"google_token_expiry" timestamp,
	"google_calendar_id" varchar,
	"google_sync_token" text,
	"google_last_sync" timestamp,
	"outlook_enabled" boolean DEFAULT false,
	"outlook_access_token" text,
	"outlook_refresh_token" text,
	"outlook_token_expiry" timestamp,
	"outlook_calendar_id" varchar,
	"outlook_delta_token" text,
	"outlook_last_sync" timestamp,
	"sync_direction" varchar DEFAULT 'both',
	"auto_sync" boolean DEFAULT true,
	"sync_frequency" integer DEFAULT 15,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "calendar_sync_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"agent_type" varchar NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_portal_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"customer_email" varchar NOT NULL,
	"customer_name" varchar,
	"customer_phone" varchar,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"quote_ids" jsonb,
	"invoice_ids" jsonb,
	"job_ids" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_portal_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "demo_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar NOT NULL,
	"user_id" varchar,
	"organization_id" varchar,
	"email" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"environment" varchar NOT NULL,
	"base_url" varchar NOT NULL,
	"signing_key" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "demo_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "document_access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" varchar,
	"action" varchar NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"original_file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"file_extension" varchar,
	"storage_provider" varchar DEFAULT 'local' NOT NULL,
	"storage_path" text NOT NULL,
	"storage_key" text,
	"bucket_name" varchar,
	"document_type" varchar NOT NULL,
	"category" varchar,
	"job_id" integer,
	"invoice_id" integer,
	"quote_id" integer,
	"expense_id" integer,
	"title" varchar,
	"description" text,
	"tags" jsonb,
	"is_public" boolean DEFAULT false,
	"width" integer,
	"height" integer,
	"thumbnail_path" text,
	"uploaded_by" varchar,
	"accessed_at" timestamp,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" varchar NOT NULL,
	"is_gst_claimable" boolean DEFAULT false,
	"linked_job_id" integer,
	"bank_transaction_id" varchar,
	"date" timestamp NOT NULL,
	"receipt_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"votes_count" integer DEFAULT 0 NOT NULL,
	"country" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'submitted',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"resource_id" text,
	"request_fingerprint" text,
	"response_data" jsonb,
	"status" text DEFAULT 'processing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"job_id" integer,
	"invoice_number" varchar NOT NULL,
	"year_sequence" integer NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"gst" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"line_items" jsonb NOT NULL,
	"due_date" timestamp,
	"paid_date" timestamp,
	"stripe_payment_intent_id" varchar,
	"email_to" varchar,
	"email_sent_at" timestamp,
	"payment_status" varchar DEFAULT 'draft' NOT NULL,
	"stripe_session_id" varchar,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "idx_invoices_user_year_sequence" UNIQUE("user_id","year_sequence"),
	CONSTRAINT "idx_invoices_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar,
	"customer_phone" varchar,
	"address" text,
	"description" text NOT NULL,
	"status" varchar DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"total_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"token_hash" text NOT NULL,
	"purpose" text DEFAULT 'login' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "magic_link_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "organization_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"role" varchar DEFAULT 'member',
	"is_onboarded" boolean DEFAULT false,
	"onboarded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar DEFAULT 'demo',
	"is_demo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "public_waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "public_waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"job_id" integer,
	"quote_number" varchar NOT NULL,
	"year_sequence" integer NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar,
	"customer_phone" varchar,
	"customer_address" text,
	"title" varchar NOT NULL,
	"description" text,
	"line_items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"gst" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"responded_at" timestamp,
	"customer_notes" text,
	"converted_to_invoice_id" integer,
	"converted_at" timestamp,
	"portal_access_token" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number"),
	CONSTRAINT "idx_quotes_user_year_sequence" UNIQUE("user_id","year_sequence")
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"job_id" integer,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar,
	"customer_phone" varchar,
	"request_type" varchar DEFAULT 'google_review',
	"sent_via" varchar,
	"message" text,
	"status" varchar DEFAULT 'sent',
	"clicked_at" timestamp,
	"completed_at" timestamp,
	"review_link" text,
	"review_received" boolean DEFAULT false,
	"review_rating" integer,
	"review_text" text,
	"sent_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roadmap_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"estimated_quarter" varchar(10),
	"votes_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false,
	"completed_date" timestamp,
	"progress_percentage" integer DEFAULT 0,
	"progress_status" varchar(20) DEFAULT 'not-started',
	"development_notes" text,
	"baseline_votes" integer DEFAULT 0,
	"weekly_vote_increase" integer DEFAULT 0,
	"has_community_surge" boolean DEFAULT false,
	"surge_threshold" integer DEFAULT 10,
	"last_surge_check" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roadmap_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"roadmap_item_id" integer NOT NULL,
	"country" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar NOT NULL,
	"setting_value" text,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "tax_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"deductible" boolean DEFAULT true,
	"deduction_rate" numeric(5, 2) DEFAULT '100.00',
	"ato_category" varchar,
	"requires_receipt" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"suggestion_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"estimated_amount" numeric(10, 2),
	"estimated_saving" numeric(10, 2),
	"expense_id" integer,
	"category_id" integer,
	"ai_reasoning" text,
	"confidence" numeric(5, 2),
	"status" varchar DEFAULT 'pending',
	"user_notes" text,
	"actioned_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"abn" varchar(11),
	"gst_registered" boolean DEFAULT false,
	"gst_registration_date" timestamp,
	"financial_year_end" varchar DEFAULT '30-06',
	"accounting_basis" varchar DEFAULT 'accrual',
	"bas_reporting_period" varchar DEFAULT 'quarterly',
	"next_bas_due_date" timestamp,
	"gst_rate" numeric(5, 2) DEFAULT '10.00',
	"accountant_name" varchar,
	"accountant_email" varchar,
	"accountant_phone" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tax_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"invited_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "team_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"permissions" jsonb,
	"status" varchar DEFAULT 'active' NOT NULL,
	"invited_by" varchar,
	"joined_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"name" varchar(100),
	"profile_photo" varchar(500),
	"country" varchar(50) NOT NULL,
	"is_approved" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "token_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"month" varchar(7) NOT NULL,
	"balance" integer NOT NULL,
	"limit" integer NOT NULL,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "token_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"metadata" jsonb,
	"idempotency_key" varchar(255),
	"transaction_id" varchar(255) NOT NULL,
	"reconciliation_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "token_ledger_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tokens_used" integer NOT NULL,
	"cost_aud" numeric(10, 6) NOT NULL,
	"agent_type" varchar(50),
	"source" varchar(20) DEFAULT 'openai',
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trial_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"email_type" varchar NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"email_status" varchar DEFAULT 'sent',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"business_name" varchar,
	"business_logo" varchar,
	"trade" varchar,
	"service_area" varchar,
	"country" varchar DEFAULT 'Australia',
	"is_gst_registered" boolean DEFAULT false,
	"is_onboarded" boolean DEFAULT false,
	"business_type" varchar,
	"experience" varchar,
	"current_revenue" varchar,
	"is_beta_user" boolean DEFAULT false,
	"beta_invite_code" varchar,
	"has_lifetime_beta_access" boolean DEFAULT false,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"user_type" varchar,
	"gender" varchar,
	"business_structure" varchar,
	"goals" jsonb,
	"vision_sentence" text,
	"vision_board_enabled" boolean DEFAULT false,
	"vision_board_images" jsonb,
	"mate_check_ins_enabled" boolean DEFAULT true,
	"last_check_in_date" timestamp,
	"tone_preference" varchar DEFAULT 'casual',
	"business_knowledge_level" varchar DEFAULT 'beginner',
	"age_range" varchar,
	"tech_comfort_level" varchar DEFAULT 'basic',
	"learning_preference" varchar DEFAULT 'simple',
	"communication_tone" varchar DEFAULT 'matey',
	"beta_consent_given" boolean DEFAULT false,
	"beta_consent_text" text,
	"beta_consent_timestamp" timestamp,
	"beta_consent_ip_address" varchar,
	"token_balance" integer DEFAULT 200,
	"token_usage_this_month" integer DEFAULT 0,
	"token_usage_today" integer DEFAULT 0,
	"token_purchase_history" jsonb DEFAULT '[]'::jsonb,
	"token_usage_history" jsonb DEFAULT '[]'::jsonb,
	"token_alert_threshold" integer DEFAULT 50,
	"token_alert_enabled" boolean DEFAULT true,
	"last_token_reset" timestamp,
	"subscription_tier" varchar DEFAULT 'Blue Lite',
	"is_demo_user" boolean DEFAULT false,
	"demo_expires_at" timestamp,
	"demo_tokens_used" integer DEFAULT 0,
	"demo_token_limit" integer DEFAULT 1000,
	"demo_status" varchar DEFAULT 'active',
	"is_free_trial_user" boolean DEFAULT false,
	"free_trial_ends_at" timestamp,
	"ugc_contributions" jsonb,
	"ugc_bonus_tokens" integer DEFAULT 0,
	"ugc_founding_member_status" boolean DEFAULT false,
	"metadata" jsonb,
	"beta_tier" varchar,
	"beta_tag" text,
	"lifetime_discount" integer DEFAULT 0,
	"free_access_until" timestamp,
	"beta_trial_start_date" timestamp,
	"current_journey_stage" integer DEFAULT 1,
	"completed_milestones" jsonb DEFAULT '[]'::jsonb,
	"last_stage_update" timestamp,
	"trial_start_date" timestamp,
	"trial_end_date" timestamp,
	"trial_duration_days" integer DEFAULT 14,
	"is_trial_active" boolean DEFAULT false,
	"has_used_trial" boolean DEFAULT false,
	"trial_emails_sent" jsonb DEFAULT '[]'::jsonb,
	"subscription_status" varchar DEFAULT 'none',
	"abn_registration_status" varchar DEFAULT 'pending',
	"business_details_status" varchar DEFAULT 'pending',
	"business_name_status" varchar DEFAULT 'pending',
	"gst_registration_status" varchar DEFAULT 'pending',
	"bank_account_status" varchar DEFAULT 'pending',
	"insurance_setup_status" varchar DEFAULT 'pending',
	"tax_setup_status" varchar DEFAULT 'pending',
	"abn_registration_updated" timestamp,
	"business_details_updated" timestamp,
	"business_name_updated" timestamp,
	"gst_registration_updated" timestamp,
	"bank_account_updated" timestamp,
	"insurance_setup_updated" timestamp,
	"tax_setup_updated" timestamp,
	"from_email" varchar,
	"from_name" varchar,
	"currency_code" varchar DEFAULT 'AUD',
	"welcome_sent_at" timestamp,
	"first_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"country" varchar DEFAULT 'Australia',
	"trade" varchar,
	"signup_date" timestamp DEFAULT now(),
	"notified" boolean DEFAULT false,
	"priority" integer DEFAULT 0,
	"demo_code" varchar,
	"demo_code_sent" boolean DEFAULT false,
	"demo_code_sent_at" timestamp,
	"early_access_requested" boolean DEFAULT false,
	"early_access_requested_at" timestamp,
	"day7_email_sent" boolean DEFAULT false,
	"day7_email_sent_at" timestamp,
	"day14_email_sent" boolean DEFAULT false,
	"day14_email_sent_at" timestamp,
	"video_submitted" boolean DEFAULT false,
	"video_submitted_at" timestamp,
	"founding_member_status" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"country" varchar DEFAULT 'Australia',
	"trade" varchar,
	"referral_source" varchar,
	"notified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "waitlist_entries_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_provider_event_unique" UNIQUE("provider","provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD CONSTRAINT "analytics_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bas_reports" ADD CONSTRAINT "bas_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_metrics" ADD CONSTRAINT "business_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_parent_event_id_calendar_events_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_settings" ADD CONSTRAINT "calendar_sync_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_portal_tokens" ADD CONSTRAINT "customer_portal_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_tokens" ADD CONSTRAINT "demo_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_tokens" ADD CONSTRAINT "demo_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_linked_job_id_jobs_id_fk" FOREIGN KEY ("linked_job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_to_invoice_id_invoices_id_fk" FOREIGN KEY ("converted_to_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_votes" ADD CONSTRAINT "roadmap_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_votes" ADD CONSTRAINT "roadmap_votes_roadmap_item_id_roadmap_items_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_deductions" ADD CONSTRAINT "tax_deductions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_deductions" ADD CONSTRAINT "tax_deductions_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_deductions" ADD CONSTRAINT "tax_deductions_category_id_tax_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tax_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_alerts" ADD CONSTRAINT "token_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_ledger" ADD CONSTRAINT "token_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_emails" ADD CONSTRAINT "trial_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_user_id" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_event_type" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_created_at" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_session_id" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_metrics_date_type" ON "analytics_metrics" USING btree ("metric_date","metric_type");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "analytics_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_started_at" ON "analytics_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_user_id" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_expires_at" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_automation_exec_rule" ON "automation_executions" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_automation_exec_user" ON "automation_executions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_automation_exec_status" ON "automation_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_automation_exec_scheduled" ON "automation_executions" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_automation_rules_user" ON "automation_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_automation_rules_active" ON "automation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_automation_rules_trigger" ON "automation_rules" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "idx_bas_user_period" ON "bas_reports" USING btree ("user_id","period_end");--> statement-breakpoint
CREATE INDEX "idx_business_metrics_user_date" ON "business_metrics" USING btree ("user_id","metric_date");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_user" ON "calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_start" ON "calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_job" ON "calendar_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_google" ON "calendar_events" USING btree ("google_event_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_outlook" ON "calendar_events" USING btree ("outlook_event_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_sync_user" ON "calendar_sync_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tokens_hash" ON "customer_portal_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_customer_tokens_email" ON "customer_portal_tokens" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "idx_customer_tokens_expires" ON "customer_portal_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_doc_access_document" ON "document_access_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_access_user" ON "document_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_doc_access_time" ON "document_access_logs" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "idx_documents_user" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_documents_job" ON "documents" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_documents_invoice" ON "documents" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_documents_quote" ON "documents" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_documents_created" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_idempotency_scope" ON "idempotency_keys" USING btree ("scope","created_at");--> statement-breakpoint
CREATE INDEX "idx_idempotency_expires" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_invoices_user_id" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_user_status_date" ON "invoices" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_invoices_stripe_payment_intent" ON "invoices" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_magic_tokens_hash" ON "magic_link_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_magic_tokens_email" ON "magic_link_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_magic_tokens_expires_at" ON "magic_link_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_org_idx" ON "organization_users" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_user_id" ON "quotes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quotes_status" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quotes_customer_email" ON "quotes" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "idx_quotes_user_status_date" ON "quotes" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_review_requests_user" ON "review_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_review_requests_job" ON "review_requests" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_review_requests_status" ON "review_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_tax_categories_category" ON "tax_categories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_tax_deductions_user_status" ON "tax_deductions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_team_invites_owner" ON "team_invitations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_team_invites_email" ON "team_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_team_invites_token_hash" ON "team_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_team_invites_status" ON "team_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_team_members_owner" ON "team_members" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_member" ON "team_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_status" ON "team_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_team_members_unique" ON "team_members" USING btree ("owner_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_status" ON "webhook_events" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_provider_type" ON "webhook_events" USING btree ("provider","event_type");