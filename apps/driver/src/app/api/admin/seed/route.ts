import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

async function sb(path: string, body?: unknown, method = 'POST') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: body ? method : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${path}: ${text}`)
  return text ? JSON.parse(text) as unknown[] : []
}

async function sbIgnore(path: string, body: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')
  await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  })
}

async function runSeed() {
  const steps: string[] = []

  // ── 1. Trouver le user existant hedibennis70@gmail.com
  const existingUsers = await sb(`users?email=eq.hedibennis70@gmail.com&select=id,public_id,email`, undefined) as Array<{id:string;public_id:string;email:string}>

  let userId: string
  if (existingUsers.length > 0) {
    userId = existingUsers[0]!.id
    steps.push(`✅ User trouvé: ${userId}`)
    // Mettre à jour pour s'assurer que status=ACTIVE
    await sb(`users?email=eq.hedibennis70@gmail.com`, { status: 'ACTIVE', email_verified_at: new Date().toISOString(), public_id: existingUsers[0]!.public_id || 'HEDI-USR-001', user_type: 'DRIVER', updated_at: new Date().toISOString() }, 'PATCH')
  } else {
    // Créer le user
    const created = await sb(`users`, {
      public_id: 'HEDI-USR-001',
      user_type: 'DRIVER',
      status: 'ACTIVE',
      email: 'hedibennis70@gmail.com',
      email_verified_at: new Date().toISOString(),
    }) as Array<{id:string}>
    userId = created[0]!.id
    steps.push(`✅ User créé: ${userId}`)
  }

  // ── 2. Rôle DRIVER
  const roles = await sb(`roles?name=eq.DRIVER&select=id`, undefined) as Array<{id:string}>
  if (roles[0]) {
    await sbIgnore('user_roles', { user_id: userId, role_id: roles[0].id })
    steps.push(`✅ Role DRIVER assigné`)
  }

  // ── 3. Driver profile — structure exacte migration 0031
  const existingProfile = await sb(`driver_profiles?user_id=eq.${userId}&select=id,driver_number`, undefined) as Array<{id:string;driver_number:string}>

  let driverId: string
  if (existingProfile.length > 0) {
    driverId = existingProfile[0]!.id
    steps.push(`✅ Profile existant: ${driverId} (${existingProfile[0]!.driver_number})`)
    // Mettre à jour
    await sb(`driver_profiles?user_id=eq.${userId}`, {
      status: 'ACTIVE',
      identity_verification_status: 'VERIFIED',
      onboarding_completed_at: new Date(Date.now() - 10*86400000).toISOString(),
      updated_at: new Date().toISOString(),
    }, 'PATCH')
  } else {
    const profile = await sb(`driver_profiles`, {
      user_id: userId,
      driver_number: 'HEDI-DRV-0010',
      status: 'ACTIVE',
      first_name: 'Hedi',
      last_name: 'Bennis',
      preferred_name: 'Hedi B.',
      phone: '514-555-0010',
      province: 'QC',
      country: 'CA',
      language: 'fr',
      business_status: 'SOLE_PROPRIETOR',
      identity_verification_status: 'VERIFIED',
      onboarding_completed_at: new Date(Date.now() - 10*86400000).toISOString(),
    }) as Array<{id:string}>
    driverId = profile[0]!.id
    steps.push(`✅ Profile créé: ${driverId}`)
  }

  // ── 4. Présence chauffeur
  await sbIgnore('driver_presences', {
    driver_id: driverId,
    status: 'OFFLINE',
    location_label: 'Montréal — Laval',
    last_offline_at: new Date().toISOString(),
  })

  // ── 5. Onboarding steps
  for (const step of ['identity', 'vehicle', 'tax']) {
    await sbIgnore('driver_onboarding_steps', {
      driver_id: driverId,
      step_key: step,
      status: 'COMPLETED',
      completed_at: new Date(Date.now() - 8*86400000).toISOString(),
      metadata: { demo: true, scenario: 'pilot-2026' },
    })
  }
  steps.push(`✅ Onboarding steps créés`)

  // ── 6. Véhicule
  const existingVeh = await sb(`vehicles?driver_id=eq.${driverId}&select=id,vehicle_number`, undefined) as Array<{id:string;vehicle_number:string}>
  let vehicleId: string

  if (existingVeh.length > 0) {
    vehicleId = existingVeh[0]!.id
    steps.push(`✅ Véhicule existant: ${vehicleId}`)
  } else {
    const veh = await sb(`vehicles`, {
      driver_id: driverId,
      vehicle_number: 'HEDI-VEH-010',
      vin_last_four: '2026',
      license_plate_region: 'QC',
      license_plate_masked: '••• 2026',
      make: 'Toyota',
      model: 'Camry Hybrid',
      year: 2024,
      color: 'Noir',
      vehicle_type: 'SEDAN',
      fuel_type: 'HYBRID',
      seating_capacity: 4,
      accessibility_features: ['Paiement sans contact'],
      vehicle_status: 'ACTIVE',
      is_active: true,
      taximeter_status: 'CERTIFIED',
      taximeter_serial_masked: '••••TM-HEDI',
      notes: 'DEMO-Véhicule pilote Hedi Bennis — données fictives',
    }) as Array<{id:string}>
    vehicleId = veh[0]!.id
    steps.push(`✅ Véhicule créé: ${vehicleId}`)
  }

  // ── 7. Assignment véhicule
  await sbIgnore('driver_vehicle_assignments', {
    driver_id: driverId,
    vehicle_id: vehicleId,
    assignment_type: 'PRIMARY_DRIVER',
    assignment_status: 'ACTIVE',
    valid_from: new Date(Date.now() - 60*86400000).toISOString().split('T')[0],
    notes: 'DEMO-Affectation pilote',
  })

  // ── 8. Immatriculation
  await sbIgnore('vehicle_registrations', {
    vehicle_id: vehicleId,
    jurisdiction: 'QC',
    registration_last4: '2026',
    valid_from: new Date(Date.now() - 120*86400000).toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 245*86400000).toISOString().split('T')[0],
    status: 'VALID',
    document_ref: 'DEMO-IMM-HEDI-010',
  })

  // ── 9. Inspection
  await sbIgnore('vehicle_inspections', {
    vehicle_id: vehicleId,
    driver_id: driverId,
    inspection_type: 'DEMO_MECHANICAL',
    status: 'VALID',
    inspection_date: new Date(Date.now() - 20*86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 345*86400000).toISOString().split('T')[0],
    inspector_name: 'Inspecteur démonstration',
    inspection_center_ref: 'DEMO-CENTRE-QC-01',
    passed: true,
    condition_notes: 'DEMO-Inspection sans valeur réglementaire',
    certificate_ref: 'DEMO-INSP-HEDI-010',
  })
  steps.push(`✅ Véhicule complet: immatriculation + inspection`)

  // ── 10. Taximètre
  const existingTxm = await sb(`taximeters?driver_id=eq.${driverId}&select=id`, undefined) as Array<{id:string}>
  let taximeterId: string
  if (existingTxm.length > 0) {
    taximeterId = existingTxm[0]!.id
    steps.push(`✅ Taximètre existant`)
  } else {
    const txm = await sb(`taximeters`, {
      public_taximeter_id: 'HEDI-TXM-010',
      driver_id: driverId,
      vehicle_id: vehicleId,
      status: 'READY',
      current_mode: 'AVAILABLE',
      jurisdiction: 'QC',
      device_id: 'DEMO-DEVICE-HEDI-010',
      app_version: 'pilot-2026.1',
      activated_at: new Date(Date.now() - 10*86400000).toISOString(),
    }) as Array<{id:string}>
    taximeterId = txm[0]!.id
    steps.push(`✅ Taximètre créé: ${taximeterId}`)
  }

  // ── 11. Permis de conduire
  await sbIgnore('driver_licenses', {
    driver_id: driverId,
    license_class: 'CLASS_4A',
    jurisdiction: 'QC',
    license_number_masked: 'DEMO-••••-HEDI',
    issue_date: new Date(Date.now() - 350*86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 4*365*86400000).toISOString().split('T')[0],
    status: 'ACTIVE',
    verification_status: 'VERIFIED',
  })

  // ── 12. Permis taxi
  await sbIgnore('taxi_permits', {
    driver_id: driverId,
    jurisdiction: 'QC',
    permit_type: 'TAXI',
    permit_number_masked: 'DEMO-••••-HEDI-TAXI',
    status: 'ACTIVE',
    issue_date: new Date(Date.now() - 210*86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 155*86400000).toISOString().split('T')[0],
    allowed_zones: ['Montréal', 'Laval'],
    verification_status: 'VERIFIED',
    issuing_authority: 'DEMO-Autorité pilote QC',
  })
  steps.push(`✅ Documents: permis conduire + taxi permit`)

  // ── 13. Document types
  const docTypes = await sb(`document_types?code=in.(DRIVER_LICENSE,TAXI_PERMIT)&select=id,code`, undefined) as Array<{id:string;code:string}>
  for (const dt of docTypes) {
    await sbIgnore('documents', {
      public_document_id: `HEDI-DOC-${dt.code}`,
      document_type_id: dt.id,
      owner_type: 'DRIVER',
      driver_owner_id: driverId,
      jurisdiction: 'QC',
      status: 'APPROVED',
      issued_at: new Date(Date.now() - 120*86400000).toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 245*86400000).toISOString().split('T')[0],
      doc_number_last4: '0010',
      ocr_status: 'OCR_COMPLETE',
      notes: 'DEMO-Document fictif pour présentation pilote',
    })
  }

  // ── 14. Providers catalogue
  const provData = [
    { public_provider_id:'DEMO-PRV-UBER',      code:'UBER',      name:'Uber',          provider_type:'RIDESHARE' },
    { public_provider_id:'DEMO-PRV-LYFT',      code:'LYFT',      name:'Lyft',          provider_type:'RIDESHARE' },
    { public_provider_id:'DEMO-PRV-DOORDASH',  code:'DOORDASH',  name:'DoorDash',      provider_type:'FOOD_DELIVERY' },
    { public_provider_id:'DEMO-PRV-UBEREATS',  code:'UBER_EATS', name:'Uber Eats',     provider_type:'FOOD_DELIVERY' },
    { public_provider_id:'DEMO-PRV-INSTACART', code:'INSTACART', name:'Instacart',     provider_type:'GROCERY_DELIVERY' },
    { public_provider_id:'DEMO-PRV-SKIP',      code:'SKIP',      name:'SkipTheDishes', provider_type:'FOOD_DELIVERY' },
  ]
  for (const p of provData) {
    await sbIgnore('providers', { ...p, provider_status: 'ACTIVE', country: 'CA', supports_oauth: false, supports_webhook: false, supports_api_sync: false, taximeter_enabled: false, is_development_seed: true })
  }
  steps.push(`✅ ${provData.length} providers catalogue`)

  // ── 15. Provider accounts Hedi
  const providers = await sb(`providers?code=in.(UBER,LYFT,DOORDASH)&select=id,code`, undefined) as Array<{id:string;code:string}>
  for (const p of providers) {
    await sbIgnore('driver_provider_accounts', {
      public_provider_account_id: `HEDI-ACC-${p.code}-010`,
      driver_id: driverId,
      provider_id: p.id,
      provider_account_status: 'ACTIVE',
      external_account_id_last4: '0010',
      display_name: `Compte pilote ${p.code} — Hedi Bennis`,
      jurisdiction: 'QC',
      verified_at: new Date(Date.now() - 5*86400000).toISOString(),
      verification_method: 'MANUAL',
      connected_at: new Date(Date.now() - 5*86400000).toISOString(),
      last_verified_at: new Date(Date.now() - 86400000).toISOString(),
      last_sync_at: new Date(Date.now() - 3600000).toISOString(),
    })
  }
  steps.push(`✅ ${providers.length} comptes provider connectés`)

  // ── 16. Wallet
  await sbIgnore('wallet_accounts', { driver_id: driverId, currency: 'CAD', jurisdiction: 'QC', is_active: true })

  // ── 17. Tax account
  const jurs = await sb(`jurisdictions?code=eq.QC&select=id`, undefined) as Array<{id:string}>
  if (jurs[0]) {
    await sbIgnore('tax_accounts', {
      driver_id: driverId,
      jurisdiction_id: jurs[0].id,
      tps_registration_masked: 'DEMO-••••-TPS-HEDI',
      tvq_registration_masked: 'DEMO-••••-TVQ-HEDI',
      tps_status: 'REGISTERED',
      tvq_status: 'REGISTERED',
      filing_frequency: 'QUARTERLY',
      tax_account_status: 'ACTIVE',
      effective_from: new Date(Date.now() - 90*86400000).toISOString().split('T')[0],
    })
    steps.push(`✅ Wallet + Tax account créés`)
  }

  // ── 18. Revenue ledger
  const ledgerEntries = [
    { source_type:'TAXI', activity_type:'TAXI_TRIP', gross:52.50, fee:0, tip:4.00, d:1, ref:'HEDI-LEDGER-001' },
    { source_type:'TAXI', activity_type:'TAXI_TRIP', gross:38.75, fee:0, tip:3.00, d:3, ref:'HEDI-LEDGER-002' },
    { source_type:'TAXI', activity_type:'TAXI_TRIP', gross:67.00, fee:0, tip:8.00, d:5, ref:'HEDI-LEDGER-003' },
    { source_type:'UBER', activity_type:'RIDESHARE_TRIP', gross:42.00, fee:8.40, tip:5.00, d:2, ref:'HEDI-LEDGER-004' },
    { source_type:'LYFT', activity_type:'RIDESHARE_TRIP', gross:33.50, fee:6.70, tip:3.00, d:4, ref:'HEDI-LEDGER-005' },
    { source_type:'DOORDASH', activity_type:'FOOD_DELIVERY', gross:22.50, fee:4.50, tip:0, d:6, ref:'HEDI-LEDGER-006' },
  ]
  for (const e of ledgerEntries) {
    const actDate = new Date(Date.now() - e.d*86400000).toISOString().split('T')[0]
    await sbIgnore('revenue_ledger', {
      driver_id: driverId,
      source_type: e.source_type,
      activity_type: e.activity_type,
      entry_type: 'CREDIT',
      gross_amount: e.gross,
      fee_amount: e.fee,
      tip_amount: e.tip,
      adjustment_amount: 0,
      net_amount: e.gross - e.fee,
      currency: 'CAD',
      jurisdiction: 'QC',
      activity_date: actDate,
      is_settled: true,
      settled_at: new Date().toISOString(),
      source_reference: e.ref,
      notes: 'DEMO-Revenu fictif de pilote, sans portée déclarative',
    })
  }
  steps.push(`✅ ${ledgerEntries.length} entrées revenue ledger`)

  // ── 19. Vérification finale
  const check = await sb(`driver_profiles?user_id=eq.${userId}&select=id,driver_number,first_name,last_name,status,identity_verification_status`, undefined) as unknown[]

  return apiSuccess({
    ok: true,
    message: '✅ Dossier Hedi Bennis complet — tous modules installés',
    profile: check[0] ?? null,
    user_id: userId,
    driver_id: driverId,
    vehicle_id: vehicleId,
    taximeter_id: taximeterId,
    steps,
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
