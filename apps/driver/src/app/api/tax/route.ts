// GET /api/tax — Moteur fiscal — lit tax_calculations, tax_filings, tax_periods réels
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } })
  return res.json() as Promise<unknown[]>
}

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  try {
    // 1. Tax account
    const taxAccs = await sbGet(`tax_accounts?driver_id=eq.${ctx.driverId}&select=id,tps_status,tvq_status,filing_frequency,tax_account_status,tps_registration_masked,tvq_registration_masked&limit=1`) as Array<Record<string,string>>
    const taxAccount = taxAccs[0] ?? null

    if (!taxAccount) {
      return apiSuccess({ hasAccount: false, message: 'Aucun compte fiscal configuré' })
    }

    // 2. Périodes fiscales (toutes)
    const periods = await sbGet(`tax_periods?tax_account_id=eq.${taxAccount['id']}&order=period_start.desc&select=id,period_start,period_end,filing_due_date,period_status,tps_status,tvq_status,gross_revenue_taxi,gross_revenue_rideshare,gross_revenue_delivery,gross_revenue_other`) as Array<Record<string,string>>

    // 3. Calculs pour la période courante
    const currentPeriod = periods.find(p => p['period_status'] === 'OPEN') ?? periods[0]
    let currentCalc: Record<string,string|boolean|number> | null = null
    let currentFiling: Record<string,string> | null = null

    if (currentPeriod) {
      const calcs = await sbGet(`tax_calculations?tax_period_id=eq.${currentPeriod['id']}&order=calculation_version.desc&select=*&limit=1`) as Array<Record<string,string|boolean|number>>
      currentCalc = calcs[0] ?? null

      const filings = await sbGet(`tax_filings?tax_period_id=eq.${currentPeriod['id']}&order=created_at.desc&select=id,filing_status,filing_type,gateway_mode,is_simulation,prepared_at,submitted_at,accepted_at,government_reference,rejection_reason&limit=1`) as Array<Record<string,string>>
      currentFiling = filings[0] ?? null
    }

    // 4. Revenue ledger pour compléter si pas de calcul
    let ledgerRevenue = { taxi: 0, rideshare: 0, livraison: 0, total: 0, tips: 0, fees: 0 }
    if (!currentCalc && currentPeriod) {
      const dateFrom = currentPeriod['period_start']
      const dateTo   = currentPeriod['period_end']
      const ledger = await sbGet(`revenue_ledger?driver_id=eq.${ctx.driverId}&activity_date=gte.${dateFrom}&activity_date=lte.${dateTo}&select=source_type,gross_amount,tip_amount,fee_amount`) as Array<Record<string,string>>
      for (const r of ledger) {
        const g = parseFloat(r['gross_amount'] ?? '0')
        const src = r['source_type'] ?? ''
        if (src === 'TAXI')  ledgerRevenue.taxi += g
        else if (['UBER','LYFT'].includes(src)) ledgerRevenue.rideshare += g
        else if (['DOORDASH','INSTACART','UBER_EATS','SKIP'].includes(src)) ledgerRevenue.livraison += g
        ledgerRevenue.total += g
        ledgerRevenue.tips  += parseFloat(r['tip_amount'] ?? '0')
        ledgerRevenue.fees  += parseFloat(r['fee_amount'] ?? '0')
      }
    }

    // 5. Règles fiscales actives
    const rules = await sbGet(`tax_rule_sets?code=eq.QC-TPS-TVQ-2024&select=tps_rate,tvq_rate,label,version&limit=1`) as Array<Record<string,string>>
    const rule = rules[0] ?? { tps_rate: '0.05000', tvq_rate: '0.09975', label: 'Taux QC 2024', version: '2024.1' }

    // 6. Toutes les déclarations
    const allFilings = await sbGet(`tax_filings?tax_account_id=eq.${taxAccount['id']}&order=created_at.desc&select=id,filing_status,filing_type,prepared_at,submitted_at,accepted_at,government_reference,tax_period_id`) as Array<Record<string,string>>

    // 7. Calcul estimation si pas de calcul en DB
    const r2 = (n: number) => Math.round(n * 100) / 100
    const tpsRate = parseFloat(rule['tps_rate'] ?? '0.05')
    const tvqRate = parseFloat(rule['tvq_rate'] ?? '0.09975')

    const gross = currentCalc ? parseFloat(String(currentCalc['gross_revenue_taxable'] ?? 0)) : ledgerRevenue.total
    const tpsCollected = currentCalc ? parseFloat(String(currentCalc['tps_collected'] ?? 0)) : r2(gross * tpsRate)
    const tvqCollected = currentCalc ? parseFloat(String(currentCalc['tvq_collected'] ?? 0)) : r2(gross * tvqRate)
    const tpsCredits   = currentCalc ? parseFloat(String(currentCalc['tps_credits'] ?? 0)) : r2(ledgerRevenue.fees * tpsRate * 0.30)
    const tvqCredits   = currentCalc ? parseFloat(String(currentCalc['tvq_credits'] ?? 0)) : r2(ledgerRevenue.fees * tvqRate * 0.30)
    const tpsBalance   = currentCalc ? parseFloat(String(currentCalc['tps_balance'] ?? 0)) : r2(tpsCollected - tpsCredits)
    const tvqBalance   = currentCalc ? parseFloat(String(currentCalc['tvq_balance'] ?? 0)) : r2(tvqCollected - tvqCredits)
    const isEstimate   = currentCalc ? Boolean(currentCalc['is_estimate']) : true

    return apiSuccess({
      hasAccount: true,
      taxAccount,
      currentPeriod: currentPeriod ?? null,
      allPeriods: periods,
      fiscal: {
        gross_revenue_taxable: r2(gross),
        tps_collected: tpsCollected,
        tps_credits: tpsCredits,
        tps_balance: tpsBalance,
        tvq_collected: tvqCollected,
        tvq_credits: tvqCredits,
        tvq_balance: tvqBalance,
        solde_total: r2(tpsBalance + tvqBalance),
        is_estimate: isEstimate,
        calculation_status: currentCalc?.['calculation_status'] ?? 'ESTIMATE',
        tps_rate: `${(tpsRate * 100).toFixed(0)}%`,
        tvq_rate: `${(tvqRate * 100).toFixed(3)}%`,
      },
      currentFiling,
      allFilings,
      ruleSet: rule,
      avertissement: 'Estimation fiscale TAXIMETER.GOV — à valider avant transmission officielle à Revenu Québec.',
      mode_pilote: true,
      revenu_quebec_url: 'https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/',
    })
  } catch (err) {
    console.error('[tax]', err)
    return apiError('Erreur moteur fiscal: ' + String(err), 500)
  }
}
