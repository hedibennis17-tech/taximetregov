// ================================================================
// GET /api/providers/list — Liste providers + statut connexion chauffeur
// ================================================================
// RÈGLE ABSOLUE: Tous les providers restent MOCK_ONLY
// jusqu'à approbation officielle du programme partenaire
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const db = getDb()

    // Tous les providers disponibles + statut connexion du chauffeur
    const providers = await db.execute(sql`
      SELECT
        p.id,
        p.provider_code,
        p.display_name,
        p.provider_type,
        p.status               as provider_status,
        p.integration_status,
        -- Compte chauffeur (si connecté)
        dpa.id                 as account_id,
        dpa.connection_status,
        dpa.provider_driver_id_masked,
        dpa.connected_at,
        dpa.last_sync_at,
        dpa.sync_error_count,
        -- Connecteur (MOCK_ONLY = pas d'API réelle)
        pc.status              as connector_status,
        pc.supports_webhook,
        pc.supports_api_pull,
        pc.partner_approval_reference
      FROM providers p
      LEFT JOIN driver_provider_accounts dpa
        ON dpa.provider_id = p.id
        AND dpa.driver_id = ${ctx.driverId}
      LEFT JOIN platform_connectors pc
        ON pc.provider_id = p.id
      WHERE p.status = 'ACTIVE'
      ORDER BY
        CASE p.provider_type
          WHEN 'RIDESHARE'       THEN 1
          WHEN 'MULTI_SERVICE'   THEN 2
          WHEN 'FOOD_DELIVERY'   THEN 3
          WHEN 'GROCERY_DELIVERY' THEN 4
          ELSE 5
        END,
        p.display_name
    `)

    // Résumé revenus par provider (30 derniers jours)
    const revenueByProvider = await db.execute(sql`
      SELECT
        source_type,
        SUM(gross_amount)  as gross,
        SUM(tip_amount)    as tips,
        COUNT(*)           as count,
        MAX(activity_date) as last_activity
      FROM revenue_ledger
      WHERE driver_id = ${ctx.driverId}
        AND activity_date >= now() - interval '30 days'
      GROUP BY source_type
    `)

    const revenueMap = Object.fromEntries(
      (revenueByProvider as unknown as { source_type: string; gross: string; tips: string; count: string; last_activity: string }[])
        .map(r => [r.source_type, r])
    )

    // Enrichir providers avec revenus
    const enriched = (providers as unknown as Record<string, unknown>[]).map(p => ({
      ...p,
      revenue: revenueMap[(p.provider_code as string)] ?? null,
      isMockOnly: (p.connector_status as string) === 'MOCK_ONLY'
        || !(p.partner_approval_reference as string | null),
    }))

    const connectedCount = enriched.filter(p => (p as Record<string, unknown>)['connection_status'] === 'CONNECTED').length

    return apiSuccess({
      providers:      enriched,
      connectedCount,
      totalProviders: enriched.length,
    })
  } catch (err) {
    console.error('[providers/list]', err)
    return apiError('Erreur serveur', 500)
  }
}
