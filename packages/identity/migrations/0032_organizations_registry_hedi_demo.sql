-- ============================================================
-- 0032 — ORGANIZATIONS REGISTRY + HEDI BENNIS + UBER QUÉBEC
-- TAXIMETER.GOV — Pilote · DONNÉES SYNTHÉTIQUES
-- ============================================================
-- Crée le registre central des entreprises et lie les chauffeurs
-- ⚠️ DONNÉES SYNTHÉTIQUES — NON TRANSMIS AU GOUVERNEMENT DU QUÉBEC

BEGIN;

-- ── 1. TABLE ORGANIZATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_org_id         varchar(30)  NOT NULL UNIQUE,
  legal_name            varchar(200) NOT NULL,
  trade_name            varchar(200),
  neq                   varchar(20),              -- Numéro d'entreprise Québec
  business_number       varchar(20),              -- Numéro d'entreprise Canada
  org_type              varchar(50)  NOT NULL DEFAULT 'ENTERPRISE',
  sector                varchar(50)  NOT NULL DEFAULT 'TRANSPORT',
  status                varchar(30)  NOT NULL DEFAULT 'ACTIVE',
  tps_registered        boolean      DEFAULT false,
  tvq_registered        boolean      DEFAULT false,
  tps_number            varchar(30),
  tvq_number            varchar(30),
  address_line1         varchar(200),
  address_city          varchar(100),
  address_province      varchar(10)  DEFAULT 'QC',
  address_postal        varchar(10),
  contact_email         varchar(200),
  contact_phone         varchar(20),
  provider_id           uuid,                     -- lien optionnel vers providers
  is_demo               boolean      DEFAULT true,
  notes                 text,
  created_at            timestamp with time zone DEFAULT now() NOT NULL,
  updated_at            timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at            timestamp with time zone
);

-- ── 2. TABLE DEPARTMENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_dept_id        varchar(30)  NOT NULL UNIQUE,
  organization_id       uuid         NOT NULL REFERENCES organizations(id),
  name                  varchar(100) NOT NULL,
  service_type          varchar(50)  NOT NULL,   -- TAXI / RIDESHARE / FOOD_DELIVERY / etc.
  status                varchar(30)  NOT NULL DEFAULT 'ACTIVE',
  emoji                 varchar(10),
  description           text,
  created_at            timestamp with time zone DEFAULT now() NOT NULL,
  updated_at            timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 3. COLONNE organization_id DANS driver_profiles ────────
ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS department_id   uuid REFERENCES departments(id);

-- ── 4. COLONNE organization_id DANS driver_activities ──────
ALTER TABLE driver_activities
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- ── 5. ORGANISATION UBER QUÉBEC (DEMO) ────────────────────
INSERT INTO organizations (
  public_org_id, legal_name, trade_name, neq, business_number,
  org_type, sector, status,
  tps_registered, tvq_registered,
  tps_number, tvq_number,
  address_line1, address_city, address_province, address_postal,
  contact_email, contact_phone,
  is_demo, notes
) VALUES (
  'ORG-UBER-QC-DEMO',
  'Uber Canada Inc. (DEMO)',
  'Uber Québec',
  '1234567890',         -- NEQ fictif
  'BN-DEMO-001',
  'ENTERPRISE', 'TRANSPORT', 'ACTIVE',
  true, true,
  'TPS-DEMO-UBER-001', 'TVQ-DEMO-UBER-001',
  '720 rue King Ouest, Bureau 4200',
  'Montréal', 'QC', 'H3C 2M7',
  'demo.uber@pilot.taximetregov.invalid',
  '514-555-9000',
  true,
  '⚠️ DONNÉES SYNTHÉTIQUES — Entreprise fictive pour démonstration TAXIMETER.GOV PILOTE. Aucun lien avec Uber Technologies Inc.'
) ON CONFLICT (public_org_id) DO UPDATE SET
  status = 'ACTIVE', updated_at = now();

