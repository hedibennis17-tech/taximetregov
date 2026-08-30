CREATE TYPE "public"."driver_tax_reg_status" AS ENUM('NOT_REGISTERED', 'PENDING', 'REGISTERED', 'SUSPENDED', 'CANCELLED', 'UNKNOWN', 'REQUIRES_VERIFICATION');--> statement-breakpoint
CREATE TYPE "public"."driver_tax_reg_type" AS ENUM('GST', 'QST', 'HST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."rounding_mode" AS ENUM('HALF_UP', 'HALF_EVEN', 'DOWN', 'UP', 'HALF_DOWN');--> statement-breakpoint
CREATE TYPE "public"."tax_adjustment_type" AS ENUM('PROVIDER_ADJUSTMENT', 'GOVERNMENT_CORRECTION', 'ROUNDING_CORRECTION', 'REFUND', 'REVERSAL', 'INPUT_TAX_CREDIT', 'INPUT_TAX_REFUND', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tax_calc_method" AS ENUM('TWO_STEP', 'ONE_STEP', 'COMPONENT', 'INCLUSIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tax_component_type" AS ENUM('GST', 'QST', 'HST', 'PST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tax_reconciliation_status" AS ENUM('MATCHED', 'MINOR_DIFFERENCE', 'MISMATCH', 'UNDER_REVIEW', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."tax_system" AS ENUM('GST_QST', 'HST', 'GST_PST', 'GST_ONLY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."taxability_status" AS ENUM('TAXABLE', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE', 'UNKNOWN', 'REQUIRES_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."tx_tax_calc_status" AS ENUM('PENDING', 'CALCULATED', 'REVIEW_REQUIRED', 'FINALIZED', 'VOIDED', 'REVERSED');--> statement-breakpoint
CREATE TABLE "tax_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_calculation_id" uuid NOT NULL,
	"adjustment_type" "tax_adjustment_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"direction" varchar(10) NOT NULL,
	"reason_code" varchar(60),
	"source_reference" varchar(100),
	"authorized_by" uuid,
	"previous_total_tax" numeric(12, 2),
	"new_total_tax" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_calculation_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_calculation_id" uuid NOT NULL,
	"tax_component_id" uuid NOT NULL,
	"taxable_base" numeric(19, 4) NOT NULL,
	"rate" numeric(8, 5) NOT NULL,
	"calculated_amount" numeric(19, 4) NOT NULL,
	"rounded_amount" numeric(12, 2) NOT NULL,
	"rounding_difference" numeric(12, 4) DEFAULT '0' NOT NULL,
	"calculation_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_rule_set_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_en" varchar(100),
	"component_type" "tax_component_type" NOT NULL,
	"rate" numeric(8, 5) NOT NULL,
	"calculation_order" integer DEFAULT 1 NOT NULL,
	"compound_on_component_id" uuid,
	"rounding_policy_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_driver_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"registration_type" "driver_tax_reg_type" NOT NULL,
	"registration_number_masked" varchar(30),
	"jurisdiction_id" uuid,
	"status" "driver_tax_reg_status" DEFAULT 'UNKNOWN' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_calculation_id" uuid NOT NULL,
	"provider_tax_amount" numeric(12, 2),
	"government_tax_amount" numeric(12, 2),
	"difference" numeric(12, 4),
	"status" "tax_reconciliation_status" DEFAULT 'UNDER_REVIEW' NOT NULL,
	"reason" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rounding_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"decimal_places" smallint DEFAULT 2 NOT NULL,
	"rounding_mode" "rounding_mode" DEFAULT 'HALF_UP' NOT NULL,
	"minimum_unit" numeric(8, 4),
	"source_reference" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rounding_policies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tax_rule_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_rule_set_id" uuid NOT NULL,
	"condition_type" varchar(50) NOT NULL,
	"condition_code" varchar(100) NOT NULL,
	"operator" varchar(20) DEFAULT 'EQUALS' NOT NULL,
	"value" text,
	"priority" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_tax_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"tax_rule_set_id" uuid NOT NULL,
	"transaction_effective_at" timestamp with time zone NOT NULL,
	"taxability_status" "taxability_status" NOT NULL,
	"tx_tax_calc_status" "tx_tax_calc_status" DEFAULT 'PENDING' NOT NULL,
	"calc_method" "tax_calc_method" NOT NULL,
	"taxable_base" numeric(19, 4) NOT NULL,
	"tax_inclusive" boolean DEFAULT false NOT NULL,
	"total_tax" numeric(12, 2),
	"rounding_difference" numeric(12, 4),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"calculation_version" varchar(30) NOT NULL,
	"taxability_reason_code" varchar(60),
	"taxability_rule_ref" varchar(100),
	"provider_reported_tax" numeric(12, 2),
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone,
	"input_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tax_adjustments" ADD CONSTRAINT "tax_adjustments_tax_calculation_id_transaction_tax_calculations_id_fk" FOREIGN KEY ("tax_calculation_id") REFERENCES "public"."transaction_tax_calculations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_adjustments" ADD CONSTRAINT "tax_adjustments_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculation_components" ADD CONSTRAINT "tax_calculation_components_tax_calculation_id_transaction_tax_calculations_id_fk" FOREIGN KEY ("tax_calculation_id") REFERENCES "public"."transaction_tax_calculations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculation_components" ADD CONSTRAINT "tax_calculation_components_tax_component_id_tax_components_id_fk" FOREIGN KEY ("tax_component_id") REFERENCES "public"."tax_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_components" ADD CONSTRAINT "tax_components_tax_rule_set_id_tax_rule_sets_id_fk" FOREIGN KEY ("tax_rule_set_id") REFERENCES "public"."tax_rule_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_components" ADD CONSTRAINT "tax_components_rounding_policy_id_tax_rounding_policies_id_fk" FOREIGN KEY ("rounding_policy_id") REFERENCES "public"."tax_rounding_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_driver_registrations" ADD CONSTRAINT "tax_driver_registrations_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_driver_registrations" ADD CONSTRAINT "tax_driver_registrations_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_driver_registrations" ADD CONSTRAINT "tax_driver_registrations_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_reconciliations" ADD CONSTRAINT "tax_reconciliations_tax_calculation_id_transaction_tax_calculations_id_fk" FOREIGN KEY ("tax_calculation_id") REFERENCES "public"."transaction_tax_calculations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_reconciliations" ADD CONSTRAINT "tax_reconciliations_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_conditions" ADD CONSTRAINT "tax_rule_conditions_tax_rule_set_id_tax_rule_sets_id_fk" FOREIGN KEY ("tax_rule_set_id") REFERENCES "public"."tax_rule_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tax_calculations" ADD CONSTRAINT "transaction_tax_calculations_activity_id_driver_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."driver_activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tax_calculations" ADD CONSTRAINT "transaction_tax_calculations_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tax_calculations" ADD CONSTRAINT "transaction_tax_calculations_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tax_calculations" ADD CONSTRAINT "transaction_tax_calculations_tax_rule_set_id_tax_rule_sets_id_fk" FOREIGN KEY ("tax_rule_set_id") REFERENCES "public"."tax_rule_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tax_adj_calculation" ON "tax_adjustments" USING btree ("tax_calculation_id");--> statement-breakpoint
CREATE INDEX "idx_tax_adj_type" ON "tax_adjustments" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "idx_tax_adj_authorized" ON "tax_adjustments" USING btree ("authorized_by");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_calc_component_unique" ON "tax_calculation_components" USING btree ("tax_calculation_id","tax_component_id");--> statement-breakpoint
CREATE INDEX "idx_calc_component_calc" ON "tax_calculation_components" USING btree ("tax_calculation_id");--> statement-breakpoint
CREATE INDEX "idx_calc_component_component" ON "tax_calculation_components" USING btree ("tax_component_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_component_unique" ON "tax_components" USING btree ("tax_rule_set_id","code");--> statement-breakpoint
CREATE INDEX "idx_tax_component_rule_set" ON "tax_components" USING btree ("tax_rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_tax_component_type" ON "tax_components" USING btree ("component_type");--> statement-breakpoint
CREATE INDEX "idx_tax_component_order" ON "tax_components" USING btree ("calculation_order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_reg_driver_type" ON "tax_driver_registrations" USING btree ("driver_id","registration_type","effective_from");--> statement-breakpoint
CREATE INDEX "idx_tax_reg_driver" ON "tax_driver_registrations" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_tax_reg_status" ON "tax_driver_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tax_reg_jurisdiction" ON "tax_driver_registrations" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_recon_calc" ON "tax_reconciliations" USING btree ("tax_calculation_id");--> statement-breakpoint
CREATE INDEX "idx_tax_recon_status" ON "tax_reconciliations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rounding_policy_code" ON "tax_rounding_policies" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_tax_condition_rule_set" ON "tax_rule_conditions" USING btree ("tax_rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_tax_condition_type" ON "tax_rule_conditions" USING btree ("condition_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tx_tax_calc_activity" ON "transaction_tax_calculations" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_driver" ON "transaction_tax_calculations" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_jurisdiction" ON "transaction_tax_calculations" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_rule_set" ON "transaction_tax_calculations" USING btree ("tax_rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_status" ON "transaction_tax_calculations" USING btree ("tx_tax_calc_status");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_taxability" ON "transaction_tax_calculations" USING btree ("taxability_status");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_effective" ON "transaction_tax_calculations" USING btree ("transaction_effective_at");--> statement-breakpoint
CREATE INDEX "idx_tx_tax_calc_driver_calc" ON "transaction_tax_calculations" USING btree ("driver_id","calculated_at");