// POST /api/admin/seed-fiscal — Seed fiscal 10 mois complet > 60 000$ — IDEMPOTENT
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

const SB_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY
             ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
             ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
             ?? ''

async function get(path: string) {
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` }
  })
  const t = await res.text()
  return t ? (JSON.parse(t) as unknown[]) : []
}
async function ins(path: string, body: unknown) {
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`,
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  })
  const t = await res.text()
  if (!res.ok && res.status !== 409) console.warn(`ins ${path}:`, t.slice(0, 200))
  return t ? (JSON.parse(t) as unknown[]) : []
}
async function upsert(path: string, body: unknown) {
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  })
  const t = await res.text()
  if (!res.ok) throw new Error(`upsert ${path}: ${t.slice(0, 300)}`)
  return t ? (JSON.parse(t) as unknown[]) : []
}

export async function POST(_req: NextRequest) {
  try {
    const steps: string[] = []
    const now = new Date()
    const r2 = (n: number) => Math.round(n * 100) / 100
    const d = (days: number) => new Date(now.getTime() + days * 86400000)
    const ds = (days: number) => d(days).toISOString().split('T')[0]!

    // ── 1. Trouver driver + tax account ───────────────────────
    const profiles = await get(`driver_profiles?select=id,first_name,last_name,driver_number&order=created_at.asc&limit=10`) as Array<{id:string;first_name:string;last_name:string;driver_number:string}>
    const profile  = profiles.find(p => p.first_name?.toLowerCase().includes('hedi')) ?? profiles[0]
    if (!profile) return apiError('Aucun driver_profile — lancez le seed principal', 404)
    const driverId = profile.id
    steps.push(`✅ Driver: ${profile.first_name} ${profile.last_name}`)

    const taxAccs = await get(`tax_accounts?driver_id=eq.${driverId}&select=id&limit=1`) as Array<{id:string}>
    if (!taxAccs[0]) return apiError('Aucun tax_account — lancez le seed principal', 404)
    const taxAccountId = taxAccs[0].id
    steps.push(`✅ Tax account: ${taxAccountId}`)

    // ── 2. Tax rule set ────────────────────────────────────────
    const rules = await get(`tax_rule_sets?code=eq.QC_TPS_TVQ&select=id&limit=1`) as Array<{id:string}>
    if (!rules[0]) return apiError('Règle fiscale QC_TPS_TVQ introuvable — lancez le seed principal', 404)
    const ruleSetId = rules[0].id
    const TPS = 0.05000
    const TVQ = 0.09975

    // ── 3. Revenus mensuels réalistes 10 mois ─────────────────
    // Taxi travaille ~5j/sem, ~9-10h/jour — Québec/Laval
    // Nov 2025 → Août 2026 (10 mois)
    const MONTHLY = [
      // { mois, taxi, uber, lyft, doordash, pourboires_taxi, frais_uber }
      { label:'Nov 2025', taxi:4820, uber:1240, lyft:580,  dd:0,    tip_t:420, fee_u:248, fee_l:116  },
      { label:'Déc 2025', taxi:5650, uber:1480, lyft:620,  dd:0,    tip_t:510, fee_u:296, fee_l:124  },
      { label:'Jan 2026', taxi:4380, uber:1150, lyft:490,  dd:0,    tip_t:380, fee_u:230, fee_l:98   },
      { label:'Fév 2026', taxi:4120, uber:1080, lyft:450,  dd:320,  tip_t:360, fee_u:216, fee_l:90   },
      { label:'Mar 2026', taxi:5230, uber:1380, lyft:560,  dd:450,  tip_t:460, fee_u:276, fee_l:112  },
      { label:'Avr 2026', taxi:5480, uber:1520, lyft:640,  dd:520,  tip_t:490, fee_u:304, fee_l:128  },
      { label:'Mai 2026', taxi:6120, uber:1680, lyft:720,  dd:580,  tip_t:545, fee_u:336, fee_l:144  },
      { label:'Juin 2026', taxi:6450, uber:1820, lyft:780, dd:640,  tip_t:580, fee_u:364, fee_l:156  },
      { label:'Juil 2026', taxi:6280, uber:1760, lyft:740, dd:720,  tip_t:560, fee_u:352, fee_l:148  },
      { label:'Août 2026', taxi:5920, uber:1640, lyft:680, dd:680,  tip_t:530, fee_u:328, fee_l:136  },
    ]

    // Calcul totaux
    const TOTAL_GROSS = MONTHLY.reduce((s,m) => s + m.taxi + m.uber + m.lyft + m.dd, 0)
    const TOTAL_TIPS  = MONTHLY.reduce((s,m) => s + m.tip_t, 0)
    const TOTAL_FEES  = MONTHLY.reduce((s,m) => s + m.fee_u + m.fee_l, 0)
    steps.push(`📊 Total brut: $${TOTAL_GROSS.toFixed(2)} sur 10 mois`)
    steps.push(`💝 Pourboires: $${TOTAL_TIPS.toFixed(2)} | 💸 Frais plateforme: $${TOTAL_FEES.toFixed(2)}`)

    // ── 4. Revenue ledger — 10 mois ──────────────────────────
    // Supprimer les anciennes entrées DEMO pour éviter doublons
    await fetch(`${SB_URL()}/rest/v1/revenue_ledger?driver_id=eq.${driverId}&notes=like.DEMO-FISCAL*`, {
      method: 'DELETE',
      headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` }
    })

    const MONTH_STARTS = [
      '2025-11-01','2025-12-01','2026-01-01','2026-02-01',
      '2026-03-01','2026-04-01','2026-05-01','2026-06-01',
      '2026-07-01','2026-08-01',
    ]

    let ledgerCount = 0
    for (let mi = 0; mi < MONTHLY.length; mi++) {
      const m    = MONTHLY[mi]!
      const base = new Date(MONTH_STARTS[mi]!)

      // ~20 courses taxi/mois réparties
      const taxiPerCourse = m.taxi / 22
      const tipPerCourse  = m.tip_t / 22
      for (let i = 0; i < 22; i++) {
        const actDate = new Date(base.getTime() + (i * 1.35) * 86400000)
        if (actDate > now) continue
        await ins('revenue_ledger', {
          driver_id: driverId, source_type: 'TAXI', activity_type: 'TAXI_TRIP',
          entry_type: 'CREDIT',
          gross_amount: r2(taxiPerCourse + (Math.random()-0.5)*8),
          fee_amount: 0,
          tip_amount: r2(tipPerCourse + (Math.random()-0.5)*2),
          adjustment_amount: 0,
          net_amount: r2(taxiPerCourse),
          currency: 'CAD', jurisdiction: 'QC',
          activity_date: actDate.toISOString().split('T')[0],
          is_settled: true,
          settled_at: actDate.toISOString(),
          source_reference: `DEMO-TAXI-${mi+1}-${i+1}`,
          notes: `DEMO-FISCAL · Course taxi pilote mois ${mi+1}`,
        })
        ledgerCount++
      }
      // Uber ~6 courses/mois
      for (let i = 0; i < 6; i++) {
        const actDate = new Date(base.getTime() + (i * 4.5) * 86400000)
        if (actDate > now) continue
        await ins('revenue_ledger', {
          driver_id: driverId, source_type: 'UBER', activity_type: 'RIDESHARE_TRIP',
          entry_type: 'CREDIT',
          gross_amount: r2(m.uber / 6),
          fee_amount: r2(m.fee_u / 6),
          tip_amount: 0,
          adjustment_amount: 0,
          net_amount: r2((m.uber - m.fee_u) / 6),
          currency: 'CAD', jurisdiction: 'QC',
          activity_date: actDate.toISOString().split('T')[0],
          is_settled: true, settled_at: actDate.toISOString(),
          source_reference: `DEMO-UBER-${mi+1}-${i+1}`,
          notes: `DEMO-FISCAL · Course Uber pilote mois ${mi+1}`,
        })
        ledgerCount++
      }
      // Lyft ~4/mois
      for (let i = 0; i < 4; i++) {
        const actDate = new Date(base.getTime() + (i * 6.5) * 86400000)
        if (actDate > now) continue
        await ins('revenue_ledger', {
          driver_id: driverId, source_type: 'LYFT', activity_type: 'RIDESHARE_TRIP',
          entry_type: 'CREDIT',
          gross_amount: r2(m.lyft / 4),
          fee_amount: r2(m.fee_l / 4),
          tip_amount: 0,
          adjustment_amount: 0,
          net_amount: r2((m.lyft - m.fee_l) / 4),
          currency: 'CAD', jurisdiction: 'QC',
          activity_date: actDate.toISOString().split('T')[0],
          is_settled: true, settled_at: actDate.toISOString(),
          source_reference: `DEMO-LYFT-${mi+1}-${i+1}`,
          notes: `DEMO-FISCAL · Course Lyft pilote mois ${mi+1}`,
        })
        ledgerCount++
      }
      // DoorDash (à partir de fév)
      if (m.dd > 0) {
        for (let i = 0; i < 5; i++) {
          const actDate = new Date(base.getTime() + (i * 5.5) * 86400000)
          if (actDate > now) continue
          await ins('revenue_ledger', {
            driver_id: driverId, source_type: 'DOORDASH', activity_type: 'FOOD_DELIVERY',
            entry_type: 'CREDIT',
            gross_amount: r2(m.dd / 5),
            fee_amount: r2((m.dd/5) * 0.20),
            tip_amount: r2((m.dd/5) * 0.10),
            adjustment_amount: 0,
            net_amount: r2((m.dd/5) * 0.80),
            currency: 'CAD', jurisdiction: 'QC',
            activity_date: actDate.toISOString().split('T')[0],
            is_settled: true, settled_at: actDate.toISOString(),
            source_reference: `DEMO-DD-${mi+1}-${i+1}`,
            notes: `DEMO-FISCAL · Livraison DoorDash pilote mois ${mi+1}`,
          })
          ledgerCount++
        }
      }
    }
    steps.push(`✅ ${ledgerCount} entrées revenue ledger créées`)

    // ── 5. Périodes fiscales trimestrielles ───────────────────
    // Q4-2025 (Oct-Déc), Q1-2026 (Jan-Mar), Q2-2026 (Avr-Juin), Q3-2026 (Juil-Sep)
    const PERIODS = [
      {
        start: '2025-10-01', end: '2025-12-31', due: '2026-01-31',
        status: 'FILED', taxi: 10470, rideshare: 3920, delivery: 0,
        label: 'Q4 2025',
      },
      {
        start: '2026-01-01', end: '2026-03-31', due: '2026-04-30',
        status: 'FILED', taxi: 13730, rideshare: 4130, delivery: 770,
        label: 'Q1 2026',
      },
      {
        start: '2026-04-01', end: '2026-06-30', due: '2026-07-31',
        status: 'FILED', taxi: 18050, rideshare: 5360, delivery: 1740,
        label: 'Q2 2026',
      },
      {
        start: '2026-07-01', end: '2026-09-30', due: '2026-10-31',
        status: 'OPEN',  taxi: 12200, rideshare: 3080, delivery: 1400,
        label: 'Q3 2026 (en cours)',
      },
    ]

    const createdPeriods: Array<{id:string;label:string;gross:number;status:string}> = []

    for (const p of PERIODS) {
      const gross = p.taxi + p.rideshare + p.delivery

      // Upsert tax_period
      const existing = await get(`tax_periods?tax_account_id=eq.${taxAccountId}&period_start=eq.${p.start}&select=id&limit=1`) as Array<{id:string}>
      let periodId: string

      if (existing[0]) {
        // Mettre à jour les revenus
        await fetch(`${SB_URL()}/rest/v1/tax_periods?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', apikey:SB_KEY(), Authorization:`Bearer ${SB_KEY()}` },
          body: JSON.stringify({
            period_status: p.status,
            gross_revenue_taxi: p.taxi.toFixed(2),
            gross_revenue_rideshare: p.rideshare.toFixed(2),
            gross_revenue_delivery: p.delivery.toFixed(2),
          })
        })
        periodId = existing[0].id
      } else {
        const res = await upsert('tax_periods', {
          tax_account_id: taxAccountId,
          period_start: p.start,
          period_end: p.end,
          filing_due_date: p.due,
          period_status: p.status,
          tps_status: p.status === 'FILED' ? 'FILED' : 'PENDING',
          tvq_status: p.status === 'FILED' ? 'FILED' : 'PENDING',
          gross_revenue_taxi: p.taxi.toFixed(2),
          gross_revenue_rideshare: p.rideshare.toFixed(2),
          gross_revenue_delivery: p.delivery.toFixed(2),
          gross_revenue_other: '0.00',
        }) as Array<{id:string}>
        periodId = res[0]?.id ?? ''
      }
      if (!periodId) { steps.push(`⚠ Période ${p.label} non créée`); continue }

      createdPeriods.push({ id: periodId, label: p.label, gross, status: p.status })

      // ── 6. Tax calculation pour chaque période ──────────────
      const calcExist = await get(`tax_calculations?tax_period_id=eq.${periodId}&select=id&limit=1`) as Array<{id:string}>

      const tpsCollected   = r2(gross * TPS)
      const tvqCollected   = r2(gross * TVQ)
      const feesForPeriod  = MONTHLY.slice().reduce((s,m) => s + m.fee_u + m.fee_l, 0) / 4
      const tpsCredits     = r2(feesForPeriod * TPS * 0.30)
      const tvqCredits     = r2(feesForPeriod * TVQ * 0.30)
      const tpsBalance     = r2(tpsCollected - tpsCredits)
      const tvqBalance     = r2(tvqCollected - tvqCredits)

      const calcPayload = {
        tax_period_id:       periodId,
        tax_rule_set_id:     ruleSetId,
        calculation_version: 1,
        gross_revenue_taxable: gross.toFixed(2),
        tps_collected:   tpsCollected.toFixed(2),
        tps_remitted:    p.status === 'FILED' ? tpsBalance.toFixed(2) : '0.00',
        tps_credits:     tpsCredits.toFixed(2),
        tps_adjustments: '0.00',
        tps_balance:     tpsBalance.toFixed(2),
        tvq_collected:   tvqCollected.toFixed(2),
        tvq_remitted:    p.status === 'FILED' ? tvqBalance.toFixed(2) : '0.00',
        tvq_credits:     tvqCredits.toFixed(2),
        tvq_adjustments: '0.00',
        tvq_balance:     tvqBalance.toFixed(2),
        is_estimate:     p.status !== 'FILED',
        input_snapshot:  JSON.stringify({ gross, tps_rate: TPS, tvq_rate: TVQ, source: 'DEMO-FISCAL-SEED' }),
        output_snapshot: JSON.stringify({ tpsCollected, tvqCollected, tpsCredits, tvqCredits, tpsBalance, tvqBalance }),
      }

      if (!calcExist[0]) {
        await ins('tax_calculations', calcPayload)
      } else {
        await fetch(`${SB_URL()}/rest/v1/tax_calculations?id=eq.${calcExist[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', apikey:SB_KEY(), Authorization:`Bearer ${SB_KEY()}` },
          body: JSON.stringify(calcPayload),
        })
      }

      // ── 7. Tax filings pour périodes FILED ──────────────────
      if (p.status === 'FILED') {
        const filingExist = await get(`tax_filings?tax_period_id=eq.${periodId}&select=id&limit=1`) as Array<{id:string}>
        if (!filingExist[0]) {
          const submittedDate = new Date(p.due).getTime() - 5 * 86400000
          const acceptedDate  = submittedDate + 2 * 86400000
          await ins('tax_filings', {
            tax_account_id:      taxAccountId,
            tax_period_id:       periodId,
            filing_type:         'REGULAR',
            filing_status:       'ACCEPTED',
            gateway_mode:        'SIMULATION',
            is_simulation:       true,
            prepared_at:         new Date(submittedDate - 86400000).toISOString(),
            submitted_at:        new Date(submittedDate).toISOString(),
            accepted_at:         new Date(acceptedDate).toISOString(),
            government_reference:`DEMO-RQ-${p.label.replace(' ','').replace(' ','')}-2026-PILOTE`,
          })
        }
      }
    }

    steps.push(`✅ ${createdPeriods.length} périodes fiscales (${createdPeriods.filter(p=>p.status==='FILED').length} déclarées, 1 en cours)`)

    // ── 8. Résumé ─────────────────────────────────────────────
    const totalDeclaré = createdPeriods.filter(p=>p.status==='FILED').reduce((s,p)=>s+p.gross,0)
    const totalEnCours = createdPeriods.filter(p=>p.status==='OPEN').reduce((s,p)=>s+p.gross,0)
    const tpsTotal     = r2(TOTAL_GROSS * TPS)
    const tvqTotal     = r2(TOTAL_GROSS * TVQ)

    return apiSuccess({
      driver:          `${profile.first_name} ${profile.last_name}`,
      resume: {
        total_gross_10mois:   `$${TOTAL_GROSS.toFixed(2)}`,
        total_pourboires:     `$${TOTAL_TIPS.toFixed(2)}`,
        total_frais_platform: `$${TOTAL_FEES.toFixed(2)}`,
        tps_estimee:          `$${tpsTotal.toFixed(2)}`,
        tvq_estimee:          `$${tvqTotal.toFixed(2)}`,
        periodes_declarees:   `$${totalDeclaré.toFixed(2)}`,
        periode_en_cours:     `$${totalEnCours.toFixed(2)}`,
      },
      ledger_entries: ledgerCount,
      periods: createdPeriods,
      steps,
      message: `✅ Dossier fiscal 10 mois — $${TOTAL_GROSS.toFixed(2)} brut — MODE PILOTE`,
    })

  } catch(e) {
    return apiError((e as Error).message, 500)
  }
}
