// ================================================================
// TAXIMÈTRE.GOV — POST-MIGRATION VERIFICATION
// Database Phase 20/20 — Verify all tables, seeds, and integrity
// ================================================================
//
// USAGE (after migrate.ts + seed.ts):
//   DATABASE_URL="postgresql://..." tsx src/db/verify.ts
//
// Ce script vérifie:
// 1. Toutes les tables existent (140 tables)
// 2. Les données seeds sont présentes
// 3. Les contraintes critiques sont en place
// 4. Les règles absolues sont respectées en DB
// ================================================================

import { drizzle }   from 'drizzle-orm/postgres-js'
import postgres      from 'postgres'
import { sql }       from 'drizzle-orm'

// Expected table count after all 19 migrations
const EXPECTED_TABLE_COUNT = 140

// Expected seed counts
const EXPECTED_SEEDS = {
  jurisdictions:      3,
  roles:              8,
  document_types:     10,
  activity_types:     7,
  providers:          6,
  platform_connectors: 6,
  retention_policies: 10,
} as const

async function verify(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL manquante')
    process.exit(1)
  }

  console.log('🔍  TAXIMÈTRE.GOV — Vérification post-migration')
  console.log('📍  DB:', databaseUrl.replace(/:[^:@]+@/, ':***@'))
  console.log('━'.repeat(60))

  const connection = postgres(databaseUrl, { max: 1 })
  const db = drizzle(connection)

  let passed = 0
  let failed = 0

  async function check(label: string, fn: () => Promise<boolean>): Promise<void> {
    try {
      const ok = await fn()
      if (ok) {
        console.log(`  ✅ ${label}`)
        passed++
      } else {
        console.log(`  ❌ ${label}`)
        failed++
      }
    } catch (err) {
      console.log(`  ❌ ${label} — ERREUR: ${(err as Error).message}`)
      failed++
    }
  }

  // ─── 1. Table count ───────────────────────────────────────

  console.log('\n📋  Tables')
  await check(`${EXPECTED_TABLE_COUNT} tables présentes`, async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `)
    const count = parseInt(String((result[0] as { count: string })?.count ?? '0'))
    if (count !== EXPECTED_TABLE_COUNT) {
      console.log(`    → Trouvé: ${count} · Attendu: ${EXPECTED_TABLE_COUNT}`)
    }
    return count === EXPECTED_TABLE_COUNT
  })

  // ─── 2. Critical tables ────────────────────────────────────

  console.log('\n🏗️   Tables critiques')
  const criticalTables = [
    'users', 'roles', 'permissions', 'driver_profiles', 'vehicles',
    'driver_vehicle_assignments', 'documents', 'document_types',
    'providers', 'driver_provider_accounts', 'provider_events',
    'taxi_trips', 'fare_configurations', 'trip_gps_points',
    'revenue_ledger', 'tax_accounts', 'tax_rule_sets', 'tax_components',
    'payments', 'wallet_accounts', 'wallet_entries', 'payouts',
    'audit_logs', 'retention_policies', 'privacy_requests',
    'platform_connectors', 'pipeline_runs', 'driver_activities',
    'transaction_tax_calculations', 'driver_ledger_summaries',
    'regulatory_actions', 'driver_regulatory_profiles',
    'service_health_checks', 'feature_flags', 'system_configs',
  ]

  for (const table of criticalTables) {
    await check(`Table: ${table}`, async () => {
      const result = await db.execute(sql`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${table}
      `)
      return result.length > 0
    })
  }

  // ─── 3. Seed data ──────────────────────────────────────────

  console.log('\n🌱  Données seeds')

  await check(`Juridictions (≥${EXPECTED_SEEDS.jurisdictions})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM jurisdictions`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.jurisdictions
  })

  await check(`Rôles (≥${EXPECTED_SEEDS.roles})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM roles`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.roles
  })

  await check(`Types de documents (≥${EXPECTED_SEEDS.document_types})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM document_types`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.document_types
  })

  await check(`Types d'activités (≥${EXPECTED_SEEDS.activity_types})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM activity_types`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.activity_types
  })

  await check(`Providers (≥${EXPECTED_SEEDS.providers})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM providers`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.providers
  })

  await check(`Platform connectors (≥${EXPECTED_SEEDS.platform_connectors})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM platform_connectors`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.platform_connectors
  })

  await check(`Retention policies (≥${EXPECTED_SEEDS.retention_policies})`, async () => {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM retention_policies`)
    return parseInt(String((result[0] as { count: string })?.count ?? '0')) >= EXPECTED_SEEDS.retention_policies
  })

  await check('Super Admin présent', async () => {
    const result = await db.execute(sql`
      SELECT u.id FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.code = 'SUPER_ADMIN'
      LIMIT 1
    `)
    return result.length > 0
  })

  // ─── 4. Absolute rules in DB ──────────────────────────────

  console.log('\n🔒  Règles absolues')

  await check('TAXI_TRIP seul type taximeterEligible=true', async () => {
    const wrongTypes = await db.execute(sql`
      SELECT code FROM activity_types
      WHERE taximeter_eligible = true AND code != 'TAXI_TRIP'
    `)
    return wrongTypes.length === 0
  })

  await check('Tous les providers: taximeterEnabled=false', async () => {
    const wrong = await db.execute(sql`
      SELECT code FROM providers WHERE taximeter_enabled = true
    `)
    return wrong.length === 0
  })

  await check('Tous les connectors: taximeterEnabled=false', async () => {
    const wrong = await db.execute(sql`
      SELECT name FROM platform_connectors WHERE taximeter_enabled = true
    `)
    return wrong.length === 0
  })

  await check('Tous les connectors: MOCK_ONLY (pas de prod prématuré)', async () => {
    const notMock = await db.execute(sql`
      SELECT name FROM platform_connectors
      WHERE status NOT IN ('MOCK_ONLY', 'DISABLED')
      AND partner_approval_reference IS NULL
    `)
    return notMock.length === 0
  })

  await check('Gateway mode: SIMULATION (jamais OFFICIAL_API en dev)', async () => {
    const result = await db.execute(sql`
      SELECT value FROM system_configs WHERE key = 'gateway.mode'
    `)
    const val = (result[0] as { value: string } | undefined)?.value
    return val === 'SIMULATION'
  })

  await check('Tax rule sets: DRAFT (pas ACTIVE sans approbation)', async () => {
    const activeWithoutApproval = await db.execute(sql`
      SELECT code FROM tax_rule_sets
      WHERE status = 'ACTIVE' AND approved_by IS NULL
    `)
    return activeWithoutApproval.length === 0
  })

  await check('Retention policies: FINANCIAL_TRANSACTIONS canDelete=false', async () => {
    const wrong = await db.execute(sql`
      SELECT category FROM retention_policies
      WHERE category IN ('FINANCIAL_TRANSACTIONS','TAX_RECORDS','AUDIT_LOGS')
        AND can_delete = true
    `)
    return wrong.length === 0
  })

  await check('MFA obligatoire pour gouvernement (system_config)', async () => {
    const result = await db.execute(sql`
      SELECT value FROM system_configs WHERE key = 'mfa.required.gov'
    `)
    return (result[0] as { value: string } | undefined)?.value === 'true'
  })

  // ─── 5. Unique constraints ─────────────────────────────────

  console.log('\n🔐  Contraintes uniques')

  await check('driver_profiles: UNIQUE user_id', async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*) as cnt, user_id
      FROM driver_profiles
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `)
    return result.length === 0
  })

  await check('wallet_accounts: UNIQUE driver_id', async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*) as cnt, driver_id
      FROM wallet_accounts
      GROUP BY driver_id
      HAVING COUNT(*) > 1
    `)
    return result.length === 0
  })

  await check('tax_accounts: UNIQUE driver_id', async () => {
    const result = await db.execute(sql`
      SELECT COUNT(*) as cnt, driver_id
      FROM tax_accounts
      GROUP BY driver_id
      HAVING COUNT(*) > 1
    `)
    return result.length === 0
  })

  // ─── 6. Summary ────────────────────────────────────────────

  console.log('\n' + '━'.repeat(60))
  console.log(`\n📊  RÉSULTAT: ${passed} ✅  |  ${failed} ❌`)
  console.log('')

  if (failed === 0) {
    console.log('🎉  BASE DE DONNÉES VÉRIFIÉE — TAXIMÈTRE.GOV PRÊT')
    console.log('')
    console.log('   Prochaines étapes:')
    console.log('   1. Configurer SUPER_ADMIN_EMAIL + SUPER_ADMIN_INITIAL_SECRET')
    console.log('   2. Connecter apps/driver → DATABASE_URL (Vercel env vars)')
    console.log('   3. Connecter apps/government → DATABASE_URL (Vercel env vars)')
    console.log('   4. Changer gateway.mode SIMULATION → OFFICIAL_API (après autorisation)')
    console.log('   5. Activer tax_rule_sets (DRAFT → APPROVED → ACTIVE)')
    console.log('')
  } else {
    console.log('⚠️   Des vérifications ont échoué — corriger avant production')
    process.exit(1)
  }

  await connection.end()
}

verify()
