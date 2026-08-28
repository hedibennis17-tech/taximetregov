CREATE TYPE "public"."account_claim_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."connection_attempt_status" AS ENUM('INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."provider_account_status" AS ENUM('PENDING', 'ACTIVE', 'REAUTH_REQUIRED', 'EXPIRED', 'ERROR', 'DISCONNECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."provider_event_status" AS ENUM('RECEIVED', 'VERIFIED', 'PROCESSING', 'PROCESSED', 'DUPLICATE', 'FAILED', 'DEAD_LETTER', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."provider_integration_type" AS ENUM('OAUTH', 'REST_API', 'WEBHOOK', 'SFTP', 'PARTNER_API', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."provider_status" AS ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('RIDESHARE', 'DELIVERY', 'FOOD_DELIVERY', 'GROCERY_DELIVERY', 'MULTI_SERVICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."provider_verification_method" AS ENUM('OAUTH', 'PROVIDER_API', 'MANUAL', 'AUTOMATED', 'OTHER');--> statement-breakpoint
CREATE TABLE "driver_provider_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_provider_account_id" varchar(25) NOT NULL,
	"driver_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_account_status" "provider_account_status" DEFAULT 'PENDING' NOT NULL,
	"external_account_id_encrypted" text,
	"external_account_id_enc_key_ver" varchar(20),
	"external_account_id_hash" varchar(64),
	"external_account_id_last4" varchar(4),
	"display_name" varchar(100),
	"jurisdiction" varchar(10) DEFAULT 'QC',
	"verified_at" timestamp with time zone,
	"verification_method" "provider_verification_method",
	"connected_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"disconnected_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"disconnect_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_provider_accounts_public_provider_account_id_unique" UNIQUE("public_provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "provider_account_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claimant_driver_id" uuid NOT NULL,
	"provider_account_id" uuid NOT NULL,
	"account_claim_status" "account_claim_status" DEFAULT 'OPEN' NOT NULL,
	"reason" text NOT NULL,
	"review_notes" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_account_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_account_id" uuid NOT NULL,
	"scope" varchar(100) NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "provider_connection_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"state_hash" varchar(64),
	"connection_attempt_status" "connection_attempt_status" DEFAULT 'INITIATED' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"failure_code" varchar(50),
	"correlation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_account_id" uuid NOT NULL,
	"access_token_encrypted" text,
	"access_token_enc_key_ver" varchar(20),
	"refresh_token_encrypted" text,
	"refresh_token_enc_key_ver" varchar(20),
	"token_type" varchar(30),
	"scope_granted" text,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_credentials_provider_account_id_unique" UNIQUE("provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "provider_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_account_id" uuid,
	"external_event_id" varchar(200) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_timestamp" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload_hash" varchar(64),
	"signature_verified" boolean DEFAULT false NOT NULL,
	"signature_method" varchar(50),
	"processing_status" "provider_event_status" DEFAULT 'RECEIVED' NOT NULL,
	"processed_at" timestamp with time zone,
	"failure_code" varchar(100),
	"retry_count" varchar(5) DEFAULT '0' NOT NULL,
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"integration_type" "provider_integration_type" NOT NULL,
	"api_version" varchar(20),
	"base_url_reference" varchar(200),
	"required_scopes" text[],
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_provider_id" varchar(20) NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"provider_type" "provider_type" NOT NULL,
	"provider_status" "provider_status" DEFAULT 'ACTIVE' NOT NULL,
	"country" varchar(2) DEFAULT 'CA' NOT NULL,
	"supports_oauth" boolean DEFAULT false NOT NULL,
	"supports_webhook" boolean DEFAULT false NOT NULL,
	"supports_api_sync" boolean DEFAULT false NOT NULL,
	"taximeter_enabled" boolean DEFAULT false NOT NULL,
	"is_development_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_public_provider_id_unique" UNIQUE("public_provider_id"),
	CONSTRAINT "providers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "driver_provider_accounts" ADD CONSTRAINT "driver_provider_accounts_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_provider_accounts" ADD CONSTRAINT "driver_provider_accounts_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_account_claims" ADD CONSTRAINT "provider_account_claims_claimant_driver_id_driver_profiles_id_fk" FOREIGN KEY ("claimant_driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_account_claims" ADD CONSTRAINT "provider_account_claims_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_account_claims" ADD CONSTRAINT "provider_account_claims_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_account_scopes" ADD CONSTRAINT "provider_account_scopes_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_connection_attempts" ADD CONSTRAINT "provider_connection_attempts_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_connection_attempts" ADD CONSTRAINT "provider_connection_attempts_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_integrations" ADD CONSTRAINT "provider_integrations_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dpa_provider_account_unique" ON "driver_provider_accounts" USING btree ("provider_id","external_account_id_hash");--> statement-breakpoint
CREATE INDEX "idx_dpa_driver" ON "driver_provider_accounts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_dpa_provider" ON "driver_provider_accounts" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_dpa_status" ON "driver_provider_accounts" USING btree ("provider_account_status");--> statement-breakpoint
CREATE INDEX "idx_dpa_hash" ON "driver_provider_accounts" USING btree ("external_account_id_hash");--> statement-breakpoint
CREATE INDEX "idx_dpa_driver_provider" ON "driver_provider_accounts" USING btree ("driver_id","provider_id");--> statement-breakpoint
CREATE INDEX "idx_claim_claimant" ON "provider_account_claims" USING btree ("claimant_driver_id");--> statement-breakpoint
CREATE INDEX "idx_claim_account" ON "provider_account_claims" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_claim_status" ON "provider_account_claims" USING btree ("account_claim_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_prov_scope_unique" ON "provider_account_scopes" USING btree ("provider_account_id","scope");--> statement-breakpoint
CREATE INDEX "idx_prov_scope_account" ON "provider_account_scopes" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_conn_attempt_driver" ON "provider_connection_attempts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_conn_attempt_provider" ON "provider_connection_attempts" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_conn_attempt_state" ON "provider_connection_attempts" USING btree ("state_hash");--> statement-breakpoint
CREATE INDEX "idx_conn_attempt_expires" ON "provider_connection_attempts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_conn_attempt_status" ON "provider_connection_attempts" USING btree ("connection_attempt_status");--> statement-breakpoint
CREATE INDEX "idx_prov_cred_account" ON "provider_credentials" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_prov_cred_expires" ON "provider_credentials" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_prov_event_idempotency" ON "provider_events" USING btree ("provider_id","external_event_id");--> statement-breakpoint
CREATE INDEX "idx_prov_event_provider" ON "provider_events" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_prov_event_account" ON "provider_events" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_prov_event_status" ON "provider_events" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_prov_event_timestamp" ON "provider_events" USING btree ("event_timestamp");--> statement-breakpoint
CREATE INDEX "idx_prov_event_received" ON "provider_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_prov_integ_provider" ON "provider_integrations" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_prov_integ_type" ON "provider_integrations" USING btree ("integration_type");--> statement-breakpoint
CREATE INDEX "idx_providers_code" ON "providers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_providers_status" ON "providers" USING btree ("provider_status");--> statement-breakpoint
CREATE INDEX "idx_providers_type" ON "providers" USING btree ("provider_type");