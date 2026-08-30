CREATE TYPE "public"."dashboard_metric_type" AS ENUM('ACTIVE_DRIVERS', 'SUSPENDED_DRIVERS', 'PENDING_APPROVALS', 'ACTIVE_VEHICLES', 'DAILY_TRIPS', 'DAILY_DELIVERIES', 'TAX_COLLECTED', 'COMPLIANCE_RATE', 'OPEN_INCIDENTS', 'PROVIDER_EVENTS_TODAY', 'QUARANTINE_QUEUE', 'EXPIRING_DOCUMENTS');--> statement-breakpoint
CREATE TYPE "public"."gov_driver_compliance" AS ENUM('COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'SUSPENDED', 'REVOKED', 'PENDING_DOCS', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."oversight_priority" AS ENUM('CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'INFORMATIONAL');--> statement-breakpoint
CREATE TYPE "public"."regulatory_action_status" AS ENUM('PENDING', 'ACTIVE', 'APPEALED', 'OVERTURNED', 'UPHELD', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."regulatory_action_type" AS ENUM('DRIVER_APPROVED', 'DRIVER_SUSPENDED', 'DRIVER_REACTIVATED', 'DRIVER_REVOKED', 'VEHICLE_APPROVED', 'VEHICLE_SUSPENDED', 'PERMIT_APPROVED', 'PERMIT_SUSPENDED', 'PERMIT_REVOKED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'TAX_ASSESSMENT', 'COMPLIANCE_NOTICE', 'INVESTIGATION_OPENED', 'INVESTIGATION_CLOSED', 'FINE_ISSUED', 'PENALTY_APPLIED', 'WARNING_ISSUED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."regulatory_report_status" AS ENUM('SCHEDULED', 'GENERATING', 'READY', 'DELIVERED', 'FAILED', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."regulatory_report_type" AS ENUM('DRIVER_ACTIVITY_SUMMARY', 'REVENUE_SUMMARY', 'TAX_COMPLIANCE', 'PROVIDER_ACTIVITY', 'PLATFORM_OVERSIGHT', 'INCIDENT_REPORT', 'AUDIT_TRAIL', 'GDPR_PROCESSING_REGISTER', 'FLEET_COMPLIANCE', 'PILOT_STATUS', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."report_format" AS ENUM('PDF', 'CSV', 'JSON', 'XML', 'XLSX');--> statement-breakpoint
CREATE TABLE "dashboard_metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"metric_type" "dashboard_metric_type" NOT NULL,
	"metric_value" numeric(19, 4) NOT NULL,
	"metric_unit" varchar(20),
	"period_type" varchar(20) DEFAULT 'DAILY' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_regulatory_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"overall_compliance" "gov_driver_compliance" DEFAULT 'UNKNOWN' NOT NULL,
	"documents_valid" boolean DEFAULT false NOT NULL,
	"documents_expiring" boolean DEFAULT false NOT NULL,
	"missing_documents" text[],
	"active_actions_count" integer DEFAULT 0 NOT NULL,
	"critical_actions_count" integer DEFAULT 0 NOT NULL,
	"has_suspension" boolean DEFAULT false NOT NULL,
	"total_activities" integer DEFAULT 0 NOT NULL,
	"taxi_trips" integer DEFAULT 0 NOT NULL,
	"rideshare_trips" integer DEFAULT 0 NOT NULL,
	"deliveries" integer DEFAULT 0 NOT NULL,
	"tax_compliant" boolean DEFAULT false NOT NULL,
	"open_tax_periods" integer DEFAULT 0 NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	"snapshot_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_regulatory_profiles_driver_id_unique" UNIQUE("driver_id")
);
--> statement-breakpoint
CREATE TABLE "oversight_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid,
	"flag_type" varchar(60) NOT NULL,
	"priority" "oversight_priority" DEFAULT 'NORMAL' NOT NULL,
	"description" text NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_ref" varchar(100),
	"jurisdiction_id" uuid,
	"is_open" boolean DEFAULT true NOT NULL,
	"assigned_to" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"resolution" varchar(30),
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "regulatory_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_action_id" varchar(20) NOT NULL,
	"issued_by" uuid NOT NULL,
	"approved_by" uuid,
	"subject_driver_id" uuid,
	"jurisdiction_id" uuid NOT NULL,
	"action_type" "regulatory_action_type" NOT NULL,
	"status" "regulatory_action_status" DEFAULT 'ACTIVE' NOT NULL,
	"priority" "oversight_priority" DEFAULT 'NORMAL' NOT NULL,
	"legal_authority" varchar(200) NOT NULL,
	"legal_reference" varchar(100),
	"effective_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"penalty_amount" numeric(12, 2),
	"penalty_currency" varchar(3),
	"reason" text NOT NULL,
	"internal_note" text,
	"appeal_deadline_at" timestamp with time zone,
	"appealed_at" timestamp with time zone,
	"appeal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_actions_public_action_id_unique" UNIQUE("public_action_id")
);
--> statement-breakpoint
CREATE TABLE "regulatory_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_report_id" varchar(22) NOT NULL,
	"requested_by" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"report_type" "regulatory_report_type" NOT NULL,
	"status" "regulatory_report_status" DEFAULT 'SCHEDULED' NOT NULL,
	"format" "report_format" DEFAULT 'PDF' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"report_ref_masked" varchar(200),
	"report_size_bytes" integer,
	"record_count" integer,
	"contains_pii" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"failure_reason" text,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_download_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulatory_reports_public_report_id_unique" UNIQUE("public_report_id")
);
--> statement-breakpoint
CREATE TABLE "report_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"accessed_by" uuid NOT NULL,
	"access_type" varchar(20) NOT NULL,
	"mfa_verified" boolean DEFAULT false NOT NULL,
	"ip_hash" varchar(64),
	"correlation_id" uuid,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_regulatory_profiles" ADD CONSTRAINT "driver_regulatory_profiles_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_regulatory_profiles" ADD CONSTRAINT "driver_regulatory_profiles_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oversight_flags" ADD CONSTRAINT "oversight_flags_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oversight_flags" ADD CONSTRAINT "oversight_flags_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oversight_flags" ADD CONSTRAINT "oversight_flags_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oversight_flags" ADD CONSTRAINT "oversight_flags_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_actions" ADD CONSTRAINT "regulatory_actions_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_actions" ADD CONSTRAINT "regulatory_actions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_actions" ADD CONSTRAINT "regulatory_actions_subject_driver_id_driver_profiles_id_fk" FOREIGN KEY ("subject_driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_actions" ADD CONSTRAINT "regulatory_actions_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_reports" ADD CONSTRAINT "regulatory_reports_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_access_log" ADD CONSTRAINT "report_access_log_report_id_regulatory_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."regulatory_reports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_access_log" ADD CONSTRAINT "report_access_log_accessed_by_users_id_fk" FOREIGN KEY ("accessed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dash_metric_unique" ON "dashboard_metric_snapshots" USING btree ("jurisdiction_id","metric_type","period_start","period_type");--> statement-breakpoint
CREATE INDEX "idx_dash_metric_jurisdiction" ON "dashboard_metric_snapshots" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_dash_metric_type" ON "dashboard_metric_snapshots" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_dash_metric_period" ON "dashboard_metric_snapshots" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_dash_metric_computed" ON "dashboard_metric_snapshots" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "idx_drp_driver" ON "driver_regulatory_profiles" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_drp_jurisdiction" ON "driver_regulatory_profiles" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_drp_compliance" ON "driver_regulatory_profiles" USING btree ("overall_compliance");--> statement-breakpoint
CREATE INDEX "idx_drp_suspension" ON "driver_regulatory_profiles" USING btree ("has_suspension");--> statement-breakpoint
CREATE INDEX "idx_drp_snapshot" ON "driver_regulatory_profiles" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_oversight_driver" ON "oversight_flags" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_oversight_type" ON "oversight_flags" USING btree ("flag_type");--> statement-breakpoint
CREATE INDEX "idx_oversight_priority" ON "oversight_flags" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_oversight_open" ON "oversight_flags" USING btree ("is_open");--> statement-breakpoint
CREATE INDEX "idx_oversight_jurisdiction" ON "oversight_flags" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_reg_action_issued_by" ON "regulatory_actions" USING btree ("issued_by");--> statement-breakpoint
CREATE INDEX "idx_reg_action_driver" ON "regulatory_actions" USING btree ("subject_driver_id");--> statement-breakpoint
CREATE INDEX "idx_reg_action_type" ON "regulatory_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_reg_action_status" ON "regulatory_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reg_action_jurisdiction" ON "regulatory_actions" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_reg_action_effective" ON "regulatory_actions" USING btree ("effective_at");--> statement-breakpoint
CREATE INDEX "idx_reg_action_expires" ON "regulatory_actions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_reg_report_requested_by" ON "regulatory_reports" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "idx_reg_report_jurisdiction" ON "regulatory_reports" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_reg_report_type" ON "regulatory_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_reg_report_status" ON "regulatory_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reg_report_period" ON "regulatory_reports" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_report_access_report" ON "report_access_log" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_report_access_user" ON "report_access_log" USING btree ("accessed_by");--> statement-breakpoint
CREATE INDEX "idx_report_access_at" ON "report_access_log" USING btree ("accessed_at");