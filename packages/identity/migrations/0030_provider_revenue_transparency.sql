-- TAXIMETER.GOV — Module 31
-- Provider Revenue Transparency & Transaction Reconciliation
--
-- Additive extension of existing authoritative domains only:
-- providers, driver_profiles, provider_activities, provider_events,
-- provider_transaction_references, revenue_ledger and reconciliation_cases.
-- This migration creates no second database, changes no existing row and
-- introduces no client-side RLS policy. Provider values remain source values;
-- any calculation or reconciliation result remains separately identifiable.

BEGIN;

-- 1. Provider-reported transaction snapshots.
-- source_payload must be redacted/minimized by the ingestion boundary before insert.
CREATE TABLE IF NOT EXISTS public.provider_transaction_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  provider_transaction_reference_id uuid REFERENCES public.provider_transaction_references(id) ON DELETE SET NULL,
  provider_activity_id uuid REFERENCES public.provider_activities(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
  source_event_id uuid REFERENCES public.provider_events(id) ON DELETE SET NULL,

  provider_transaction_id varchar(200) NOT NULL,
  snapshot_version integer NOT NULL DEFAULT 1,
  is_original boolean NOT NULL DEFAULT true,
  transaction_type varchar(40),
  transaction_status varchar(40),
  transaction_at timestamptz,
  finalized_at timestamptz,
  customer_total numeric(12,2),
  currency varchar(3) NOT NULL DEFAULT 'CAD',
  jurisdiction_code varchar(20),
  source_payload_hash varchar(128),
  source_received_at timestamptz NOT NULL DEFAULT now(),
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT provider_transaction_snapshots_version_ck CHECK (snapshot_version > 0),
  CONSTRAINT provider_transaction_snapshots_currency_ck CHECK (char_length(currency) = 3),
  CONSTRAINT provider_transaction_snapshots_unique_version UNIQUE (provider_id, provider_transaction_id, snapshot_version)
);

-- 2. Source components. A component records what the provider reported; it does
-- not overwrite the corresponding revenue_ledger entry or tax calculation.
CREATE TABLE IF NOT EXISTS public.provider_transaction_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_snapshot_id uuid NOT NULL REFERENCES public.provider_transaction_snapshots(id) ON DELETE CASCADE,
  component_type varchar(50) NOT NULL,
  component_code varchar(80),
  description text,
  amount numeric(12,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'CAD',
  payer_type varchar(40),
  beneficiary_type varchar(40),
  taxable boolean NOT NULL DEFAULT false,
  tax_type varchar(40),
  tax_amount numeric(12,2),
  source_component_id varchar(200),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_transaction_components_currency_ck CHECK (char_length(currency) = 3)
);

-- 3. Provider tax record. government_calculated_amount is a comparison value,
-- never a replacement for the provider-reported amount.
CREATE TABLE IF NOT EXISTS public.provider_tax_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_snapshot_id uuid NOT NULL REFERENCES public.provider_transaction_snapshots(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  driver_id uuid REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
  tax_type varchar(40) NOT NULL,
  jurisdiction_code varchar(20),
  taxable_amount numeric(12,2),
  reported_rate numeric(12,8),
  reported_tax_amount numeric(12,2),
  government_calculated_amount numeric(12,2),
  variance_amount numeric(12,2),
  reporting_period_start date,
  reporting_period_end date,
  tax_status varchar(40) NOT NULL DEFAULT 'REPORTED',
  provider_reference varchar(200),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_tax_records_period_ck CHECK (reporting_period_end IS NULL OR reporting_period_start IS NULL OR reporting_period_end >= reporting_period_start)
);

-- 4. Tips are separate from base revenue, adjustments and refunds.
CREATE TABLE IF NOT EXISTS public.provider_tip_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_snapshot_id uuid NOT NULL REFERENCES public.provider_transaction_snapshots(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  driver_id uuid REFERENCES public.driver_profiles(id) ON DELETE SET NULL,
  tip_amount numeric(12,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'CAD',
  tip_status varchar(40) NOT NULL DEFAULT 'RECEIVED',
  tip_received_at timestamptz,
  tip_adjusted_at timestamptz,
  tip_refunded_at timestamptz,
  provider_tip_reference varchar(200),
  adjustment_amount numeric(12,2) NOT NULL DEFAULT 0,
  refund_amount numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_tip_records_currency_ck CHECK (char_length(currency) = 3)
);

-- 5. Settlement periods reconcile provider-reported transaction value with a
-- payment-period amount. They never initiate, approve or execute a payout.
CREATE TABLE IF NOT EXISTS public.provider_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.driver_profiles(id) ON DELETE RESTRICT,
  provider_settlement_id varchar(200) NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  gross_customer_amount numeric(12,2) NOT NULL DEFAULT 0,
  driver_transport_earnings numeric(12,2) NOT NULL DEFAULT 0,
  tip_amount numeric(12,2) NOT NULL DEFAULT 0,
  provider_fee_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  adjustment_amount numeric(12,2) NOT NULL DEFAULT 0,
  refund_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_payable numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'CAD',
  settlement_date timestamptz,
  status varchar(40) NOT NULL DEFAULT 'PENDING',
  source_reference varchar(200),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_settlements_period_ck CHECK (period_end >= period_start),
  CONSTRAINT provider_settlements_currency_ck CHECK (char_length(currency) = 3),
  CONSTRAINT provider_settlements_unique_provider_ref UNIQUE (provider_id, provider_settlement_id)
);

