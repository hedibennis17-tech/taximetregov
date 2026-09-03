// ================================================================
// POST /api/taximeter/start — Démarrer une course taxi
// ================================================================
// RÈGLE ABSOLUE: UNIQUEMENT pour TAXI_TRIP
// Taximètre JAMAIS activé par événement provider (Uber/Lyft/DoorDash)
// Tarif: depuis fare_configurations en DB — jamais hardcodé
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'

import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const db = getDb()
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const { vehicleId, commandId } = await req.json()

    // Idempotency — même commande = même résultat
    if (commandId) {
      const existing = await db.execute(sql`
        SELECT id, public_trip_id, trip_reference
        FROM taxi_trips
        WHERE start_command_id = ${commandId}
        LIMIT 1
      `)
      if (existing.length > 0) {
        return apiSuccess({ idempotent: true, trip: existing[0] })
      }
    }

    // 1. Vérifier qu'aucune course active n'existe
    const activeTrip = await db.execute(sql`
      SELECT id, public_trip_id FROM taxi_trips
      WHERE driver_id = ${ctx.driverId}
        AND trip_status IN ('CREATED', 'STARTED', 'PAUSED', 'RESUMED')
      LIMIT 1
    `)
    if (activeTrip.length > 0) {
      return apiError(
        `Course déjà active: ${(activeTrip[0] as { public_trip_id: string }).public_trip_id} — terminer avant d'en démarrer une nouvelle`,
        409
      )
    }

    // 2. Récupérer la fare config active depuis DB
    const fareConfig = await db.execute(sql`
      SELECT id, version, base_fare, distance_rate_per_100m,
             time_rate_per_minute, waiting_rate_per_minute,
             minimum_fare, airport_surcharge, currency, is_pilot
      FROM fare_configurations
      WHERE is_active = true
        AND jurisdiction = 'QC'
      ORDER BY effective_from DESC
      LIMIT 1
    `)
    if (!fareConfig.length) {
      return apiError('Aucune configuration tarifaire active — contacter l\'administrateur', 503)
    }
    const fare = fareConfig[0] as {
      id: string; version: string; base_fare: string;
      distance_rate_per_100m: string; time_rate_per_minute: string;
      waiting_rate_per_minute: string; minimum_fare: string;
      airport_surcharge: string; currency: string; is_pilot: boolean
    }

    // 3. Récupérer ou créer le taximètre
    let taximeter = await db.execute(sql`
      SELECT id FROM taximeters
      WHERE driver_id = ${ctx.driverId}
        AND status IN ('READY', 'OFFLINE')
      LIMIT 1
    `)

    if (!taximeter.length) {
      // Créer le taximètre pour ce chauffeur
      const txmSeq = await db.execute(sql`
        SELECT COUNT(*) + 1 as seq FROM taximeters
      `)
      const txmNum = String((txmSeq[0] as { seq: string }).seq).padStart(8, '0')
      await db.execute(sql`
        INSERT INTO taximeters (id, public_taximeter_id, driver_id, vehicle_id, status, current_mode, jurisdiction, created_at, updated_at)
        VALUES (gen_random_uuid(), ${'TXM-' + txmNum}, ${ctx.driverId}, ${vehicleId ?? null}, 'READY', 'AVAILABLE', 'QC', now(), now())
      `)
      taximeter = await db.execute(sql`
        SELECT id FROM taximeters WHERE driver_id = ${ctx.driverId} ORDER BY created_at DESC LIMIT 1
      `)
    }

    const taximeterId = (taximeter[0] as { id: string }).id

    // 4. Générer le trip reference officiel
    const countResult = await db.execute(sql`SELECT COUNT(*) + 1 as seq FROM taxi_trips`)
    const seq = String((countResult[0] as { seq: string }).seq).padStart(9, '0')
    const year = new Date().getFullYear()
    const tripReference = `TXG-${year}-${seq}`
    const publicTripId  = `TRP-${seq.padStart(8, '0')}`

    // 5. Fare snapshot — immuable pour cette course
    const fareSnapshot = {
      configId:             fare.id,
      version:              fare.version,
      baseFare:             fare.base_fare,
      distanceRatePer100m: fare.distance_rate_per_100m,
      timeRatePerMinute:    fare.time_rate_per_minute,
      waitingRatePerMinute: fare.waiting_rate_per_minute,
      minimumFare:          fare.minimum_fare,
      airportSurcharge:     fare.airport_surcharge,
      currency:             fare.currency,
      isPilot:              fare.is_pilot,
      snapshotAt:           new Date().toISOString(),
    }

    // 6. Créer la course
    const startCmd = commandId ?? randomBytes(24).toString('base64url')
    await db.execute(sql`
      INSERT INTO taxi_trips (
        id, public_trip_id, trip_reference,
        taximeter_id, driver_id, vehicle_id,
        trip_status, integrity_status,
        fare_configuration_id, fare_version, fare_snapshot,
        jurisdiction, currency,
        distance_meters, elapsed_seconds, waiting_seconds,
        estimated_amount,
        start_command_id,
        started_at,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${publicTripId},
        ${tripReference},
        ${taximeterId},
        ${ctx.driverId},
        ${vehicleId ?? null},
        'STARTED',
        'NORMAL',
        ${fare.id},
        ${fare.version},
        ${JSON.stringify(fareSnapshot)},
        'QC', ${fare.currency},
        0, 0, 0,
        ${fare.base_fare},
        ${startCmd},
        now(),
        now(), now()
      )
    `)

    // 7. Mettre à jour le taximètre
    await db.execute(sql`
      UPDATE taximeters
      SET status = 'IN_TRIP', current_mode = 'OCCUPIED', activated_at = now(), updated_at = now()
      WHERE id = ${taximeterId}
    `)

    // 8. Événement taximètre
    await db.execute(sql`
      INSERT INTO taxi_meter_events (id, trip_id, taximeter_id, driver_id, event_type, new_state, occurred_at, created_at)
      SELECT gen_random_uuid(), tt.id, ${taximeterId}, ${ctx.driverId}, 'TRIP_STARTED', 'STARTED', now(), now()
      FROM taxi_trips tt WHERE tt.trip_reference = ${tripReference}
    `)

    return apiSuccess({
      tripReference,
      publicTripId,
      taximeterId,
      fareVersion:  fare.version,
      isPilot:      fare.is_pilot,
      fareSnapshot,
      startedAt:    new Date().toISOString(),
    })

  } catch (err) {
    console.error('[taximeter/start]', err)
    return apiError('Erreur démarrage course', 500)
  }
}
