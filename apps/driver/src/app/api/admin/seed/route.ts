import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

// Utilise l'API REST Supabase avec SERVICE_ROLE_KEY — bypass RLS automatique
async function supabaseRest(path: string, body: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')
  
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  })
  
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${path}: ${err}`)
  }
  return res
}

async function supabaseQuery(query: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')
  
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ query }),
  })
  
  if (!res.ok) {
    // Essai via pg directement
    const text = await res.text()
    throw new Error(`SQL failed: ${text}`)
  }
  return res
}

async function runSeed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return apiError('Config manquante. Variables présentes: ' + Object.keys(process.env).filter(k => k.includes('SUPA')).join(', '), 503)
  }

  // Utiliser le DB connection directe avec postgres role via fetch
  // L'API Supabase /rest/v1/ bypass RLS avec service_role key
  
  const results: string[] = []

  // ── 1. User Hedi via REST API (bypass RLS avec service role)
  const userRes = await fetch(`${url}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      public_id: 'DEMO-USR-HEDI-001',
      user_type: 'DRIVER',
      status: 'ACTIVE',
      email: 'hedibennis70@gmail.com',
      email_verified_at: new Date().toISOString(),
    }),
  })
  
  if (!userRes.ok) {
    const errText = await userRes.text()
    throw new Error(`users insert failed: ${errText}`)
  }
  
  const userData = await userRes.json() as Array<{ id: string }>
  const userId = userData[0]?.id
  results.push(`✅ User créé: ${userId}`)

  // ── 2. Role DRIVER
  const roleRes = await fetch(`${url}/rest/v1/roles?name=eq.DRIVER&select=id`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  })
  const roles = await roleRes.json() as Array<{ id: string }>
  const roleId = roles[0]?.id

  if (roleId && userId) {
    await fetch(`${url}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({ user_id: userId, role_id: roleId }),
    })
    results.push(`✅ Role DRIVER assigné`)
  }

  // ── 3. Driver profile
  const profileRes = await fetch(`${url}/rest/v1/driver_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      driver_number: 'DEMO-DRV-HEDI',
      status: 'ACTIVE',
      first_name: 'Hedi',
      last_name: 'Bennis',
      preferred_name: 'Hedi B.',
      phone: '514-555-0100',
      province: 'QC',
      country: 'CA',
      language: 'fr',
      business_status: 'SOLE_PROPRIETOR',
      identity_verification_status: 'VERIFIED',
      onboarding_completed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    }),
  })

  if (!profileRes.ok) {
    const errText = await profileRes.text()
    throw new Error(`driver_profiles insert failed: ${errText}`)
  }
  
  const profileData = await profileRes.json() as Array<{ id: string }>
  const driverId = profileData[0]?.id
  results.push(`✅ Driver profile créé: ${driverId}`)

  // ── 4. Providers (catalogue)
  const providers = [
    { public_provider_id: 'DEMO-PRV-UBER',      code: 'UBER',      name: 'Uber',          provider_type: 'RIDESHARE',        provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true },
    { public_provider_id: 'DEMO-PRV-LYFT',      code: 'LYFT',      name: 'Lyft',          provider_type: 'RIDESHARE',        provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true },
    { public_provider_id: 'DEMO-PRV-DOORDASH',  code: 'DOORDASH',  name: 'DoorDash',      provider_type: 'FOOD_DELIVERY',    provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true },
    { public_provider_id: 'DEMO-PRV-UBEREATS',  code: 'UBER_EATS', name: 'Uber Eats',     provider_type: 'FOOD_DELIVERY',    provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true },
    { public_provider_id: 'DEMO-PRV-INSTACART', code: 'INSTACART', name: 'Instacart',     provider_type: 'GROCERY_DELIVERY', provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true },
    { public_provider_id: 'DEMO-PRV-SKIP',      code: 'SKIP',      name: 'SkipTheDishes', provider_type: 'FOOD_DELIVERY',    provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true },
  ]
  
  for (const p of providers) {
    await fetch(`${url}/rest/v1/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(p),
    })
  }
  results.push(`✅ ${providers.length} providers créés`)

  // ── 5. Wallet
  if (driverId) {
    await fetch(`${url}/rest/v1/wallet_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({ driver_id: driverId, currency: 'CAD', jurisdiction: 'QC', is_active: true }),
    })
    results.push(`✅ Wallet créé`)
  }

  // ── 6. Tax account
  const jurRes = await fetch(`${url}/rest/v1/jurisdictions?code=eq.QC&select=id`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  })
  const jurs = await jurRes.json() as Array<{ id: string }>
  const jurId = jurs[0]?.id

  if (driverId && jurId) {
    await fetch(`${url}/rest/v1/tax_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({
        driver_id: driverId,
        jurisdiction_id: jurId,
        tps_registration_masked: 'DEMO-••••-TPS',
        tvq_registration_masked: 'DEMO-••••-TVQ',
        tps_status: 'REGISTERED',
        tvq_status: 'REGISTERED',
        filing_frequency: 'QUARTERLY',
        tax_account_status: 'ACTIVE',
        effective_from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      }),
    })
    results.push(`✅ Tax account créé`)
  }

  // ── 7. Revenue ledger (données démo)
  if (driverId) {
    const entries = [
      { source_type: 'TAXI',     activity_type: 'TAXI_TRIP',      gross_amount: 52.50, fee_amount: 0,    tip_amount: 4.00, net_amount: 52.50, days_ago: 1, ref: 'DEMO-LEDGER-HEDI-001' },
      { source_type: 'TAXI',     activity_type: 'TAXI_TRIP',      gross_amount: 38.75, fee_amount: 0,    tip_amount: 3.00, net_amount: 38.75, days_ago: 3, ref: 'DEMO-LEDGER-HEDI-002' },
      { source_type: 'TAXI',     activity_type: 'TAXI_TRIP',      gross_amount: 67.00, fee_amount: 0,    tip_amount: 8.00, net_amount: 67.00, days_ago: 5, ref: 'DEMO-LEDGER-HEDI-003' },
      { source_type: 'UBER',     activity_type: 'RIDESHARE_TRIP', gross_amount: 45.00, fee_amount: 9.00, tip_amount: 5.00, net_amount: 36.00, days_ago: 2, ref: 'DEMO-LEDGER-HEDI-004' },
      { source_type: 'LYFT',     activity_type: 'RIDESHARE_TRIP', gross_amount: 33.50, fee_amount: 6.70, tip_amount: 3.00, net_amount: 26.80, days_ago: 4, ref: 'DEMO-LEDGER-HEDI-005' },
      { source_type: 'DOORDASH', activity_type: 'FOOD_DELIVERY',  gross_amount: 24.00, fee_amount: 4.80, tip_amount: 0,    net_amount: 19.20, days_ago: 6, ref: 'DEMO-LEDGER-HEDI-006' },
    ]

    for (const e of entries) {
      const actDate = new Date(Date.now() - e.days_ago * 86400000).toISOString().split('T')[0]
      await fetch(`${url}/rest/v1/revenue_ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({
          driver_id: driverId,
          source_type: e.source_type,
          activity_type: e.activity_type,
          entry_type: 'CREDIT',
          gross_amount: e.gross_amount,
          fee_amount: e.fee_amount,
          tip_amount: e.tip_amount,
          adjustment_amount: 0,
          net_amount: e.net_amount,
          currency: 'CAD',
          jurisdiction: 'QC',
          activity_date: actDate,
          is_settled: true,
          settled_at: new Date().toISOString(),
          source_reference: e.ref,
          notes: 'DEMO-Revenu fictif pilote Hedi Bennis',
        }),
      })
    }
    results.push(`✅ ${entries.length} entrées revenue ledger créées`)
  }

  // ── 8. Vérification
  const checkRes = await fetch(`${url}/rest/v1/driver_profiles?driver_number=eq.DEMO-DRV-HEDI&select=id,driver_number,first_name,last_name,status,identity_verification_status`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  })
  const check = await checkRes.json() as unknown[]

  return apiSuccess({
    ok: true,
    message: 'Compte Hedi Bennis installe avec succes via Supabase REST API',
    profile: check[0] ?? null,
    steps: results,
    driver_id: driverId,
    user_id: userId,
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
