// ================================================================
// POST /api/taximeter/stop — Terminer une course taxi
// ================================================================
// finalAmount calculé côté serveur depuis fareSnapshot immuable
// JAMAIS depuis données client — GPS + temps = autoritaire serveur
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'

import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { randomBytes } from 'crypto'

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

function calculateFinalFare(snapshot: Record<string, string>, distanceMeters: number, elapsedSeconds: number, waitingSeconds: number, isAirport: boolean): number {
  const base       = parseFloat(snapshot.baseFare)
  const distance   = round2((distanceMeters / 100) * parseFloat(snapshot.distanceRatePer100m))
  const time       = round2((elapsedSeconds / 60) * parseFloat(snapshot.timeRatePerMinute))
  const waiting    = round2((waitingSeconds / 60) * parseFloat(snapshot.waitingRatePerMinute))
  const airport    = isAirport ? parseFloat(snapshot.airportSurcharge) : 0
  const subtotal   = round2(base + distance + time + waiting + airport)
  return round2(Math.max(subtotal, parseFloat(snapshot.minimumFare)))
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const {
      tripReference,
      distanceMeters   = 0,
      elapsedSeconds   = 0,
      waitingSeconds   = 0,
      isAirportTrip    = false,
      completeCommandId,
    } = await req.json()

    if (!tripReference) return apiError('tripReference requis', 400)

    // Idempotency
    if (completeCommandId) {
      const existing = await db.execute(sql`
        SELECT id, final_amount, trip_reference
        FROM taxi_trips
        WHERE complete_command_id = ${completeCommandId}
        LIMIT 1
      `)
      if (existing.length > 0) return apiSuccess({ idempotent: true, trip: existing[0] })
    }

    // Récupérer la course
    const trips = await db.execute(sql`
      SELECT id, taximeter_id, trip_status, fare_snapshot, driver_id
      FROM taxi_trips
      WHERE trip_reference = ${tripReference}
        AND driver_id = ${ctx.driverId}
      LIMIT 1
    `)
    if (!trips.length) return apiError('Course introuvable', 404)

    const trip = trips[0] as {
      id: string; taximeter_id: string; trip_status: string
      fare_snapshot: Record<string, unknown>; driver_id: string
    }

    if (trip.trip_status === 'COMPLETED') {
      return apiError('Course déjà terminée — immuable', 409)
    }
    if (!['STARTED', 'PAUSED', 'RESUMED'].includes(trip.trip_status)) {
      return apiError(`Impossible de terminer une course en statut ${trip.trip_status}`, 400)
    }

    // Calcul serveur — jamais depuis client
    const snap = trip.fare_snapshot as Record<string, string>
    const finalAmount = calculateFinalFare(
      snap,
      distanceMeters, elapsedSeconds, waitingSeconds, isAirportTrip
    )

    const receiptRef  = `RCP-TXG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
    const completeCmd = completeCommandId ?? randomBytes(24).toString('base64url')

    // Mettre à jour la course — COMPLETED = immuable après ça
    await db.execute(sql`
      UPDATE taxi_trips SET
        trip_status       = 'COMPLETED',
        distance_meters   = ${distanceMeters},
        elapsed_seconds   = ${elapsedSeconds},
        waiting_seconds   = ${waitingSeconds},
        final_amount      = ${finalAmount},
        receipt_reference = ${receiptRef},
        complete_command_id = ${completeCmd},
        completed_at      = now(),
        updated_at        = now()
      WHERE id = ${trip.id}
    `)

    // Libérer le taximètre
    await db.execute(sql`
      UPDATE taximeters SET
        status = 'READY', current_mode = 'AVAILABLE',
        updated_at = now()
      WHERE id = ${trip.taximeter_id}
    `)

    // Événement
    await db.execute(sql`
      INSERT INTO taxi_meter_events (id, trip_id, taximeter_id, driver_id, event_type, previous_state, new_state, occurred_at, created_at)
      VALUES (gen_random_uuid(), ${trip.id}, ${trip.taximeter_id}, ${ctx.driverId}, 'TRIP_COMPLETED', 'STARTED', 'COMPLETED', now(), now())
    `)

    // Créer entrée revenue_ledger
    await db.execute(sql`
      INSERT INTO revenue_ledger (
        id, driver_id, source_type, activity_type,
        entry_type, gross_amount, fee_amount, tip_amount,
        adjustment_amount, net_amount,
        currency, jurisdiction, activity_date,
        source_reference, is_settled,
        created_at
      ) VALUES (
        gen_random_uuid(), ${ctx.driverId}, 'TAXI', 'TAXI_TRIP',
        'CREDIT', ${finalAmount}, 0, 0, 0, ${finalAmount},
        'CAD', 'QC', CURRENT_DATE,
        ${tripReference}, false,
        now()
      )
    `)

    return apiSuccess({
      tripReference,
      receiptReference: receiptRef,
      finalAmount,
      distanceMeters,
      elapsedSeconds,
      waitingSeconds,
      completedAt: new Date().toISOString(),
    })

  } catch (err) {
    console.error('[taximeter/stop]', err)
    return apiError('Erreur fin de course', 500)
  }
}
