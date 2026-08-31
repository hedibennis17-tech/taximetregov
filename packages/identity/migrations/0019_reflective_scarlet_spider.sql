CREATE TYPE "public"."driver_jurisdiction_status" AS ENUM('ACTIVE', 'PENDING_REGISTRATION', 'SUSPENDED', 'INACTIVE', 'DEREGISTERED');--> statement-breakpoint
CREATE TYPE "public"."tax_exemption_type" AS ENUM('ZERO_RATED', 'EXEMPT', 'PERSONAL_USE', 'BASIC_NECESSITY', 'GOVERNMENT', 'EXPORT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_level" AS ENUM('COUNTRY', 'FEDERAL', 'PROVINCE', 'STATE', 'TERRITORY', 'REGION', 'MUNICIPALITY', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."service_type_code" AS ENUM('TAXI', 'RIDESHARE', 'DELIVERY', 'PERSONAL', 'COURIER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tax_authority_type" AS ENUM('FEDERAL', 'PROVINCIAL', 'STATE', 'MUNICIPAL', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."tax_system_type" AS ENUM('GST_QST', 'HST', 'GST_PST', 'GST_ONLY', 'VAT', 'SALES_TAX', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."tax_type_code" AS ENUM('GST', 'QST', 'HST', 'PST', 'RST', 'VAT', 'SALES', 'OTHER');--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iso_code" varchar(2) NOT NULL,
	"iso3_code" varchar(3),
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_en" varchar(100),
	"currency_code" varchar(3) NOT NULL,
	"calling_code" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_pilot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_iso_code_unique" UNIQUE("iso_code")
);
--> statement-breakpoint
CREATE TABLE "driver_jurisdiction_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"status" "driver_jurisdiction_status" DEFAULT 'PENDING_REGISTRATION' NOT NULL,
	"tax_registration_masked" varchar(30),
	"gst_registration_status" varchar(30) DEFAULT 'UNKNOWN' NOT NULL,
	"qst_registration_status" varchar(30) DEFAULT 'UNKNOWN' NOT NULL,
	"hst_registration_status" varchar(30) DEFAULT 'UNKNOWN' NOT NULL,
	"filing_frequency" varchar(20) DEFAULT 'QUARTERLY' NOT NULL,
	"allowed_service_types" text[],
	"effective_from" varchar(10) NOT NULL,
	"effective_until" varchar(10),
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provinces_states_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_en" varchar(100),
	"type" "jurisdiction_level" NOT NULL,
	"tax_system" "tax_system_type",
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "service_type_code" NOT NULL,
	"label" varchar(100) NOT NULL,
	"label_fr" varchar(100),
	"label_en" varchar(100),
	"taximeter_applicable" boolean NOT NULL,
	"gps_required" boolean DEFAULT true NOT NULL,
	"revenue_tracking_required" boolean DEFAULT true NOT NULL,
	"tax_treatment_note" text,
	"display_order" smallint DEFAULT 99 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tax_authorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"name_fr" varchar(200),
	"name_en" varchar(200),
	"abbreviation" varchar(20),
	"authority_type" "tax_authority_type" NOT NULL,
	"official_url" varchar(500),
	"official_reference" varchar(200),
	"registration_required" boolean DEFAULT false NOT NULL,
	"registration_threshold" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_exemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_type_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"exemption_type" "tax_exemption_type" NOT NULL,
	"applicable_to_service_types" text[],
	"eligibility_conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"effective_from" varchar(10) NOT NULL,
	"effective_until" varchar(10),
	"legal_reference" varchar(500),
	"documentation_required" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"authority_id" uuid,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"system_type" "tax_system_type" NOT NULL,
	"calc_method" varchar(20) DEFAULT 'TWO_STEP' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_system_id" uuid NOT NULL,
	"authority_id" uuid,
	"code" "tax_type_code" NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_fr" varchar(100),
	"name_en" varchar(100),
	"default_rate" numeric(8, 5),
	"calculation_order" smallint DEFAULT 1 NOT NULL,
	"is_compound" boolean DEFAULT false NOT NULL,
	"is_inclusive" boolean DEFAULT false NOT NULL,
	"legal_reference" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "driver_jurisdiction_profiles" ADD CONSTRAINT "driver_jurisdiction_profiles_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_jurisdiction_profiles" ADD CONSTRAINT "driver_jurisdiction_profiles_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_jurisdiction_profiles" ADD CONSTRAINT "driver_jurisdiction_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provinces_states_regions" ADD CONSTRAINT "provinces_states_regions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_authorities" ADD CONSTRAINT "tax_authorities_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_tax_type_id_tax_types_id_fk" FOREIGN KEY ("tax_type_id") REFERENCES "public"."tax_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_systems" ADD CONSTRAINT "tax_systems_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_systems" ADD CONSTRAINT "tax_systems_authority_id_tax_authorities_id_fk" FOREIGN KEY ("authority_id") REFERENCES "public"."tax_authorities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_types" ADD CONSTRAINT "tax_types_tax_system_id_tax_systems_id_fk" FOREIGN KEY ("tax_system_id") REFERENCES "public"."tax_systems"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_types" ADD CONSTRAINT "tax_types_authority_id_tax_authorities_id_fk" FOREIGN KEY ("authority_id") REFERENCES "public"."tax_authorities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_country_iso" ON "countries" USING btree ("iso_code");--> statement-breakpoint
CREATE INDEX "idx_country_active" ON "countries" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_driver_jurisdiction_unique" ON "driver_jurisdiction_profiles" USING btree ("driver_id","jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_driver_jurisdiction_driver" ON "driver_jurisdiction_profiles" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_driver_jurisdiction_jurisdiction" ON "driver_jurisdiction_profiles" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_driver_jurisdiction_status" ON "driver_jurisdiction_profiles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_psr_country_code" ON "provinces_states_regions" USING btree ("country_id","code");--> statement-breakpoint
CREATE INDEX "idx_psr_country" ON "provinces_states_regions" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "idx_psr_type" ON "provinces_states_regions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_service_type_code" ON "service_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_service_type_taximeter" ON "service_types" USING btree ("taximeter_applicable");--> statement-breakpoint
CREATE INDEX "idx_tax_authority_jurisdiction" ON "tax_authorities" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "idx_tax_authority_type" ON "tax_authorities" USING btree ("authority_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_exemption_type_jurisdiction" ON "tax_exemptions" USING btree ("tax_type_id","jurisdiction_id","code");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_type" ON "tax_exemptions" USING btree ("tax_type_id");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_jurisdiction" ON "tax_exemptions" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_system_jurisdiction_code" ON "tax_systems" USING btree ("jurisdiction_id","code");--> statement-breakpoint
CREATE INDEX "idx_tax_system_jurisdiction" ON "tax_systems" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_type_system_code" ON "tax_types" USING btree ("tax_system_id","code");--> statement-breakpoint
CREATE INDEX "idx_tax_type_system" ON "tax_types" USING btree ("tax_system_id");--> statement-breakpoint
CREATE INDEX "idx_tax_type_code" ON "tax_types" USING btree ("code");