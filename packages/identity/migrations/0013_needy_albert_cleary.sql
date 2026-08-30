CREATE TYPE "public"."canonical_event_type" AS ENUM('TRIP_CREATED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_UPDATED', 'TRIP_CANCELLED', 'DELIVERY_CREATED', 'DELIVERY_STARTED', 'DELIVERY_COMPLETED', 'DELIVERY_UPDATED', 'DELIVERY_CANCELLED', 'FARE_UPDATED', 'FARE_FINALIZED', 'PAYOUT_CREATED', 'PAYOUT_UPDATED', 'TIP_ADDED', 'ADJUSTMENT_CREATED', 'DRIVER_UPDATED', 'ACCOUNT_UPDATED', 'TAX_DATA_UPDATED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."event_processing_status" AS ENUM('RECEIVED', 'VALIDATING', 'VALIDATED', 'PROCESSING', 'PROCESSED', 'DUPLICATE', 'REJECTED', 'FAILED', 'QUARANTINED');--> statement-breakpoint
CREATE TYPE "public"."provider_event_source" AS ENUM('WEBHOOK', 'API', 'BATCH', 'GOVERNMENT_FEED', 'MANUAL_IMPORT');--> statement-breakpoint
CREATE TYPE "public"."quarantine_reason" AS ENUM('INVALID_SIGNATURE', 'UNKNOWN_PROVIDER', 'UNKNOWN_CONNECTION', 'UNKNOWN_DRIVER', 'UNKNOWN_ACCOUNT', 'INVALID_SCHEMA', 'DUPLICATE', 'SUSPICIOUS_PAYLOAD', 'MISSING_TRANSACTION_ID', 'UNSUPPORTED_EVENT', 'DATA_INCONSISTENCY', 'SUSPENDED_CONNECTION', 'REVOKED_CONNECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."quarantine_review_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED');--> statement-breakpoint
CREATE TYPE "public"."transaction_ref_status" AS ENUM('OPEN', 'FINALIZED', 'CANCELLED', 'DISPUTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."webhook_auth_status" AS ENUM('NOT_CHECKED', 'VALID', 'INVALID', 'EXPIRED', 'MISSING', 'FAILED');--> statement-breakpoint
CREATE TABLE "driver_resolution_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"external_account_id" varchar(200),
	"external_driver_id" varchar(200),
	"resolved" boolean NOT NULL,
	"resolved_driver_id" uuid,
	"resolution_method" varchar(50),
	"failure_reason" varchar(100),
	"provider_event_id" uuid,
	"webhook_delivery_id" uuid,
	"resolved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_event_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_event_type" varchar(100) NOT NULL,
	"canonical_event_type" "canonical_event_type" NOT NULL,
	"provider_schema_version" varchar(20),
	"enabled" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_event_quarantine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_event_id" uuid,
	"webhook_delivery_id" uuid,
	"provider_id" uuid NOT NULL,
	"reason_code" "quarantine_reason" NOT NULL,
	"reason_detail" text NOT NULL,
	"external_event_id" varchar(200),
	"external_transaction_id" varchar(200),
	"external_account_id" varchar(200),
	"review_status" "quarantine_review_status" DEFAULT 'PENDING' NOT NULL,
	"assigned_to" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"resolution" text,
	"quarantined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_transaction_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_account_id" uuid,
	"driver_id" uuid,
	"external_transaction_id" varchar(200) NOT NULL,
	"canonical_event_type" "canonical_event_type" NOT NULL,
	"transaction_ref_status" "transaction_ref_status" DEFAULT 'OPEN' NOT NULL,
	"estimated_amount" numeric(12, 2),
	"final_amount" numeric(12, 2),
	"total_adjustments" numeric(12, 2) DEFAULT '0',
	"tip_amount" numeric(12, 2) DEFAULT '0',
	"fee_amount" numeric(12, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"finalized_at" timestamp with time zone,
	"reconciled_at" timestamp with time zone,
	"event_count" integer DEFAULT 1 NOT NULL,
	"taximeter_enabled" boolean DEFAULT false NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider_event_id" uuid,
	"provider_account_id" uuid,
	"external_delivery_id" varchar(200),
	"auth_status" "webhook_auth_status" DEFAULT 'NOT_CHECKED' NOT NULL,
	"signature_status" "webhook_auth_status" DEFAULT 'NOT_CHECKED' NOT NULL,
	"signature_method" varchar(50),
	"http_method" varchar(10) DEFAULT 'POST' NOT NULL,
	"http_status_code" integer,
	"response_time_ms" integer,
	"payload_hash" varchar(64) NOT NULL,
	"payload_size" integer,
	"processing_status" "event_processing_status" DEFAULT 'RECEIVED' NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"source" "provider_event_source" DEFAULT 'WEBHOOK' NOT NULL,
	"error_code" varchar(100),
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"next_retry_at" timestamp with time zone,
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "driver_resolution_log" ADD CONSTRAINT "driver_resolution_log_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_resolution_log" ADD CONSTRAINT "driver_resolution_log_resolved_driver_id_driver_profiles_id_fk" FOREIGN KEY ("resolved_driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_resolution_log" ADD CONSTRAINT "driver_resolution_log_provider_event_id_provider_events_id_fk" FOREIGN KEY ("provider_event_id") REFERENCES "public"."provider_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_resolution_log" ADD CONSTRAINT "driver_resolution_log_webhook_delivery_id_provider_webhook_deliveries_id_fk" FOREIGN KEY ("webhook_delivery_id") REFERENCES "public"."provider_webhook_deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_event_mappings" ADD CONSTRAINT "provider_event_mappings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_event_quarantine" ADD CONSTRAINT "provider_event_quarantine_provider_event_id_provider_events_id_fk" FOREIGN KEY ("provider_event_id") REFERENCES "public"."provider_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_event_quarantine" ADD CONSTRAINT "provider_event_quarantine_webhook_delivery_id_provider_webhook_deliveries_id_fk" FOREIGN KEY ("webhook_delivery_id") REFERENCES "public"."provider_webhook_deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_event_quarantine" ADD CONSTRAINT "provider_event_quarantine_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_event_quarantine" ADD CONSTRAINT "provider_event_quarantine_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_event_quarantine" ADD CONSTRAINT "provider_event_quarantine_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_transaction_references" ADD CONSTRAINT "provider_transaction_references_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_transaction_references" ADD CONSTRAINT "provider_transaction_references_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_transaction_references" ADD CONSTRAINT "provider_transaction_references_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_webhook_deliveries" ADD CONSTRAINT "provider_webhook_deliveries_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_webhook_deliveries" ADD CONSTRAINT "provider_webhook_deliveries_provider_event_id_provider_events_id_fk" FOREIGN KEY ("provider_event_id") REFERENCES "public"."provider_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_webhook_deliveries" ADD CONSTRAINT "provider_webhook_deliveries_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_driver_res_provider" ON "driver_resolution_log" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_driver_res_resolved" ON "driver_resolution_log" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_driver_res_driver" ON "driver_resolution_log" USING btree ("resolved_driver_id");--> statement-breakpoint
CREATE INDEX "idx_driver_res_event" ON "driver_resolution_log" USING btree ("provider_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_event_mapping_unique" ON "provider_event_mappings" USING btree ("provider_id","provider_event_type","provider_schema_version");--> statement-breakpoint
CREATE INDEX "idx_event_mapping_provider" ON "provider_event_mappings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_event_mapping_canonical" ON "provider_event_mappings" USING btree ("canonical_event_type");--> statement-breakpoint
CREATE INDEX "idx_quarantine_provider_event" ON "provider_event_quarantine" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "idx_quarantine_provider" ON "provider_event_quarantine" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_quarantine_reason" ON "provider_event_quarantine" USING btree ("reason_code");--> statement-breakpoint
CREATE INDEX "idx_quarantine_review" ON "provider_event_quarantine" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_quarantine_quarantined" ON "provider_event_quarantine" USING btree ("quarantined_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_txn_ref_idempotency" ON "provider_transaction_references" USING btree ("provider_id","external_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_txn_ref_provider" ON "provider_transaction_references" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_txn_ref_account" ON "provider_transaction_references" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_txn_ref_driver" ON "provider_transaction_references" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_txn_ref_status" ON "provider_transaction_references" USING btree ("transaction_ref_status");--> statement-breakpoint
CREATE INDEX "idx_txn_ref_canonical" ON "provider_transaction_references" USING btree ("canonical_event_type");--> statement-breakpoint
CREATE INDEX "idx_txn_ref_driver_created" ON "provider_transaction_references" USING btree ("driver_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_webhook_delivery_idempotency" ON "provider_webhook_deliveries" USING btree ("provider_id","external_delivery_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_provider" ON "provider_webhook_deliveries" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_event" ON "provider_webhook_deliveries" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_status" ON "provider_webhook_deliveries" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_received" ON "provider_webhook_deliveries" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_correlation" ON "provider_webhook_deliveries" USING btree ("correlation_id");