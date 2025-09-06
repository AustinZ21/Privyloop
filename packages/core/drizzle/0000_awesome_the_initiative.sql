CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"password_hash" varchar(255),
	"providers" jsonb DEFAULT '{}'::jsonb,
	"subscription_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"subscription_status" varchar(20) DEFAULT 'active',
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"privacy_cards_used" integer DEFAULT 0 NOT NULL,
	"last_scan_at" timestamp,
	"preferences" jsonb DEFAULT '{"notifications":{"email":true,"changeAlerts":true,"weeklyDigest":false},"scanning":{"frequency":"weekly","autoScan":true},"privacy":{"dataRetention":"1y","shareAnalytics":false}}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"gdpr_consent_at" timestamp,
	"data_export_requested_at" timestamp,
	"deletion_requested_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"description" text,
	"logo_url" varchar(500),
	"website_url" varchar(500),
	"privacy_page_urls" jsonb NOT NULL,
	"scraping_config" jsonb NOT NULL,
	"manifest_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_supported" boolean DEFAULT true NOT NULL,
	"requires_auth" boolean DEFAULT true NOT NULL,
	"config_version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"last_updated_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platforms_name_unique" UNIQUE("name"),
	CONSTRAINT "platforms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "privacy_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"template_hash" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"settings_structure" jsonb NOT NULL,
	"ai_analysis" jsonb,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"active_user_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"previous_version_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "privacy_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"user_settings" jsonb NOT NULL,
	"scan_id" varchar(100),
	"scan_method" varchar(20) DEFAULT 'extension' NOT NULL,
	"changes_since_previous" jsonb DEFAULT '{}'::jsonb,
	"has_changes" boolean DEFAULT false NOT NULL,
	"is_user_initiated" boolean DEFAULT false,
	"scan_status" varchar(20) DEFAULT 'completed' NOT NULL,
	"scan_error" text,
	"scan_duration_ms" integer,
	"completion_rate" real DEFAULT 1,
	"confidence_score" real DEFAULT 1,
	"risk_score" integer,
	"risk_factors" jsonb DEFAULT '[]'::jsonb,
	"recommendations" jsonb DEFAULT '{"high":[],"medium":[],"low":[]}'::jsonb,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"retention_policy" varchar(20) DEFAULT '1y',
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform_id" uuid NOT NULL,
	"connection_name" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_authorized" boolean DEFAULT false NOT NULL,
	"scan_enabled" boolean DEFAULT true NOT NULL,
	"scan_frequency" varchar(20) DEFAULT 'weekly' NOT NULL,
	"last_scan_id" varchar(100),
	"last_scan_at" timestamp,
	"last_scan_status" varchar(20) DEFAULT 'never',
	"last_scan_error" text,
	"next_scheduled_scan" timestamp,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"max_consecutive_failures" integer DEFAULT 5 NOT NULL,
	"platform_settings" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{"notifications":{"changeAlerts":true,"scanResults":false,"failures":true},"scanning":{"includeInBulkScans":true,"priority":"medium"},"privacy":{"shareWithPlatform":false,"includeInAnalytics":false}}'::jsonb,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_modified_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp,
	"disconnection_reason" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_category" varchar(30) NOT NULL,
	"user_id" text,
	"platform_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100),
	"resource_id" varchar(100),
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"status_code" integer,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"sensitive_data" boolean DEFAULT false NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"retention_policy" varchar(20) DEFAULT '1y',
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"purpose" varchar(50) DEFAULT 'email_verification' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"userId" text,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"revokedAt" timestamp,
	"usedAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_templates" ADD CONSTRAINT "privacy_templates_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_snapshots" ADD CONSTRAINT "privacy_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_snapshots" ADD CONSTRAINT "privacy_snapshots_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_snapshots" ADD CONSTRAINT "privacy_snapshots_template_id_privacy_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."privacy_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_platform_connections" ADD CONSTRAINT "user_platform_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_platform_connections" ADD CONSTRAINT "user_platform_connections_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification" ADD CONSTRAINT "verification_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_templates_platform_version_idx" ON "privacy_templates" USING btree ("platform_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_templates_active_idx" ON "privacy_templates" USING btree ("platform_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_templates_hash_idx" ON "privacy_templates" USING btree ("template_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_snapshots_user_platform_idx" ON "privacy_snapshots" USING btree ("user_id","platform_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_snapshots_user_scanned_idx" ON "privacy_snapshots" USING btree ("user_id","scanned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_snapshots_changes_idx" ON "privacy_snapshots" USING btree ("has_changes","scanned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_snapshots_template_idx" ON "privacy_snapshots" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_snapshots_retention_idx" ON "privacy_snapshots" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_connections_user_platform_idx" ON "user_platform_connections" USING btree ("user_id","platform_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_connections_active_idx" ON "user_platform_connections" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_connections_scan_schedule_idx" ON "user_platform_connections" USING btree ("next_scheduled_scan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_connections_scan_enabled_idx" ON "user_platform_connections" USING btree ("scan_enabled","next_scheduled_scan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_event_type_idx" ON "audit_logs" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_platform_idx" ON "audit_logs" USING btree ("platform_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_severity_idx" ON "audit_logs" USING btree ("severity","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_category_idx" ON "audit_logs" USING btree ("event_category","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_retention_idx" ON "audit_logs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_value_idx" ON "verification" USING btree ("value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_status_expires_idx" ON "verification" USING btree ("status","expiresAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_user_purpose_status_idx" ON "verification" USING btree ("userId","purpose","status");