-- ── 6. ORGANISATIONS SUPPLÉMENTAIRES DEMO ─────────────────
INSERT INTO organizations (
  public_org_id, legal_name, trade_name, neq, org_type, sector, status, is_demo
) VALUES
  ('ORG-LYFT-QC-DEMO',   'Lyft Canada Inc. (DEMO)',     'Lyft Québec',     '2345678901', 'ENTERPRISE', 'TRANSPORT',  'ACTIVE', true),
  ('ORG-TAXI-MTL-DEMO',  'Taxi Montréal SENC (DEMO)',   'Taxi Montréal',   '3456789012', 'ENTERPRISE', 'TAXI',       'ACTIVE', true),
  ('ORG-DRD-QC-DEMO',    'DoorDash Canada Inc. (DEMO)', 'DoorDash Québec', '4567890123', 'ENTERPRISE', 'DELIVERY',   'PILOT',  true),
  ('ORG-INST-QC-DEMO',   'Instacart Canada (DEMO)',     'Instacart QC',    '5678901234', 'ENTERPRISE', 'GROCERY',    'PILOT',  true),
  ('ORG-PUROLATOR-DEMO', 'Purolator Inc. (DEMO)',       'Purolator',       '6789012345', 'ENTERPRISE', 'LOGISTICS',  'ACTIVE', true)
ON CONFLICT (public_org_id) DO NOTHING;

-- ── 7. DÉPARTEMENTS UBER QUÉBEC ────────────────────────────
INSERT INTO departments (public_dept_id, organization_id, name, service_type, status, emoji)
SELECT
  src.public_dept_id, o.id, src.name, src.service_type, 'ACTIVE', src.emoji
FROM (VALUES
  ('DEPT-UBER-RIDES',    'Uber Rides (UberX/XL)',   'RIDESHARE',       '🚗'),
  ('DEPT-UBER-GREEN',    'Uber Green',              'RIDESHARE',       '🌱'),
  ('DEPT-UBER-TAXI',     'Uber Taxi',               'TAXI',            '🚕'),
  ('DEPT-UBER-EATS',     'Uber Eats',               'FOOD_DELIVERY',   '🍔'),
  ('DEPT-UBER-GROCERY',  'Uber Grocery',            'GROCERY_DELIVERY','🛒'),
  ('DEPT-UBER-COURIER',  'Uber Courier',            'PARCEL_DELIVERY', '📦')
) AS src(public_dept_id, name, service_type, emoji)
JOIN organizations o ON o.public_org_id = 'ORG-UBER-QC-DEMO'
ON CONFLICT (public_dept_id) DO NOTHING;

-- ── 8. UTILISATEUR HEDI BENNIS (Supabase users table) ─────
-- Note: Le compte Supabase Auth (hedibennis70@gmail.com) est créé manuellement
-- Cette migration crée l'enregistrement dans la table users pour la liaison
INSERT INTO users (
  id, public_id, user_type, status, email, email_verified_at, created_at, updated_at
) VALUES (
  '30000000-0000-4000-8000-000000000001',
  'HEDI-USR-DRV-001',
  'DRIVER', 'ACTIVE',
  'hedibennis70@gmail.com',
  now(), now(), now()
) ON CONFLICT (id) DO UPDATE SET
  status = 'ACTIVE',
  email = 'hedibennis70@gmail.com',
  updated_at = now();

-- ── 9. PROFIL CHAUFFEUR HEDI BENNIS ───────────────────────
INSERT INTO driver_profiles (
  user_id, driver_number, status,
  first_name, last_name, preferred_name,
  phone, province, country, language,
  business_status, identity_verification_status,
  organization_id, department_id,
  onboarding_completed_at, created_at, updated_at
)
SELECT
  u.id,
  'HEDI-DRV-0001',
  'ACTIVE'::driver_status,
  'Hedi', 'Bennis', 'Hedi B.',
  '514-555-7070',
  'QC', 'CA', 'fr'::language,
  'SOLE_PROPRIETOR'::business_status,
  'VERIFIED'::verification_status,
  o.id,
  d.id,
  now() - interval '60 days',
  now(), now()
FROM users u
JOIN organizations o ON o.public_org_id = 'ORG-UBER-QC-DEMO'
LEFT JOIN departments d ON d.public_dept_id = 'DEPT-UBER-GREEN'
WHERE u.id = '30000000-0000-4000-8000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM driver_profiles dp WHERE dp.driver_number = 'HEDI-DRV-0001'
  );

-- ── 10. LIER LES CHAUFFEURS DEMO EXISTANTS À UBER QUÉBEC ──
-- Ahmed Benali → Uber Rides
UPDATE driver_profiles dp
SET organization_id = o.id,
    department_id   = d.id,
    updated_at      = now()
