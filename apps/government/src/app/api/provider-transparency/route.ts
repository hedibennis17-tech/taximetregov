// GET /api/provider-transparency — Module 31 Dashboard
// Provider Revenue Transparency & Transaction Reconciliation
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

    const [volume, byProvider, byService, reconciliation, exceptions] = await Promise.all([

      // Volume global
      db.execute(sql`
        SELECT
          COUNT(*)                              as total_transactions,
          COALESCE(SUM(gross_amount), 0)        as total_gross,
          COALESCE(SUM(tip_amount), 0)          as total_tips,
          COALESCE(SUM(fee_amount), 0)          as total_fees,
          COALESCE(SUM(net_amount), 0)          as total_net,
          COUNT(DISTINCT driver_id)             as unique_drivers,
          COUNT(DISTINCT source_type)           as unique_providers,
          COALESCE(SUM(CASE WHEN is_settled THEN gross_amount ELSE 0 END), 0) as settled_amount,
          COALESCE(SUM(CASE WHEN NOT is_settled THEN gross_amount ELSE 0 END), 0) as pending_amount
        FROM revenue_ledger
        WHERE activity_date >= date_trunc('month', now())
      `),

      // Par provider
      db.execute(sql`
        SELECT
          source_type                       as provider,
          COUNT(*)                          as transactions,
          SUM(gross_amount)                 as gross,
          SUM(tip_amount)                   as tips,
          SUM(fee_amount)                   as fees,
          SUM(net_amount)                   as net,
          COUNT(DISTINCT driver_id)         as drivers,
          MAX(activity_date)                as last_activity,
          COUNT(CASE WHEN is_settled THEN 1 END) as settled
        FROM revenue_ledger
        WHERE activity_date >= date_trunc('month', now())
        GROUP BY source_type
        ORDER BY gross DESC NULLS LAST
      `),

      // Par type de service
      db.execute(sql`
        SELECT
          activity_type                     as service_type,
          COUNT(*)                          as transactions,
          SUM(gross_amount)                 as gross,
          SUM(tip_amount)                   as tips,
          SUM(net_amount)                   as net
        FROM revenue_ledger
        WHERE activity_date >= date_trunc('month', now())
        GROUP BY activity_type
        ORDER BY gross DESC NULLS LAST
      `),

      // Réconciliation summary
      db.execute(sql`
        SELECT
          COUNT(*)                          as total_cases,
          COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved,
          COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_cases,
          COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
          COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high
        FROM reconciliation_cases
        WHERE created_at >= date_trunc('month', now())
      `),

      // Exceptions récentes
      db.execute(sql`
        SELECT
          rc.id,
          rc.case_type,
          rc.severity,
          rc.status,
          rc.expected_amount,
          rc.actual_amount,
          rc.difference_amount,
          rc.currency,
          rc.created_at,
          dp.public_driver_id,
          dp.first_name,
          dp.last_name,
          p.display_name as provider_name
        FROM reconciliation_cases rc
        LEFT JOIN driver_profiles dp ON dp.id = rc.driver_id
        LEFT JOIN providers p ON p.id = rc.provider_id
        WHERE rc.status IN ('OPEN', 'INVESTIGATING')
        ORDER BY
          CASE rc.severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
          END,
          rc.created_at DESC
        LIMIT 10
      `),
    ])

    return apiSuccess({
      volume:         volume[0] ?? {},
      byProvider,
      byService,
      reconciliation: reconciliation[0] ?? {},
      exceptions,
      generatedAt:    new Date().toISOString(),
      period:         'month',
    })
  } catch (err) {
    console.error('[provider-transparency]', err)
    return apiError('Erreur serveur', 500)
  }
}
