CREATE TYPE "public"."activity_adjustment_type" AS ENUM('FARE_CORRECTION', 'TIP_ADJUSTMENT', 'FEE_ADJUSTMENT', 'CANCELLATION_FEE', 'GOVERNMENT_CORRECTION', 'PROVIDER_CORRECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."activity_source_type" AS ENUM('TAXIMETER', 'PROVIDER_WEBHOOK', 'PROVIDER_API', 'BATCH_IMPORT', 'GOVERNMENT_FEED', 'MANUAL_AUTHORIZED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."canonical_activity_type" AS ENUM('TAXI_TRIP', 'RIDESHARE_TRIP', 'FOOD_DELIVERY', 'GROCERY_DELIVERY', 'PARCEL_DELIVERY', 'COURIER', 'SHOPPING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."data_quality_status" AS ENUM('VALIDATED', 'PARTIAL', 'INCONSISTENT', 'PENDING_REVIEW', 'REJECTED');--> statement-breakpoint
CREATE TABLE "activity_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"adjustment_type" "activity_adjustment_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"direction" varchar(10) NOT NULL,
	"reason" text NOT NULL,
	"source_provider_event_id" uuid,
	"created_by" uuid,
	"previous_final_amount" numeric(12, 2),
	"new_final_amount" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_ledger_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"action" varchar(60) NOT NULL,
	"previous_status" varchar(30),
	"new_status" varchar(30),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"label_fr" varchar(100),
	"label_en" varchar(100),
	"description" text,
	"taximeter_eligible" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "driver_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(20) NOT NULL,
	"driver_id" uuid NOT NULL,
	"provider_id" uuid,
	"provider_account_id" uuid,
	"jurisdiction_id" uuid,
	"activity_type_code" "canonical_activity_type" NOT NULL,
	"status" "canonical_activity_status" DEFAULT 'PENDING' NOT NULL,
	"source_type" "activity_source_type" NOT NULL,
	"external_activity_id" varchar(200),
	"external_transaction_id" varchar(200),
	"source_provider_event_id" uuid,
	"source_taxi_trip_id" uuid,
	"vehicle_id" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"estimated_amount" numeric(12, 2),
	"gross_amount" numeric(12, 2),
	"adjustment_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"final_amount" numeric(12, 2),
	"tip_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"fee_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"location_start_reference" varchar(100),
	"location_end_reference" varchar(100),
	"passenger_or_customer_reference" varchar(100),
	"data_quality_status" "data_quality_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"reconciliation_status" "activity_reconciliation_status" DEFAULT 'NOT_RECONCILED' NOT NULL,
	"taximeter_enabled" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_activities_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "activity_adjustments" ADD CONSTRAINT "activity_adjustments_activity_id_driver_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."driver_activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_adjustments" ADD CONSTRAINT "activity_adjustments_source_provider_event_id_provider_events_id_fk" FOREIGN KEY ("source_provider_event_id") REFERENCES "public"."provider_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_adjustments" ADD CONSTRAINT "activity_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_ledger_audit" ADD CONSTRAINT "activity_ledger_audit_activity_id_driver_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."driver_activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_ledger_audit" ADD CONSTRAINT "activity_ledger_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_provider_account_id_driver_provider_accounts_id_fk" FOREIGN KEY ("provider_account_id") REFERENCES "public"."driver_provider_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_source_provider_event_id_provider_events_id_fk" FOREIGN KEY ("source_provider_event_id") REFERENCES "public"."provider_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_source_taxi_trip_id_taxi_trips_id_fk" FOREIGN KEY ("source_taxi_trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activities" ADD CONSTRAINT "driver_activities_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_adj_activity" ON "activity_adjustments" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_adj_type" ON "activity_adjustments" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "idx_adj_created" ON "activity_adjustments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ledger_audit_activity" ON "activity_ledger_audit" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_audit_actor" ON "activity_ledger_audit" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_audit_action" ON "activity_ledger_audit" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_ledger_audit_occurred" ON "activity_ledger_audit" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_activity_types_code" ON "activity_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_activity_types_taximeter" ON "activity_types" USING btree ("taximeter_eligible");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_activity_ext_id" ON "driver_activities" USING btree ("provider_id","external_activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_activity_taxi_trip" ON "driver_activities" USING btree ("source_taxi_trip_id");--> statement-breakpoint
CREATE INDEX "idx_activity_driver" ON "driver_activities" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_activity_provider" ON "driver_activities" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_activity_status" ON "driver_activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_activity_type" ON "driver_activities" USING btree ("activity_type_code");--> statement-breakpoint
CREATE INDEX "idx_activity_source" ON "driver_activities" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_activity_jurisdiction" ON "driver_activities" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_activity_started" ON "driver_activities" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_activity_finalized" ON "driver_activities" USING btree ("finalized_at");--> statement-breakpoint
CREATE INDEX "idx_activity_reconciliation" ON "driver_activities" USING btree ("reconciliation_status");--> statement-breakpoint
CREATE INDEX "idx_activity_data_quality" ON "driver_activities" USING btree ("data_quality_status");--> statement-breakpoint
CREATE INDEX "idx_activity_driver_started" ON "driver_activities" USING btree ("driver_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_activity_provider_ext_txn" ON "driver_activities" USING btree ("provider_id","external_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_activity_driver_provider" ON "driver_activities" USING btree ("driver_id","provider_id");