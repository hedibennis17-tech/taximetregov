CREATE TYPE "public"."cash_collection_status" AS ENUM('COLLECTED', 'RECONCILED', 'DECLARED', 'DISCREPANCY', 'UNDER_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."payment_audit_action" AS ENUM('PAYMENT_INITIATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'WALLET_CREDITED', 'WALLET_DEBITED', 'REFUND_INITIATED', 'REFUND_COMPLETED', 'PAYOUT_REQUESTED', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'CASH_COLLECTED', 'CASH_RECONCILED', 'ADJUSTMENT_APPLIED');--> statement-breakpoint
CREATE TYPE "public"."payment_dispute_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED', 'CHARGEBACK_WON', 'CHARGEBACK_LOST');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CREDIT_CARD', 'DEBIT_CARD', 'INTERAC', 'DIGITAL_WALLET', 'CASH', 'PROVIDER_MANAGED', 'VOUCHER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'CHARGEBACK');--> statement-breakpoint
CREATE TYPE "public"."payout_method" AS ENUM('DIRECT_DEPOSIT', 'INTERAC_ETRANSFER', 'CHECK', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETURNED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."refund_reason" AS ENUM('DRIVER_CANCELLED', 'PASSENGER_REQUEST', 'OVERCHARGE', 'TECHNICAL_ERROR', 'COMPLAINT_RESOLUTION', 'GOVERNMENT_ORDER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."wallet_entry_direction" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TYPE "public"."wallet_entry_type" AS ENUM('TRIP_REVENUE', 'PROVIDER_REVENUE', 'TIP', 'BONUS', 'ADJUSTMENT', 'REFUND_DEBIT', 'FEE', 'TAX_REMITTANCE', 'PAYOUT', 'CORRECTION');--> statement-breakpoint
CREATE TABLE "cash_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"payment_id" uuid,
	"collected_amount" numeric(12, 2) NOT NULL,
	"expected_amount" numeric(12, 2) NOT NULL,
	"difference_amount" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"cash_collection_status" "cash_collection_status" DEFAULT 'COLLECTED' NOT NULL,
	"taxi_trip_id" uuid,
	"collected_at" timestamp with time zone NOT NULL,
	"reconciled_at" timestamp with time zone,
	"declaration_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"payment_id" uuid,
	"wallet_entry_id" uuid,
	"payout_id" uuid,
	"refund_id" uuid,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"action" "payment_audit_action" NOT NULL,
	"result" varchar(20) DEFAULT 'SUCCESS' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"payment_dispute_status" "payment_dispute_status" DEFAULT 'OPEN' NOT NULL,
	"dispute_type" varchar(50) NOT NULL,
	"claimed_amount" numeric(12, 2),
	"reason" text NOT NULL,
	"evidence_ref" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_payment_id" varchar(20) NOT NULL,
	"driver_id" uuid NOT NULL,
	"provider_id" uuid,
	"taxi_trip_id" uuid,
	"provider_activity_id" uuid,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"fare_amount" numeric(12, 2) NOT NULL,
	"tip_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"fee_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"surcharge_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"driver_net_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"processor_reference" varchar(200),
	"idempotency_key" varchar(100) NOT NULL,
	"processed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_code" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_public_payment_id_unique" UNIQUE("public_payment_id"),
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_payout_id" varchar(20) NOT NULL,
	"driver_id" uuid NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"payout_method" "payout_method" NOT NULL,
	"payout_status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"requested_amount" numeric(12, 2) NOT NULL,
	"processed_amount" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"destination_token_ref" varchar(200),
	"idempotency_key" varchar(100) NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"failure_code" varchar(50),
	"return_reason" text,
	"processor_reference" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_public_payout_id_unique" UNIQUE("public_payout_id"),
	CONSTRAINT "payouts_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_refund_id" varchar(20) NOT NULL,
	"original_payment_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"refund_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"refund_reason" "refund_reason" NOT NULL,
	"reason_note" text,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"processor_reference" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_public_refund_id_unique" UNIQUE("public_refund_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_driver_id_unique" UNIQUE("driver_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"entry_type" "wallet_entry_type" NOT NULL,
	"direction" "wallet_entry_direction" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"balance_snapshot" numeric(12, 2),
	"payment_id" uuid,
	"taxi_trip_id" uuid,
	"provider_activity_id" uuid,
	"description" text NOT NULL,
	"is_settled" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp with time zone,
	"corrected_entry_id" uuid,
	"payment_status_at_credit" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_collections" ADD CONSTRAINT "cash_collections_taxi_trip_id_taxi_trips_id_fk" FOREIGN KEY ("taxi_trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_wallet_entry_id_wallet_entries_id_fk" FOREIGN KEY ("wallet_entry_id") REFERENCES "public"."wallet_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_audit_events" ADD CONSTRAINT "payment_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_taxi_trip_id_taxi_trips_id_fk" FOREIGN KEY ("taxi_trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_provider_activity_id_provider_activities_id_fk" FOREIGN KEY ("provider_activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_wallet_account_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_original_payment_id_payments_id_fk" FOREIGN KEY ("original_payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_wallet_account_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_taxi_trip_id_taxi_trips_id_fk" FOREIGN KEY ("taxi_trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_provider_activity_id_provider_activities_id_fk" FOREIGN KEY ("provider_activity_id") REFERENCES "public"."provider_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cash_driver" ON "cash_collections" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_cash_trip" ON "cash_collections" USING btree ("taxi_trip_id");--> statement-breakpoint
CREATE INDEX "idx_cash_status" ON "cash_collections" USING btree ("cash_collection_status");--> statement-breakpoint
CREATE INDEX "idx_cash_collected" ON "cash_collections" USING btree ("collected_at");--> statement-breakpoint
CREATE INDEX "idx_pay_audit_driver" ON "payment_audit_events" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_pay_audit_payment" ON "payment_audit_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_pay_audit_action" ON "payment_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_pay_audit_occurred" ON "payment_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_pay_dispute_payment" ON "payment_disputes" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_pay_dispute_driver" ON "payment_disputes" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_pay_dispute_status" ON "payment_disputes" USING btree ("payment_dispute_status");--> statement-breakpoint
CREATE INDEX "idx_payment_driver" ON "payments" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_payment_provider" ON "payments" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_payment_taxi_trip" ON "payments" USING btree ("taxi_trip_id");--> statement-breakpoint
CREATE INDEX "idx_payment_activity" ON "payments" USING btree ("provider_activity_id");--> statement-breakpoint
CREATE INDEX "idx_payment_status" ON "payments" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_payment_method" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "idx_payment_created" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_payout_driver" ON "payouts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_payout_wallet" ON "payouts" USING btree ("wallet_account_id");--> statement-breakpoint
CREATE INDEX "idx_payout_status" ON "payouts" USING btree ("payout_status");--> statement-breakpoint
CREATE INDEX "idx_payout_requested" ON "payouts" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "idx_refund_payment" ON "refunds" USING btree ("original_payment_id");--> statement-breakpoint
CREATE INDEX "idx_refund_driver" ON "refunds" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_refund_status" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_wallet_driver" ON "wallet_accounts" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_account" ON "wallet_entries" USING btree ("wallet_account_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_driver" ON "wallet_entries" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_type" ON "wallet_entries" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_direction" ON "wallet_entries" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_payment" ON "wallet_entries" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_created" ON "wallet_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_wallet_entry_driver_created" ON "wallet_entries" USING btree ("driver_id","created_at");