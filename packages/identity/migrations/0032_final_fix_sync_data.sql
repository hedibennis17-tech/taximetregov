-- ============================================================
-- 0032 — FINAL FIX: Seed données DEMO cohérentes 3 apps
-- TAXIMETER.GOV — Pilote · DONNÉES SYNTHÉTIQUES
-- ============================================================

-- ── SÉCURITÉ: tout en transaction idempotente ──────────────
BEGIN;

-- ── 1. ENTERPRISE DEMO ────────────────────────────────────
-- Assurer que l'enterprise ENT-DEMO-001 existe dans providers
INSERT INTO providers (
  id, name, slug, provider_type, status,
  api_base_url, webhook_secret, created_at, updated_at
) VALUES (
  'ENT-DEMO-001',
  'Uber Québec (DEMO)',
  'uber-qc-demo',
  'PLATFORM',
  'ACTIVE',
  'https://api.demo.uber.taximetregov.qc',
  'demo-webhook-secret-sha256',
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'ACTIVE',
  updated_at = NOW();

-- ── 2. PROVIDER ACTIVITIES (SIM-ACT-001 à SIM-ACT-005) ──
-- 5 activités DEMO représentant le scénario Robert Simard / Ali Bouchard
INSERT INTO provider_activities (
  id, provider_id, external_activity_id,
  driver_id, department_id,
  service_type, origin_address, destination_address,
  distance_km, duration_minutes,
  started_at, completed_at,
  status, created_at
) VALUES
  ('pact-001', 'ENT-DEMO-001', 'SIM-ACT-001', 'HEDI-DRV-0010', 'DEPT-001',
   'TAXI_RIDE', 'Montréal-Nord', 'Aéroport YUL',
   22.4, 28, '2026-09-20 07:00:00+00', '2026-09-20 07:28:00+00',
   'COMPLETED', NOW()),
  ('pact-002', 'ENT-DEMO-001', 'SIM-ACT-002', 'HEDI-DRV-0010', 'DEPT-002',
   'RIDE', 'Plateau-Mont-Royal', 'Centre-Ville',
   8.1, 18, '2026-09-20 09:15:00+00', '2026-09-20 09:33:00+00',
   'COMPLETED', NOW()),
  ('pact-003', 'ENT-DEMO-001', 'SIM-ACT-003', 'HEDI-DRV-0010', 'DEPT-004',
   'FOOD_DELIVERY', 'Restaurant La Belle Province', 'Rosemont',
   4.2, 22, '2026-09-20 12:00:00+00', '2026-09-20 12:22:00+00',
   'COMPLETED', NOW()),
  ('pact-004', 'ENT-DEMO-001', 'SIM-ACT-004', 'HEDI-DRV-0010', 'DEPT-003',
   'GREEN_RIDE', 'Mile-Ex', 'Rosemont',
   6.8, 16, '2026-09-20 15:30:00+00', '2026-09-20 15:46:00+00',
   'COMPLETED', NOW()),
  ('pact-005', 'ENT-DEMO-001', 'SIM-ACT-005', 'HEDI-DRV-0010', 'DEPT-003',
   'GREEN_RIDE', 'Outremont', 'Parc Jarry',
   5.3, 14, '2026-09-20 18:00:00+00', '2026-09-20 18:14:00+00',
   'COMPLETED', NOW())
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at;

-- ── 3. PROVIDER TRANSACTION SNAPSHOTS ────────────────────
INSERT INTO provider_transaction_snapshots (
  id, provider_id, activity_id,
  gross_amount, tip_amount, platform_fee, driver_net,
  tps_amount, tvq_amount, taxable_amount,
  currency, snapshot_version, is_original,
  snapshotted_at, created_at
) VALUES
  ('ptx-001','ENT-DEMO-001','pact-001', 42.50,  5.00, 11.69, 30.81, 2.13, 4.24, 42.50, 'CAD', 1, true, NOW(), NOW()),
  ('ptx-002','ENT-DEMO-001','pact-002', 18.00,  2.00,  4.95, 13.05, 0.90, 1.80, 18.00, 'CAD', 1, true, NOW(), NOW()),
  ('ptx-003','ENT-DEMO-001','pact-003', 14.50,  3.00,  3.99, 10.51, 0.73, 1.45, 14.50, 'CAD', 1, true, NOW(), NOW()),
  ('ptx-004','ENT-DEMO-001','pact-004', 22.00,  0.00,  6.05, 15.95, 1.10, 2.19, 22.00, 'CAD', 1, true, NOW(), NOW()),
  ('ptx-005','ENT-DEMO-001','pact-005', 24.00,  2.00,  6.60, 17.40, 1.20, 2.39, 24.00, 'CAD', 1, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  snapshot_version = EXCLUDED.snapshot_version,
  updated_at = NOW();

-- ── 4. PROVIDER TAX RECORDS (Q3 2026) ────────────────────
INSERT INTO provider_tax_records (
  id, provider_id, driver_id,
  tax_type, tax_period, taxable_amount,
  reported_tax_amount, government_calculated_amount,
  tips_amount, adjustments_amount,
  currency, status, posted_at, created_at
) VALUES
  ('ptax-001','ENT-DEMO-001','HEDI-DRV-0010','TPS','2026-Q3',121.00, 6.05,  6.05,  12.00, 0.00,'CAD','POSTED',NOW(),NOW()),
  ('ptax-002','ENT-DEMO-001','HEDI-DRV-0010','TVQ','2026-Q3',121.00,12.07, 12.07,  12.00, 0.00,'CAD','POSTED',NOW(),NOW()),
  ('ptax-003','ENT-DEMO-001','HEDI-DRV-0010','TPS','2026-Q3', 24.00, 1.20,  1.20,   2.00, 0.00,'CAD','POSTED',NOW(),NOW()),
  ('ptax-004','ENT-DEMO-001','HEDI-DRV-0010','TVQ','2026-Q3', 24.00, 2.39,  2.39,   2.00, 0.00,'CAD','POSTED',NOW(),NOW()),
  ('ptax-005','ENT-DEMO-001','HEDI-DRV-0010','TPS','2026-Q3',121.00, 6.06,  6.06,   0.00, 0.00,'CAD','POSTED',NOW(),NOW())
ON CONFLICT (id) DO UPDATE SET
  status = 'POSTED',
  posted_at = NOW();

-- ── 5. PROVIDER SETTLEMENTS ──────────────────────────────
INSERT INTO provider_settlements (
  id, provider_id, driver_id,
  period_start, period_end,
  gross_amount, platform_fee_amount, tip_amount,
  tax_amount, driver_net_amount,
  currency, settlement_status, settled_at, created_at
) VALUES
  ('pset-001','ENT-DEMO-001','HEDI-DRV-0010',
   '2026-09-01','2026-09-30',
   121.00, 33.27, 12.00, 11.07, 65.66, 'CAD','SETTLED',NOW(),NOW()),
  ('pset-002','ENT-DEMO-001','HEDI-DRV-0010',
   '2026-09-20','2026-09-20',
   24.00, 6.60, 2.00, 3.59, 13.81, 'CAD','MATCHED',NOW(),NOW())
ON CONFLICT (id) DO UPDATE SET
  settlement_status = EXCLUDED.settlement_status;

-- ── 6. PROVIDER RECONCILIATION ITEMS ─────────────────────
INSERT INTO provider_reconciliation_items (
  id, provider_id,
  activity_id, transaction_id, settlement_id,
  comparison_type, variance_amount, match_status,
  reconciled_at, created_at
) VALUES
  ('prec-001','ENT-DEMO-001','pact-001','ptx-001','pset-001','ACTIVITY_VS_SETTLEMENT', 0.00,'MATCHED',NOW(),NOW()),
  ('prec-002','ENT-DEMO-001','pact-002','ptx-002','pset-001','ACTIVITY_VS_SETTLEMENT', 0.00,'MATCHED',NOW(),NOW()),
  ('prec-003','ENT-DEMO-001','pact-003','ptx-003','pset-001','ACTIVITY_VS_SETTLEMENT', 0.00,'MATCHED',NOW(),NOW()),
  ('prec-004','ENT-DEMO-001','pact-004','ptx-004','pset-002','ACTIVITY_VS_SETTLEMENT',-2.00,'PARTIAL_MATCH',NOW(),NOW()),
  ('prec-005','ENT-DEMO-001','pact-005','ptx-005','pset-002','ACTIVITY_VS_SETTLEMENT', 0.00,'MATCHED',NOW(),NOW())
ON CONFLICT (id) DO UPDATE SET
  match_status = EXCLUDED.match_status,
  variance_amount = EXCLUDED.variance_amount;

COMMIT;

-- Note DEMO obligatoire
-- ⚠️ DONNÉES SYNTHÉTIQUES — SIMULATION PILOTE TAXIMETER.GOV
-- Aucune donnée réelle ne provient d'Uber Technologies Inc.
-- Aucune connexion avec Revenu Québec.
