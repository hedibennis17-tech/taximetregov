// GET /api/tax — Centre fiscal gouvernemental
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  try {
    const db = getDb()

    const [summary, periods, registrations] = await Promise.all([
      // Résumé fiscal global
      db.execute(sql`
        SELECT
          COALESCE(SUM(total_tps_collected), 0)  as total_tps,
          COALESCE(SUM(total_tvq_collected), 0)  as total_tvq,
          COALESCE(SUM(total_tax_collected), 0)  as total_tax,
          COALESCE(SUM(gross_revenue_total), 0)  as total_gross,
          COALESCE(SUM(gross_revenue_taxi), 0)   as taxi_gross,
          COALESCE(SUM(gross_revenue_rideshare), 0) as rideshare_gross,
          COALESCE(SUM(gross_revenue_delivery), 0)  as delivery_gross,
          COUNT(DISTINCT driver_id)              as drivers_with_revenue
        FROM driver_ledger_summaries
        WHERE period_start >= date_trunc('year', now())
      `),

      // Périodes fiscales récentes
      db.execute(sql`
        SELECT
          tp.id,
          tp.period_start,
          tp.period_end,
          tp.status,
          tp.tps_status,
          tp.tvq_status,
          tp.filing_due_date,
          tp.gross_revenue_taxi,
          tp.gross_revenue_rideshare,
          tp.gross_revenue_delivery,
          dp.public_driver_id,
          dp.first_name,
          dp.last_name
        FROM tax_periods tp
        JOIN tax_accounts ta ON ta.id = tp.tax_account_id
        JOIN driver_profiles dp ON dp.id = ta.driver_id
        WHERE tp.period_start >= now() - interval '6 months'
        ORDER BY tp.period_end DESC
        LIMIT 50
      `),

      // Enregistrements TPS/TVQ par statut
      db.execute(sql`
        SELECT
          tps_status,
          tvq_status,
          COUNT(*) as count
        FROM tax_accounts
        GROUP BY tps_status, tvq_status
        ORDER BY count DESC
      `),
    ])

    return apiSuccess({
      summary:       summary[0] ?? {},
      periods,
      registrations,
      generatedAt:   new Date().toISOString(),
    })
  } catch (err) {
    console.error('[gov/tax]', err)
    return apiError('Erreur serveur', 500)
  }
}
