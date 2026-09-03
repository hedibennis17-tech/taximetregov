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
        dp.public_driver_id,
        dp.first_name,
        dp.last_name,
        dp.verification_status,
        dp.onboarding_status,
        dp.phone_number_masked,
        dp.created_at,
        u.email,
        -- Revenu ce mois
        COALESCE((
          SELECT SUM(gross_amount)
          FROM revenue_ledger rl
          WHERE rl.driver_id = dp.id
            AND rl.activity_date >= date_trunc('month', now())
        ), 0) as revenue_this_month,
        -- Nombre de courses ce mois
        COALESCE((
          SELECT COUNT(*)
          FROM taxi_trips tt
          WHERE tt.driver_id = dp.id
            AND tt.started_at >= date_trunc('month', now())
            AND tt.trip_status = 'COMPLETED'
        ), 0) as trips_this_month,
        -- Plateformes connectées
        (
          SELECT COUNT(*)
          FROM driver_provider_accounts dpa
          WHERE dpa.driver_id = dp.id
            AND dpa.connection_status = 'CONNECTED'
        ) as connected_platforms
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE 1=1
        ${status ? sql`AND dp.verification_status = ${status}` : sql``}
        ${search ? sql`AND (
          dp.first_name ILIKE ${'%' + search + '%'} OR
          dp.last_name  ILIKE ${'%' + search + '%'} OR
          u.email       ILIKE ${'%' + search + '%'} OR
          dp.public_driver_id ILIKE ${'%' + search + '%'}
        )` : sql``}
      ORDER BY dp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const total = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE 1=1
        ${status ? sql`AND dp.verification_status = ${status}` : sql``}
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
