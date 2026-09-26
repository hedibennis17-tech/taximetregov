// GET /api/enterprises/[id] — Enterprise 360° Gov
// Injecte les données de l'app Enterprise (lib/data.ts) dans Gov
// Source: taximetregov-enterprise.vercel.app / apps/enterprise/src/lib/data.ts

import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireGovRole } from '@/lib/auth'

const r2 = (n: number) => Math.round(n * 100) / 100
const TPS = 0.05
const TVQ = 0.09975

// ── DONNÉES EXACTES depuis apps/enterprise/src/lib/data.ts ──────────
const GROSS_Q3 = 412_800

const DEPARTMENTS = [
  { id:'DEPT-001', name:'Uber Taxi',              emoji:'🚕', color:'#003DA5', drivers:142,   vehicles:138,   activities:8_420,   transactions:8_106,   gross:2_890_000,  tips:289_000,   tps:r2(2_890_000*TPS),  tvq:r2(2_890_000*TVQ) },
  { id:'DEPT-002', name:'Rides (UberX / XL)',     emoji:'🚗', color:'#000000', drivers:3_840,  vehicles:3_680,  activities:124_500, transactions:119_200, gross:18_420_000, tips:1_842_000, tps:r2(18_420_000*TPS), tvq:r2(18_420_000*TVQ) },
  { id:'DEPT-003', name:'Uber Green',             emoji:'🟢', color:'#059669', drivers:420,   vehicles:408,   activities:14_200,  transactions:13_640,  gross:2_484_000,  tips:248_400,   tps:r2(2_484_000*TPS),  tvq:r2(2_484_000*TVQ) },
  { id:'DEPT-004', name:'Uber Eats',              emoji:'🍔', color:'#06B029', drivers:5_200,  vehicles:4_900,  activities:312_000, transactions:298_400, gross:24_960_000, tips:3_744_000, tps:r2(24_960_000*TPS), tvq:r2(24_960_000*TVQ) },
  { id:'DEPT-005', name:'Uber Eats Épicerie',     emoji:'🛒', color:'#7C3AED', drivers:820,   vehicles:780,   activities:42_000,  transactions:40_200,  gross:5_880_000,  tips:588_000,   tps:r2(5_880_000*TPS),  tvq:r2(5_880_000*TVQ) },
  { id:'DEPT-006', name:'Uber Courier / Colis',   emoji:'📦', color:'#B45309', drivers:380,   vehicles:362,   activities:18_400,  transactions:17_640,  gross:2_760_000,  tips:138_000,   tps:r2(2_760_000*TPS),  tvq:r2(2_760_000*TVQ) },
]

const DRIVERS = [
  { id:'DRV-QC-0001', name:'Jean Tremblay',  status:'ACTIVE',    vehicle:'TXM-001', actQ3:1842, revQ3:r2(1842*22.4) },
  { id:'DRV-QC-0002', name:'Marie Gagnon',   status:'ACTIVE',    vehicle:'TXM-002', actQ3:1640, revQ3:r2(1640*22.4) },
  { id:'DRV-QC-0003', name:'Karim Hassan',   status:'ACTIVE',    vehicle:'TXM-003', actQ3:1540, revQ3:r2(1540*22.4) },
  { id:'DRV-QC-0004', name:'Ali Bouchard',   status:'ACTIVE',    vehicle:'TXM-004', actQ3:980,  revQ3:r2(980*22.4)  },
  { id:'DRV-QC-0005', name:'Nadia Patel',    status:'SUSPENDED', vehicle:null,       actQ3:0,    revQ3:0             },
  { id:'DRV-QC-0006', name:'Marc Leblanc',   status:'ACTIVE',    vehicle:'TXM-006', actQ3:1240, revQ3:r2(1240*22.4) },
]

const DECLARATIONS = [
  { id:'DCL-Q1-2026', period:'Q1 2026', status:'ACCEPTED', tps:6840,  tvq:13653.60, total:20493.60, gross:136_800, govRef:'RQ-2026-Q1-00142' },
  { id:'DCL-Q2-2026', period:'Q2 2026', status:'ACCEPTED', tps:7224,  tvq:14415.78, total:21639.78, gross:144_480, govRef:'RQ-2026-Q2-00098' },
  { id:'DCL-Q3-2026', period:'Q3 2026', status:'DRAFT',    tps:20640, tvq:41178.72, total:61818.72, gross:412_800, govRef:null               },
]

const PAYMENTS = [
  { id:'PAY-Q1', period:'Q1 2026', amount:r2(136_800*(TPS+TVQ)*0.98), status:'PAID',    paidAt:'2026-04-28' },
  { id:'PAY-Q2', period:'Q2 2026', amount:r2(144_480*(TPS+TVQ)),      status:'PAID',    paidAt:'2026-07-30' },
  { id:'PAY-Q3', period:'Q3 2026', amount:r2(412_800*(TPS+TVQ)),      status:'UPCOMING',paidAt:null          },
]

const CONNECTIONS = [
  { provider:'TAXIMETER.GOV',     status:'CONNECTED',  dataRx:9_840 },
  { provider:'Taximètre numérique',status:'CONNECTED', dataRx:4_820 },
  { provider:'UBER DEMO',          status:'SIMULATION', dataRx:3_200 },
  { provider:'LYFT DEMO',          status:'SIMULATION', dataRx:1_840 },
  { provider:'UBER EATS DEMO',     status:'SIMULATION', dataRx:3_240 },
]

