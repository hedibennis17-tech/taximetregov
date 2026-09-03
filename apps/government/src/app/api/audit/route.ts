// GET /api/audit — Journaux d'audit gouvernemental
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
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset   = parseInt(searchParams.get('offset') ?? '0')
  const module   = searchParams.get('module')
  const severity = searchParams.get('severity')
  const search   = searchParams.get('search')

  try {
    const db = getDb()

    const [logs, stats] = await Promise.all([
      // Logs paginés
      db.execute(sql`
        SELECT
          al.id,
          al.action,
          al.module,
          al.severity,
          al.result,
          al.resource_type,
          al.resource_id,
          al.occurred_at,
          al.actor_type,
          al.actor_public_id,
          al.actor_role,
          u.email as actor_email,
          dp.public_driver_id as subject_driver_public_id
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_id
        LEFT JOIN driver_profiles dp ON dp.id = al.subject_driver_id
        WHERE 1=1
          ${module   ? sql`AND al.module = ${module}`     : sql``}
          ${severity ? sql`AND al.severity = ${severity}` : sql``}
          ${search   ? sql`AND (al.action ILIKE ${'%' + search + '%'} OR al.resource_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY al.occurred_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `),

      // Stats par sévérité et module
      db.execute(sql`
        SELECT
          module,
          severity,
          COUNT(*) as count,
          SUM(CASE WHEN result = 'FAILURE' OR result = 'BLOCKED' THEN 1 ELSE 0 END) as failures
        FROM audit_logs
        WHERE occurred_at >= now() - interval '7 days'
        GROUP BY module, severity
        ORDER BY count DESC
        LIMIT 20
      `),
    ])

    const total = await db.execute(sql`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE 1=1
        ${module   ? sql`AND module = ${module}`     : sql``}
        ${severity ? sql`AND severity = ${severity}` : sql``}
    `)

    return apiSuccess({
      logs,
      stats,
      total:  parseInt(String((total[0] as { count: string }).count)),
      limit,
      offset,
    })
  } catch (err) {
    console.error('[gov/audit]', err)
    return apiError('Erreur serveur', 500)
  }
}
