// GET /api/tax — Moteur fiscal TAXIMETER.GOV
// Calcul TPS/TVQ depuis Revenue Ledger
// ⚠️ Estimation uniquement — à valider avant transmission officielle

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

const TPS_RATE = 0.05
const TVQ_RATE = 0.09975

function r2(n: number) { return Math.round(n * 100) / 100 }

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'quarter' // month | quarter | year
  const year   = parseInt(searchParams.get('year')   ?? String(new Date().getFullYear()))
  const quarter = parseInt(searchParams.get('quarter') ?? String(Math.ceil((new Date().getMonth() + 1) / 3)))

  // Calcul des dates selon la période
  let dateFrom: string
  let dateTo:   string
  const now = new Date()

  if (period === 'month') {
    dateFrom = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    dateTo = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`
  } else if (period === 'quarter') {
    const qStart = (quarter - 1) * 3 + 1
    const qEnd   = qStart + 2
    dateFrom = `${year}-${String(qStart).padStart(2, '0')}-01`
    const lastDay = new Date(year, qEnd, 0).getDate()
    dateTo = `${year}-${String(qEnd).padStart(2, '0')}-${lastDay}`
  } else {
    dateFrom = `${year}-01-01`
    dateTo   = `${year}-12-31`
  }

  try {
    // 1. Revenue Ledger — toutes les activités imposables
    const res = await fetch(
      `${SB_URL}/rest/v1/revenue_ledger?driver_id=eq.${ctx.driverId}&activity_date=gte.${dateFrom}&activity_date=lte.${dateTo}&select=source_type,activity_type,gross_amount,fee_amount,tip_amount,net_amount,entry_type`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const ledger = await res.json() as Array<Record<string, string>>

    // 2. Tax account
    const taxRes = await fetch(
      `${SB_URL}/rest/v1/tax_accounts?driver_id=eq.${ctx.driverId}&select=tps_status,tvq_status,filing_frequency,tax_account_status,tps_registration_masked,tvq_registration_masked&limit=1`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const taxAccounts = await taxRes.json() as Array<Record<string, string>>
    const taxAccount = taxAccounts[0] ?? null

    // 3. Calcul fiscal par source
    const bySource: Record<string, { gross: number; tips: number; fees: number; net: number; count: number }> = {}
    let totalGross = 0
    let totalTips  = 0
    let totalFees  = 0

    for (const entry of ledger) {
      const src   = entry['source_type'] ?? 'OTHER'
      const gross = parseFloat(entry['gross_amount'] ?? '0')
      const tips  = parseFloat(entry['tip_amount']   ?? '0')
      const fees  = parseFloat(entry['fee_amount']   ?? '0')

      if (!bySource[src]) bySource[src] = { gross: 0, tips: 0, fees: 0, net: 0, count: 0 }
      bySource[src]!.gross += gross
      bySource[src]!.tips  += tips
      bySource[src]!.fees  += fees
      bySource[src]!.net   += parseFloat(entry['net_amount'] ?? '0')
      bySource[src]!.count += 1
      totalGross += gross
      totalTips  += tips
      totalFees  += fees
    }

    // 4. Moteur fiscal
    // Revenus taxables = bruts (taxi + rideshare + livraison)
    const revenusTaxi       = bySource['TAXI']?.gross     ?? 0
    const revenusRideshare  = (bySource['UBER']?.gross ?? 0) + (bySource['LYFT']?.gross ?? 0)
    const revenusLivraison  = (bySource['DOORDASH']?.gross ?? 0) + (bySource['INSTACART']?.gross ?? 0)
                            + (bySource['UBER_EATS']?.gross ?? 0) + (bySource['SKIP']?.gross ?? 0)
    const revenusAutres     = totalGross - revenusTaxi - revenusRideshare - revenusLivraison

    // TPS/TVQ sur revenus bruts
    const revenusBruts      = totalGross
    const tpsPercue         = r2(revenusBruts * TPS_RATE)
    const tvqPercue         = r2(revenusBruts * TVQ_RATE)

    // CTI estimé (Crédits de taxe sur intrants) — 30% des frais platform
    const ctiEstime         = r2(totalFees * TPS_RATE * 0.30)
    const remboursTVQ       = r2(totalFees * TVQ_RATE * 0.30)

    // Solde estimé à remettre
    const soldeTPSEstime    = r2(tpsPercue - ctiEstime)
    const soldeTVQEstime    = r2(tvqPercue - remboursTVQ)
    const soldeTotal        = r2(soldeTPSEstime + soldeTVQEstime)

    // 5. Prochaine échéance
    const echeances = {
      quarterly: {
        Q1: `${year}-04-30`,
        Q2: `${year}-07-31`,
        Q3: `${year}-10-31`,
        Q4: `${year + 1}-01-31`,
      }
    }
    const prochaineEcheance = echeances.quarterly[`Q${quarter}` as keyof typeof echeances.quarterly]

    // 6. Déclarations précédentes (simulées — connexion Revenu Québec future)
    const declarations = [
      { period: `Q${quarter - 1 || 4}-${quarter === 1 ? year - 1 : year}`, status: 'SUBMITTED', montant: r2(soldeTotal * 0.92), date_soumission: new Date(Date.now() - 90*86400000).toISOString().split('T')[0] },
    ].filter(d => !d.period.startsWith('Q0'))

    return apiSuccess({
      period:       { type: period, year, quarter, dateFrom, dateTo },
      taxAccount,
      revenus: {
        taxi:        r2(revenusTaxi),
        rideshare:   r2(revenusRideshare),
        livraison:   r2(revenusLivraison),
        autres:      r2(revenusAutres),
        bruts:       r2(revenusBruts),
        tips:        r2(totalTips),
        frais:       r2(totalFees),
      },
      fiscal: {
        tps_percue:       tpsPercue,
        tvq_percue:       tvqPercue,
        cti_estime:       ctiEstime,
        remboursement_tvq: remboursTVQ,
        solde_tps:        soldeTPSEstime,
        solde_tvq:        soldeTVQEstime,
        solde_total:      soldeTotal,
        taux_tps:         `${TPS_RATE * 100}%`,
        taux_tvq:         `${TVQ_RATE * 100}%`,
      },
      by_source: Object.entries(bySource).map(([src, v]) => ({
        source: src,
        gross:  r2(v.gross),
        tips:   r2(v.tips),
        fees:   r2(v.fees),
        net:    r2(v.net),
        count:  v.count,
      })),
      echeances: {
        prochaine: prochaineEcheance,
        statut:    new Date() < new Date(prochaineEcheance ?? '') ? 'A_VENIR' : 'ECHEANCE_DEPASSEE',
      },
      declarations,
      mode:          'ESTIMATION',
      avertissement: 'Estimation fiscale TAXIMETER.GOV — à valider avant transmission officielle à Revenu Québec.',
      revenu_quebec: {
        url:   'https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/',
        note:  'MODE 1 — Redirection officielle. TAXIMETER.GOV ne demande jamais le mot de passe Revenu Québec.',
        sev:   'Depuis le 1er janvier 2026, les exploitants de taxi doivent utiliser un SEV certifié de 2e génération.',
      },
    })
  } catch (err) {
    console.error('[tax]', err)
    return apiError('Erreur moteur fiscal: ' + String(err), 500)
  }
}
