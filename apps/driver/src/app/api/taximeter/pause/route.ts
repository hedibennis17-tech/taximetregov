// POST /api/taximeter/pause
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
    const { tripReference } = await req.json()
    if (!tripReference) return apiError('tripReference requis', 400)

    const trips = await db.execute(sql`
      SELECT id, taximeter_id, trip_status FROM taxi_trips
      WHERE trip_reference = ${tripReference} AND driver_id = ${ctx.driverId}
      LIMIT 1
    `)
    if (!trips.length) return apiError('Course introuvable', 404)
    const trip = trips[0] as { id: string; taximeter_id: string; trip_status: string }
    if (trip.trip_status !== 'STARTED' && trip.trip_status !== 'RESUMED') {
      return apiError(`Impossible de mettre en pause: statut ${trip.trip_status}`, 409)
    }

    await db.execute(sql`
      UPDATE taxi_trips SET trip_status = 'PAUSED', updated_at = now() WHERE id = ${trip.id}
    `)
    await db.execute(sql`
      INSERT INTO taxi_meter_events (id, trip_id, taximeter_id, driver_id, event_type, previous_state, new_state, occurred_at, created_at)
      VALUES (gen_random_uuid(), ${trip.id}, ${trip.taximeter_id}, ${ctx.driverId}, 'WAITING_START', 'STARTED', 'PAUSED', now(), now())
    `)
    return apiSuccess({ tripReference, status: 'PAUSED', pausedAt: new Date().toISOString() })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
