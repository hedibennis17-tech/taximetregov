// GET /api/revenue — Revenus enterprise agrégés (depuis Supabase)
// TAXIMETER.GOV · Enterprise Gov · Source unique : Supabase
import { NextRequest } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { 'apikey': KEY(), 'Authorization': `Bearer ${KEY()}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase ${path}: ${await res.text()}`)
  return res.json()
}

const r2 = (n: number) => Math.round(n * 100) / 100
const TPS_R = 0.05
const TVQ_R = 0.09975

export async function GET(req: NextRequest) {
  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? 'month'
    const now = new Date()
    let dateFrom: string
    if (period === 'year') {
      dateFrom = `${now.getFullYear()}-01-01`
    } else if (period === 'q3') {
      dateFrom = `${now.getFullYear()}-07-01`
    } else {
      dateFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    }

    const ledger = await sbGet(
      `revenue_ledger?select=driver_id,source_type,gross_amount,fee_amount,tip_amount,tax_amount,net_amount,activity_date,activity_type&activity_date=gte.${dateFrom}&order=activity_date.desc&limit=500`
    ) as Array<Record<string, string>>

    // Agrégats globaux
    const totals = ledger.reduce((acc, r) => ({
      gross: acc.gross + parseFloat(r['gross_amount'] ?? '0'),
      tips:  acc.tips  + parseFloat(r['tip_amount']   ?? '0'),
      fees:  acc.fees  + parseFloat(r['fee_amount']   ?? '0'),
      taxes: acc.taxes + parseFloat(r['tax_amount']   ?? '0'),
      net:   acc.net   + parseFloat(r['net_amount']    ?? '0'),
      count: acc.count + 1,
    }), { gross:0, tips:0, fees:0, taxes:0, net:0, count:0 })

    // TPS/TVQ calculées
    const tps = r2(totals.gross * TPS_R)
    const tvq = r2(totals.gross * TVQ_R)

    // Par source (TAXI / UBER / DOORDASH / etc.)
    const bySource = ledger.reduce((acc: Record<string, Record<string,number>>, r) => {
      const src = r['source_type'] ?? 'OTHER'
      if (!acc[src]) acc[src] = { gross:0, tips:0, fees:0, net:0, count:0 }
      acc[src]!.gross += parseFloat(r['gross_amount'] ?? '0')
      acc[src]!.tips  += parseFloat(r['tip_amount']   ?? '0')
      acc[src]!.net   += parseFloat(r['net_amount']    ?? '0')
      acc[src]!.count += 1
      return acc
    }, {})

    return Response.json({
      period,
      dateFrom,
      totals: { ...totals, tps, tvq },
      bySource,
      ledger: ledger.slice(0, 25),
      source: 'SUPABASE',
      pilot: true,
      note: 'DONNÉES SYNTHÉTIQUES · TAXIMETER.GOV PILOTE',
    })

  } catch (err) {
    // Fallback aligné sur 0031 (montants réels des activités DEMO)
    const gross = r2(28.75 + 42.00 + 22.50 + 24.25 + 55.00 + 31.50) // = 204.00
    return Response.json({
      period: 'month',
      totals: {
        gross, tips: r2(4+5+0+2.5+6+3), fees: r2(0+8.4+4.5+0+11+6.3),
        taxes: r2(4.3+6.29+3.37+3.63+8.24+4.72), net: r2(gross*0.725), count: 6,
        tps: r2(gross * TPS_R), tvq: r2(gross * TVQ_R),
      },
      bySource: {
        TAXI:    { gross: r2(28.75+24.25), tips: r2(4+2.5),   net: r2(45.00*0.725), count: 2 },
        UBER:    { gross: 42.00,           tips: 5.00,         net: r2(42*0.725),    count: 1 },
        DOORDASH:{ gross: 22.50,           tips: 0,            net: r2(22.5*0.725),  count: 1 },
        LYFT:    { gross: 55.00,           tips: 6.00,         net: r2(55*0.725),    count: 1 },
        INSTACART:{ gross: 31.50,          tips: 3.00,         net: r2(31.5*0.725),  count: 1 },
      },
      source: 'DEMO_FALLBACK', error: String(err), pilot: true,
      note: 'DONNÉES SYNTHÉTIQUES · TAXIMETER.GOV PILOTE',
    })
  }
}
