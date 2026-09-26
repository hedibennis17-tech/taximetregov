// GET /api/enterprises/[id] — Enterprise 360° — injecte les données du pilot-demo
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireGovRole } from '@/lib/auth'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function r2(n: number) { return Math.round(n * 100) / 100 }

const UBER_META = {
  enterprise_id:      'ENT-UBER-DEMO',
  name:               'Uber Canada Inc.',
  commercial_name:    'Uber Québec',
  neq:                'NOT_VERIFIED_DEMO',
  province:           'QC',
  city:               'Montréal',
  address:            '1 Place Ville Marie, Bureau 3700 (DEMO)',
  postal_code:        'H3B 4M4 (DEMO)',
  website:            'https://www.uber.com/ca/fr-ca/',
  org_type:           'PLATFORM',
  status:             'DEMO',
  data_status:        'SYNTHETIC_DEMO',
  economic_impact:    '1,9G$ QC 2024 — PUBLIC_VERIFIED (Uber/Public First, déc. 2025)',
  internal_revenue:   'PRIVATE_NOT_AVAILABLE',
  departments: [
    { id:'DEPT-UBER-TAXI',    name:'Uber Taxi',          service:'TAXI',      color:'#F59E0B' },
    { id:'DEPT-UBER-RIDES',   name:'Uber Rides',         service:'RIDESHARE', color:'#3B82F6' },
    { id:'DEPT-UBER-GREEN',   name:'Uber Green',         service:'GREEN',     color:'#10B981' },
    { id:'DEPT-UBER-EATS',    name:'Uber Eats',          service:'FOOD',      color:'#EF4444' },
    { id:'DEPT-UBER-GROCERY', name:'Uber Eats Grocery',  service:'GROCERY',   color:'#8B5CF6' },
    { id:'DEPT-UBER-COURIER', name:'Uber Courier',       service:'DELIVERY',  color:'#F97316' },
  ],
  data_sources: {
    'Impact économique QC 2024':         'PUBLIC_VERIFIED — Uber/Public First, déc. 2025',
    'Revenus internes Uber':             'PRIVATE_NOT_AVAILABLE',
    'Chauffeurs / transactions':         'SYNTHETIC_DEMO (pilot-demo QC-PILOT-2026-Q3)',
    'TPS/TVQ':                           'SYNTHETIC_DEMO — TPS 5% + TVQ 9.975%',
    'Statut fiscal chauffeurs':          'PUBLIC_VERIFIED — Revenu Québec (travailleurs autonomes)',
    'SEV 2e génération':                 'PUBLIC_VERIFIED — CTQ, requis depuis jan. 2026',
  },
}

