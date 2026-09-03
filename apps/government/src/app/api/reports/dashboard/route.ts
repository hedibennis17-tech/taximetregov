// GET /api/reports/dashboard — Métriques gouvernementales
import { NextRequest } from 'next/server'
import { db, apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx

  const denied = requireGovRole(ctx)
  if (denied) return denied

  try {
    // Métriques globales
    const [drivers, revenue, trips, tax] = await Promise.all([
      // Chauffeurs
      db.execute(sql`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END)  as pending,
          SUM(CASE WHEN verification_status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended
        FROM driver_profiles
      `),
      // Revenus ce mois
      db.execute(sql`
        SELECT
          COALESCE(SUM(gross_amount), 0) as total_gross,
          COALESCE(SUM(CASE WHEN source_type = 'TAXI' THEN gross_amount ELSE 0 END), 0) as taxi,
          COALESCE(SUM(CASE WHEN source_type IN ('UBER','LYFT') THEN gross_amount ELSE 0 END), 0) as rideshare,
          COALESCE(SUM(CASE WHEN source_type IN ('DOORDASH','INSTACART','UBER_EATS','SKIP') THEN gross_amount ELSE 0 END), 0) as delivery,
          COUNT(DISTINCT driver_id) as active_drivers
        FROM revenue_ledger
        WHERE activity_date >= date_trunc('month', now())
      `),
      // Courses ce mois
      db.execute(sql`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN trip_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN trip_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
          COALESCE(AVG(final_amount) FILTER (WHERE trip_status = 'COMPLETED'), 0) as avg_fare
        FROM taxi_trips
        WHERE started_at >= date_trunc('month', now())
      `),
      // Taxes
      db.execute(sql`
        SELECT
          COALESCE(SUM(total_tps_collected), 0) as tps,
          COALESCE(SUM(total_tvq_collected), 0) as tvq
        FROM driver_ledger_summaries
        WHERE period_start >= date_trunc('month', now())
      `),
    ])

    return apiSuccess({
      drivers:     drivers[0],
      revenue:     revenue[0],
      trips:       trips[0],
      tax:         tax[0],
      generatedAt: new Date().toISOString(),
      jurisdiction: 'QC',
    })
  } catch (err) {
    console.error('[gov/reports/dashboard]', err)
    return apiError('Erreur serveur', 500)
  }
}
