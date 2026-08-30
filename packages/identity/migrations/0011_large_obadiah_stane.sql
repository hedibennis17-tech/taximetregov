CREATE TYPE "public"."archival_reason" AS ENUM('RETENTION_POLICY', 'USER_REQUESTED', 'LEGAL_OBLIGATION', 'ADMIN_ACTION', 'ACCOUNT_CLOSED');--> statement-breakpoint
CREATE TYPE "public"."audit_result" AS ENUM('SUCCESS', 'FAILURE', 'BLOCKED', 'PARTIAL');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('DEBUG', 'INFO', 'WARNING', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."data_access_type" AS ENUM('VIEW', 'EXPORT', 'DOWNLOAD', 'PRINT', 'API_READ', 'BULK_EXPORT');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_status" AS ENUM('RECEIVED', 'UNDER_REVIEW', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_type" AS ENUM('ACCESS', 'PORTABILITY', 'RECTIFICATION', 'ERASURE', 'RESTRICTION', 'OBJECTION');--> statement-breakpoint
CREATE TYPE "public"."retention_category" AS ENUM('FINANCIAL_TRANSACTIONS', 'TAX_RECORDS', 'AUDIT_LOGS', 'GPS_DATA', 'DOCUMENTS', 'NOTIFICATIONS', 'WEBHOOK_EVENTS', 'SESSION_LOGS', 'PERSONAL_DATA', 'COMPLIANCE_RECORDS');--> statement-breakpoint
CREATE TYPE "public"."sensitive_data_category" AS ENUM('NAS_SIN', 'FINANCIAL', 'TAX', 'PERSONAL_IDENTITY', 'GPS_LOCATION', 'HEALTH', 'OTHER');--> statement-breakpoint
CREATE TABLE "archival_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"archived_by" uuid,
	"archival_reason" "archival_reason" NOT NULL,
	"legal_justification" text NOT NULL,
	"privacy_request_id" uuid,
	"was_anonymized" boolean DEFAULT false NOT NULL,
	"was_deleted" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"actor_public_id" varchar(20),
	"actor_type" varchar(20),
	"action" varchar(80) NOT NULL,
	"module" varchar(50) NOT NULL,
	"severity" "audit_severity" DEFAULT 'INFO' NOT NULL,
	"result" "audit_result" NOT NULL,
	"resource_type" varchar(50),
	"resource_id" varchar(100),
	"subject_driver_id" uuid,
	"correlation_id" uuid,
	"session_id" uuid,
	"request_id" varchar(60),
	"ip_hash" varchar(64),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" varchar(60) NOT NULL,
	"version" varchar(20) NOT NULL,
	"granted" boolean NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"consent_method" varchar(30) NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"access_type" "data_access_type" NOT NULL,
	"data_category" "sensitive_data_category" NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(100),
	"subject_user_id" uuid,
	"subject_driver_id" uuid,
	"legal_basis" varchar(100),
	"correlation_id" uuid,
	"record_count" integer,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "government_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"government_user_id" uuid NOT NULL,
	"subject_driver_id" uuid NOT NULL,
	"access_type" "data_access_type" NOT NULL,
	"data_category" "sensitive_data_category" NOT NULL,
	"legal_authority" varchar(100) NOT NULL,
	"accessed_fields" text[],
	"jurisdiction" varchar(10) NOT NULL,
	"correlation_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_request_id" varchar(22) NOT NULL,
	"user_id" uuid NOT NULL,
	"driver_id" uuid,
	"request_type" "privacy_request_type" NOT NULL,
	"status" "privacy_request_status" DEFAULT 'RECEIVED' NOT NULL,
	"reason" text,
	"specific_data" text[],
	"legal_assessment_note" text,
	"assigned_to" uuid,
	"reviewed_by" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"completion_note" text,
	"data_package_ref" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "privacy_requests_public_request_id_unique" UNIQUE("public_request_id")
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"category" "retention_category" NOT NULL,
	"retention_days" integer,
	"can_delete" boolean DEFAULT false NOT NULL,
	"legal_basis" text NOT NULL,
	"archival_action" varchar(30) DEFAULT 'ARCHIVE' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"actor_role" varchar(50),
	"event_category" varchar(40) NOT NULL,
	"event_code" varchar(60) NOT NULL,
	"severity" "audit_severity" NOT NULL,
	"result" "audit_result" NOT NULL,
	"session_id" uuid,
	"device_fingerprint_hash" varchar(64),
	"ip_hash" varchar(64),
	"correlation_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archival_records" ADD CONSTRAINT "archival_records_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archival_records" ADD CONSTRAINT "archival_records_privacy_request_id_privacy_requests_id_fk" FOREIGN KEY ("privacy_request_id") REFERENCES "public"."privacy_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_subject_driver_id_driver_profiles_id_fk" FOREIGN KEY ("subject_driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_subject_driver_id_driver_profiles_id_fk" FOREIGN KEY ("subject_driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_access_logs" ADD CONSTRAINT "government_access_logs_government_user_id_users_id_fk" FOREIGN KEY ("government_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_access_logs" ADD CONSTRAINT "government_access_logs_subject_driver_id_driver_profiles_id_fk" FOREIGN KEY ("subject_driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_archival_entity" ON "archival_records" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_archival_reason" ON "archival_records" USING btree ("archival_reason");--> statement-breakpoint
CREATE INDEX "idx_archival_privacy_req" ON "archival_records" USING btree ("privacy_request_id");--> statement-breakpoint
CREATE INDEX "idx_archival_archived_at" ON "archival_records" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_audit_actor" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_module" ON "audit_logs" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_audit_severity" ON "audit_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_audit_result" ON "audit_logs" USING btree ("result");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_subject_driver" ON "audit_logs" USING btree ("subject_driver_id");--> statement-breakpoint
CREATE INDEX "idx_audit_correlation" ON "audit_logs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_audit_occurred" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_audit_actor_occurred" ON "audit_logs" USING btree ("actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_consent_user" ON "consent_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_consent_type" ON "consent_records" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "idx_consent_granted" ON "consent_records" USING btree ("granted");--> statement-breakpoint
CREATE INDEX "idx_consent_revoked" ON "consent_records" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "idx_data_access_actor" ON "data_access_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_data_access_category" ON "data_access_logs" USING btree ("data_category");--> statement-breakpoint
CREATE INDEX "idx_data_access_type" ON "data_access_logs" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX "idx_data_access_subject_driver" ON "data_access_logs" USING btree ("subject_driver_id");--> statement-breakpoint
CREATE INDEX "idx_data_access_occurred" ON "data_access_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_data_access_correlation" ON "data_access_logs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_gov_access_gov_user" ON "government_access_logs" USING btree ("government_user_id");--> statement-breakpoint
CREATE INDEX "idx_gov_access_driver" ON "government_access_logs" USING btree ("subject_driver_id");--> statement-breakpoint
CREATE INDEX "idx_gov_access_type" ON "government_access_logs" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX "idx_gov_access_category" ON "government_access_logs" USING btree ("data_category");--> statement-breakpoint
CREATE INDEX "idx_gov_access_occurred" ON "government_access_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_privacy_req_user" ON "privacy_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_privacy_req_driver" ON "privacy_requests" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_privacy_req_type" ON "privacy_requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "idx_privacy_req_status" ON "privacy_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_privacy_req_due" ON "privacy_requests" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_retention_unique" ON "retention_policies" USING btree ("jurisdiction","category");--> statement-breakpoint
CREATE INDEX "idx_retention_jurisdiction" ON "retention_policies" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_retention_category" ON "retention_policies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_retention_can_delete" ON "retention_policies" USING btree ("can_delete");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_user" ON "security_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_category" ON "security_audit_logs" USING btree ("event_category");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_code" ON "security_audit_logs" USING btree ("event_code");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_severity" ON "security_audit_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_occurred" ON "security_audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_sec_audit_correlation" ON "security_audit_logs" USING btree ("correlation_id");