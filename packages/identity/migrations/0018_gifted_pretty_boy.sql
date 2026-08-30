CREATE TYPE "public"."connector_config_status" AS ENUM('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "public"."connector_auth_type" AS ENUM('OAUTH2_AUTHORIZATION_CODE', 'OAUTH2_CLIENT_CREDENTIALS', 'API_KEY', 'HMAC', 'PARTNER_API', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."connector_status" AS ENUM('MOCK_ONLY', 'SANDBOX', 'PILOT', 'PRODUCTION', 'DEPRECATED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."connector_type" AS ENUM('UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."pipeline_run_status" AS ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'RETRYING');--> statement-breakpoint
CREATE TYPE "public"."pipeline_stage_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'RETRYING');--> statement-breakpoint
CREATE TYPE "public"."pipeline_stage_type" AS ENUM('FETCH', 'VALIDATE', 'NORMALIZE', 'ENRICH', 'PERSIST', 'NOTIFY', 'RECONCILE', 'FINALIZE');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_scope" AS ENUM('PER_SECOND', 'PER_MINUTE', 'PER_HOUR', 'PER_DAY', 'PER_MONTH');--> statement-breakpoint
CREATE TYPE "public"."sync_checkpoint_status" AS ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."sync_error_category" AS ENUM('AUTHENTICATION', 'AUTHORIZATION', 'RATE_LIMIT', 'NETWORK', 'SCHEMA_MISMATCH', 'DATA_INCONSISTENCY', 'DRIVER_UNRESOLVED', 'DUPLICATE_EVENT', 'QUOTA_EXCEEDED', 'PROVIDER_ERROR', 'INTERNAL_ERROR', 'OTHER');--> statement-breakpoint
CREATE TABLE "connector_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"version" varchar(20) NOT NULL,
	"connector_config_status" "connector_config_status" DEFAULT 'DRAFT' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"api_schema_version" varchar(20),
	"published_by" uuid,
	"published_at" timestamp with time zone,
	"deprecated_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"response_time_ms" integer,
	"http_status_code" integer,
	"check_type" varchar(40) DEFAULT 'PING' NOT NULL,
	"error_code" varchar(100),
	"error_message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"rate_limit_scope" "rate_limit_scope" NOT NULL,
	"limit_type" varchar(50) NOT NULL,
	"max_requests" integer NOT NULL,
	"window_seconds" integer NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"window_start_at" timestamp with time zone,
	"window_reset_at" timestamp with time zone,
	"backoff_seconds" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_sync_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"provider_account_id" uuid,
	"driver_id" uuid,
	"sync_checkpoint_status" "sync_checkpoint_status" DEFAULT 'ACTIVE' NOT NULL,
	"cursor_value" text,
	"cursor_type" varchar(30) DEFAULT 'TIMESTAMP' NOT NULL,
	"cursor_expires_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"total_records_synced" integer DEFAULT 0 NOT NULL,
	"consecutive_errors" integer DEFAULT 0 NOT NULL,
	"last_pipeline_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(22) NOT NULL,
	"connector_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"run_type" varchar(30) NOT NULL,
	"pipeline_run_status" "pipeline_run_status" DEFAULT 'QUEUED' NOT NULL,
	"driver_id" uuid,
	"provider_account_id" uuid,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"records_succeeded" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"records_skipped" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"error_code" varchar(100),
	"error_summary" text,
	"run_key" varchar(100),
	"triggered_by" varchar(30) DEFAULT 'SCHEDULER' NOT NULL,
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pipeline_runs_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "pipeline_runs_run_key_unique" UNIQUE("run_key")
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"stage_type" "pipeline_stage_type" NOT NULL,
	"stage_order" integer NOT NULL,
	"stage_status" "pipeline_stage_status" DEFAULT 'PENDING' NOT NULL,
	"records_in" integer DEFAULT 0 NOT NULL,
	"records_out" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"records_filtered" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"error_code" varchar(100),
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(22) NOT NULL,
	"provider_id" uuid NOT NULL,
	"connector_type" "connector_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"connector_status" "connector_status" DEFAULT 'MOCK_ONLY' NOT NULL,
	"auth_type" "connector_auth_type" DEFAULT 'NONE' NOT NULL,
	"api_base_url_reference" varchar(200),
	"supports_webhook" boolean DEFAULT false NOT NULL,
	"supports_api_pull" boolean DEFAULT false NOT NULL,
	"supports_oauth" boolean DEFAULT false NOT NULL,
	"supports_batch_export" boolean DEFAULT false NOT NULL,
	"taximeter_enabled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"partner_approval_reference" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_connectors_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "sync_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid,
	"connector_id" uuid NOT NULL,
	"error_category" "sync_error_category" NOT NULL,
	"error_code" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"external_event_id" varchar(200),
	"external_activity_id" varchar(200),
	"driver_id" uuid,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"is_retryable" boolean DEFAULT true NOT NULL,
	"resolved_at" timestamp with time zone,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connector_configurations" ADD CONSTRAINT "connector_configurations_connector_id_platform_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."platform_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_configurations" ADD CONSTRAINT "connector_configurations_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_health_checks" ADD CONSTRAINT "connector_health_checks_connector_id_platform_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."platform_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_rate_limits" ADD CONSTRAINT "connector_rate_limits_connector_id_platform_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."platform_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sync_checkpoints" ADD CONSTRAINT "data_sync_checkpoints_connector_id_platform_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."platform_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sync_checkpoints" ADD CONSTRAINT "data_sync_checkpoints_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sync_checkpoints" ADD CONSTRAINT "data_sync_checkpoints_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sync_checkpoints" ADD CONSTRAINT "data_sync_checkpoints_last_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("last_pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_connector_id_platform_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."platform_connectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_connectors" ADD CONSTRAINT "platform_connectors_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_connector_id_platform_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."platform_connectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_connector_config_version" ON "connector_configurations" USING btree ("connector_id","version");--> statement-breakpoint
CREATE INDEX "idx_connector_config_connector" ON "connector_configurations" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "idx_connector_config_status" ON "connector_configurations" USING btree ("connector_config_status");--> statement-breakpoint
CREATE INDEX "idx_connector_health_connector" ON "connector_health_checks" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "idx_connector_health_status" ON "connector_health_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_connector_health_checked" ON "connector_health_checks" USING btree ("checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rate_limit_connector_type_scope" ON "connector_rate_limits" USING btree ("connector_id","limit_type","rate_limit_scope");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_connector" ON "connector_rate_limits" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_reset" ON "connector_rate_limits" USING btree ("window_reset_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sync_checkpoint_connector_account" ON "data_sync_checkpoints" USING btree ("connector_id","provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_sync_checkpoint_connector" ON "data_sync_checkpoints" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "idx_sync_checkpoint_driver" ON "data_sync_checkpoints" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_sync_checkpoint_status" ON "data_sync_checkpoints" USING btree ("sync_checkpoint_status");--> statement-breakpoint
CREATE INDEX "idx_sync_checkpoint_last_sync" ON "data_sync_checkpoints" USING btree ("last_synced_at");--> statement-breakpoint
CREATE INDEX "idx_pipeline_run_connector" ON "pipeline_runs" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_run_provider" ON "pipeline_runs" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_run_status" ON "pipeline_runs" USING btree ("pipeline_run_status");--> statement-breakpoint
CREATE INDEX "idx_pipeline_run_driver" ON "pipeline_runs" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_run_started" ON "pipeline_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_pipeline_run_correlation" ON "pipeline_runs" USING btree ("correlation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pipeline_stage_run_order" ON "pipeline_stages" USING btree ("pipeline_run_id","stage_order");--> statement-breakpoint
CREATE INDEX "idx_pipeline_stage_run" ON "pipeline_stages" USING btree ("pipeline_run_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_stage_type" ON "pipeline_stages" USING btree ("stage_type");--> statement-breakpoint
CREATE INDEX "idx_pipeline_stage_status" ON "pipeline_stages" USING btree ("stage_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_platform_connector_provider_type" ON "platform_connectors" USING btree ("provider_id","connector_type");--> statement-breakpoint
CREATE INDEX "idx_platform_connector_status" ON "platform_connectors" USING btree ("connector_status");--> statement-breakpoint
CREATE INDEX "idx_platform_connector_type" ON "platform_connectors" USING btree ("connector_type");--> statement-breakpoint
CREATE INDEX "idx_sync_error_pipeline" ON "sync_errors" USING btree ("pipeline_run_id");--> statement-breakpoint
CREATE INDEX "idx_sync_error_connector" ON "sync_errors" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "idx_sync_error_category" ON "sync_errors" USING btree ("error_category");--> statement-breakpoint
CREATE INDEX "idx_sync_error_driver" ON "sync_errors" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_sync_error_occurred" ON "sync_errors" USING btree ("occurred_at");