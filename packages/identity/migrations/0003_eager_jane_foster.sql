CREATE TYPE "public"."assignment_status" AS ENUM('ACTIVE', 'SCHEDULED', 'ENDED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."assignment_type" AS ENUM('OWNER', 'PRIMARY_DRIVER', 'AUTHORIZED_DRIVER', 'LEASED', 'RENTED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."operational_status" AS ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('UNKNOWN', 'PENDING', 'VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."vehicle_regulatory_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'CONDITIONAL', 'SUSPENDED', 'EXPIRED', 'REVOKED', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "driver_vehicle_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"assignment_type" "assignment_type" DEFAULT 'PRIMARY_DRIVER' NOT NULL,
	"assignment_status" "assignment_status" DEFAULT 'ACTIVE' NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"assigned_by" uuid,
	"ended_by" uuid,
	"end_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"registration_number_encrypted" text,
	"registration_number_enc_key_ver" varchar(20),
	"registration_hash" varchar(64),
	"registration_last4" varchar(4),
	"valid_from" date NOT NULL,
	"valid_until" date NOT NULL,
	"status" "registration_status" DEFAULT 'PENDING' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"expiry_notified_at" timestamp with time zone,
	"document_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_regulatory_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"regulatory_status" "vehicle_regulatory_status" DEFAULT 'PENDING' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"conditions" text[] DEFAULT '{}',
	"review_notes" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"previous_status" varchar(40),
	"new_status" varchar(40) NOT NULL,
	"status_type" varchar(30) NOT NULL,
	"reason" text NOT NULL,
	"changed_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_ended_by_users_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_registrations" ADD CONSTRAINT "vehicle_registrations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_registrations" ADD CONSTRAINT "vehicle_registrations_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_regulatory_profiles" ADD CONSTRAINT "vehicle_regulatory_profiles_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_regulatory_profiles" ADD CONSTRAINT "vehicle_regulatory_profiles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dva_driver" ON "driver_vehicle_assignments" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_dva_vehicle" ON "driver_vehicle_assignments" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_dva_valid_from" ON "driver_vehicle_assignments" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "idx_dva_valid_until" ON "driver_vehicle_assignments" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_dva_status" ON "driver_vehicle_assignments" USING btree ("assignment_status");--> statement-breakpoint
CREATE INDEX "idx_dva_vehicle_temporal" ON "driver_vehicle_assignments" USING btree ("vehicle_id","valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_dva_driver_temporal" ON "driver_vehicle_assignments" USING btree ("driver_id","valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_vehicle" ON "vehicle_registrations" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_jurisdiction" ON "vehicle_registrations" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_valid_until" ON "vehicle_registrations" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_status" ON "vehicle_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_hash" ON "vehicle_registrations" USING btree ("registration_hash");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_profile_vehicle" ON "vehicle_regulatory_profiles" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_profile_status" ON "vehicle_regulatory_profiles" USING btree ("regulatory_status");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_profile_jurisdiction" ON "vehicle_regulatory_profiles" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_vehicle_reg_profile_effective" ON "vehicle_regulatory_profiles" USING btree ("effective_from","effective_until");--> statement-breakpoint
CREATE INDEX "idx_vehicle_status_hist_vehicle" ON "vehicle_status_history" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_status_hist_created" ON "vehicle_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_vehicle_status_hist_type" ON "vehicle_status_history" USING btree ("status_type");