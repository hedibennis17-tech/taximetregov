// POST /api/taximeter/stop — Terminer course taxi
// Calcul serveur depuis fareSnapshot (immuable)
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } })
  return res.json() as Promise<unknown[]>
}
async function sbPatch(path: string, body: unknown) {
  await fetch(`${SB_URL}/rest/v1/${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' }, body: JSON.stringify(body) })
}
async function sbPost(path: string, body: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' }, body: JSON.stringify(body) })
  return res.ok
}

function calcFare(snap: Record<string, string>, distM: number, elapsedSec: number, waitSec: number, isAirport: boolean): number {
  const base    = parseFloat(snap['baseFare']              ?? '3.50')
  const dist    = (distM / 100) * parseFloat(snap['distanceRatePer100m'] ?? '0.185')
  const time    = (elapsedSec / 60) * parseFloat(snap['timeRatePerMinute']   ?? '0.55')
  const wait    = (waitSec / 60) * parseFloat(snap['waitingRatePerMinute']   ?? '0.55')
  const airport = isAirport ? parseFloat(snap['airportSurcharge'] ?? '1.50') : 0
  const sub     = base + dist + time + wait + airport
  return Math.round(Math.max(sub, parseFloat(snap['minimumFare'] ?? '3.50')) * 100) / 100
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  try {
    const body = await req.json() as { tripReference?: string; distanceMeters?: number; elapsedSeconds?: number; waitingSeconds?: number; isAirportTrip?: boolean }
    const { tripReference, distanceMeters = 0, elapsedSeconds = 0, waitingSeconds = 0, isAirportTrip = false } = body

    if (!tripReference) return apiError('tripReference requis', 400)

    const trips = await sbGet(`taxi_trips?trip_reference=eq.${tripReference}&driver_id=eq.${ctx.driverId}&select=id,taximeter_id,trip_status,fare_snapshot&limit=1`) as Array<{ id: string; taximeter_id: string; trip_status: string; fare_snapshot: Record<string, string> }>

    if (!trips.length) return apiError('Course introuvable', 404)
    const trip = trips[0]!
    if (trip.trip_status === 'COMPLETED') return apiError('Course déjà terminée', 409)

    // Calcul serveur — JAMAIS depuis le client
    const finalAmount = calcFare(trip.fare_snapshot, distanceMeters, elapsedSeconds, waitingSeconds, isAirportTrip)

    // TPS + TVQ Québec officiels
    const tps = Math.round(finalAmount * 0.05 * 100) / 100
    const tvq = Math.round(finalAmount * 0.09975 * 100) / 100
    const totalTTC = Math.round((finalAmount + tps + tvq) * 100) / 100

    const receiptRef = `RCP-${tripReference}`
    const now = new Date().toISOString()

    // Mettre à jour la course
    await sbPatch(`taxi_trips?id=eq.${trip.id}`, {
      trip_status:      'COMPLETED',
      distance_meters:  distanceMeters,
      elapsed_seconds:  elapsedSeconds,
      waiting_seconds:  waitingSeconds,
      final_amount:     finalAmount,
      receipt_reference: receiptRef,
      completed_at:     now,
      updated_at:       now,
    })

    // Libérer le taximètre
    await sbPatch(`taximeters?id=eq.${trip.taximeter_id}`, {
      status:       'READY',
      current_mode: 'AVAILABLE',
      updated_at:   now,
    })

    // Événement COMPLETED
    await sbPost('taxi_meter_events', {
      trip_id:        trip.id,
      taximeter_id:   trip.taximeter_id,
      driver_id:      ctx.driverId,
      event_type:     'TRIP_COMPLETED',
      event_sequence: 3,
      previous_state: 'OCCUPIED',
      new_state:      'COMPLETED',
      command_id:     `CMD-STOP-${tripReference}`,
      occurred_at:    now,
      metadata:       { pilot: true, final_amount: finalAmount },
    })

    // Revenue ledger
    await sbPost('revenue_ledger', {
      driver_id:        ctx.driverId,
      source_type:      'TAXI',
      activity_type:    'TAXI_TRIP',
      entry_type:       'CREDIT',
      gross_amount:     finalAmount,
      fee_amount:       0,
      tip_amount:       0,
      adjustment_amount:0,
      net_amount:       finalAmount,
      currency:         'CAD',
      jurisdiction:     'QC',
      activity_date:    now.split('T')[0],
      is_settled:       true,
      settled_at:       now,
      source_reference: tripReference,
      notes:            `Course taxi TAXIMETER.GOV — Mode pilote`,
    })

    return apiSuccess({
      tripReference,
      receiptReference: receiptRef,
      finalAmount,
      tps,
      tvq,
      totalTTC,
      distanceMeters,
      elapsedSeconds,
      waitingSeconds,
      completedAt: now,
      tariff: { note: 'Tarifs pilote QC — non certifiés MEV-WEB' },
    })

  } catch (err) {
    console.error('[taximeter/stop]', err)
    return apiError('Erreur fin de course: ' + String(err), 500)
  }
}
