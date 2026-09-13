// POST /api/taximeter/start — Démarrer une course taxi
// Tarifs Québec officiels 2024 (Commission des transports du Québec)
// Schéma V2 exact — migration 0031

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { randomBytes } from 'crypto'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  return res.json() as Promise<unknown[]>
}

async function sbPost(path: string, body: unknown, prefer = 'return=representation') {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY(),
      Authorization: `Bearer ${KEY()}`,
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path}: ${text}`)
  return text ? JSON.parse(text) as unknown[] : []
}

async function sbPatch(path: string, body: unknown) {
  await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY(),
      Authorization: `Bearer ${KEY()}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

// ── Tarifs Québec officiels (CTQ 2024) ─────────────────────────
// Source: Commission des transports du Québec — Tarification officielle
const QC_TARIF = {
  version:              'QC-CTQ-2024',
  baseFare:             '3.50',   // Prise en charge
  distanceRatePer100m: '0.185',  // 1.85$/km → 0.185$/100m
  timeRatePerMinute:   '0.55',   // 33$/heure
  waitingRatePerMinute:'0.55',   // Attente = même taux temps
  minimumFare:         '3.50',   // Minimum
  airportSurcharge:    '1.50',   // Supplément aéroport
  currency:            'CAD',
  jurisdiction:        'QC',
  isPilot:             true,
  note:                'Tarifs pilote TAXIMETER.GOV — inspirés du cadre CTQ 2024. Non certifiés MEV-WEB.',
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const body = await req.json().catch(() => ({})) as Record<string, string>
    const commandId = body['commandId'] ?? null

    // 1. Vérifier course active
    const activeTrips = await sbGet(
      `taxi_trips?driver_id=eq.${ctx.driverId}&trip_status=in.(STARTED,PAUSED)&select=id,public_trip_id&limit=1`
    ) as Array<{ id: string; public_trip_id: string }>
    if (activeTrips.length > 0) {
      return apiError(`Course déjà active: ${activeTrips[0]!.public_trip_id}`, 409)
    }

    // 2. Idempotency
    if (commandId) {
      const existing = await sbGet(
        `taxi_trips?trip_reference=eq.${commandId}&select=id,public_trip_id,trip_reference&limit=1`
      ) as unknown[]
      if (existing.length > 0) return apiSuccess({ idempotent: true, trip: existing[0] })
    }

    // 3. Taximètre du chauffeur
    const taximeters = await sbGet(
      `taximeters?driver_id=eq.${ctx.driverId}&status=in.(READY,OFFLINE)&select=id,vehicle_id,device_id,app_version&limit=1`
    ) as Array<{ id: string; vehicle_id: string; device_id: string; app_version: string }>

    let taximeterId: string
    let vehicleId: string | null = null
    let deviceId = 'DRIVER-APP-MOBILE'
    let appVersion = 'pilot-2026.1'

    if (taximeters.length > 0) {
      taximeterId = taximeters[0]!.id
      vehicleId   = taximeters[0]!.vehicle_id
      deviceId    = taximeters[0]!.device_id ?? deviceId
      appVersion  = taximeters[0]!.app_version ?? appVersion
    } else {
      // Créer taximètre si absent
      const vehicles = await sbGet(
        `vehicles?driver_id=eq.${ctx.driverId}&is_active=eq.true&select=id&limit=1`
      ) as Array<{ id: string }>
      vehicleId = vehicles[0]?.id ?? null

      const txm = await sbPost('taximeters', {
        public_taximeter_id: `TXM-${Date.now()}`,
        driver_id:   ctx.driverId,
        vehicle_id:  vehicleId,
        status:      'READY',
        current_mode:'AVAILABLE',
        jurisdiction:'QC',
        device_id:   deviceId,
        app_version: appVersion,
        activated_at: new Date().toISOString(),
      }) as Array<{ id: string }>
      taximeterId = txm[0]!.id
    }

    // 4. Fare snapshot — tarifs QC officiels
    const fareSnapshot = {
      ...QC_TARIF,
      snapshotAt: new Date().toISOString(),
      taximeterId,
    }

    // 5. Créer la course — colonnes exactes migration 0031
    const year = new Date().getFullYear()
    const seq  = randomBytes(4).toString('hex').toUpperCase()
    const publicTripId  = `TRIP-${year}-${seq}`
    const tripReference = `TXG-${year}-${seq}`

    const trips = await sbPost('taxi_trips', {
      public_trip_id:       publicTripId,
      trip_reference:       tripReference,
      taximeter_id:         taximeterId,
      driver_id:            ctx.driverId,
      vehicle_id:           vehicleId,
      trip_status:          'STARTED',
      trip_integrity_status:'NORMAL',
      jurisdiction:         'QC',
      currency:             'CAD',
      distance_meters:      0,
      elapsed_seconds:      0,
      waiting_seconds:      0,
      estimated_amount:     parseFloat(QC_TARIF.baseFare),
      device_id:            deviceId,
      app_version:          appVersion,
      fare_snapshot:        fareSnapshot,
      started_at:           new Date().toISOString(),
    }) as Array<{ id: string }>

    const tripId = trips[0]!.id

    // 6. Mettre taximètre IN_TRIP
    await sbPatch(`taximeters?id=eq.${taximeterId}`, {
      status:       'IN_TRIP',
      current_mode: 'OCCUPIED',
      updated_at:   new Date().toISOString(),
    })

    // 7. Événement taximètre — colonnes exactes 0031
    await sbPost('taxi_meter_events', {
      trip_id:        tripId,
      taximeter_id:   taximeterId,
      driver_id:      ctx.driverId,
      event_type:     'TRIP_STARTED',
      event_sequence: 1,
      previous_state: 'AVAILABLE',
      new_state:      'OCCUPIED',
      command_id:     commandId ?? `CMD-${seq}`,
      device_id:      deviceId,
      app_version:    appVersion,
      occurred_at:    new Date().toISOString(),
      metadata:       { pilot: true, tariff: QC_TARIF.version },
    }, 'return=minimal')

    return apiSuccess({
      tripReference,
      publicTripId,
      tripId,
      taximeterId,
      fareVersion: QC_TARIF.version,
      isPilot:     true,
      fareSnapshot,
      startedAt:   new Date().toISOString(),
    })

  } catch (err) {
    console.error('[taximeter/start]', err)
    return apiError('Erreur démarrage: ' + String(err), 500)
  }
}
