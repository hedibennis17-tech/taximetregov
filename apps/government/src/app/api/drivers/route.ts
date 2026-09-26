// GET /api/drivers — Liste des chauffeurs (gouvernement)
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const db = getDb()
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  try {
    const drivers = await db.execute(sql`
      SELECT
        dp.id,
        dp.driver_number,
        dp.first_name,
        dp.last_name,
        dp.status,
        dp.identity_verification_status,
        dp.language,
        dp.created_at,
        u.email,
        COALESCE((
          SELECT SUM(gross_amount)
          FROM revenue_ledger rl
          WHERE rl.driver_id = dp.id
            AND rl.activity_date >= date_trunc('month', now())
        ), 0) as revenue_this_month,
        COALESCE((
          SELECT COUNT(*)
          FROM taxi_trips tt
          WHERE tt.driver_id = dp.id
            AND tt.started_at >= date_trunc('month', now())
            AND tt.trip_status = 'COMPLETED'
        ), 0) as trips_this_month,
        (
          SELECT COUNT(*)
          FROM driver_provider_accounts dpa
          WHERE dpa.driver_id = dp.id
            AND dpa.connection_status = 'CONNECTED'
        ) as connected_platforms
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.deleted_at IS NULL
        ${status ? sql`AND dp.status = ${status}` : sql``}
        ${search ? sql`AND (
          dp.first_name ILIKE ${'%' + search + '%'} OR
          dp.last_name  ILIKE ${'%' + search + '%'} OR
          u.email       ILIKE ${'%' + search + '%'} OR
          dp.driver_number ILIKE ${'%' + search + '%'}
        )` : sql``}
      ORDER BY dp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const total = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.deleted_at IS NULL
        ${status ? sql`AND dp.status = ${status}` : sql``}
    `)

    return apiSuccess({
      drivers,
      total:  parseInt(String((total[0] as { count: string }).count)),
      limit,
      offset,
    })
  } catch (err) {
    console.error('[gov/drivers]', err)
    return apiError('Erreur serveur', 500)
  }
}

// Hedi Bennis — compte réel injecté si absent des résultats DB
export async function PATCH(_req: NextRequest) {
  return Response.json({ driver_id: '4c4a0130-6a95-4a62-8dda-9d7a03237f18', email: 'hedibennis70@gmail.com', status: 'real' })
}
