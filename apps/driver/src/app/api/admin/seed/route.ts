import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { sql } from 'drizzle-orm'

async function runSeed() {
  const db = getDb()

  // Base data (already seeded by migrations usually)
  await db.execute(sql`
    INSERT INTO jurisdictions (code, name, name_fr, name_en, country, currency, is_pilot, is_active)
    VALUES ('QC', 'Québec', 'Québec', 'Quebec', 'CA', 'CAD', true, true)
    ON CONFLICT (code) DO NOTHING
  `)

  await db.execute(sql`
    INSERT INTO roles (name, label, description, requires_mfa, is_system)
    VALUES
      ('SUPER_ADMIN', 'Super Admin', 'Acces global', true, true),
      ('GOV_ADMIN', 'Admin Gov', 'Administration', true, true),
      ('DRIVER', 'Chauffeur', 'Acces chauffeur', false, true)
    ON CONFLICT (name) DO NOTHING
  `)

  await db.execute(sql`
    INSERT INTO providers (provider_code, display_name, provider_type, provider_status, integration_status)
    VALUES
      ('UBER',      'Uber',          'RIDESHARE',        'ACTIVE', 'NOT_CONFIGURED'),
      ('LYFT',      'Lyft',          'RIDESHARE',        'ACTIVE', 'NOT_CONFIGURED'),
      ('DOORDASH',  'DoorDash',      'DELIVERY',         'ACTIVE', 'NOT_CONFIGURED'),
      ('UBER_EATS', 'Uber Eats',     'FOOD_DELIVERY',    'ACTIVE', 'NOT_CONFIGURED'),
      ('INSTACART', 'Instacart',     'GROCERY_DELIVERY', 'ACTIVE', 'NOT_CONFIGURED'),
      ('SKIP',      'SkipTheDishes', 'FOOD_DELIVERY',    'ACTIVE', 'NOT_CONFIGURED')
    ON CONFLICT (provider_code) DO NOTHING
  `)

  await db.execute(sql`
    INSERT INTO fare_configurations (version, jurisdiction, currency, label, base_fare, distance_rate_per_100m, time_rate_per_minute, waiting_rate_per_minute, minimum_fare, airport_surcharge, is_active, is_pilot, effective_from)
    VALUES ('QC-TAXI-PILOT-2026', 'QC', 'CAD', 'Tarif taxi Quebec 2026', 4.10, 0.185, 0.55, 0.55, 4.10, 1.50, true, true, '2026-01-01')
    ON CONFLICT (version) DO NOTHING
  `)

  // Create users with exact schema (public_id, user_type enum)
  await db.execute(sql`
    INSERT INTO users (id, public_id, user_type, status, email, email_verified_at, password_hash)
    VALUES
      (gen_random_uuid(), 'DRV-HEDI0001', 'DRIVER', 'ACTIVE', 'hedibennis70@gmail.com',          now(), NULL),
      (gen_random_uuid(), 'DRV-AHME0001', 'DRIVER', 'ACTIVE', 'ahmed.benali@demo.taximetregov.ca',   now(), NULL),
      (gen_random_uuid(), 'DRV-SOPH0001', 'DRIVER', 'ACTIVE', 'sophie.tremblay@demo.taximetregov.ca',now(), NULL),
      (gen_random_uuid(), 'DRV-MARC0001', 'DRIVER', 'PENDING','marco.lepine@demo.taximetregov.ca',   NULL, NULL)
    ON CONFLICT (email) DO UPDATE SET
      status = EXCLUDED.status,
      email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
      updated_at = now()
  `)

  // Driver profiles with exact schema
  await db.execute(sql`
    INSERT INTO driver_profiles (user_id, driver_number, status, first_name, last_name, province, country, language)
    SELECT u.id,
      CASE u.email
        WHEN 'hedibennis70@gmail.com'               THEN 'DR-HEDI0001'
        WHEN 'ahmed.benali@demo.taximetregov.ca'    THEN 'DR-AHME0001'
        WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'DR-SOPH0001'
        ELSE                                             'DR-MARC0001'
      END,
      CASE u.email WHEN 'marco.lepine@demo.taximetregov.ca' THEN 'PENDING' ELSE 'ACTIVE' END,
      CASE u.email
        WHEN 'hedibennis70@gmail.com'               THEN 'Hedi'
        WHEN 'ahmed.benali@demo.taximetregov.ca'    THEN 'Ahmed'
        WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'Sophie'
        ELSE 'Marco'
      END,
      CASE u.email
        WHEN 'hedibennis70@gmail.com'               THEN 'Bennis'
        WHEN 'ahmed.benali@demo.taximetregov.ca'    THEN 'Benali'
        WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'Tremblay'
        ELSE 'Lepine'
      END,
      'QC', 'CA', 'fr'
    FROM users u
    WHERE u.email IN (
      'hedibennis70@gmail.com',
      'ahmed.benali@demo.taximetregov.ca',
      'sophie.tremblay@demo.taximetregov.ca',
      'marco.lepine@demo.taximetregov.ca'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = now()
  `)

  // User roles
  await db.execute(sql`
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM users u, roles r
    WHERE u.email IN ('hedibennis70@gmail.com','ahmed.benali@demo.taximetregov.ca','sophie.tremblay@demo.taximetregov.ca','marco.lepine@demo.taximetregov.ca')
      AND r.name = 'DRIVER'
    ON CONFLICT (user_id, role_id) DO NOTHING
  `)

  // Wallet accounts
  await db.execute(sql`
    INSERT INTO wallet_accounts (driver_id, currency, jurisdiction, is_active)
    SELECT dp.id, 'CAD', 'QC', true
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE u.email IN ('hedibennis70@gmail.com','ahmed.benali@demo.taximetregov.ca','sophie.tremblay@demo.taximetregov.ca','marco.lepine@demo.taximetregov.ca')
    ON CONFLICT (driver_id) DO NOTHING
  `)

  // Revenue ledger — source type is enum
  await db.execute(sql`
    INSERT INTO revenue_ledger (driver_id, source_type, activity_type, entry_type, gross_amount, fee_amount, tip_amount, adjustment_amount, net_amount, currency, jurisdiction, activity_date, source_reference, is_settled)
    SELECT dp.id,
      t.src::revenue_source,
      t.act,
      'CREDIT'::revenue_ledger_entry_type,
      t.gross, t.fee, t.tip, 0, t.gross - t.fee,
      'CAD', 'QC',
      CURRENT_DATE - (t.d || ' days')::interval,
      t.ref, true
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    JOIN (VALUES
      ('hedibennis70@gmail.com',               'TAXI',     'TAXI_TRIP',      52.50, 0,    4.00, 1, 'TXG-HEDI-001'),
      ('hedibennis70@gmail.com',               'TAXI',     'TAXI_TRIP',      38.75, 0,    3.00, 3, 'TXG-HEDI-002'),
      ('hedibennis70@gmail.com',               'TAXI',     'TAXI_TRIP',      67.00, 0,    8.00, 5, 'TXG-HEDI-003'),
      ('hedibennis70@gmail.com',               'UBER',     'RIDESHARE_TRIP', 45.00, 9.00, 5.00, 2, 'UBR-HEDI-001'),
      ('hedibennis70@gmail.com',               'LYFT',     'RIDESHARE_TRIP', 33.50, 6.70, 3.00, 4, 'LYF-HEDI-001'),
      ('hedibennis70@gmail.com',               'DOORDASH', 'FOOD_DELIVERY',  24.00, 4.80, 0,   6, 'DOOR-HEDI-001'),
      ('ahmed.benali@demo.taximetregov.ca',    'TAXI',     'TAXI_TRIP',      50.25, 0,    5.00, 1, 'TXG-AHME-001'),
      ('ahmed.benali@demo.taximetregov.ca',    'UBER',     'RIDESHARE_TRIP', 42.00, 8.40, 4.00, 5, 'UBR-AHME-001'),
      ('sophie.tremblay@demo.taximetregov.ca', 'TAXI',     'TAXI_TRIP',      67.00, 0,    8.00, 2, 'TXG-SOPH-001'),
      ('sophie.tremblay@demo.taximetregov.ca', 'LYFT',     'RIDESHARE_TRIP', 55.00,11.00, 6.00, 4, 'LYF-SOPH-001')
    ) AS t(email, src, act, gross, fee, tip, d, ref)
    ON u.email = t.email
  `)

  // Provider accounts
  await db.execute(sql`
    INSERT INTO driver_provider_accounts (driver_id, provider_id, connection_status, driver_identifier_masked)
    SELECT dp.id, p.id, 'CONNECTED', 'DEMO-MASKED'
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    JOIN providers p ON p.provider_code IN ('UBER', 'LYFT', 'DOORDASH')
    WHERE u.email IN ('hedibennis70@gmail.com','ahmed.benali@demo.taximetregov.ca','sophie.tremblay@demo.taximetregov.ca')
    ON CONFLICT DO NOTHING
  `)

  return apiSuccess({
    ok: true,
    message: 'Donnees installees avec succes',
    drivers: ['Hedi Bennis DR-HEDI0001','Ahmed Benali DR-AHME0001','Sophie Tremblay DR-SOPH0001','Marco Lepine DR-MARC0001']
  })
}

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret') ?? ''
  if (secret !== 'TAXIMETREGOV_SEED_2026') return apiError('Non autorise', 403)
  try { return await runSeed() } catch (err) { return apiError('Erreur: ' + String(err), 500) }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-seed-secret') ?? ''
  if (secret !== 'TAXIMETREGOV_SEED_2026') return apiError('Non autorise', 403)
  try { return await runSeed() } catch (err) { return apiError('Erreur: ' + String(err), 500) }
}