async function sbGet(path: string) {
  try {
    const res = await fetch(`${SB}/rest/v1/${path}`, {
      headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'count=exact' }
    })
    const data = await res.json() as unknown[]
    const count = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0')
    return { data, count }
  } catch { return { data: [], count: 0 } }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  if (params.id !== 'ENT-UBER-DEMO') {
    return NextResponse.json({ enterprise_id: params.id, message: 'Dossier complet disponible pour ENT-UBER-DEMO en mode DEMO', data_status: 'SYNTHETIC_DEMO' })
  }

  // 1. Charger les données du pilot-demo (même source que le Control Center)
  const pilotRes = await fetch(`${req.nextUrl.origin}/api/admin/pilot-demo`, {
    headers: { authorization: req.headers.get('authorization') ?? '' }
  })
  const pilot = pilotRes.ok ? await pilotRes.json() as {
    metrics: Record<string, number>
    drivers: Array<Record<string, string>>
    activities: Array<Record<string, string|number>>
    transactions: Array<Record<string, string|number>>
    taxRecords: Array<Record<string, string|number>>
    tips: Array<Record<string, string|number>>
    settlements: Array<Record<string, string|number>>
    cases: Array<Record<string, string|number>>
    alerts: Array<Record<string, string|number>>
    reports: Array<Record<string, string|number>>
    statements: Array<Record<string, string|number>>
    accounts: Array<Record<string, string>>
  } : null

  // 2. Données Supabase DB réelles
  const [vehicles, documents, taxFilings, auditLogs, notifications] = await Promise.all([
    sbGet('vehicles?select=id,make,model,year,vehicle_status&limit=20'),
    sbGet('documents?select=id,status&limit=20'),
    sbGet('tax_filings?select=id,filing_status&limit=20'),
    sbGet('audit_logs?select=id,action&limit=10'),
    sbGet('notifications?select=id,status&limit=10'),
  ])

  // 3. Calculer KPIs depuis pilot-demo (même source que Control Center)
  const acts = pilot?.activities ?? []
  const uber_acts = acts.filter(a => a['provider'] === 'UBER' || a['provider'] === 'TAXI')
  const totalGross = r2(acts.reduce((s, a) => s + (parseFloat(String(a['gross'])) || 0), 0))
  const totalNet   = r2(acts.reduce((s, a) => s + (parseFloat(String(a['net']))   || 0), 0))
  const totalFees  = r2(acts.reduce((s, a) => s + (parseFloat(String(a['fee']))   || 0), 0))
  const totalTips  = r2(acts.reduce((s, a) => s + (parseFloat(String(a['tip']))   || 0), 0))
  const totalTax   = r2(acts.reduce((s, a) => s + (parseFloat(String(a['tax']))   || 0), 0))
  const tpsOnly    = r2(totalGross * 0.05)
  const tvqOnly    = r2(totalGross * 0.09975)

  // Revenus par département Uber
  const byProvider: Record<string, { gross:number; activities:number; net:number }> = {}
  for (const a of acts) {
    const p = String(a['provider'])
    if (!byProvider[p]) byProvider[p] = { gross:0, activities:0, net:0 }
    byProvider[p]!.gross      += parseFloat(String(a['gross'])) || 0
    byProvider[p]!.activities += 1
    byProvider[p]!.net        += parseFloat(String(a['net'])) || 0
  }

  return NextResponse.json({
    ...UBER_META,
    kpis: {
      // Depuis pilot-demo (même source que Control Center)
      drivers:          pilot?.metrics?.['drivers'] ?? 0,
      drivers_online:   pilot?.metrics?.['online'] ?? 0,
      activities:       pilot?.metrics?.['activities'] ?? 0,
      gross_revenue:    pilot?.metrics?.['gross'] ?? 0,
      net_revenue:      pilot?.metrics?.['net'] ?? 0,
      tips:             pilot?.metrics?.['tips'] ?? 0,
      fees:             totalFees,
      tax_calculated:   pilot?.metrics?.['tax'] ?? 0,
      tps_only:         tpsOnly,
      tvq_only:         tvqOnly,
      alerts:           pilot?.metrics?.['alerts'] ?? 0,
      open_cases:       pilot?.metrics?.['openCases'] ?? 0,
      settlements:      pilot?.metrics?.['snapshots'] ?? 0,
      // Depuis Supabase DB
      vehicles_db:      vehicles.count,
      documents_db:     documents.count,
      declarations_db:  taxFilings.count,
      audits_db:        auditLogs.count,
      notifications_db: notifications.count,
      departments:      UBER_META.departments.length,
      compliance_demo:  85,
    },
    // Données détaillées du pilot-demo
    drivers:      pilot?.drivers ?? [],
    activities:   acts,
    transactions: pilot?.transactions ?? [],
    tax_records:  pilot?.taxRecords ?? [],
    tips:         pilot?.tips ?? [],
    settlements:  pilot?.settlements ?? [],
    cases:        pilot?.cases ?? [],
    alerts:       pilot?.alerts ?? [],
    reports:      pilot?.reports ?? [],
    statements:   pilot?.statements ?? [],
    accounts:     pilot?.accounts ?? [],
    by_provider:  Object.entries(byProvider).map(([p, v]) => ({
      provider:   p,
      gross:      r2(v.gross),
      net:        r2(v.net),
      activities: v.activities,
    })),
    supabase_db: {
      vehicles:     vehicles.count,
      documents:    documents.count,
      tax_filings:  taxFilings.count,
      audit_logs:   auditLogs.count,
    },
  })
}
