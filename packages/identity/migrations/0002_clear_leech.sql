CREATE TYPE "public"."fuel_type" AS ENUM('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUG_IN_HYBRID', 'HYDROGEN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('VALID', 'EXPIRING_SOON', 'EXPIRED', 'FAILED', 'PENDING', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."insurance_status" AS ENUM('VALID', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED', 'PENDING_VERIFICATION');--> statement-breakpoint
CREATE TYPE "public"."license_class" AS ENUM('CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4A', 'CLASS_4B', 'CLASS_4C', 'CLASS_5', 'CLASS_6A', 'CLASS_6B', 'CLASS_8', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."permit_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED', 'UNDER_REVIEW', 'RENEWAL_PENDING');--> statement-breakpoint
CREATE TYPE "public"."service_auth_status" AS ENUM('AUTHORIZED', 'PENDING', 'SUSPENDED', 'BLOCKED', 'NOT_APPLICABLE');--> statement-breakpoint
CREATE TYPE "public"."taximeter_status" AS ENUM('NOT_INSTALLED', 'INSTALLED_NOT_CERTIFIED', 'CERTIFIED', 'DECOMMISSIONED', 'NEEDS_RECERTIFICATION');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'DEACTIVATED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('SEDAN', 'SUV', 'MINIVAN', 'VAN', 'HYBRID', 'ELECTRIC', 'MOTORCYCLE', 'TRUCK', 'OTHER');--> statement-breakpoint
CREATE TABLE "driver_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"license_class" "license_class" NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"license_number_encrypted" text,
	"license_number_enc_key_ver" varchar(20),
	"license_number_masked" varchar(20) NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"status" "permit_status" DEFAULT 'PENDING' NOT NULL,
	"restrictions" text[] DEFAULT '{}',
	"verification_status" varchar(30) DEFAULT 'NOT_STARTED' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"insurance_provider" varchar(100) NOT NULL,
	"policy_number_encrypted" text,
	"policy_number_enc_key_ver" varchar(20),
	"policy_number_masked" varchar(20) NOT NULL,
	"is_commercial" boolean DEFAULT false NOT NULL,
	"coverage_type" varchar(50),
	"effective_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"status" "insurance_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"verification_status" varchar(30) DEFAULT 'NOT_STARTED' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"document_ref" text,
	"expiry_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxi_permits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"permit_type" varchar(50) DEFAULT 'TAXI' NOT NULL,
	"permit_number_encrypted" text,
	"permit_number_enc_key_ver" varchar(20),
	"permit_number_masked" varchar(20) NOT NULL,
	"status" "permit_status" DEFAULT 'PENDING' NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"vehicle_requirement" text,
	"allowed_zones" text[] DEFAULT '{}',
	"verification_status" varchar(30) DEFAULT 'NOT_STARTED' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"issuing_authority" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"action" varchar(60) NOT NULL,
	"old_status" varchar(30),
	"new_status" varchar(30),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"doc_type" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"storage_ref_masked" text NOT NULL,
	"file_hash" varchar(64),
	"mime_type" varchar(50),
	"file_size_bytes" integer,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"expiry_date" date,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"inspection_type" varchar(50) DEFAULT 'SAAQ_MECHANICAL' NOT NULL,
	"status" "inspection_status" DEFAULT 'PENDING' NOT NULL,
	"inspection_date" date,
	"expiry_date" date,
	"inspector_name" varchar(100),
	"inspection_center_ref" varchar(100),
	"passed" boolean,
	"failure_reasons" text[] DEFAULT '{}',
	"condition_notes" text,
	"certificate_ref" text,
	"expiry_notified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_service_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"taxi_status" "service_auth_status" DEFAULT 'PENDING' NOT NULL,
	"rideshare_status" "service_auth_status" DEFAULT 'PENDING' NOT NULL,
	"delivery_status" "service_auth_status" DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"personal_status" "service_auth_status" DEFAULT 'AUTHORIZED' NOT NULL,
	"taxi_suspension_reason" text,
	"rideshare_suspension_reason" text,
	"delivery_suspension_reason" text,
	"authorized_by" uuid,
	"authorized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_number" varchar(20) NOT NULL,
	"vin_encrypted" text,
	"vin_encryption_key_ver" varchar(20),
	"vin_last_four" varchar(4),
	"license_plate_encrypted" text,
	"license_plate_region" varchar(10) DEFAULT 'QC',
	"license_plate_masked" varchar(20),
	"make" varchar(50) NOT NULL,
	"model" varchar(50) NOT NULL,
	"year" smallint NOT NULL,
	"color" varchar(30),
	"vehicle_type" "vehicle_type" NOT NULL,
	"fuel_type" "fuel_type" DEFAULT 'GASOLINE' NOT NULL,
	"seating_capacity" smallint DEFAULT 4,
	"accessibility_features" text[] DEFAULT '{}',
	"vehicle_status" "vehicle_status" DEFAULT 'PENDING' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"taximeter_status" "taximeter_status" DEFAULT 'NOT_INSTALLED' NOT NULL,
	"taximeter_serial_masked" varchar(20),
	"taximeter_certified_at" timestamp with time zone,
	"taximeter_certified_by" varchar(100),
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"odometer_at_registration" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vehicles_vehicle_number_unique" UNIQUE("vehicle_number")
);
--> statement-breakpoint
ALTER TABLE "driver_licenses" ADD CONSTRAINT "driver_licenses_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_licenses" ADD CONSTRAINT "driver_licenses_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_documents" ADD CONSTRAINT "insurance_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_documents" ADD CONSTRAINT "insurance_documents_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_documents" ADD CONSTRAINT "insurance_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_permits" ADD CONSTRAINT "taxi_permits_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_permits" ADD CONSTRAINT "taxi_permits_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_audit_events" ADD CONSTRAINT "vehicle_audit_events_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_audit_events" ADD CONSTRAINT "vehicle_audit_events_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_audit_events" ADD CONSTRAINT "vehicle_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_service_authorizations" ADD CONSTRAINT "vehicle_service_authorizations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_service_authorizations" ADD CONSTRAINT "vehicle_service_authorizations_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_service_authorizations" ADD CONSTRAINT "vehicle_service_authorizations_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_driver_licenses_driver" ON "driver_licenses" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_driver_licenses_expiry" ON "driver_licenses" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_driver_licenses_status" ON "driver_licenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_driver_licenses_class" ON "driver_licenses" USING btree ("license_class");--> statement-breakpoint
CREATE INDEX "idx_insurance_vehicle" ON "insurance_documents" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_insurance_driver" ON "insurance_documents" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_insurance_expiry" ON "insurance_documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_insurance_status" ON "insurance_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_insurance_commercial" ON "insurance_documents" USING btree ("is_commercial");--> statement-breakpoint
CREATE INDEX "idx_taxi_permits_driver" ON "taxi_permits" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_taxi_permits_expiry" ON "taxi_permits" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_taxi_permits_status" ON "taxi_permits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_taxi_permits_jurisdiction" ON "taxi_permits" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_vehicle_audit_vehicle" ON "vehicle_audit_events" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_audit_driver" ON "vehicle_audit_events" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_audit_action" ON "vehicle_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_vehicle_audit_occurred" ON "vehicle_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_vehicle_docs_vehicle" ON "vehicle_documents" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_docs_driver" ON "vehicle_documents" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_docs_type" ON "vehicle_documents" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX "idx_vehicle_docs_expiry" ON "vehicle_documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_inspections_vehicle" ON "vehicle_inspections" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_driver" ON "vehicle_inspections" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_expiry" ON "vehicle_inspections" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_inspections_status" ON "vehicle_inspections" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vehicle_service_auth_unique" ON "vehicle_service_authorizations" USING btree ("vehicle_id","driver_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_service_auth_vehicle" ON "vehicle_service_authorizations" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_service_auth_driver" ON "vehicle_service_authorizations" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_driver" ON "vehicles" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_status" ON "vehicles" USING btree ("vehicle_status");--> statement-breakpoint
CREATE INDEX "idx_vehicles_active" ON "vehicles" USING btree ("driver_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_vehicles_number" ON "vehicles" USING btree ("vehicle_number");