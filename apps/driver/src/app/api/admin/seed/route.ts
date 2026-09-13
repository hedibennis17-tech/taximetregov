import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { sql } from 'drizzle-orm'

async function runSeed() {
  const db = getDb()

  // ── 1. User Hedi Bennis (lié à son compte Supabase Auth hedibennis70@gmail.com)
  await db.execute(sql`
    INSERT INTO users (public_id, user_type, status, email, email_verified_at, created_at, updated_at)
    VALUES ('DEMO-USR-HEDI-001', 'DRIVER', 'ACTIVE', 'hedibennis70@gmail.com', now(), now(), now())
    ON CONFLICT (email) DO UPDATE SET
      status = 'ACTIVE',
      email_verified_at = COALESCE(users.email_verified_at, now()),
      updated_at = now()
  `)

  // ── 2. Rôle DRIVER
  await db.execute(sql`
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM users u, roles r
    WHERE u.email = 'hedibennis70@gmail.com' AND r.name = 'DRIVER'
    ON CONFLICT (user_id, role_id) DO NOTHING
  `)

  // ── 3. Driver profile — exacte structure V2
  await db.execute(sql`
    INSERT INTO driver_profiles (
      user_id, driver_number, status, first_name, last_name, preferred_name,
      phone, province, country, language, business_status,
      identity_verification_status, onboarding_completed_at, created_at, updated_at
    )
    SELECT
      u.id, 'DEMO-DRV-HEDI', 'ACTIVE', 'Hedi', 'Bennis', 'Hedi B.',
      '514-555-HEDI', 'QC', 'CA', 'fr', 'SOLE_PROPRIETOR',
      'VERIFIED', now() - interval '10 days', now(), now()
    FROM users u
    WHERE u.email = 'hedibennis70@gmail.com'
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'ACTIVE',
      identity_verification_status = 'VERIFIED',
      onboarding_completed_at = COALESCE(driver_profiles.onboarding_completed_at, now() - interval '10 days'),
      updated_at = now()
  `)

  // ── 4. Provider catalogue (si pas encore là)
  await db.execute(sql`
    INSERT INTO providers (public_provider_id, code, name, provider_type, provider_status, country, supports_oauth, supports_webhook, supports_api_sync, taximeter_enabled, is_development_seed, created_at, updated_at)
    SELECT src.pid, src.code, src.name, src.ptype::provider_type, 'ACTIVE'::provider_status, 'CA', false, false, false, false, true, now(), now()
    FROM (VALUES
      ('DEMO-PRV-UBER',      'UBER',      'Uber',          'RIDESHARE'),
      ('DEMO-PRV-LYFT',      'LYFT',      'Lyft',          'RIDESHARE'),
      ('DEMO-PRV-DOORDASH',  'DOORDASH',  'DoorDash',      'FOOD_DELIVERY'),
      ('DEMO-PRV-UBEREATS',  'UBER_EATS', 'Uber Eats',     'FOOD_DELIVERY'),
      ('DEMO-PRV-INSTACART', 'INSTACART', 'Instacart',     'GROCERY_DELIVERY'),
      ('DEMO-PRV-SKIP',      'SKIP',      'SkipTheDishes', 'FOOD_DELIVERY')
    ) AS src(pid, code, name, ptype)
    WHERE NOT EXISTS (SELECT 1 FROM providers p WHERE p.code = src.code)
  `)

  // ── 5. Véhicule Hedi
  await db.execute(sql`
    INSERT INTO vehicles (
      driver_id, vehicle_number, vin_last_four, license_plate_region,
      license_plate_masked, make, model, year, color, vehicle_type,
      fuel_type, seating_capacity, accessibility_features,
      vehicle_status, is_active, taximeter_status, taximeter_serial_masked,
      notes, created_at, updated_at
    )
    SELECT
      dp.id, 'DEMO-VEH-HEDI', '2026', 'QC',
      '••• 2026', 'Toyota', 'Camry Hybrid', 2024, 'Noir', 'SEDAN',
      'HYBRID', 4, ARRAY['Paiement sans contact'],
      'ACTIVE', true, 'CERTIFIED', '••••TM-HEDI',
      'DEMO-Véhicule pilote Hedi Bennis', now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE u.email = 'hedibennis70@gmail.com'
    ON CONFLICT DO NOTHING
  `)

  // ── 6. Taximeter
  await db.execute(sql`
    INSERT INTO taximeters (
      public_taximeter_id, driver_id, vehicle_id,
      status, current_mode, jurisdiction,
      device_id, app_version, activated_at, created_at, updated_at
    )
    SELECT
      'DEMO-TXM-HEDI', dp.id, v.id,
      'READY', 'AVAILABLE', 'QC',
      'DEMO-DEVICE-HEDI', 'pilot-2026.1',
      now() - interval '10 days', now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    JOIN vehicles v ON v.driver_id = dp.id AND v.vehicle_number = 'DEMO-VEH-HEDI'
    WHERE u.email = 'hedibennis70@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM taximeters t WHERE t.public_taximeter_id = 'DEMO-TXM-HEDI')
  `)

  // ── 7. Permis de conduire
  await db.execute(sql`
    INSERT INTO driver_licenses (
      driver_id, license_class, jurisdiction,
      license_number_masked, issue_date, expiry_date,
      status, verification_status, created_at, updated_at
    )
    SELECT dp.id, 'CLASS_4A', 'QC',
      'DEMO-••••-HEDI',
      current_date - interval '2 years',
      current_date + interval '3 years',
      'ACTIVE', 'VERIFIED', now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE u.email = 'hedibennis70@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM driver_licenses dl WHERE dl.driver_id = dp.id)
  `)

  // ── 8. Permis taxi
  await db.execute(sql`
    INSERT INTO taxi_permits (
      driver_id, jurisdiction, permit_type, permit_number_masked,
      status, issue_date, expiry_date, allowed_zones,
      verification_status, issuing_authority, created_at, updated_at
    )
    SELECT dp.id, 'QC', 'TAXI', 'DEMO-••••-HEDI-TAXI',
      'ACTIVE', current_date - interval '6 months', current_date + interval '6 months',
      ARRAY['Montréal','Laval'],
      'VERIFIED', 'DEMO-Autorité pilote QC', now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE u.email = 'hedibennis70@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM taxi_permits tp WHERE tp.driver_id = dp.id)
  `)

  // ── 9. Wallet
  await db.execute(sql`
    INSERT INTO wallet_accounts (driver_id, currency, jurisdiction, is_active, created_at, updated_at)
    SELECT dp.id, 'CAD', 'QC', true, now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE u.email = 'hedibennis70@gmail.com'
    ON CONFLICT (driver_id) DO NOTHING
  `)

  // ── 10. Tax account
  await db.execute(sql`
    INSERT INTO tax_accounts (
      driver_id, jurisdiction_id,
      tps_registration_masked, tvq_registration_masked,
      tps_status, tvq_status, filing_frequency,
      tax_account_status, effective_from, created_at, updated_at
    )
    SELECT dp.id, j.id,
      'DEMO-••••-TPS-HEDI', 'DEMO-••••-TVQ-HEDI',
      'REGISTERED', 'REGISTERED', 'QUARTERLY',
      'ACTIVE', current_date - interval '30 days', now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    JOIN jurisdictions j ON j.code = 'QC'
    WHERE u.email = 'hedibennis70@gmail.com'
    ON CONFLICT (driver_id) DO NOTHING
  `)

  // ── 11. Provider accounts (UBER + LYFT + DOORDASH)
  await db.execute(sql`
    INSERT INTO driver_provider_accounts (
      public_provider_account_id, driver_id, provider_id,
      provider_account_status, external_account_id_last4, display_name,
      jurisdiction, verified_at, verification_method,
      connected_at, last_verified_at, last_sync_at, created_at, updated_at
    )
    SELECT
      'DEMO-ACC-' || p.code || '-HEDI', dp.id, p.id,
      'ACTIVE', 'HEDI', 'Compte pilote ' || p.name,
      'QC', now() - interval '5 days', 'MANUAL',
      now() - interval '5 days', now() - interval '1 day',
      now() - interval '1 hour', now(), now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    JOIN providers p ON p.code IN ('UBER', 'LYFT', 'DOORDASH')
    WHERE u.email = 'hedibennis70@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM driver_provider_accounts dpa
      WHERE dpa.driver_id = dp.id AND dpa.provider_id = p.id
    )
  `)

  // ── 12. Courses taxi
  await db.execute(sql`
    INSERT INTO taxi_trips (
      public_trip_id, trip_reference, taximeter_id, driver_id, vehicle_id,
      trip_status, trip_integrity_status, jurisdiction, currency,
      started_at, completed_at, distance_meters, elapsed_seconds, waiting_seconds,
      estimated_amount, final_amount, receipt_reference,
      device_id, app_version, fare_snapshot, created_at, updated_at
    )
    SELECT
      src.trip_id, src.trip_ref, t.id, dp.id, v.id,
      'COMPLETED', 'NORMAL', 'QC', 'CAD',
      now() - src.h * interval '1 hour',
      now() - src.h * interval '1 hour' + interval '20 minutes',
      src.dist, 1200, 60,
      src.amount, src.amount,
      'DEMO-RCT-HEDI-' || src.n,
      t.device_id, 'pilot-2026.1',
      jsonb_build_object('demo', true, 'tariff', 'pilot-2026'),
      now(), now()
    FROM (VALUES
      ('DEMO-TRIP-HEDI-001', 'DEMO-TAXI-HEDI-001', 5,  4800, 28.75::numeric, '001'),
      ('DEMO-TRIP-HEDI-002', 'DEMO-TAXI-HEDI-002', 28, 7200, 43.50::numeric, '002'),
      ('DEMO-TRIP-HEDI-003', 'DEMO-TAXI-HEDI-003', 52, 5500, 34.25::numeric, '003')
    ) AS src(trip_id, trip_ref, h, dist, amount, n)
    JOIN driver_profiles dp ON true
    JOIN users u ON u.id = dp.user_id AND u.email = 'hedibennis70@gmail.com'
    JOIN vehicles v ON v.driver_id = dp.id AND v.vehicle_number = 'DEMO-VEH-HEDI'
    JOIN taximeters t ON t.driver_id = dp.id
    WHERE NOT EXISTS (SELECT 1 FROM taxi_trips tt WHERE tt.public_trip_id = src.trip_id)
  `)

  // ── 13. Revenue ledger
  await db.execute(sql`
    INSERT INTO revenue_ledger (
      driver_id, source_type, activity_type, entry_type,
      gross_amount, fee_amount, tip_amount, adjustment_amount, net_amount,
      currency, jurisdiction, activity_date,
      is_settled, settled_at, source_reference, notes, created_at
    )
    SELECT dp.id,
      t.src::revenue_source, t.act,
      'CREDIT'::revenue_ledger_entry_type,
      t.gross, t.fee, t.tip, 0, t.gross - t.fee,
      'CAD', 'QC',
      CURRENT_DATE - (t.d || ' days')::interval,
      true, now(),
      'DEMO-LEDGER-HEDI-' || t.n,
      'DEMO-Revenu fictif pilote Hedi Bennis', now()
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id AND u.email = 'hedibennis70@gmail.com'
    CROSS JOIN (VALUES
      ('TAXI',     'TAXI_TRIP',      52.50::numeric, 0::numeric,    4.00::numeric, 1, '001'),
      ('TAXI',     'TAXI_TRIP',      38.75::numeric, 0::numeric,    3.00::numeric, 3, '002'),
      ('TAXI',     'TAXI_TRIP',      67.00::numeric, 0::numeric,    8.00::numeric, 5, '003'),
      ('UBER',     'RIDESHARE_TRIP', 45.00::numeric, 9.00::numeric, 5.00::numeric, 2, '004'),
      ('LYFT',     'RIDESHARE_TRIP', 33.50::numeric, 6.70::numeric, 3.00::numeric, 4, '005'),
      ('DOORDASH', 'FOOD_DELIVERY',  24.00::numeric, 4.80::numeric, 0::numeric,    6, '006')
    ) AS t(src, act, gross, fee, tip, d, n)
    WHERE NOT EXISTS (
      SELECT 1 FROM revenue_ledger rl
      WHERE rl.source_reference = 'DEMO-LEDGER-HEDI-' || t.n
    )
  `)

  // ── 14. Vérification finale
  const profile = await db.execute(sql`
    SELECT dp.driver_number, dp.first_name, dp.last_name, dp.status,
           dp.identity_verification_status,
           (SELECT COUNT(*) FROM revenue_ledger rl WHERE rl.driver_id = dp.id) as ledger_count,
           (SELECT COUNT(*) FROM taxi_trips tt WHERE tt.driver_id = dp.id) as trip_count
    FROM driver_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE u.email = 'hedibennis70@gmail.com'
    LIMIT 1
  `)

  return apiSuccess({
    ok: true,
    message: 'Compte Hedi Bennis installe avec succes',
    profile: profile[0] ?? null,
    modules: ['users','user_roles','driver_profiles','vehicles','taximeters','driver_licenses','taxi_permits','wallet_accounts','tax_accounts','driver_provider_accounts','taxi_trips','revenue_ledger']
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
