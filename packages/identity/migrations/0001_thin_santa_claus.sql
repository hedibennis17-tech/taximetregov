CREATE TYPE "public"."business_status" AS ENUM('SOLE_PROPRIETOR', 'INCORPORATED', 'PARTNERSHIP', 'NOT_APPLICABLE');--> statement-breakpoint
CREATE TYPE "public"."driver_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."government_department" AS ENUM('TRANSPORT_QC', 'REVENU_QC', 'SAAQ', 'CMQ', 'MTQ', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."identifier_type" AS ENUM('SIN_NAS', 'BUSINESS_NUMBER', 'TAX_ACCOUNT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('OFFICIAL_API', 'DOCUMENT_REVIEW', 'AUTHORIZED_PROVIDER', 'MANUAL_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('NOT_STARTED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'FAILED', 'EXPIRED', 'MANUAL_REVIEW');--> statement-breakpoint
CREATE TABLE "driver_onboarding_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"step_key" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"completed_at" timestamp with time zone,
	"blocked_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"driver_number" varchar(20) NOT NULL,
	"status" "driver_status" DEFAULT 'PENDING' NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"preferred_name" varchar(100),
	"date_of_birth" date,
	"phone" varchar(20),
	"province" varchar(10) DEFAULT 'QC' NOT NULL,
	"country" varchar(2) DEFAULT 'CA' NOT NULL,
	"language" "language" DEFAULT 'fr' NOT NULL,
	"address_encrypted" text,
	"business_status" "business_status" DEFAULT 'SOLE_PROPRIETOR' NOT NULL,
	"identity_verification_status" "verification_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"profile_photo_ref" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "driver_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "driver_profiles_driver_number_unique" UNIQUE("driver_number")
);
--> statement-breakpoint
CREATE TABLE "driver_suspensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"service_type" varchar(30) NOT NULL,
	"reason" text NOT NULL,
	"suspended_by" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"lifted_at" timestamp with time zone,
	"lifted_by" uuid,
	"lift_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "government_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"department" "government_department" NOT NULL,
	"job_title" varchar(100),
	"employee_reference" varchar(50),
	"mfa_required" boolean DEFAULT true NOT NULL,
	"jurisdictions" text[] DEFAULT '{QC}' NOT NULL,
	"supervisor_user_id" uuid,
	"activated_at" timestamp with time zone,
	"last_review_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "government_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "identity_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"method" "verification_method" DEFAULT 'DOCUMENT_REVIEW' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"rejection_reason" text,
	"review_notes" text,
	"is_pilot_verification" boolean DEFAULT true NOT NULL,
	"pilot_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"action" varchar(60) NOT NULL,
	"changed_fields" text[],
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensitive_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"identifier_type" "identifier_type" NOT NULL,
	"encrypted_value" text NOT NULL,
	"encryption_key_version" varchar(20) NOT NULL,
	"masked_display" varchar(20) NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'CA' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"verification_method" "verification_method",
	"last_accessed_at" timestamp with time zone,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "driver_onboarding_steps" ADD CONSTRAINT "driver_onboarding_steps_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_suspensions" ADD CONSTRAINT "driver_suspensions_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_suspensions" ADD CONSTRAINT "driver_suspensions_suspended_by_users_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_suspensions" ADD CONSTRAINT "driver_suspensions_lifted_by_users_id_fk" FOREIGN KEY ("lifted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_profiles" ADD CONSTRAINT "government_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_profiles" ADD CONSTRAINT "government_profiles_supervisor_user_id_users_id_fk" FOREIGN KEY ("supervisor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_audit_events" ADD CONSTRAINT "profile_audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_audit_events" ADD CONSTRAINT "profile_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensitive_identifiers" ADD CONSTRAINT "sensitive_identifiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensitive_identifiers" ADD CONSTRAINT "sensitive_identifiers_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_onboarding_driver_step" ON "driver_onboarding_steps" USING btree ("driver_id","step_key");--> statement-breakpoint
CREATE INDEX "idx_onboarding_driver" ON "driver_onboarding_steps" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_driver_profiles_user" ON "driver_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_driver_profiles_number" ON "driver_profiles" USING btree ("driver_number");--> statement-breakpoint
CREATE INDEX "idx_driver_profiles_status" ON "driver_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_suspensions_driver" ON "driver_suspensions" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_suspensions_service" ON "driver_suspensions" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_suspensions_ends" ON "driver_suspensions" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "idx_gov_profiles_user" ON "government_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_gov_profiles_dept" ON "government_profiles" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_identity_verif_user" ON "identity_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_identity_verif_status" ON "identity_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_identity_verif_expires" ON "identity_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_profile_audit_user" ON "profile_audit_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_audit_actor" ON "profile_audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_profile_audit_action" ON "profile_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_profile_audit_occurred" ON "profile_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sensitive_id_user_type" ON "sensitive_identifiers" USING btree ("user_id","identifier_type");--> statement-breakpoint
CREATE INDEX "idx_sensitive_id_user" ON "sensitive_identifiers" USING btree ("user_id");