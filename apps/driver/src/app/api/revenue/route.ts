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

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'month'

  const now = new Date()
  let dateFrom: string
  if (period === 'week') {
    dateFrom = new Date(now.getTime() - 7*86400000).toISOString().split('T')[0]!
  } else if (period === 'year') {
    dateFrom = `${now.getFullYear()}-01-01`
  } else {
    dateFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  }

  try {
    const ledger = await sbGet(
      `revenue_ledger?driver_id=eq.${ctx.driverId}&activity_date=gte.${dateFrom}&select=gross_amount,net_amount,tip_amount,fee_amount,source_type,activity_date&order=activity_date.desc`
    ) as Array<Record<string, string>>

    const wallets = await sbGet(
      `wallet_accounts?driver_id=eq.${ctx.driverId}&select=id,currency&limit=1`
    ) as Array<Record<string, string>>

    const breakdown = Object.values(
      ledger.reduce((acc, r) => {
        const src = r['source_type'] ?? 'OTHER'
        if (!acc[src]) acc[src] = { source_type: src, gross: 0, tips: 0, net: 0, count: 0 }
        acc[src]!.gross += parseFloat(r['gross_amount'] ?? '0')
        acc[src]!.tips  += parseFloat(r['tip_amount']   ?? '0')
        acc[src]!.net   += parseFloat(r['net_amount']    ?? '0')
        acc[src]!.count += 1
        return acc
      }, {} as Record<string, { source_type:string; gross:number; tips:number; net:number; count:number }>)
    ).map(b => ({
      source_type: b.source_type,
      gross: b.gross.toFixed(2),
      tips:  b.tips.toFixed(2),
      net:   b.net.toFixed(2),
      count: b.count.toString(),
    }))

    const totalGross = ledger.reduce((s, r) => s + parseFloat(r['gross_amount'] ?? '0'), 0)
    const totalNet   = ledger.reduce((s, r) => s + parseFloat(r['net_amount']   ?? '0'), 0)
    const totalTips  = ledger.reduce((s, r) => s + parseFloat(r['tip_amount']   ?? '0'), 0)

    return apiSuccess({
      wallet: {
        balance:  totalNet.toFixed(2),
        currency: wallets[0]?.['currency'] ?? 'CAD',
        status:   'ACTIVE',
      },
      summary: {
        total_gross:      totalGross.toFixed(2),
        total_net:        totalNet.toFixed(2),
        total_tips:       totalTips.toFixed(2),
        total_activities: ledger.length.toString(),
        taxi_gross:       (breakdown.find(b => b.source_type === 'TAXI')?.gross ?? '0'),
        rideshare_gross:  (breakdown.find(b => ['UBER','LYFT'].includes(b.source_type))?.gross ?? '0'),
        delivery_gross:   (breakdown.find(b => ['DOORDASH','INSTACART','UBER_EATS','SKIP'].includes(b.source_type))?.gross ?? '0'),
      },
      breakdown,
      period,
      date_from: dateFrom,
    })
  } catch (err) {
    console.error('[revenue]', err)
    return apiError('Erreur serveur', 500)
  }
}
