// GET /api/transactions — Transactions revenus gouvernement
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset     = parseInt(searchParams.get('offset') ?? '0')
  const sourceType = searchParams.get('source')
  const driverId   = searchParams.get('driver_id')
  const from       = searchParams.get('from')
  const to         = searchParams.get('to')

  try {
    const db = getDb()

    const transactions = await db.execute(sql`
      SELECT
        rl.id,
        rl.source_type,
        rl.activity_type,
        rl.entry_type,
        rl.gross_amount,
        rl.fee_amount,
        rl.tip_amount,
        rl.net_amount,
        rl.currency,
        rl.activity_date,
        rl.is_settled,
        rl.source_reference,
        dp.public_driver_id,
        dp.first_name,
        dp.last_name
      FROM revenue_ledger rl
      JOIN driver_profiles dp ON dp.id = rl.driver_id
      WHERE 1=1
        ${sourceType ? sql`AND rl.source_type = ${sourceType}` : sql``}
        ${driverId   ? sql`AND rl.driver_id = ${driverId}`     : sql``}
        ${from       ? sql`AND rl.activity_date >= ${from}::date` : sql``}
        ${to         ? sql`AND rl.activity_date <= ${to}::date`   : sql``}
      ORDER BY rl.activity_date DESC, rl.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const total = await db.execute(sql`
      SELECT COUNT(*) as count FROM revenue_ledger rl
      WHERE 1=1
        ${sourceType ? sql`AND rl.source_type = ${sourceType}` : sql``}
        ${driverId   ? sql`AND rl.driver_id = ${driverId}`     : sql``}
    `)

    // Totaux
    const totals = await db.execute(sql`
      SELECT
        source_type,
        SUM(gross_amount) as gross,
        SUM(tip_amount)   as tips,
        SUM(net_amount)   as net,
        COUNT(*)          as count
      FROM revenue_ledger
      WHERE activity_date >= date_trunc('month', now())
      GROUP BY source_type
      ORDER BY gross DESC
    `)

    return apiSuccess({
      transactions,
      totals,
      total:  parseInt(String((total[0] as { count: string }).count)),
      limit,
      offset,
    })
  } catch (err) {
    console.error('[gov/transactions]', err)
    return apiError('Erreur serveur', 500)
  }
}
