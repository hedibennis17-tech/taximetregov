// POST /api/admin/seed-pilots — Seed 8 chauffeurs pilotes complets IDEMPOTENT
// Crée: users, driver_profiles, vehicles, documents, document_types, revenue_ledger
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

async function sb(path: string, body?: unknown, method = 'POST') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: body ? method : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': body ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok && res.status !== 409 && res.status !== 404) throw new Error(`${path}: ${text.slice(0,300)}`)
  return text ? JSON.parse(text) as unknown[] : []
}

async function sbIgnore(path: string, body: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
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

async function sbGet(path: string) { return sb(path, undefined) }

const now = new Date()
const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0]!
const dt = (days: number) => new Date(now.getTime() + days * 86400000).toISOString()

const PILOTS = [
  {
    pub: 'PILOT-USR-001', email: 'jean.tremblay.demo@taximetregov.qc', fn: 'Jean', ln: 'Tremblay',
    driverNum: 'DRV-QC-0001', status: 'ACTIVE', verif: 'APPROVED', city: 'Montréal',
    make: 'Toyota', model: 'Camry',    year: 2022, color: 'Blanc',  plate: 'DEMO-ABC-001', vin: 'DEMO-VIN-001',
    services: ['TAXI','RIDESHARE'], licType: 'TAXI', licNum: 'LIC-TAXI-QC-001',
    gross: 42800, trips: 312, tips: 4280, days: -5,
  },
  {
    pub: 'PILOT-USR-002', email: 'marie.gagnon.demo@taximetregov.qc', fn: 'Marie', ln: 'Gagnon',
    driverNum: 'DRV-QC-0002', status: 'ACTIVE', verif: 'APPROVED', city: 'Laval',
    make: 'Honda',  model: 'Civic',    year: 2021, color: 'Gris',   plate: 'DEMO-ABC-002', vin: 'DEMO-VIN-002',
    services: ['RIDESHARE','DELIVERY'], licType: 'VTC', licNum: 'LIC-VTC-QC-002',
    gross: 38600, trips: 284, tips: 3860, days: -2,
  },
  {
    pub: 'PILOT-USR-003', email: 'karim.hassan.demo@taximetregov.qc', fn: 'Karim', ln: 'Hassan',
    driverNum: 'DRV-QC-0003', status: 'ACTIVE', verif: 'APPROVED', city: 'Montréal',
    make: 'Hyundai', model: 'Elantra', year: 2023, color: 'Bleu',  plate: 'DEMO-ABC-003', vin: 'DEMO-VIN-003',
    services: ['DELIVERY'], licType: 'DELIVERY', licNum: 'LIC-DEL-QC-003',
    gross: 29400, trips: 0, tips: 2940, days: -1,
  },
  {
    pub: 'PILOT-USR-004', email: 'sophie.martin.demo@taximetregov.qc', fn: 'Sophie', ln: 'Martin',
    driverNum: 'DRV-QC-0004', status: 'PENDING', verif: 'PENDING', city: 'Longueuil',
    make: 'Ford', model: 'Escape',     year: 2020, color: 'Rouge',  plate: 'DEMO-ABC-004', vin: 'DEMO-VIN-004',
    services: ['TAXI'], licType: 'TAXI', licNum: 'LIC-TAXI-QC-004',
    gross: 0, trips: 0, tips: 0, days: -30,
  },
  {
    pub: 'PILOT-USR-005', email: 'ali.bouchard.demo@taximetregov.qc', fn: 'Ali', ln: 'Bouchard',
    driverNum: 'DRV-QC-0005', status: 'PENDING', verif: 'PENDING', city: 'Québec City',
    make: 'Volkswagen', model: 'Golf', year: 2021, color: 'Noir',   plate: 'DEMO-ABC-005', vin: 'DEMO-VIN-005',
    services: ['RIDESHARE','DELIVERY'], licType: 'VTC', licNum: 'LIC-VTC-QC-005',
    gross: 0, trips: 0, tips: 0, days: -20,
  },
  {
    pub: 'PILOT-USR-006', email: 'nadia.patel.demo@taximetregov.qc', fn: 'Nadia', ln: 'Patel',
    driverNum: 'DRV-QC-0006', status: 'ACTIVE', verif: 'APPROVED', city: 'Brossard',
    make: 'Mazda', model: 'CX-5',      year: 2022, color: 'Argent', plate: 'DEMO-ABC-006', vin: 'DEMO-VIN-006',
    services: ['DELIVERY'], licType: 'DELIVERY', licNum: 'LIC-DEL-QC-006',
    gross: 31200, trips: 0, tips: 3120, days: -3,
  },
  {
    pub: 'PILOT-USR-007', email: 'marc.leblanc.demo@taximetregov.qc', fn: 'Marc', ln: 'Leblanc',
    driverNum: 'DRV-QC-0007', status: 'SUSPENDED', verif: 'APPROVED', city: 'Montréal',
    make: 'Nissan', model: 'Altima',   year: 2019, color: 'Beige',  plate: 'DEMO-ABC-007', vin: 'DEMO-VIN-007',
    services: ['TAXI'], licType: 'TAXI', licNum: 'LIC-TAXI-QC-007',
    gross: 12400, trips: 89, tips: 1240, days: -60,
  },
  {
    pub: 'PILOT-USR-008', email: 'amira.tremblay.demo@taximetregov.qc', fn: 'Amira', ln: 'Tremblay',
    driverNum: 'DRV-QC-0008', status: 'ACTIVE', verif: 'UNDER_REVIEW', city: 'Laval',
    make: 'Kia', model: 'Sportage',    year: 2020, color: 'Vert',   plate: 'DEMO-ABC-008', vin: 'DEMO-VIN-008',
    services: ['RIDESHARE'], licType: 'VTC', licNum: 'LIC-VTC-QC-008',
    gross: 18700, trips: 142, tips: 1870, days: -10,
  },
]

