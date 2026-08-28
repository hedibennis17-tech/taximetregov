CREATE TYPE "public"."gateway_mode" AS ENUM('SIMULATION', 'OFFICIAL_API', 'AUTHORIZED_ELECTRONIC', 'PORTAL_REDIRECT', 'MANUAL_EXPORT');--> statement-breakpoint
CREATE TYPE "public"."provider_compliance_status" AS ENUM('UNKNOWN', 'COMPLIANT', 'PENDING', 'NON_COMPLIANT', 'EXEMPT');--> statement-breakpoint
CREATE TYPE "public"."recon_case_status" AS ENUM('OPEN', 'MATCHED', 'EXCEPTION', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."revenue_ledger_entry_type" AS ENUM('CREDIT', 'DEBIT', 'ADJUSTMENT', 'REVERSAL');--> statement-breakpoint
CREATE TYPE "public"."revenue_source" AS ENUM('TAXI', 'UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP', 'OTHER_PROVIDER', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."tax_account_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'DEREGISTERED');--> statement-breakpoint
CREATE TYPE "public"."tax_filing_status" AS ENUM('DRAFT', 'PREPARED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'AMENDED');--> statement-breakpoint
CREATE TYPE "public"."tax_filing_type" AS ENUM('TPS', 'TVQ', 'TPS_TVQ_COMBINED', 'AMENDMENT');--> statement-breakpoint
CREATE TYPE "public"."tax_period_status" AS ENUM('OPEN', 'CALCULATING', 'READY_TO_FILE', 'FILED', 'ACCEPTED', 'REJECTED', 'AMENDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."tax_registration_status" AS ENUM('NOT_REGISTERED', 'PENDING', 'REGISTERED', 'EXEMPT', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_en" varchar(100),
	"country" varchar(2) DEFAULT 'CA' NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"is_pilot" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jurisdictions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "provider_compliance_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"requirement_code" varchar(60) NOT NULL,
	"requirement_type" varchar(40) NOT NULL,
	"mandatory" boolean DEFAULT false NOT NULL,
	"compliance_status" "provider_compliance_status" DEFAULT 'UNKNOWN' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"provider_id" uuid,
	"case_type" varchar(40) NOT NULL,
	"expected_amount" numeric(12, 2),
	"actual_amount" numeric(12, 2),
	"difference_amount" numeric(12, 2),
	"recon_case_status" "recon_case_status" DEFAULT 'OPEN' NOT NULL,
	"exception_note" text,
	"period_reference" varchar(30),
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"source_type" "revenue_source" NOT NULL,
	"provider_id" uuid,
	"activity_id" uuid,
	"activity_type" varchar(30),
	"entry_type" "revenue_ledger_entry_type" NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"fee_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tip_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"adjustment_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"activity_date" date NOT NULL,
	"is_settled" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp with time zone,
	"source_reference" varchar(100),
	"corrected_entry_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"tps_registration_masked" varchar(20),
	"tvq_registration_masked" varchar(20),
	"tps_status" "tax_registration_status" DEFAULT 'NOT_REGISTERED' NOT NULL,
	"tvq_status" "tax_registration_status" DEFAULT 'NOT_REGISTERED' NOT NULL,
	"filing_frequency" varchar(20) DEFAULT 'QUARTERLY' NOT NULL,
	"tax_account_status" "tax_account_status" DEFAULT 'PENDING' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_accounts_driver_id_unique" UNIQUE("driver_id")
);
--> statement-breakpoint
CREATE TABLE "tax_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_period_id" uuid NOT NULL,
	"tax_rule_set_id" uuid NOT NULL,
	"calculation_version" integer DEFAULT 1 NOT NULL,
	"tps_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tps_remitted" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tps_credits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tps_adjustments" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tps_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_remitted" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_credits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_adjustments" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_estimate" boolean DEFAULT true NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"calculated_by" uuid,
	"input_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_account_id" uuid NOT NULL,
	"tax_period_id" uuid NOT NULL,
	"calculation_id" uuid,
	"filing_type" "tax_filing_type" NOT NULL,
	"filing_status" "tax_filing_status" DEFAULT 'DRAFT' NOT NULL,
	"gateway_mode" "gateway_mode" DEFAULT 'SIMULATION' NOT NULL,
	"prepared_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"government_reference" varchar(100),
	"rejection_reason" text,
	"is_simulation" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_account_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"filing_due_date" date NOT NULL,
	"period_status" "tax_period_status" DEFAULT 'OPEN' NOT NULL,
	"tps_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"tvq_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"gross_revenue_taxi" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_rideshare" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_delivery" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_other" numeric(12, 2) DEFAULT '0' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rule_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"version" varchar(20) NOT NULL,
	"label" varchar(100) NOT NULL,
	"tps_rate" numeric(8, 5),
	"tvq_rate" numeric(8, 5),
	"effective_from" date NOT NULL,
	"effective_until" date,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"published_by" uuid,
	"published_at" timestamp with time zone,
	"source_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_compliance_requirements" ADD CONSTRAINT "provider_compliance_requirements_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_compliance_requirements" ADD CONSTRAINT "provider_compliance_requirements_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_cases" ADD CONSTRAINT "reconciliation_cases_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_cases" ADD CONSTRAINT "reconciliation_cases_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_cases" ADD CONSTRAINT "reconciliation_cases_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_ledger" ADD CONSTRAINT "revenue_ledger_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_ledger" ADD CONSTRAINT "revenue_ledger_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_accounts" ADD CONSTRAINT "tax_accounts_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_accounts" ADD CONSTRAINT "tax_accounts_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_tax_period_id_tax_periods_id_fk" FOREIGN KEY ("tax_period_id") REFERENCES "public"."tax_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_tax_rule_set_id_tax_rule_sets_id_fk" FOREIGN KEY ("tax_rule_set_id") REFERENCES "public"."tax_rule_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filings" ADD CONSTRAINT "tax_filings_tax_account_id_tax_accounts_id_fk" FOREIGN KEY ("tax_account_id") REFERENCES "public"."tax_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filings" ADD CONSTRAINT "tax_filings_tax_period_id_tax_periods_id_fk" FOREIGN KEY ("tax_period_id") REFERENCES "public"."tax_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filings" ADD CONSTRAINT "tax_filings_calculation_id_tax_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."tax_calculations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_periods" ADD CONSTRAINT "tax_periods_tax_account_id_tax_accounts_id_fk" FOREIGN KEY ("tax_account_id") REFERENCES "public"."tax_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_sets" ADD CONSTRAINT "tax_rule_sets_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_sets" ADD CONSTRAINT "tax_rule_sets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_sets" ADD CONSTRAINT "tax_rule_sets_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_jurisdictions_code" ON "jurisdictions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_jurisdictions_country" ON "jurisdictions" USING btree ("country");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_prov_compliance_unique" ON "provider_compliance_requirements" USING btree ("provider_id","jurisdiction_id","requirement_code");--> statement-breakpoint
CREATE INDEX "idx_prov_compliance_provider" ON "provider_compliance_requirements" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_prov_compliance_jurisdiction" ON "provider_compliance_requirements" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_recon_driver" ON "reconciliation_cases" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_recon_provider" ON "reconciliation_cases" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_recon_status" ON "reconciliation_cases" USING btree ("recon_case_status");--> statement-breakpoint
CREATE INDEX "idx_rev_ledger_driver" ON "revenue_ledger" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_rev_ledger_source" ON "revenue_ledger" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_rev_ledger_provider" ON "revenue_ledger" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_rev_ledger_date" ON "revenue_ledger" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "idx_rev_ledger_driver_date" ON "revenue_ledger" USING btree ("driver_id","activity_date");--> statement-breakpoint
CREATE INDEX "idx_rev_ledger_settled" ON "revenue_ledger" USING btree ("is_settled");--> statement-breakpoint
CREATE INDEX "idx_tax_account_driver" ON "tax_accounts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_tax_account_jurisdiction" ON "tax_accounts" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_tax_account_status" ON "tax_accounts" USING btree ("tax_account_status");--> statement-breakpoint
CREATE INDEX "idx_tax_calc_period" ON "tax_calculations" USING btree ("tax_period_id");--> statement-breakpoint
CREATE INDEX "idx_tax_calc_rules" ON "tax_calculations" USING btree ("tax_rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_tax_calc_calculated" ON "tax_calculations" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "idx_tax_filing_account" ON "tax_filings" USING btree ("tax_account_id");--> statement-breakpoint
CREATE INDEX "idx_tax_filing_period" ON "tax_filings" USING btree ("tax_period_id");--> statement-breakpoint
CREATE INDEX "idx_tax_filing_status" ON "tax_filings" USING btree ("filing_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_period_unique" ON "tax_periods" USING btree ("tax_account_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_tax_period_account" ON "tax_periods" USING btree ("tax_account_id");--> statement-breakpoint
CREATE INDEX "idx_tax_period_status" ON "tax_periods" USING btree ("period_status");--> statement-breakpoint
CREATE INDEX "idx_tax_period_due" ON "tax_periods" USING btree ("filing_due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_rule_set_unique" ON "tax_rule_sets" USING btree ("jurisdiction_id","code","version");--> statement-breakpoint
CREATE INDEX "idx_tax_rule_set_jurisdiction" ON "tax_rule_sets" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_tax_rule_set_status" ON "tax_rule_sets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tax_rule_set_effective" ON "tax_rule_sets" USING btree ("effective_from","effective_until");