-- 6. Reconciliation line items preserve both sources and their variance.
CREATE TABLE IF NOT EXISTS public.provider_reconciliation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_case_id uuid REFERENCES public.reconciliation_cases(id) ON DELETE SET NULL,
  transaction_snapshot_id uuid REFERENCES public.provider_transaction_snapshots(id) ON DELETE SET NULL,
  source_a_type varchar(40) NOT NULL,
  source_a_reference varchar(200),
  source_a_amount numeric(12,2),
  source_b_type varchar(40) NOT NULL,
  source_b_reference varchar(200),
  source_b_amount numeric(12,2),
  variance_amount numeric(12,2),
  tolerance_amount numeric(12,2) NOT NULL DEFAULT 0,
  comparison_type varchar(50) NOT NULL,
  result_status varchar(40) NOT NULL DEFAULT 'PENDING',
  explanation text,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pts_provider ON public.provider_transaction_snapshots(provider_id);
CREATE INDEX IF NOT EXISTS idx_pts_driver ON public.provider_transaction_snapshots(driver_id);
CREATE INDEX IF NOT EXISTS idx_pts_external_transaction ON public.provider_transaction_snapshots(provider_id, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pts_activity ON public.provider_transaction_snapshots(provider_activity_id);
CREATE INDEX IF NOT EXISTS idx_pts_source_event ON public.provider_transaction_snapshots(source_event_id);
CREATE INDEX IF NOT EXISTS idx_pts_received ON public.provider_transaction_snapshots(source_received_at);
CREATE INDEX IF NOT EXISTS idx_ptc_snapshot ON public.provider_transaction_components(transaction_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_ptc_type ON public.provider_transaction_components(component_type);
CREATE INDEX IF NOT EXISTS idx_ptc_source_component ON public.provider_transaction_components(source_component_id);
CREATE INDEX IF NOT EXISTS idx_ptax_snapshot ON public.provider_tax_records(transaction_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_ptax_provider ON public.provider_tax_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_ptax_driver ON public.provider_tax_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_ptax_period ON public.provider_tax_records(reporting_period_start, reporting_period_end);
CREATE INDEX IF NOT EXISTS idx_ptip_snapshot ON public.provider_tip_records(transaction_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_ptip_driver ON public.provider_tip_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_ptip_provider ON public.provider_tip_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_ps_provider ON public.provider_settlements(provider_id);
CREATE INDEX IF NOT EXISTS idx_ps_driver ON public.provider_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_ps_period ON public.provider_settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ps_status ON public.provider_settlements(status);
CREATE INDEX IF NOT EXISTS idx_pri_case ON public.provider_reconciliation_items(reconciliation_case_id);
CREATE INDEX IF NOT EXISTS idx_pri_snapshot ON public.provider_reconciliation_items(transaction_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_pri_status ON public.provider_reconciliation_items(result_status);

-- Defence in depth: trusted server paths remain required until explicit policies
-- are approved. The migration introduces no permissive authenticated policy.
ALTER TABLE public.provider_transaction_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_transaction_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_tip_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reconciliation_items ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.provider_transaction_snapshots IS 'Versioned, source-reported provider transaction data. Payloads must be minimized before storage; source values are not overwritten by system calculations.';
COMMENT ON TABLE public.provider_transaction_components IS 'Source-reported transaction components: fares, fees, taxes, tips, tolls, refunds and adjustments.';
COMMENT ON TABLE public.provider_tax_records IS 'Provider-reported tax information retained separately from calculated comparison values.';
COMMENT ON TABLE public.provider_tip_records IS 'Provider-reported tips and their separate adjustment or refund events.';
COMMENT ON TABLE public.provider_settlements IS 'Provider settlement periods used to compare reported transaction values with paid amounts; not a payout execution table.';
COMMENT ON TABLE public.provider_reconciliation_items IS 'Line-level, non-accusatory comparison of source values within a reconciliation case.';

COMMIT;