FROM organizations o, departments d
WHERE o.public_org_id = 'ORG-UBER-QC-DEMO'
  AND d.public_dept_id = 'DEPT-UBER-RIDES'
  AND dp.driver_number = 'DEMO-DRV-0001'
  AND dp.organization_id IS NULL;

-- Sophie Tremblay → Uber Green
UPDATE driver_profiles dp
SET organization_id = o.id,
    department_id   = d.id,
    updated_at      = now()
FROM organizations o, departments d
WHERE o.public_org_id = 'ORG-UBER-QC-DEMO'
  AND d.public_dept_id = 'DEPT-UBER-GREEN'
  AND dp.driver_number = 'DEMO-DRV-0002'
  AND dp.organization_id IS NULL;

-- Marco Lépine → Uber Taxi
UPDATE driver_profiles dp
SET organization_id = o.id,
    department_id   = d.id,
    updated_at      = now()
FROM organizations o, departments d
WHERE o.public_org_id = 'ORG-UBER-QC-DEMO'
  AND d.public_dept_id = 'DEPT-UBER-TAXI'
  AND dp.driver_number = 'DEMO-DRV-0003'
  AND dp.organization_id IS NULL;

-- ── 11. VÉHICULE POUR HEDI BENNIS ─────────────────────────
INSERT INTO vehicles (
  driver_id, vehicle_number, vin_last_four,
  license_plate_region, license_plate_masked,
  make, model, year, color,
  vehicle_type, fuel_type, seating_capacity,
  accessibility_features,
  vehicle_status, is_active,
  taximeter_status, taximeter_serial_masked,
  notes, created_at, updated_at
)
SELECT
  dp.id,
  'HEDI-VEH-001', '7070',
  'QC', '••• 7070',
  'Toyota', 'Prius Prime', 2024, 'Blanc Perle',
  'SEDAN'::vehicle_type, 'PLUG_IN_HYBRID'::fuel_type, 4,
  ARRAY['Paiement sans contact', 'Chargeur USB'],
  'ACTIVE'::vehicle_status, true,
  'CERTIFIED'::taximeter_status, '••••TM-7070',
  '⚠️ Véhicule DEMO — données fictives · TAXIMETER.GOV PILOTE',
  now(), now()
FROM driver_profiles dp
WHERE dp.driver_number = 'HEDI-DRV-0001'
  AND NOT EXISTS (
    SELECT 1 FROM vehicles v WHERE v.vehicle_number = 'HEDI-VEH-001'
  );

-- ── 12. ACTIVITÉS HEDI BENNIS (Q3 2026) ───────────────────
INSERT INTO driver_activities (
  public_id, driver_id, provider_id,
  activity_type_code, status, source_type,
  external_activity_id, external_transaction_id,
  vehicle_id,
  hours_ago,
  gross_amount, tip_amount, fee_amount, tax_amount,
  net_amount,
  location_start_reference, location_end_reference,
  reconciliation_status, taximeter_enabled,
  organization_id,
  started_at, completed_at, finalized_at,
  created_at, updated_at
)
SELECT
  src.public_id,
  dp.id,
  p.id,
  src.activity_type::canonical_activity_type,
  'FINALIZED'::canonical_activity_status,
  src.source_type::activity_source_type,
  src.external_id, src.ext_txn,
  v.id,
  src.hours_ago,
  src.gross::numeric, src.tip::numeric, src.fee::numeric, src.tax::numeric,
  (src.gross - src.fee - src.tax)::numeric,
  src.origin, src.destination,
  src.recon::canonical_reconciliation_status,
  true,
  o.id,
  now() - src.hours_ago * interval '1 hour',
  now() - src.hours_ago * interval '1 hour' + interval '18 minutes',
  now() - src.hours_ago * interval '1 hour' + interval '20 minutes',
  now(), now()
