CREATE TYPE "public"."compliance_status" AS ENUM('COMPLIANT', 'NON_COMPLIANT', 'REVIEW_REQUIRED', 'PENDING', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('DRAFT', 'UPLOADED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'REPLACED', 'REVOKED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."inspection_result" AS ENUM('SCHEDULED', 'PENDING', 'PASSED', 'FAILED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."inspection_type_v2" AS ENUM('SAFETY', 'MECHANICAL', 'REGULATORY', 'ANNUAL', 'COMMERCIAL', 'TAXIMETER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ocr_status" AS ENUM('NOT_REQUESTED', 'OCR_PENDING', 'OCR_COMPLETE', 'OCR_FAILED');--> statement-breakpoint
CREATE TYPE "public"."owner_type" AS ENUM('DRIVER', 'VEHICLE', 'BUSINESS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."rejection_reason" AS ENUM('DOCUMENT_ILLEGIBLE', 'EXPIRED', 'WRONG_DOCUMENT_TYPE', 'MISSING_INFORMATION', 'INVALID_FORMAT', 'UNVERIFIABLE', 'SUSPECTED_FRAUD', 'MISMATCH', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('SCAN_PENDING', 'SCAN_CLEAN', 'SCAN_INFECTED', 'SCAN_FAILED');--> statement-breakpoint
CREATE TABLE "compliance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "owner_type" NOT NULL,
	"driver_owner_id" uuid,
	"vehicle_owner_id" uuid,
	"service_type" varchar(30) NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"overall_status" "compliance_status" NOT NULL,
	"missing_documents" jsonb DEFAULT '[]' NOT NULL,
	"expired_documents" jsonb DEFAULT '[]' NOT NULL,
	"expiring_documents" jsonb DEFAULT '[]' NOT NULL,
	"completeness_score" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"action" varchar(60) NOT NULL,
	"version_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_type_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type_id" uuid NOT NULL,
	"service_type" varchar(30) NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"notes" text,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"label" varchar(100) NOT NULL,
	"label_fr" varchar(100),
	"label_en" varchar(100),
	"owner_type" "owner_type" NOT NULL,
	"has_expiry_date" boolean DEFAULT true NOT NULL,
	"has_issue_date" boolean DEFAULT true NOT NULL,
	"requires_verification" boolean DEFAULT true NOT NULL,
	"requires_manual_review" boolean DEFAULT false NOT NULL,
	"default_validity_days" integer,
	"renewal_notice_days" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "document_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid,
	"verification_status" "doc_verification_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"verification_method" "verification_method" DEFAULT 'MANUAL' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"rejection_reason" "rejection_reason",
	"rejection_note" text,
	"review_notes" text,
	"reviewer_jurisdiction" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"storage_reference" text NOT NULL,
	"original_file_name" varchar(255),
	"mime_type" varchar(100),
	"file_size_bytes" integer,
	"checksum" varchar(64) NOT NULL,
	"scan_status" "scan_status" DEFAULT 'SCAN_PENDING' NOT NULL,
	"scan_completed_at" timestamp with time zone,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"replaced_by_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_document_id" varchar(20) NOT NULL,
	"document_type_id" uuid NOT NULL,
	"owner_type" "owner_type" NOT NULL,
	"driver_owner_id" uuid,
	"vehicle_owner_id" uuid,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"status" "document_status" DEFAULT 'DRAFT' NOT NULL,
	"issued_at" date,
	"expires_at" date,
	"current_version_id" uuid,
	"doc_number_encrypted" text,
	"doc_number_enc_key_ver" varchar(20),
	"doc_number_hash" varchar(64),
	"doc_number_last4" varchar(4),
	"ocr_extracted_data" jsonb,
	"ocr_status" "ocr_status" DEFAULT 'NOT_REQUESTED' NOT NULL,
	"is_legal_hold" boolean DEFAULT false NOT NULL,
	"legal_hold_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "documents_public_document_id_unique" UNIQUE("public_document_id")
);
--> statement-breakpoint
CREATE TABLE "inspection_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid,
	"driver_id" uuid,
	"inspection_type_v2" "inspection_type_v2" NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"inspected_at" timestamp with time zone,
	"valid_from" date,
	"valid_until" date,
	"result" "inspection_result" DEFAULT 'SCHEDULED' NOT NULL,
	"inspector_reference" varchar(100),
	"inspection_center_reference" varchar(100),
	"document_id" uuid,
	"failure_notes" text,
	"conditions" text[] DEFAULT '{}',
	"expiry_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compliance_snapshots" ADD CONSTRAINT "compliance_snapshots_driver_owner_id_driver_profiles_id_fk" FOREIGN KEY ("driver_owner_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_snapshots" ADD CONSTRAINT "compliance_snapshots_vehicle_owner_id_vehicles_id_fk" FOREIGN KEY ("vehicle_owner_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_events" ADD CONSTRAINT "document_audit_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_events" ADD CONSTRAINT "document_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_events" ADD CONSTRAINT "document_audit_events_version_id_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_type_requirements" ADD CONSTRAINT "document_type_requirements_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_driver_owner_id_driver_profiles_id_fk" FOREIGN KEY ("driver_owner_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicle_owner_id_vehicles_id_fk" FOREIGN KEY ("vehicle_owner_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_compliance_driver" ON "compliance_snapshots" USING btree ("driver_owner_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_vehicle" ON "compliance_snapshots" USING btree ("vehicle_owner_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_service" ON "compliance_snapshots" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_compliance_status" ON "compliance_snapshots" USING btree ("overall_status");--> statement-breakpoint
CREATE INDEX "idx_compliance_computed" ON "compliance_snapshots" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "idx_doc_audit_document" ON "document_audit_events" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_audit_actor" ON "document_audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_doc_audit_action" ON "document_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_doc_audit_occurred" ON "document_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_doc_req_unique" ON "document_type_requirements" USING btree ("document_type_id","service_type","jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_doc_req_service" ON "document_type_requirements" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_doc_req_jurisdiction" ON "document_type_requirements" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_doc_types_owner" ON "document_types" USING btree ("owner_type");--> statement-breakpoint
CREATE INDEX "idx_doc_types_active" ON "document_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_doc_verif_document" ON "document_verifications" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_verif_status" ON "document_verifications" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_doc_verif_verified_by" ON "document_verifications" USING btree ("verified_by");--> statement-breakpoint
CREATE INDEX "idx_doc_verif_jurisdiction" ON "document_verifications" USING btree ("reviewer_jurisdiction");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_doc_versions_doc_num" ON "document_versions" USING btree ("document_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_doc_versions_document" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_versions_checksum" ON "document_versions" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "idx_doc_versions_scan" ON "document_versions" USING btree ("scan_status");--> statement-breakpoint
CREATE INDEX "idx_doc_versions_uploaded" ON "document_versions" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_docs_public_id" ON "documents" USING btree ("public_document_id");--> statement-breakpoint
CREATE INDEX "idx_docs_type" ON "documents" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX "idx_docs_driver_owner" ON "documents" USING btree ("driver_owner_id");--> statement-breakpoint
CREATE INDEX "idx_docs_vehicle_owner" ON "documents" USING btree ("vehicle_owner_id");--> statement-breakpoint
CREATE INDEX "idx_docs_status" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_docs_expires" ON "documents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_docs_jurisdiction" ON "documents" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_docs_number_hash" ON "documents" USING btree ("doc_number_hash");--> statement-breakpoint
CREATE INDEX "idx_docs_driver_expires" ON "documents" USING btree ("driver_owner_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_inspection_vehicle" ON "inspection_records" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_inspection_driver" ON "inspection_records" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_inspection_type" ON "inspection_records" USING btree ("inspection_type_v2");--> statement-breakpoint
CREATE INDEX "idx_inspection_result" ON "inspection_records" USING btree ("result");--> statement-breakpoint
CREATE INDEX "idx_inspection_valid_until" ON "inspection_records" USING btree ("valid_until");