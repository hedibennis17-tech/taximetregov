// GET /api/revenue — Revenus et wallet du chauffeur
import { NextRequest } from 'next/server'
import { db, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'month' // 'week' | 'month' | 'year'

  const intervalMap: Record<string, string> = {
    week:  '7 days',
    month: '30 days',
    year:  '365 days',
  }
  const interval = intervalMap[period] ?? '30 days'

  try {
    // Wallet balance (computed from entries)
    const wallet = await db.execute(sql`
      SELECT
        COALESCE(SUM(
          CASE WHEN we.direction = 'CREDIT' THEN we.amount
               ELSE -we.amount END
        ), 0) as balance,
        wa.currency
      FROM wallet_accounts wa
      LEFT JOIN wallet_entries we ON we.wallet_account_id = wa.id
      WHERE wa.driver_id = ${ctx.driverId}
      GROUP BY wa.currency
      LIMIT 1
    `)

    // Revenue breakdown par source
    const revenue = await db.execute(sql`
      SELECT
        source_type,
        SUM(gross_amount) as gross,
        SUM(tip_amount)   as tips,
        SUM(net_amount)   as net,
        COUNT(*)          as count
      FROM revenue_ledger
      WHERE driver_id = ${ctx.driverId}
        AND activity_date >= now() - ${interval}::interval
      GROUP BY source_type
    `)

    // Résumé total
    const summary = await db.execute(sql`
      SELECT
        SUM(gross_amount)              as total_gross,
        SUM(tip_amount)                as total_tips,
        SUM(net_amount)                as total_net,
        COUNT(*)                       as total_activities,
        SUM(CASE WHEN source_type = 'TAXI' THEN gross_amount ELSE 0 END) as taxi_gross,
        SUM(CASE WHEN source_type IN ('UBER','LYFT') THEN gross_amount ELSE 0 END) as rideshare_gross,
        SUM(CASE WHEN source_type IN ('DOORDASH','INSTACART','UBER_EATS','SKIP') THEN gross_amount ELSE 0 END) as delivery_gross
      FROM revenue_ledger
      WHERE driver_id = ${ctx.driverId}
        AND activity_date >= now() - ${interval}::interval
    `)

    return apiSuccess({
      wallet: {
        balance:  wallet[0] ? (wallet[0] as { balance: string }).balance : '0.00',
        currency: wallet[0] ? (wallet[0] as { currency: string }).currency : 'CAD',
      },
      period,
      summary:  summary[0] ?? {},
      breakdown: revenue,
    })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
