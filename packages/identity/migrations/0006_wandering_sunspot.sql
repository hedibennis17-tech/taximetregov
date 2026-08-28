CREATE TYPE "public"."activity_source" AS ENUM('PROVIDER', 'TAXIMETER_GOV', 'MANUAL', 'IMPORT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('RECEIVED', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'FAILED', 'ADJUSTED', 'DISPUTED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('RIDESHARE_TRIP', 'DELIVERY', 'FOOD_DELIVERY', 'GROCERY_DELIVERY', 'PACKAGE_DELIVERY', 'TAXIMETER_TRIP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."activity_dispute_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('UNMATCHED', 'MATCHED', 'REVIEW_REQUIRED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('NOT_RECONCILED', 'MATCHED', 'MISMATCH', 'DUPLICATE', 'MISSING_DATA', 'UNDER_REVIEW', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('NOT_STARTED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'RETRYING');--> statement-breakpoint
CREATE TABLE "activity_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"action" varchar(60) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"activity_dispute_status" "activity_dispute_status" DEFAULT 'OPEN' NOT NULL,
	"dispute_type" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"previous_status" varchar(30),
	"new_status" varchar(30),
	"amount_snapshot" numeric(12, 2),
	"amount_currency" varchar(3),
	"change_reason" varchar(100),
	"source_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_activity_id" varchar(20) NOT NULL,
	"source_type" "activity_source" DEFAULT 'PROVIDER' NOT NULL,
	"provider_id" uuid,
	"provider_account_id" uuid,
	"driver_id" uuid,
	"external_activity_id" varchar(200),
	"external_activity_hash" varchar(64),
	"source_provider_event_id" uuid,
	"activity_type" "activity_type" NOT NULL,
	"activity_status" "activity_status" DEFAULT 'RECEIVED' NOT NULL,
	"match_status" "match_status" DEFAULT 'UNMATCHED' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"timezone" varchar(50),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC',
	"provider_event_version" integer,
	"taximeter_enabled" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "provider_activities_public_activity_id_unique" UNIQUE("public_activity_id")
);
--> statement-breakpoint
CREATE TABLE "provider_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"delivery_type" varchar(30),
	"pickup_at" timestamp with time zone,
	"dropoff_at" timestamp with time zone,
	"external_order_id" varchar(200),
	"external_delivery_id" varchar(200),
	"delivery_status" varchar(30),
	"taximeter_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_deliveries_activity_id_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
CREATE TABLE "provider_sync_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_account_id" uuid NOT NULL,
	"sync_type" varchar(30) NOT NULL,
	"sync_status" "sync_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"cursor_reference" varchar(500),
	"last_successful_sync_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"activities_synced" integer DEFAULT 0 NOT NULL,
	"error_code" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"pickup_at" timestamp with time zone,
	"dropoff_at" timestamp with time zone,
	"pickup_area_reference" varchar(100),
	"dropoff_area_reference" varchar(100),
	"passenger_count" integer,
	"trip_status" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_trips_activity_id_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
ALTER TABLE "activity_audit_events" ADD CONSTRAINT "activity_audit_events_activity_id_provider_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_audit_events" ADD CONSTRAINT "activity_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_disputes" ADD CONSTRAINT "activity_disputes_activity_id_provider_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_disputes" ADD CONSTRAINT "activity_disputes_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_disputes" ADD CONSTRAINT "activity_disputes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_versions" ADD CONSTRAINT "activity_versions_activity_id_provider_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_versions" ADD CONSTRAINT "activity_versions_source_event_id_provider_events_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."provider_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_activities" ADD CONSTRAINT "provider_activities_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_activities" ADD CONSTRAINT "provider_activities_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_activities" ADD CONSTRAINT "provider_activities_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_activities" ADD CONSTRAINT "provider_activities_source_provider_event_id_provider_events_id_fk" FOREIGN KEY ("source_provider_event_id") REFERENCES "public"."provider_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_deliveries" ADD CONSTRAINT "provider_deliveries_activity_id_provider_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_sync_state" ADD CONSTRAINT "provider_sync_state_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_trips" ADD CONSTRAINT "provider_trips_activity_id_provider_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_act_audit_activity" ON "activity_audit_events" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_act_audit_actor" ON "activity_audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_act_audit_action" ON "activity_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_act_audit_occurred" ON "activity_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_dispute_activity" ON "activity_disputes" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_driver" ON "activity_disputes" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_status" ON "activity_disputes" USING btree ("activity_dispute_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_act_version_unique" ON "activity_versions" USING btree ("activity_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_act_version_activity" ON "activity_versions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_act_version_created" ON "activity_versions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_prov_act_idempotency" ON "provider_activities" USING btree ("provider_id","provider_account_id","external_activity_hash");--> statement-breakpoint
CREATE INDEX "idx_prov_act_public_id" ON "provider_activities" USING btree ("public_activity_id");--> statement-breakpoint
CREATE INDEX "idx_prov_act_provider" ON "provider_activities" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_prov_act_account" ON "provider_activities" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_prov_act_driver" ON "provider_activities" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_prov_act_type" ON "provider_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_prov_act_status" ON "provider_activities" USING btree ("activity_status");--> statement-breakpoint
CREATE INDEX "idx_prov_act_match" ON "provider_activities" USING btree ("match_status");--> statement-breakpoint
CREATE INDEX "idx_prov_act_driver_started" ON "provider_activities" USING btree ("driver_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_prov_act_started" ON "provider_activities" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_prov_act_hash" ON "provider_activities" USING btree ("external_activity_hash");--> statement-breakpoint
CREATE INDEX "idx_prov_del_activity" ON "provider_deliveries" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_prov_del_pickup" ON "provider_deliveries" USING btree ("pickup_at");--> statement-breakpoint
CREATE INDEX "idx_sync_state_account" ON "provider_sync_state" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_sync_state_status" ON "provider_sync_state" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "idx_sync_state_last_sync" ON "provider_sync_state" USING btree ("last_successful_sync_at");--> statement-breakpoint
CREATE INDEX "idx_prov_trip_activity" ON "provider_trips" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_prov_trip_pickup" ON "provider_trips" USING btree ("pickup_at");--> statement-breakpoint
CREATE INDEX "idx_prov_trip_dropoff" ON "provider_trips" USING btree ("dropoff_at");