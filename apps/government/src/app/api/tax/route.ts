// GET /api/tax — Centre fiscal gouvernemental — lit tax_calculations, tax_filings, tax_periods
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  return res.json() as Promise<unknown[]>
}

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  try {
    // 1. Tous les chauffeurs avec comptes fiscaux
    const taxAccounts = await sbGet(
      `tax_accounts?select=id,driver_id,tps_status,tvq_status,filing_frequency,tax_account_status&order=created_at.desc`
    ) as Array<Record<string,string>>

    // 2. Toutes les périodes fiscales
    const allPeriods = await sbGet(
      `tax_periods?select=id,tax_account_id,period_start,period_end,filing_due_date,period_status,gross_revenue_taxi,gross_revenue_rideshare,gross_revenue_delivery,gross_revenue_other&order=period_start.desc&limit=50`
    ) as Array<Record<string,string>>

    // 3. Toutes les déclarations
    const allFilings = await sbGet(
      `tax_filings?select=id,tax_account_id,tax_period_id,filing_status,filing_type,gateway_mode,is_simulation,submitted_at,accepted_at,government_reference&order=created_at.desc&limit=50`
    ) as Array<Record<string,string|boolean>>

    // 4. Tous les calculs
    const allCalcs = await sbGet(
      `tax_calculations?select=id,tax_period_id,tps_collected,tps_balance,tvq_collected,tvq_balance,gross_revenue_taxable,is_estimate,calculation_status&order=created_at.desc&limit=50`
    ) as Array<Record<string,string|boolean|number>>

    // 5. Revenue ledger global
    const ledger = await sbGet(
      `revenue_ledger?select=driver_id,source_type,gross_amount,net_amount&order=activity_date.desc&limit=200`
    ) as Array<Record<string,string>>

    // 6. Calculs agrégés
    const totalGross     = ledger.reduce((s, r) => s + parseFloat(r['gross_amount'] ?? '0'), 0)
    const totalTPS       = allCalcs.reduce((s, r) => s + parseFloat(String(r['tps_collected'] ?? 0)), 0)
    const totalTVQ       = allCalcs.reduce((s, r) => s + parseFloat(String(r['tvq_collected'] ?? 0)), 0)
    const totalSolde     = allCalcs.reduce((s, r) => s + parseFloat(String(r['tps_balance'] ?? 0)) + parseFloat(String(r['tvq_balance'] ?? 0)), 0)

    const filingsAccepted = allFilings.filter(f => f['filing_status'] === 'ACCEPTED').length
    const filingsDraft    = allFilings.filter(f => f['filing_status'] === 'DRAFT').length
    const periodsOpen     = allPeriods.filter(p => p['period_status'] === 'OPEN').length

    // 7. Comptes par statut
    const statusCounts = taxAccounts.reduce((acc, a) => {
      const s = a['tax_account_status'] ?? 'UNKNOWN'
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    }, {} as Record<string,number>)

    // 8. Chauffeurs avec dossiers fiscaux
    const driversWithAccounts = [...new Set(taxAccounts.map(a => a['driver_id']))].length

    return apiSuccess({
      summary: {
        drivers_with_tax_account: driversWithAccounts,
        total_gross_revenue:      Math.round(totalGross * 100) / 100,
        total_tps_collected:      Math.round(totalTPS * 100) / 100,
        total_tvq_collected:      Math.round(totalTVQ * 100) / 100,
        total_tax_solde:          Math.round(totalSolde * 100) / 100,
        filings_accepted:         filingsAccepted,
        filings_draft:            filingsDraft,
        periods_open:             periodsOpen,
        account_status_counts:    statusCounts,
      },
      taxAccounts,
      allPeriods,
      allFilings,
      allCalcs,
      mode_pilote: true,
    })
  } catch (err) {
    console.error('[gov/tax]', err)
    return apiError('Erreur centre fiscal: ' + String(err), 500)
  }
}
