// ================================================================
// POST /api/taximeter/start  — Démarrer le taximètre
// POST /api/taximeter/stop   — Arrêter le taximètre
// GET  /api/taximeter/status — Statut actuel
// ================================================================
//
// RÈGLE ABSOLUE: Taximètre UNIQUEMENT pour TAXI_TRIP
// JAMAIS activé pour DELIVERY ou RIDESHARE provider
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'

import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const db = getDb()
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const taximeter = await db.execute(sql`
      SELECT
        t.id,
        t.public_taximeter_id,
        t.status,
        t.current_mode,
        t.activated_at,
        -- Course active
        (
          SELECT json_build_object(
            'id', tt.id,
            'publicTripId', tt.public_trip_id,
            'tripReference', tt.trip_reference,
            'status', tt.trip_status,
            'distanceMeters', tt.distance_meters,
            'elapsedSeconds', tt.elapsed_seconds,
            'estimatedAmount', tt.estimated_amount,
            'startedAt', tt.started_at
          )
          FROM taxi_trips tt
          WHERE tt.taximeter_id = t.id
            AND tt.trip_status IN ('STARTED', 'PAUSED', 'RESUMED')
          LIMIT 1
        ) as active_trip
      FROM taximeters t
      WHERE t.driver_id = ${ctx.driverId}
        AND t.status IN ('READY', 'IN_TRIP')
      ORDER BY t.created_at DESC
      LIMIT 1
    `)

    return apiSuccess({
      taximeter: taximeter[0] ?? null,
      hasActiveMeter: taximeter.length > 0,
    })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
