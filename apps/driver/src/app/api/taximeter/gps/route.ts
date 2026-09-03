// POST /api/taximeter/gps — Enregistrer une position GPS
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const db = getDb()
    const { tripId, latitude, longitude, accuracy, speedKmh, distanceDelta, elapsedDelta } = await req.json()
    if (!tripId || !latitude || !longitude) return apiError('tripId, latitude, longitude requis', 400)

    // Insérer le point GPS
    await db.execute(sql`
      INSERT INTO trip_gps_points (id, trip_id, latitude, longitude, accuracy_meters, speed_kmh, recorded_at, created_at)
      VALUES (gen_random_uuid(), ${tripId}, ${latitude}, ${longitude}, ${accuracy ?? null}, ${speedKmh ?? null}, now(), now())
    `)

    // Mettre à jour la distance et la durée de la course
    if (distanceDelta || elapsedDelta) {
      await db.execute(sql`
        UPDATE taxi_trips SET
          distance_meters  = distance_meters  + ${distanceDelta  ?? 0},
          elapsed_seconds  = elapsed_seconds  + ${elapsedDelta   ?? 0},
          updated_at       = now()
        WHERE id = ${tripId} AND driver_id = ${ctx.driverId}
      `)
    }

    return apiSuccess({ recorded: true, at: new Date().toISOString() })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