FROM (VALUES
  ('HEDI-ACT-001','TAXI_TRIP',     'TAXIMETER',    'HEDI-TAXI-ACT-001','HEDI-TAXI-TXN-001',  2, 32.50, 4.50,  0,     4.87, 'Plateau-Mont-Royal','Centre-Ville',        'MATCHED'),
  ('HEDI-ACT-002','RIDESHARE_TRIP','PROVIDER_API', 'HEDI-UBER-ACT-002','HEDI-UBER-TXN-002', 26, 24.00, 2.00,  4.80,  3.59, 'Mile-Ex',           'Rosemont',            'MATCHED'),
  ('HEDI-ACT-003','RIDESHARE_TRIP','PROVIDER_API', 'HEDI-UBER-ACT-003','HEDI-UBER-TXN-003', 50, 18.50, 0,     3.70,  2.77, 'Outremont',         'Côte-des-Neiges',     'MATCHED'),
  ('HEDI-ACT-004','TAXI_TRIP',     'TAXIMETER',    'HEDI-TAXI-ACT-004','HEDI-TAXI-TXN-004', 74, 45.00, 5.00,  0,     6.74, 'Vieux-Montréal',    'Aéroport YUL',        'MATCHED'),
  ('HEDI-ACT-005','RIDESHARE_TRIP','PROVIDER_API', 'HEDI-UBER-ACT-005','HEDI-UBER-TXN-005', 98, 28.75, 3.00,  5.75,  4.31, 'Saint-Laurent',     'Laval',               'PARTIAL_MATCH')
) AS src(public_id, activity_type, source_type, external_id, ext_txn, hours_ago, gross, tip, fee, tax, origin, destination, recon)
JOIN driver_profiles dp ON dp.driver_number = 'HEDI-DRV-0001'
JOIN organizations  o  ON o.public_org_id   = 'ORG-UBER-QC-DEMO'
LEFT JOIN providers p  ON p.code            = CASE WHEN src.source_type = 'TAXIMETER' THEN NULL ELSE 'UBER' END
LEFT JOIN vehicles  v  ON v.vehicle_number  = 'HEDI-VEH-001'
WHERE NOT EXISTS (
  SELECT 1 FROM driver_activities da WHERE da.public_id = src.public_id
);

-- ── 13. REVENUE LEDGER HEDI BENNIS ────────────────────────
INSERT INTO revenue_ledger (
  driver_id, source_type, provider_id,
  activity_id, activity_type, entry_type,
  gross_amount, fee_amount, tip_amount,
  adjustment_amount, net_amount,
  currency, jurisdiction, activity_date,
  is_settled, settled_at,
  source_reference, notes, created_at
)
SELECT
  da.driver_id,
  CASE WHEN da.provider_id IS NULL THEN 'TAXI'::revenue_source ELSE 'UBER'::revenue_source END,
  da.provider_id,
  da.id,
  da.activity_type_code::text,
  'CREDIT'::revenue_ledger_entry_type,
  da.gross_amount, da.fee_amount, da.tip_amount,
  0, da.net_amount,
  'CAD', 'QC',
  (now() - (CASE da.public_id
    WHEN 'HEDI-ACT-001' THEN 2
    WHEN 'HEDI-ACT-002' THEN 26
    WHEN 'HEDI-ACT-003' THEN 50
    WHEN 'HEDI-ACT-004' THEN 74
    WHEN 'HEDI-ACT-005' THEN 98
  END)::int * interval '1 hour')::date,
  true,
  now() - interval '1 hour',
  'HEDI-LEDGER-' || right(da.public_id, 3),
  '⚠️ Revenu DEMO fictif — TAXIMETER.GOV PILOTE',
  now()
FROM driver_activities da
WHERE da.public_id LIKE 'HEDI-ACT-%'
  AND NOT EXISTS (
    SELECT 1 FROM revenue_ledger rl
    WHERE rl.source_reference = 'HEDI-LEDGER-' || right(da.public_id, 3)
  );

-- ── 14. INDEXES ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_organizations_public_org_id ON organizations(public_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status        ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_legal_name    ON organizations(legal_name);
CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_org_id      ON driver_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_activities_org_id    ON driver_activities(organization_id);

COMMIT;

-- ============================================================
-- ⚠️ DONNÉES SYNTHÉTIQUES — SIMULATION PILOTE TAXIMETER.GOV
-- Aucune donnée réelle. Aucune connexion avec Revenu Québec.
-- Uber, Lyft, DoorDash: noms fictifs pour démonstration.
-- Hedi Bennis / hedibennis70@gmail.com: compte DEMO pilote.
-- ============================================================