const NOTIFICATIONS = [
  { id:'N1', type:'WARNING', title:'Permis DRV-QC-0004 expire bientôt', desc:'Permis de conduire expire le 2026-09-30.', read:false },
  { id:'N2', type:'ALERT',   title:'Inspection TXM-004 expirée',         desc:'Inspection du véhicule TXM-004 a expiré.', read:false },
  { id:'N3', type:'INFO',    title:'Déclaration Q3 à préparer',          desc:'Échéance: 2026-10-31', read:true },
  { id:'N4', type:'SUCCESS', title:'Synchronisation TAXIMETER.GOV complétée', desc:'9 840 enregistrements synchronisés.', read:true },
]

const RECENT_ACTIVITIES = [
  { id:'ACT-001', type:'SYNC',    desc:'Synchronisation complétée', sub:'9 840 enregistrements · TAXIMETER.GOV', at:'2026-09-18T06:38:00Z' },
  { id:'ACT-002', type:'TX',      desc:'Transaction reçue',          sub:'TX-001 · Jean Tremblay · 42,50 $',     at:'2026-09-18T06:32:00Z' },
  { id:'ACT-003', type:'TX',      desc:'Transaction reçue',          sub:'TX-002 · Jean Tremblay · 18,75 $',     at:'2026-09-18T05:12:00Z' },
  { id:'ACT-004', type:'TX',      desc:'Transaction reçue',          sub:'TX-003 · Marie Gagnon · 22,50 $',      at:'2026-09-18T04:32:00Z' },
  { id:'ACT-005', type:'ALERT',   desc:'Document expiré détecté',    sub:'Inspection TXM-004 — action requise',  at:'2026-09-18T04:00:00Z' },
]

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  // Auth optionnelle pour les données DEMO
  // Les données sont SYNTHETIC_DEMO — pas de données sensibles réelles
  const ctx = await requireAuth(req).catch(() => null)
  const isAuth = ctx && !(ctx instanceof Response)

  if (params.id !== 'ENT-UBER-DEMO' && params.id !== 'ENT-DEMO-001') {
    return NextResponse.json({ enterprise_id: params.id, message: 'Dossier disponible pour ENT-UBER-DEMO', data_status: 'SYNTHETIC_DEMO' })
  }

  // Agrégats totaux depuis les 6 départements actifs
  const totalDrivers     = DEPARTMENTS.reduce((s, d) => s + d.drivers, 0)
  const totalVehicles    = DEPARTMENTS.reduce((s, d) => s + d.vehicles, 0)
  const totalActivities  = DEPARTMENTS.reduce((s, d) => s + d.activities, 0)
  const totalTransactions= DEPARTMENTS.reduce((s, d) => s + d.transactions, 0)
  const totalGross       = DEPARTMENTS.reduce((s, d) => s + d.gross, 0)
  const totalTips        = DEPARTMENTS.reduce((s, d) => s + d.tips, 0)
  const totalTPS         = r2(DEPARTMENTS.reduce((s, d) => s + d.tps, 0))
  const totalTVQ         = r2(DEPARTMENTS.reduce((s, d) => s + d.tvq, 0))

  return NextResponse.json({
    enterprise_id:   'ENT-UBER-DEMO',
    name:            'Uber Canada Inc.',
    commercial_name: 'Uber Québec',
    neq:             '8765432100 (FICTIF — DEMO)',
    province:        'QC',
    city:            'Montréal',
    website:         'www.uber.com',
    status:          'ACTIVE',
    data_status:     'SYNTHETIC_DEMO',
    note:            "DONNÉES SYNTHÉTIQUES — ESTIMATION INSPIRÉE DE DONNÉES PUBLIQUES — NE REPRÉSENTE PAS LES ÉTATS FINANCIERS RÉELS D'UBER",

    // KPIs — mêmes chiffres que taximetregov-enterprise.vercel.app
    kpis: {
      drivers:      totalDrivers,
      vehicles:     totalVehicles,
      departments:  DEPARTMENTS.length,
      activities:   totalActivities,
      transactions: totalTransactions,
      gross:        totalGross,
      tips:         totalTips,
      tps:          totalTPS,
      tvq:          totalTVQ,
      fees:         r2(totalGross * 0.22),
      net:          r2(totalGross * 0.84),
      alerts:       NOTIFICATIONS.filter(n => !n.read).length,
      declarations: DECLARATIONS.length,
      exception:    5,
      compliance:   97,
      gross_q3:     GROSS_Q3,
      tps_q3:       r2(GROSS_Q3 * TPS),
      tvq_q3:       r2(GROSS_Q3 * TVQ),
    },

    departments:   DEPARTMENTS,
    drivers:       DRIVERS,
    declarations:  DECLARATIONS,
    payments:      PAYMENTS,
    connections:   CONNECTIONS,
    notifications: NOTIFICATIONS,
    recent:        RECENT_ACTIVITIES,

    // Public verified
    public_data: {
      impact_eco_qc_2024:    '1,9 G$ (Uber Canada / Public First, déc. 2025)',
      impact_eats_qc_2024:   '270 M$ retombées restaurateurs',
      vehicules_ref_qc:      '12 351 véhicules référencés (Travelnet 2024)',
      fiscal_status:         'Uber = répondant fiscal TPS/TVQ — Revenu Québec',
      sev_required:          'SEV 2e génération requis depuis jan. 2026 — CTQ',
    },
  })
}
