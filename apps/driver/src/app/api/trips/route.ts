// GET  /api/trips        — Historique des courses
// POST /api/trips/start  — Démarrer une course
// POST /api/trips/complete — Terminer une course

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'

import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

// GET — Historique des courses
export async function GET(req: NextRequest) {
  const db = getDb()
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const status = searchParams.get('status')

  try {
    const trips = await db.execute(sql`
      SELECT
        tt.id,
        tt.public_trip_id,
        tt.trip_reference,
        tt.trip_status,
        tt.distance_meters,
        tt.elapsed_seconds,
        tt.final_amount,
        tt.estimated_amount,
        tt.currency,
        tt.started_at,
        tt.completed_at,
        tt.fare_version
      FROM taxi_trips tt
      WHERE tt.driver_id = ${ctx.driverId}
        ${status ? sql`AND tt.trip_status = ${status}` : sql``}
      ORDER BY tt.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const total = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM taxi_trips
      WHERE driver_id = ${ctx.driverId}
        ${status ? sql`AND trip_status = ${status}` : sql``}
    `)

    return apiSuccess({
      trips,
      total:  parseInt(String((total[0] as { count: string }).count)),
      limit,
      offset,
    })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
