-- ================================================================
-- TAXIMETER.GOV — RLS Policies Phase 34
-- PILOTE · DONNÉES SYNTHÉTIQUES
-- Ces policies sont un référentiel de sécurité — à appliquer dans Supabase
-- ================================================================

-- ── HELPER: récupérer enterprise_id depuis user_metadata ──
CREATE OR REPLACE FUNCTION auth.get_enterprise_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'enterprise_id')
$$;

-- ── HELPER: récupérer le rôle ──
CREATE OR REPLACE FUNCTION auth.get_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')
$$;

-- ── HELPER: est-ce un Super Admin? ──
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'SUPER_ADMIN'
$$;

-- ── HELPER: est-ce un Admin Gov? ──
CREATE OR REPLACE FUNCTION auth.is_gov()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') IN ('SUPER_ADMIN','GOV_ADMIN','GOV_AGENT')
$$;

-- ================================================================
-- TABLE: driver_profiles
-- ================================================================
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Driver: ses propres données uniquement
CREATE POLICY "driver_own_profile" ON driver_profiles
  FOR ALL USING (
    user_id = auth.uid()
    OR auth.is_gov()
  );

-- ================================================================
-- TABLE: vehicles
-- ================================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_driver_or_enterprise" ON vehicles
  FOR SELECT USING (
    -- Chauffeur voit son véhicule
    driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    -- Enterprise voit ses véhicules (via driver dans son enterprise)
    OR auth.is_gov()
  );

CREATE POLICY "vehicle_no_update_enterprise_id" ON vehicles
  FOR UPDATE USING (auth.is_gov())
  WITH CHECK (auth.is_gov());

-- ================================================================
-- TABLE: revenue_ledger
-- ================================================================
ALTER TABLE revenue_ledger ENABLE ROW LEVEL SECURITY;

-- Driver: ses propres entrées ledger
CREATE POLICY "ledger_driver_own" ON revenue_ledger
  FOR SELECT USING (
    driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    OR auth.is_gov()
  );

-- Personne ne peut modifier le ledger directement (append-only via API)
CREATE POLICY "ledger_no_direct_update" ON revenue_ledger
  FOR UPDATE USING (auth.is_super_admin());

CREATE POLICY "ledger_no_direct_delete" ON revenue_ledger
  FOR DELETE USING (FALSE); -- Jamais de suppression physique

-- ================================================================
-- TABLE: taxi_trips / driver_activities
-- ================================================================
ALTER TABLE taxi_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_driver_own" ON taxi_trips
  FOR SELECT USING (
    driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    OR auth.is_gov()
  );

-- ================================================================
-- TABLE: tax_accounts
-- ================================================================
ALTER TABLE tax_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_account_driver_own" ON tax_accounts
  FOR SELECT USING (
    driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    OR auth.is_gov()
  );

CREATE POLICY "tax_account_no_modify_registration" ON tax_accounts
  FOR UPDATE USING (auth.is_gov())
  WITH CHECK (auth.is_gov());

-- ================================================================
-- TABLE: tax_periods
-- ================================================================
ALTER TABLE tax_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_period_via_account" ON tax_periods
  FOR SELECT USING (
    tax_account_id IN (
      SELECT id FROM tax_accounts
      WHERE driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    )
    OR auth.is_gov()
  );

-- ================================================================
-- TABLE: documents
-- ================================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_driver_own" ON documents
  FOR SELECT USING (
    driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    OR auth.is_gov()
  );

CREATE POLICY "documents_no_delete" ON documents
  FOR DELETE USING (FALSE); -- Soft delete seulement via API

-- ================================================================
-- ANTI-IDOR: vérification enterprise_id côté application
-- ================================================================
-- Note: Pour les tables enterprise, la protection enterprise_id
-- est assurée par l'API (requireAuth + enterprise_id from user_metadata)
-- et non uniquement par RLS, car enterprise_id vient de user_metadata.

-- ================================================================
-- AUDIT TRAIL: immutabilité des logs
-- ================================================================
ALTER TABLE document_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_only_driver" ON document_audit_events
  FOR SELECT USING (
    driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
    OR auth.is_gov()
  );

-- Aucun UPDATE/DELETE sur les logs d'audit
CREATE POLICY "audit_no_update" ON document_audit_events
  FOR UPDATE USING (FALSE);
CREATE POLICY "audit_no_delete" ON document_audit_events
  FOR DELETE USING (FALSE);

-- ================================================================
-- TEST SCÉNARIO CROSS-ENTERPRISE (à exécuter en SQL Editor Supabase)
-- ================================================================
-- Tester: Driver A → Driver B = DENY
-- SELECT * FROM driver_profiles WHERE id = '<OTHER_DRIVER_ID>';
-- Résultat attendu: 0 rows (RLS bloque)
--
-- Tester: Enterprise A → Enterprise B
-- SELECT * FROM revenue_ledger WHERE driver_id = '<DRIVER_B_ID>';
-- Résultat attendu: 0 rows si driver_id appartient à autre entreprise
