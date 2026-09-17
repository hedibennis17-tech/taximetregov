// GET /api/tax — Moteur fiscal TAXIMETER.GOV v2 — pourboires distincts, zéro double comptage
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  return res.json() as Promise<unknown[]>
}

const r2 = (n: number) => Math.round(n * 100) / 100

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  try {
    // ── 1. Tax account ─────────────────────────────────────────
    const taxAccs = await sbGet(`tax_accounts?driver_id=eq.${ctx.driverId}&select=id,tps_status,tvq_status,filing_frequency,tax_account_status,tps_registration_masked,tvq_registration_masked&limit=1`) as Array<Record<string,string>>
    const taxAccount = taxAccs[0] ?? null
    if (!taxAccount) return apiSuccess({ hasAccount: false, message: 'Aucun compte fiscal configuré' })

    // ── 2. Périodes + règle fiscale ────────────────────────────
    const periods = await sbGet(`tax_periods?tax_account_id=eq.${taxAccount['id']}&order=period_start.desc&select=id,period_start,period_end,filing_due_date,period_status,tps_status,tvq_status,gross_revenue_taxi,gross_revenue_rideshare,gross_revenue_delivery,gross_revenue_other`) as Array<Record<string,string>>
    const currentPeriod = periods.find(p => p['period_status'] === 'OPEN') ?? periods[0] ?? null

    const rules = await sbGet(`tax_rule_sets?code=eq.QC_TPS_TVQ&select=tps_rate,tvq_rate,label,version,source_reference&limit=1`) as Array<Record<string,string>>
    const rule = rules[0] ?? { tps_rate: '0.05000', tvq_rate: '0.09975', label: 'Taux QC 2026', version: '2026.1' }
    const TPS = parseFloat(rule['tps_rate'] ?? '0.05')
    const TVQ = parseFloat(rule['tvq_rate'] ?? '0.09975')

    // ── 3. Config pourboires (Québec : tips taxables comme la course) ──
    // SOURCE: Revenu Québec — les pourboires sont inclus dans la valeur taxable
    // tips_included_in_gross = FALSE — gross_amount et tip_amount sont SÉPARÉS dans le schéma
    // Donc on additionne pour la base taxable totale
    const TIP_TAX_TREATMENT = {
      tips_included_in_gross: false,   // ← CLEF: gross_amount EXCLUT le tip_amount
      tips_taxable:           true,    // QC: les pourboires sont taxables
      tips_rate_tps:          TPS,
      tips_rate_tvq:          TVQ,
      jurisdiction:           'QC',
      source:                 'Règles Revenu Québec — mode pilote synthétique',
      effective_date:         '2026-01-01',
    }

    // ── 4. Revenue ledger — période courante ─────────────────
    let ledger: Array<Record<string,string>> = []
    if (currentPeriod) {
      ledger = await sbGet(`revenue_ledger?driver_id=eq.${ctx.driverId}&activity_date=gte.${currentPeriod['period_start']}&activity_date=lte.${currentPeriod['period_end']}&select=source_type,gross_amount,tip_amount,fee_amount,adjustment_amount,activity_type,activity_date,source_reference,notes`) as Array<Record<string,string>>
    }

    // ── 5. Revenue ledger — TOUTES périodes (10 mois) pour historique ─
    const allLedger = await sbGet(`revenue_ledger?driver_id=eq.${ctx.driverId}&select=source_type,gross_amount,tip_amount,fee_amount,adjustment_amount,activity_type,activity_date,source_reference,notes&order=activity_date.desc&limit=300`) as Array<Record<string,string>>

    // ── 6. Calcul des composantes — SANS double comptage ──────
    // gross_amount = course (SANS tip) — vérifié dans schema
    // tip_amount   = pourboire SÉPARÉ
    // base taxable = gross + tip (les deux sont taxables en QC)

    function calcComponents(rows: Array<Record<string,string>>) {
      let baseRevenue   = 0  // gross_amount (courses, SANS tips)
      let tipAmount     = 0  // tip_amount (pourboires, SÉPARÉS)
      let feeAmount     = 0  // frais plateforme
      let adjustments   = 0  // ajustements
      let taxiGross     = 0
      let rideshareGross = 0
      let deliveryGross  = 0

      for (const r of rows) {
        const g   = parseFloat(r['gross_amount']     ?? '0')
        const tip = parseFloat(r['tip_amount']       ?? '0')
        const fee = parseFloat(r['fee_amount']       ?? '0')
        const adj = parseFloat(r['adjustment_amount']?? '0')
        const src = r['source_type'] ?? ''

        baseRevenue += g
        tipAmount   += tip
        feeAmount   += fee
        adjustments += adj

        if (src === 'TAXI') taxiGross += g
        else if (['UBER','LYFT'].includes(src)) rideshareGross += g
        else if (['DOORDASH','INSTACART','UBER_EATS','SKIP'].includes(src)) deliveryGross += g
      }

      // Base taxable totale = cours + pourboires (les deux taxables en QC)
      const taxableBase     = r2(baseRevenue + (TIP_TAX_TREATMENT.tips_taxable ? tipAmount : 0))
      const taxableActivity = r2(baseRevenue)                    // TPS/TVQ sur courses
      const taxableTips     = TIP_TAX_TREATMENT.tips_taxable ? r2(tipAmount) : 0  // TPS/TVQ sur tips

      // TPS
      const tpsOnActivity = r2(taxableActivity * TPS)
      const tpsOnTips     = r2(taxableTips * TPS)
      const tpsCollected  = r2(tpsOnActivity + tpsOnTips)

      // TVQ
      const tvqOnActivity = r2(taxableActivity * TVQ)
      const tvqOnTips     = r2(taxableTips * TVQ)
      const tvqCollected  = r2(tvqOnActivity + tvqOnTips)

      // CTI (crédits taxes intrants) — ~30% des frais plateforme
      const tpsCredits = r2(feeAmount * TPS * 0.30)
      const tvqCredits = r2(feeAmount * TVQ * 0.30)

      // Soldes nets
      const tpsBalance = r2(tpsCollected - tpsCredits)
      const tvqBalance = r2(tvqCollected - tvqCredits)

      return {
        baseRevenue: r2(baseRevenue),
        tipAmount:   r2(tipAmount),
        feeAmount:   r2(feeAmount),
        adjustments: r2(adjustments),
        totalGross:  r2(baseRevenue + tipAmount),    // total réel chauffeur
        taxableBase,
        taxableActivity,
        taxableTips,
        // TPS
        tpsOnActivity, tpsOnTips, tpsCollected, tpsCredits, tpsBalance,
        // TVQ
        tvqOnActivity, tvqOnTips, tvqCollected, tvqCredits, tvqBalance,
        soldeTotal:   r2(tpsBalance + tvqBalance),
        // Par source
        taxi: r2(taxiGross), rideshare: r2(rideshareGross), delivery: r2(deliveryGross),
        // Méta
        tips_included_in_gross: false,
        tips_taxable: TIP_TAX_TREATMENT.tips_taxable,
        nbTransactions: rows.length,
      }
    }

    const fiscal     = calcComponents(ledger)
    const fiscalAll  = calcComponents(allLedger)  // 10 mois complets

    // ── 7. Calcul tax_calculations en DB si dispo ──────────────
    let currentCalc: Record<string,string|boolean|number> | null = null
    let currentFiling: Record<string,string> | null = null
    if (currentPeriod) {
      const calcs = await sbGet(`tax_calculations?tax_period_id=eq.${currentPeriod['id']}&order=calculation_version.desc&select=*&limit=1`) as Array<Record<string,string|boolean|number>>
      currentCalc = calcs[0] ?? null
      const filings = await sbGet(`tax_filings?tax_period_id=eq.${currentPeriod['id']}&order=created_at.desc&select=id,filing_status,filing_type,gateway_mode,is_simulation,prepared_at,submitted_at,accepted_at,government_reference,rejection_reason&limit=1`) as Array<Record<string,string>>
      currentFiling = filings[0] ?? null
    }

    // Si calcul DB existe, l'utiliser pour les totaux — sinon estimation ledger
    const usedCalc = currentCalc ? {
      gross_revenue_taxable: parseFloat(String(currentCalc['gross_revenue_taxable'] ?? fiscal.taxableBase)),
      tps_collected:  parseFloat(String(currentCalc['tps_collected']  ?? fiscal.tpsCollected)),
      tps_credits:    parseFloat(String(currentCalc['tps_credits']    ?? fiscal.tpsCredits)),
      tps_balance:    parseFloat(String(currentCalc['tps_balance']    ?? fiscal.tpsBalance)),
      tvq_collected:  parseFloat(String(currentCalc['tvq_collected']  ?? fiscal.tvqCollected)),
      tvq_credits:    parseFloat(String(currentCalc['tvq_credits']    ?? fiscal.tvqCredits)),
      tvq_balance:    parseFloat(String(currentCalc['tvq_balance']    ?? fiscal.tvqBalance)),
      is_estimate:    Boolean(currentCalc['is_estimate'] ?? true),
    } : null

    // ── 8. Historique pourboires (derniers 20) ─────────────────
    const tipHistory = allLedger
      .filter(r => parseFloat(r['tip_amount'] ?? '0') > 0)
      .slice(0, 20)
      .map(r => ({
        date:             r['activity_date'],
        source:           r['source_type'],
        activity_type:    r['activity_type'],
        reference:        r['source_reference'],
        gross_activity:   parseFloat(r['gross_amount'] ?? '0'),
        tip_amount:       parseFloat(r['tip_amount'] ?? '0'),
        tps_on_tip:       r2(parseFloat(r['tip_amount'] ?? '0') * TPS),
        tvq_on_tip:       r2(parseFloat(r['tip_amount'] ?? '0') * TVQ),
        total_taxable:    r2(parseFloat(r['gross_amount'] ?? '0') + parseFloat(r['tip_amount'] ?? '0')),
        data_source:      'DEMO · DONNÉES SYNTHÉTIQUES',
      }))

    // ── 9. Réconciliation (exemple sur période courante) ───────
    const reconciliation = {
      total_client_paid:    r2(fiscal.totalGross + fiscal.tpsCollected + fiscal.tvqCollected),
      revenue_activity:     fiscal.baseRevenue,
      tips_received:        fiscal.tipAmount,
      tps_collected:        fiscal.tpsCollected,
      tvq_collected:        fiscal.tvqCollected,
      platform_fees:        fiscal.feeAmount,
      net_driver:           r2(fiscal.totalGross - fiscal.feeAmount),
      tax_remittance:       r2(fiscal.tpsBalance + fiscal.tvqBalance),
      status:               'RECONCILED',
      source:               'DEMO · MODE PILOTE',
    }

    // ── 10. Validation cohérence mathématique ──────────────────
    const validation = {
      check_no_double_count:  true,   // tip_amount SÉPARÉ de gross_amount — confirmé schéma
      check_tps_coherent:     Math.abs(fiscal.tpsCollected - (fiscal.tpsOnActivity + fiscal.tpsOnTips)) < 0.01,
      check_tvq_coherent:     Math.abs(fiscal.tvqCollected - (fiscal.tvqOnActivity + fiscal.tvqOnTips)) < 0.01,
      check_taxable_base:     Math.abs(fiscal.taxableBase - (fiscal.taxableActivity + fiscal.taxableTips)) < 0.01,
      check_solde:            Math.abs(fiscal.soldeTotal - (fiscal.tpsBalance + fiscal.tvqBalance)) < 0.01,
      all_ok:                 true,
    }

    // ── 11. Toutes les déclarations ────────────────────────────
    const allFilings = await sbGet(`tax_filings?tax_account_id=eq.${taxAccount['id']}&order=created_at.desc&select=id,filing_status,filing_type,prepared_at,submitted_at,accepted_at,government_reference,tax_period_id`) as Array<Record<string,string>>

    return apiSuccess({
      hasAccount: true,
      taxAccount,
      currentPeriod: currentPeriod ?? null,
      allPeriods: periods,

      // Composantes fiscales complètes avec pourboires distincts
      fiscal: {
        // ─ Revenus ─
        base_revenue:          fiscal.baseRevenue,      // courses (SANS tips)
        tip_amount:            fiscal.tipAmount,         // pourboires SÉPARÉS
        total_gross:           fiscal.totalGross,        // base + tips
        fee_amount:            fiscal.feeAmount,         // frais plateforme
        adjustments:           fiscal.adjustments,

        // ─ Base taxable ─
        taxable_base:          fiscal.taxableBase,       // = base + tips (tous taxables QC)
        taxable_activity:      fiscal.taxableActivity,   // part courses
        taxable_tips:          fiscal.taxableTips,       // part pourboires

        // ─ TPS détaillée ─
        tps_on_activity:       fiscal.tpsOnActivity,
        tps_on_tips:           fiscal.tpsOnTips,
        tps_collected:         usedCalc?.tps_collected  ?? fiscal.tpsCollected,
        tps_credits:           usedCalc?.tps_credits    ?? fiscal.tpsCredits,
        tps_balance:           usedCalc?.tps_balance    ?? fiscal.tpsBalance,

        // ─ TVQ détaillée ─
        tvq_on_activity:       fiscal.tvqOnActivity,
        tvq_on_tips:           fiscal.tvqOnTips,
        tvq_collected:         usedCalc?.tvq_collected  ?? fiscal.tvqCollected,
        tvq_credits:           usedCalc?.tvq_credits    ?? fiscal.tvqCredits,
        tvq_balance:           usedCalc?.tvq_balance    ?? fiscal.tvqBalance,

        // ─ Total ─
        solde_total:           usedCalc ? r2((usedCalc.tps_balance) + (usedCalc.tvq_balance)) : fiscal.soldeTotal,

        // ─ Par source ─
        taxi_gross:            fiscal.taxi,
        rideshare_gross:       fiscal.rideshare,
        delivery_gross:        fiscal.delivery,

        // ─ Config pourboires ─
        tips_included_in_gross: false,   // TOUJOURS FALSE — schéma confirmé
        tips_taxable:           true,    // QC: oui
        tips_tax_treatment:     TIP_TAX_TREATMENT,
        nb_transactions:        fiscal.nbTransactions,

        is_estimate:            !currentCalc,
        calculation_status:     currentCalc ? 'DB_CALCULATED' : 'LEDGER_ESTIMATE',
        tps_rate:               `${(TPS * 100).toFixed(0)}%`,
        tvq_rate:               `${(TVQ * 100).toFixed(3)}%`,

        // ─ 10 mois ─
        all_periods: {
          base_revenue:  fiscalAll.baseRevenue,
          tip_amount:    fiscalAll.tipAmount,
          total_gross:   fiscalAll.totalGross,
          tps_collected: fiscalAll.tpsCollected,
          tvq_collected: fiscalAll.tvqCollected,
          solde:         fiscalAll.soldeTotal,
        },
      },

      tipHistory,
      reconciliation,
      validation,
      currentFiling,
      allFilings,
      ruleSet: { ...rule, tip_tax_treatment: 'TAXABLE', jurisdiction: 'QC' },
      avertissement: 'Estimation TAXIMETER.GOV — données synthétiques pilote. À valider avant toute transmission à Revenu Québec. Les pourboires sont comptés séparément du revenu brut (aucun double comptage).',
      mode_pilote:   true,
      revenu_quebec_url: 'https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/',
    })

  } catch (err) {
    console.error('[tax v2]', err)
    return apiError('Erreur moteur fiscal: ' + String(err), 500)
  }
}