const TPS = 0.05; const TVQ = 0.09975
const r2 = (n: number) => Math.round(n * 100) / 100

export async function POST(_req: NextRequest) {
  try {
    const steps: string[] = []

    // ── 1. Document types IDEMPOTENT ──────────────────────────
    const DOC_TYPES = [
      { code:'DRIVER_LICENSE',               label:'Permis de conduire',          required:true  },
      { code:'VEHICLE_REGISTRATION',         label:'Immatriculation véhicule',    required:true  },
      { code:'INSURANCE',                    label:'Assurance automobile',         required:true  },
      { code:'VEHICLE_INSPECTION',           label:'Inspection mécanique',         required:true  },
      { code:'TAXI_AUTHORIZATION',           label:'Autorisation taxi',            required:false },
      { code:'VTC_AUTHORIZATION',            label:'Autorisation VTC',             required:false },
      { code:'DELIVERY_PERMIT',              label:'Permis livraison',             required:false },
      { code:'IDENTITY_VERIFICATION',        label:'Vérification identité',        required:true  },
      { code:'CRIMINAL_RECORD_CHECK',        label:'Vérification antécédents',     required:true  },
      { code:'TRAINING_CERTIFICATE',         label:'Certificat de formation',      required:false },
    ]
    await sbIgnore('document_types', DOC_TYPES.map(t => ({
      code: t.code, label_fr: t.label, label_en: t.label,
      required_for_activation: t.required, category: 'PROFESSIONAL',
    })))
    steps.push(`✅ ${DOC_TYPES.length} document_types (idempotent)`)

    // Récupérer les doc type IDs
    const dtRows = await sbGet(`document_types?select=id,code&code=in.(${DOC_TYPES.map(t=>`"${t.code}"`).join(',')})`) as Array<{id:string;code:string}>
    const dtMap: Record<string,string> = {}
    dtRows.forEach(r => { dtMap[r.code] = r.id })

    // ── 2. DRIVER_LICENSE role ─────────────────────────────────
    const roles = await sbGet(`roles?name=eq.DRIVER&select=id`) as Array<{id:string}>
    const driverRoleId = roles[0]?.id ?? null

    // ── 3. Chauffeurs pilotes ──────────────────────────────────
    const createdDriverIds: Record<string,string> = {}

    for (const p of PILOTS) {
      // User
      const existU = await sbGet(`users?email=eq.${p.email}&select=id`) as Array<{id:string}>
      let userId: string
      if (existU.length > 0) {
        userId = existU[0]!.id
        await sb(`users?email=eq.${p.email}`, { status:'ACTIVE', updated_at: now.toISOString() }, 'PATCH')
      } else {
        const u = await sb('users', [{
          public_id: p.pub, user_type:'DRIVER', status:'ACTIVE',
          email: p.email, email_verified_at: dt(-30),
          created_at: dt(-90), updated_at: now.toISOString(),
        }]) as Array<{id:string}>
        userId = u[0]!.id
      }

      // Role DRIVER
      if (driverRoleId) await sbIgnore('user_roles', { user_id: userId, role_id: driverRoleId })

      // Driver profile
      const existDp = await sbGet(`driver_profiles?user_id=eq.${userId}&select=id,driver_number`) as Array<{id:string;driver_number:string}>
      let driverId: string
      if (existDp.length > 0) {
        driverId = existDp[0]!.id
        await sb(`driver_profiles?id=eq.${driverId}`, {
          status: p.status, identity_verification_status: p.verif,
          updated_at: now.toISOString(),
        }, 'PATCH')
      } else {
        const dp = await sb('driver_profiles', [{
          user_id: userId, driver_number: p.driverNum,
          first_name: p.fn, last_name: p.ln,
          status: p.status, identity_verification_status: p.verif,
          language: 'fr', city: p.city,
          created_at: dt(-90), updated_at: now.toISOString(),
        }]) as Array<{id:string}>
        driverId = dp[0]!.id
      }
      createdDriverIds[p.pub] = driverId
      steps.push(`✅ Chauffeur: ${p.fn} ${p.ln} (${p.driverNum})`)

      // Vehicle
      const existV = await sbGet(`vehicles?driver_id=eq.${driverId}&select=id`) as Array<{id:string}>
      let vehicleId: string | null = existV[0]?.id ?? null
      if (!vehicleId) {
        const v = await sb('vehicles', [{
          driver_id: driverId, make: p.make, model: p.model, year: p.year,
          color: p.color, license_plate: p.plate, vin_number: p.vin,
          vehicle_category: p.services.includes('TAXI')?'TAXI':p.services.includes('RIDESHARE')?'VTC':'DELIVERY',
          status: p.status==='ACTIVE'?'ACTIVE':'PENDING',
          registration_expiry: d(120), insurance_expiry: d(180),
          last_inspection_date: d(-30), next_inspection_date: d(335),
          created_at: dt(-80), updated_at: now.toISOString(),
        }]) as Array<{id:string}>
        vehicleId = v[0]?.id ?? null
      }

      // Documents — idempotent via ignore-duplicates
      if (dtMap['DRIVER_LICENSE']) {
        await sbIgnore('documents', {
          driver_id: driverId, vehicle_id: null,
          document_type_id: dtMap['DRIVER_LICENSE'],
          status: p.verif==='APPROVED'?'APPROVED':p.verif==='PENDING'?'PENDING_REVIEW':'UNDER_REVIEW',
          doc_number_last4: 'DEMO', issued_at: dt(-730), expires_at: d(365*3),
          submitted_at: dt(-60), verified_at: p.verif==='APPROVED'?dt(-50):null,
          public_document_id: `DOC-DL-${p.driverNum}`,
        })
      }
      if (vehicleId && dtMap['VEHICLE_REGISTRATION']) {
        await sbIgnore('documents', {
          driver_id: driverId, vehicle_id: vehicleId,
          document_type_id: dtMap['VEHICLE_REGISTRATION'],
          status: 'APPROVED', doc_number_last4: 'DEMO',
          issued_at: dt(-365), expires_at: d(365),
          submitted_at: dt(-60), verified_at: dt(-50),
          public_document_id: `DOC-VR-${p.driverNum}`,
        })
      }
      if (vehicleId && dtMap['INSURANCE']) {
        await sbIgnore('documents', {
          driver_id: driverId, vehicle_id: vehicleId,
          document_type_id: dtMap['INSURANCE'],
          status: p.status==='SUSPENDED'?'EXPIRED':'APPROVED',
          doc_number_last4: 'DEMO',
          issued_at: dt(-180), expires_at: p.status==='SUSPENDED'?d(-10):d(180),
          submitted_at: dt(-60), verified_at: dt(-55),
          public_document_id: `DOC-INS-${p.driverNum}`,
        })
      }

      // Revenue ledger entries (si actif)
      if (p.gross > 0) {
        const TPS_AMT = r2(p.gross * TPS)
        const TVQ_AMT = r2(p.gross * TVQ)
        await sbIgnore('revenue_ledger', {
          driver_id: driverId, source_type: 'TAXI',
          activity_date: dt(p.days).split('T')[0],
          gross_amount: p.gross * 0.4, tip_amount: p.tips * 0.4,
          tps_amount: TPS_AMT * 0.4, tvq_amount: TVQ_AMT * 0.4,
          net_amount: r2(p.gross * 0.4 - p.gross * 0.4 * 0.05),
          currency:'CAD', period_key:'2026-Q3',
          public_ledger_id: `RL-TAXI-${p.driverNum}`,
        })
        await sbIgnore('revenue_ledger', {
          driver_id: driverId, source_type: 'RIDESHARE',
          activity_date: dt(p.days).split('T')[0],
          gross_amount: p.gross * 0.35, tip_amount: p.tips * 0.35,
          tps_amount: TPS_AMT * 0.35, tvq_amount: TVQ_AMT * 0.35,
          net_amount: r2(p.gross * 0.35 - p.gross * 0.35 * 0.2),
          currency:'CAD', period_key:'2026-Q3',
          public_ledger_id: `RL-RIDE-${p.driverNum}`,
        })
        await sbIgnore('revenue_ledger', {
          driver_id: driverId, source_type: 'DELIVERY',
          activity_date: dt(p.days).split('T')[0],
          gross_amount: p.gross * 0.25, tip_amount: p.tips * 0.25,
          tps_amount: TPS_AMT * 0.25, tvq_amount: TVQ_AMT * 0.25,
          net_amount: r2(p.gross * 0.25 - p.gross * 0.25 * 0.2),
          currency:'CAD', period_key:'2026-Q3',
          public_ledger_id: `RL-DEL-${p.driverNum}`,
        })
      }
    }

    steps.push(`✅ ${PILOTS.length} chauffeurs pilotes seedés`)
    steps.push(`✅ Véhicules, documents, revenue_ledger créés`)
    steps.push(`✅ SEED IDEMPOTENT — ré-exécutable sans duplication`)

    return apiSuccess({ ok: true, steps, count: PILOTS.length })
  } catch(e) {
    return apiError(e instanceof Error ? e.message : String(e), 500)
  }
}

export async function GET() {
  return apiSuccess({ message: 'POST pour lancer le seed pilotes' })
}
