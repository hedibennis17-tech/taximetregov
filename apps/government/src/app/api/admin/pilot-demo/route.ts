// GET /api/admin/pilot-demo — Scénario pilote TAXIMETER.GOV — données synthétiques
import { NextRequest, NextResponse } from 'next/server'

function iso(daysAgo: number, hoursAgo = 0): string {
  return new Date(Date.now() - (daysAgo * 86400 + hoursAgo * 3600) * 1000).toISOString()
}
function r2(n: number) { return Math.round(n * 100) / 100 }
function pid(prefix: string, i: number) { return `${prefix}-${String(i).padStart(4,'0')}` }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // ── Chauffeurs pilotes ──────────────────────────────────────
  const drivers = [
    { id:'drv-001', number:'DRV-QC-0001', name:'Hedi Bennis',        status:'ACTIVE',    verification:'APPROVED', presence:'ONLINE',  location:'Laval, QC',     onboardingCompletedAt: iso(45) },
    { id:'drv-002', number:'DRV-QC-0002', name:'Mohammed El-Amine',  status:'ACTIVE',    verification:'APPROVED', presence:'ONLINE',  location:'Montréal, QC',  onboardingCompletedAt: iso(30) },
    { id:'drv-003', number:'DRV-QC-0003', name:'Sofia Lapointe',     status:'ACTIVE',    verification:'APPROVED', presence:'OFFLINE', location:'Québec, QC',    onboardingCompletedAt: iso(60) },
    { id:'drv-004', number:'DRV-QC-0004', name:'Jean-François Roy',  status:'PENDING',   verification:'PENDING',  presence:'OFFLINE', location:'Longueuil, QC', onboardingCompletedAt: null },
    { id:'drv-005', number:'DRV-QC-0005', name:'Amira Tremblay',     status:'SUSPENDED', verification:'APPROVED', presence:'OFFLINE', location:'Laval, QC',     onboardingCompletedAt: iso(90) },
  ]

  // ── Comptes plateforme ─────────────────────────────────────
  const accounts = [
    { id:'acc-001', idPublic:'PA-TAXI-001',  name:'Hedi Bennis',       provider:'TAXI',     status:'ACTIVE',        lastSyncAt: iso(0,1)  },
    { id:'acc-002', idPublic:'PA-UBER-001',  name:'Hedi Bennis',       provider:'UBER',     status:'ACTIVE',        lastSyncAt: iso(0,2)  },
    { id:'acc-003', idPublic:'PA-LYFT-001',  name:'Hedi Bennis',       provider:'LYFT',     status:'ACTIVE',        lastSyncAt: iso(0,3)  },
    { id:'acc-004', idPublic:'PA-DD-001',    name:'Hedi Bennis',       provider:'DOORDASH', status:'ACTIVE',        lastSyncAt: iso(0,4)  },
    { id:'acc-005', idPublic:'PA-TAXI-002',  name:'Mohammed El-Amine', provider:'TAXI',     status:'ACTIVE',        lastSyncAt: iso(0,5)  },
    { id:'acc-006', idPublic:'PA-UBER-002',  name:'Mohammed El-Amine', provider:'UBER',     status:'ACTIVE',        lastSyncAt: iso(0,6)  },
    { id:'acc-007', idPublic:'PA-TAXI-003',  name:'Sofia Lapointe',    provider:'TAXI',     status:'INACTIVE',      lastSyncAt: iso(3)    },
    { id:'acc-008', idPublic:'PA-UBER-003',  name:'Amira Tremblay',    provider:'UBER',     status:'SUSPENDED',     lastSyncAt: iso(10)   },
  ]

  // ── Activités (courses/livraisons) ─────────────────────────
  const ACTIVITY_TEMPLATES = [
    { driver:'DRV-QC-0001', provider:'TAXI',     type:'TAXI_TRIP',      gross:28.50, fee:0,    tip:3.00  },
    { driver:'DRV-QC-0001', provider:'UBER',     type:'RIDESHARE_TRIP', gross:22.00, fee:4.40, tip:2.00  },
    { driver:'DRV-QC-0001', provider:'LYFT',     type:'RIDESHARE_TRIP', gross:18.75, fee:3.75, tip:0     },
    { driver:'DRV-QC-0001', provider:'DOORDASH', type:'FOOD_DELIVERY',  gross:14.50, fee:2.90, tip:1.50  },
    { driver:'DRV-QC-0002', provider:'TAXI',     type:'TAXI_TRIP',      gross:35.00, fee:0,    tip:5.00  },
    { driver:'DRV-QC-0002', provider:'UBER',     type:'RIDESHARE_TRIP', gross:19.00, fee:3.80, tip:0     },
    { driver:'DRV-QC-0003', provider:'TAXI',     type:'TAXI_TRIP',      gross:42.00, fee:0,    tip:4.00  },
    { driver:'DRV-QC-0001', provider:'TAXI',     type:'TAXI_TRIP',      gross:31.25, fee:0,    tip:2.50  },
    { driver:'DRV-QC-0002', provider:'TAXI',     type:'TAXI_TRIP',      gross:26.00, fee:0,    tip:3.50  },
    { driver:'DRV-QC-0001', provider:'UBER',     type:'RIDESHARE_TRIP', gross:24.50, fee:4.90, tip:4.00  },
    { driver:'DRV-QC-0001', provider:'TAXI',     type:'TAXI_TRIP',      gross:45.00, fee:0,    tip:6.00  },
    { driver:'DRV-QC-0002', provider:'LYFT',     type:'RIDESHARE_TRIP', gross:17.00, fee:3.40, tip:1.00  },
    { driver:'DRV-QC-0001', provider:'DOORDASH', type:'FOOD_DELIVERY',  gross:12.00, fee:2.40, tip:2.00  },
    { driver:'DRV-QC-0003', provider:'TAXI',     type:'TAXI_TRIP',      gross:55.00, fee:0,    tip:5.00  },
    { driver:'DRV-QC-0001', provider:'TAXI',     type:'TAXI_TRIP',      gross:33.75, fee:0,    tip:3.00  },
    { driver:'DRV-QC-0002', provider:'UBER',     type:'RIDESHARE_TRIP', gross:21.50, fee:4.30, tip:2.50  },
    { driver:'DRV-QC-0001', provider:'LYFT',     type:'RIDESHARE_TRIP', gross:20.00, fee:4.00, tip:0     },
    { driver:'DRV-QC-0002', provider:'TAXI',     type:'TAXI_TRIP',      gross:38.00, fee:0,    tip:4.00  },
    { driver:'DRV-QC-0001', provider:'DOORDASH', type:'FOOD_DELIVERY',  gross:16.00, fee:3.20, tip:3.00  },
    { driver:'DRV-QC-0001', provider:'TAXI',     type:'TAXI_TRIP',      gross:29.00, fee:0,    tip:2.00  },
  ]

  const TPS = 0.05; const TVQ = 0.09975
  const activities = ACTIVITY_TEMPLATES.map((a, i) => {
    const taxable = r2(a.gross + a.tip)
    const tax     = r2(taxable * (TPS + TVQ))
    const net     = r2(a.gross - a.fee + a.tip)
    return {
      id:             pid('ACT', i+1),
      driver:         a.driver,
      provider:       a.provider,
      type:           a.type,
      status:         'COMPLETED',
      startedAt:      iso(Math.floor(i * 0.4), i % 8),
      gross:          a.gross,
      fee:            a.fee,
      tip:            a.tip,
      tax,
      net,
      currency:       'CAD',
      reconciliation: i % 7 === 0 ? 'REVIEW_REQUIRED' : 'RECONCILED',
      quality:        i % 5 === 0 ? 'REVIEW' : 'VERIFIED',
    }
  })

  // ── Transactions ───────────────────────────────────────────
  const transactions = activities.slice(0, 12).map((a, i) => ({
    id:         pid('TXN', i+1),
    driver:     a.driver,
    provider:   a.provider,
    type:       'PAYOUT',
    status:     i < 10 ? 'SETTLED' : 'PENDING',
    at:         a.startedAt,
    total:      a.net,
    currency:   'CAD',
    receivedAt: iso(Math.floor(i * 0.4) - 1, i % 6),
  }))

  // ── Fiscalité ──────────────────────────────────────────────
  const taxRecords = [
    { id:'TAX-001', driver:'DRV-QC-0001', provider:'TAXI',     taxable:4820, providerTax:0,      calculatedTax:r2(4820*(TPS+TVQ)),  variance:0,     status:'RECONCILED', start:'2026-07-01', end:'2026-09-30' },
    { id:'TAX-002', driver:'DRV-QC-0001', provider:'UBER',     taxable:1240, providerTax:r2(1240*TPS), calculatedTax:r2(1240*(TPS+TVQ)), variance:r2(1240*TVQ), status:'REVIEW_REQUIRED', start:'2026-07-01', end:'2026-09-30' },
    { id:'TAX-003', driver:'DRV-QC-0002', provider:'TAXI',     taxable:3680, providerTax:0,      calculatedTax:r2(3680*(TPS+TVQ)),  variance:0,     status:'RECONCILED', start:'2026-07-01', end:'2026-09-30' },
    { id:'TAX-004', driver:'DRV-QC-0003', provider:'TAXI',     taxable:2950, providerTax:0,      calculatedTax:r2(2950*(TPS+TVQ)),  variance:0,     status:'RECONCILED', start:'2026-07-01', end:'2026-09-30' },
  ]

  // ── Pourboires ─────────────────────────────────────────────
  const tips = activities
    .filter(a => a.tip > 0)
    .map((a, i) => ({
      id:         pid('TIP', i+1),
      driver:     a.driver,
      provider:   a.provider,
      amount:     a.tip,
      status:     'SETTLED',
      receivedAt: a.startedAt,
    }))

  // ── Relevés de règlement ───────────────────────────────────
  const settlements = [
    { id:'SET-001', driver:'DRV-QC-0001', provider:'TAXI',     start:'2026-09-01', end:'2026-09-07', gross:1240.50, earnings:1240.50, fee:0,    tax:r2(1240.50*(TPS+TVQ)), tip:112.00, paid:r2(1240.50-r2(1240.50*(TPS+TVQ))+112), status:'PAID',    at:iso(3)  },
    { id:'SET-002', driver:'DRV-QC-0001', provider:'UBER',     start:'2026-09-01', end:'2026-09-07', gross:380.00,  earnings:304.00,  fee:76.00, tax:r2(380*(TPS+TVQ)),     tip:28.00,  paid:r2(304-r2(380*(TPS+TVQ))+28),       status:'PAID',    at:iso(3)  },
    { id:'SET-003', driver:'DRV-QC-0002', provider:'TAXI',     start:'2026-09-01', end:'2026-09-07', gross:980.00,  earnings:980.00,  fee:0,    tax:r2(980*(TPS+TVQ)),     tip:85.00,  paid:r2(980-r2(980*(TPS+TVQ))+85),       status:'PAID',    at:iso(3)  },
    { id:'SET-004', driver:'DRV-QC-0001', provider:'DOORDASH', start:'2026-09-08', end:'2026-09-14', gross:320.00,  earnings:256.00,  fee:64.00, tax:r2(320*(TPS+TVQ)),     tip:42.00,  paid:r2(256-r2(320*(TPS+TVQ))+42),       status:'PENDING', at:iso(0)  },
  ]

  // ── Cas de réconciliation ──────────────────────────────────
  const cases = [
    { id:'CASE-001', driver:'DRV-QC-0001', provider:'UBER',     type:'TAX_VARIANCE',       expected:69.00,  actual:19.00,  difference:50.00,  status:'OPEN',     note:'TVQ non perçue par Uber — écart à régulariser', period:'2026-Q3', createdAt:iso(5)  },
    { id:'CASE-002', driver:'DRV-QC-0002', provider:'LYFT',     type:'MISSING_ACTIVITY',   expected:340.00, actual:0,      difference:340.00, status:'OPEN',     note:'Activités LYFT non reçues semaine du 8 sept',   period:'2026-Q3', createdAt:iso(3)  },
    { id:'CASE-003', driver:'DRV-QC-0001', provider:'DOORDASH', type:'TIP_DISCREPANCY',    expected:42.00,  actual:38.50,  difference:3.50,   status:'RESOLVED', note:'Pourboire ajusté après confirmation client',    period:'2026-Q3', createdAt:iso(8)  },
    { id:'CASE-004', driver:'DRV-QC-0003', provider:'TAXI',     type:'SETTLEMENT_DELAY',   expected:0,      actual:0,      difference:0,      status:'MONITORING','note':'Délai paiement >5j — surveillance activée',  period:'2026-Q3', createdAt:iso(2)  },
  ]

  // ── Alertes système ────────────────────────────────────────
  const alerts = [
    { id:'ALT-001', service:'FISCAL_ENGINE',   severity:'HIGH',   status:'ACTIVE',   title:'Variance TVQ Uber Q3',     message:'Écart TVQ détecté sur 12 transactions Uber — révision requise', triggered:12, threshold:5,  at:iso(1)  },
    { id:'ALT-002', service:'SYNC_MONITOR',    severity:'MEDIUM', status:'ACTIVE',   title:'Sync Lyft en retard',      message:'Aucune synchronisation Lyft depuis 48h — vérification requise', triggered:1,  threshold:24, at:iso(2)  },
    { id:'ALT-003', service:'COMPLIANCE',      severity:'LOW',    status:'RESOLVED', title:'Document expiré — drv-005',message:'Assurance automobile expirée pour Amira Tremblay',              triggered:1,  threshold:1,  at:iso(5)  },
    { id:'ALT-004', service:'PAYOUT_MONITOR',  severity:'LOW',    status:'ACTIVE',   title:'Retard règlement DoorDash',message:'Règlement SET-004 en attente depuis >48h',                      triggered:1,  threshold:48, at:iso(0)  },
  ]

  // ── Rapports ───────────────────────────────────────────────
  const reports = [
    { id:'RPT-001', type:'REVENUE_SUMMARY',   status:'READY',   format:'PDF', start:'2026-09-01', end:'2026-09-14', records:20, containsPii:true,  generatedAt:iso(0,2) },
    { id:'RPT-002', type:'TAX_QUARTERLY',     status:'READY',   format:'PDF', start:'2026-07-01', end:'2026-09-30', records:4,  containsPii:true,  generatedAt:iso(1)   },
    { id:'RPT-003', type:'RECONCILIATION',    status:'PENDING', format:'CSV', start:'2026-09-01', end:'2026-09-14', records:0,  containsPii:false, generatedAt:iso(0)   },
    { id:'RPT-004', type:'COMPLIANCE_AUDIT',  status:'READY',   format:'PDF', start:'2026-01-01', end:'2026-09-30', records:5,  containsPii:true,  generatedAt:iso(2)   },
  ]

  // ── Relevés chauffeurs ─────────────────────────────────────
  const statements = [
    { id:'STM-001', driver:'DRV-QC-0001', type:'WEEKLY',    status:'SENT',    start:'2026-09-08', end:'2026-09-14', reference:'WKL-2026-37-001', generatedAt:iso(3) },
    { id:'STM-002', driver:'DRV-QC-0002', type:'WEEKLY',    status:'SENT',    start:'2026-09-08', end:'2026-09-14', reference:'WKL-2026-37-002', generatedAt:iso(3) },
    { id:'STM-003', driver:'DRV-QC-0001', type:'QUARTERLY', status:'READY',   start:'2026-07-01', end:'2026-09-30', reference:'QTR-2026-Q3-001', generatedAt:iso(0) },
    { id:'STM-004', driver:'DRV-QC-0003', type:'WEEKLY',    status:'PENDING', start:'2026-09-08', end:'2026-09-14', reference:'WKL-2026-37-003', generatedAt:iso(0) },
  ]

  // ── Métriques globales ─────────────────────────────────────
  const totalGross = r2(activities.reduce((s,a) => s+a.gross, 0))
  const totalTips  = r2(activities.reduce((s,a) => s+a.tip,   0))
  const totalFees  = r2(activities.reduce((s,a) => s+a.fee,   0))
  const totalTax   = r2(activities.reduce((s,a) => s+a.tax,   0))
  const totalNet   = r2(totalGross + totalTips - totalFees)

  const payload = {
    scenario: {
      code:        'QC-PILOT-2026-Q3',
      label:       'Scénario pilote TAXIMETER.GOV — Q3 2026 — Données synthétiques',
      generatedAt: new Date().toISOString(),
    },
    metrics: {
      drivers:     drivers.length,
      online:      drivers.filter(d => d.presence === 'ONLINE').length,
      activities:  activities.length,
      gross:       totalGross,
      net:         totalNet,
      tax:         totalTax,
      tips:        totalTips,
      snapshots:   settlements.length,
      alerts:      alerts.filter(a => a.status === 'ACTIVE').length,
      openCases:   cases.filter(c => c.status === 'OPEN').length,
    },
    drivers,
    accounts,
    activities,
    transactions,
    taxRecords,
    tips,
    settlements,
    cases,
    alerts,
    reports,
    statements,
  }

  return NextResponse.json(payload)
}
