// GET /api/providers/activities — Activités par provider
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  const { searchParams } = new URL(req.url)
  const providerCode = searchParams.get('provider')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  try {
    const db = getDb()

    const activities = await db.execute(sql`
      SELECT
        da.id,
        da.public_activity_id,
        da.activity_date,
        da.status,
        at2.code   as activity_type,
        at2.label  as activity_label,
        p.provider_code,
        p.display_name as provider_name,
        rl.gross_amount,
        rl.tip_amount,
        rl.net_amount,
        rl.currency,
        rl.source_reference
      FROM driver_activities da
      JOIN activity_types at2 ON at2.id = da.activity_type_id
      LEFT JOIN providers p ON p.id = da.provider_id
      LEFT JOIN revenue_ledger rl ON rl.driver_id = da.driver_id
        AND rl.source_reference = da.public_activity_id
      WHERE da.driver_id = ${ctx.driverId}
        ${providerCode ? sql`AND p.provider_code = ${providerCode}` : sql``}
      ORDER BY da.activity_date DESC, da.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const summary = await db.execute(sql`
      SELECT
        p.provider_code,
        p.display_name,
        COUNT(da.id)              as activity_count,
        SUM(rl.gross_amount)      as total_gross,
        MAX(da.activity_date)     as last_activity
      FROM driver_activities da
      JOIN providers p ON p.id = da.provider_id
      LEFT JOIN revenue_ledger rl ON rl.driver_id = da.driver_id
        AND rl.source_reference = da.public_activity_id
      WHERE da.driver_id = ${ctx.driverId}
        AND da.activity_date >= now() - interval '30 days'
      GROUP BY p.provider_code, p.display_name
      ORDER BY total_gross DESC NULLS LAST
    `)

    return apiSuccess({ activities, summary, limit, offset })
  } catch (err) {
    console.error('[providers/activities]', err)
    return apiError('Erreur serveur', 500)
  }
}
