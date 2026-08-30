CREATE TYPE "public"."deduction_type" AS ENUM('PLATFORM_FEE', 'TAX_REMITTANCE', 'REFUND_DEBIT', 'ADJUSTMENT_DEBIT', 'REGULATORY_FEE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ledger_summary_status" AS ENUM('COMPUTING', 'COMPUTED', 'STALE', 'FINALIZED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."payout_calc_status" AS ENUM('DRAFT', 'VALIDATED', 'APPROVED', 'DISBURSED', 'FAILED', 'CANCELLED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."financial_snapshot_type" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ON_DEMAND', 'TAX_PERIOD');--> statement-breakpoint
CREATE TYPE "public"."statement_status" AS ENUM('GENERATING', 'READY', 'DELIVERED', 'VIEWED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."statement_type" AS ENUM('EARNINGS_SUMMARY', 'TAX_SUMMARY', 'ACTIVITY_BREAKDOWN', 'PAYOUT_HISTORY', 'RECONCILIATION_STATEMENT', 'ANNUAL_STATEMENT');--> statement-breakpoint
CREATE TABLE "driver_financial_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(22) NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid,
	"statement_type" "statement_type" NOT NULL,
	"status" "statement_status" DEFAULT 'GENERATING' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"snapshot_id" uuid,
	"ledger_summary_id" uuid,
	"document_ref" text,
	"masking_policy" varchar(30) DEFAULT 'STANDARD' NOT NULL,
	"generated_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"generated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_financial_statements_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "driver_ledger_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" "ledger_summary_status" DEFAULT 'COMPUTING' NOT NULL,
	"gross_revenue_taxi" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_rideshare" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_delivery" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_other" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tips" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_platform_fees" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tax_remittances" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_refund_debits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_adjustment_debits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tps_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tvq_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tax_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"activity_count" integer DEFAULT 0 NOT NULL,
	"taxi_trip_count" integer DEFAULT 0 NOT NULL,
	"rideshare_trip_count" integer DEFAULT 0 NOT NULL,
	"delivery_count" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"computed_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"ledger_entry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_period_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"tax_period_id" uuid,
	"snapshot_type" "financial_snapshot_type" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"gross_revenue_taxi" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_rideshare" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_delivery" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_revenue_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tps_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tps_remitted" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tvq_remitted" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"activity_count" integer DEFAULT 0 NOT NULL,
	"wallet_balance_at_period_end" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"is_finalized" boolean DEFAULT false NOT NULL,
	"finalized_at" timestamp with time zone,
	"snapshot_version" integer DEFAULT 1 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(22) NOT NULL,
	"driver_id" uuid NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"payout_calc_status" "payout_calc_status" DEFAULT 'DRAFT' NOT NULL,
	"wallet_balance_at_calc" numeric(12, 2) NOT NULL,
	"requested_amount" numeric(12, 2) NOT NULL,
	"pending_tax_remittances" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_platform_fees" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_refund_debits" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_pending_deductions" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_available_amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2),
	"disbursed_amount" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"has_negative_balance" boolean DEFAULT false NOT NULL,
	"validation_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calculated_by" uuid,
	"approved_by" uuid,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"disbursed_at" timestamp with time zone,
	"failure_code" varchar(50),
	"failure_detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_calculations_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "driver_financial_statements" ADD CONSTRAINT "driver_financial_statements_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_financial_statements" ADD CONSTRAINT "driver_financial_statements_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_financial_statements" ADD CONSTRAINT "driver_financial_statements_snapshot_id_financial_period_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."financial_period_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_financial_statements" ADD CONSTRAINT "driver_financial_statements_ledger_summary_id_driver_ledger_summaries_id_fk" FOREIGN KEY ("ledger_summary_id") REFERENCES "public"."driver_ledger_summaries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_financial_statements" ADD CONSTRAINT "driver_financial_statements_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_ledger_summaries" ADD CONSTRAINT "driver_ledger_summaries_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_ledger_summaries" ADD CONSTRAINT "driver_ledger_summaries_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_period_snapshots" ADD CONSTRAINT "financial_period_snapshots_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_period_snapshots" ADD CONSTRAINT "financial_period_snapshots_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_period_snapshots" ADD CONSTRAINT "financial_period_snapshots_tax_period_id_tax_periods_id_fk" FOREIGN KEY ("tax_period_id") REFERENCES "public"."tax_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_calculations" ADD CONSTRAINT "payout_calculations_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_calculations" ADD CONSTRAINT "payout_calculations_wallet_account_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_calculations" ADD CONSTRAINT "payout_calculations_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_calculations" ADD CONSTRAINT "payout_calculations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_statement_driver" ON "driver_financial_statements" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_statement_type" ON "driver_financial_statements" USING btree ("statement_type");--> statement-breakpoint
CREATE INDEX "idx_statement_status" ON "driver_financial_statements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_statement_period" ON "driver_financial_statements" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ledger_summary_driver_period" ON "driver_ledger_summaries" USING btree ("driver_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_ledger_summary_driver" ON "driver_ledger_summaries" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_summary_jurisdiction" ON "driver_ledger_summaries" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_summary_status" ON "driver_ledger_summaries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ledger_summary_period" ON "driver_ledger_summaries" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fin_snapshot_driver_period_type" ON "financial_period_snapshots" USING btree ("driver_id","period_start","period_end","snapshot_type","snapshot_version");--> statement-breakpoint
CREATE INDEX "idx_fin_snapshot_driver" ON "financial_period_snapshots" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_fin_snapshot_jurisdiction" ON "financial_period_snapshots" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_fin_snapshot_period" ON "financial_period_snapshots" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_fin_snapshot_type" ON "financial_period_snapshots" USING btree ("snapshot_type");--> statement-breakpoint
CREATE INDEX "idx_fin_snapshot_finalized" ON "financial_period_snapshots" USING btree ("is_finalized");--> statement-breakpoint
CREATE INDEX "idx_payout_calc_driver" ON "payout_calculations" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_payout_calc_wallet" ON "payout_calculations" USING btree ("wallet_account_id");--> statement-breakpoint
CREATE INDEX "idx_payout_calc_status" ON "payout_calculations" USING btree ("payout_calc_status");--> statement-breakpoint
CREATE INDEX "idx_payout_calc_created" ON "payout_calculations" USING btree ("calculated_at");