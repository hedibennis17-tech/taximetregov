// POST /api/taximeter/reset — Forcer la fermeture d'une course bloquée
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function patch(path: string, body: unknown) {
  await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  try {
    const now = new Date().toISOString()

    // 1. Fermer toutes les courses actives du chauffeur
    const tripsRes = await fetch(
      `${SB_URL}/rest/v1/taxi_trips?driver_id=eq.${ctx.driverId}&trip_status=in.(STARTED,PAUSED)&select=id,distance_meters,elapsed_seconds,fare_snapshot`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const trips = await tripsRes.json() as Array<{id:string; distance_meters:number; elapsed_seconds:number; fare_snapshot:Record<string,string>}>

    let closedTrips = 0
    for (const trip of trips) {
      // Calcul du montant final
      const snap = trip.fare_snapshot ?? {}
      const base = parseFloat(snap['baseFare'] ?? '3.50')
      const dist = (trip.distance_meters / 100) * parseFloat(snap['distanceRatePer100m'] ?? '0.185')
      const time = (trip.elapsed_seconds / 60) * parseFloat(snap['timeRatePerMinute'] ?? '0.55')
      const finalAmount = Math.max(Math.round((base + dist + time) * 100) / 100, parseFloat(snap['minimumFare'] ?? '3.50'))

      await patch(`taxi_trips?id=eq.${trip.id}`, {
        trip_status: 'COMPLETED',
        trip_integrity_status: 'FORCE_CLOSED',
        final_amount: finalAmount,
        receipt_reference: `RCP-RESET-${trip.id.slice(0, 8)}`,
        completed_at: now,
        updated_at: now,
      })

      // Revenue ledger si montant > 0
      if (finalAmount > 0) {
        await fetch(`${SB_URL}/rest/v1/revenue_ledger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify({
            driver_id: ctx.driverId, source_type: 'TAXI', activity_type: 'TAXI_TRIP',
            entry_type: 'CREDIT', gross_amount: finalAmount, fee_amount: 0,
            tip_amount: 0, adjustment_amount: 0, net_amount: finalAmount,
            currency: 'CAD', jurisdiction: 'QC',
            activity_date: now.split('T')[0],
            is_settled: true, settled_at: now,
            source_reference: `RESET-${trip.id.slice(0, 8)}`,
            notes: 'Course fermée automatiquement — reset taximètre',
          }),
        })
      }
      closedTrips++
    }

    // 2. Réinitialiser le taximètre
    const txmRes = await fetch(
      `${SB_URL}/rest/v1/taximeters?driver_id=eq.${ctx.driverId}&select=id`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const txms = await txmRes.json() as Array<{id:string}>
    for (const txm of txms) {
      await patch(`taximeters?id=eq.${txm.id}`, {
        status: 'READY', current_mode: 'AVAILABLE', updated_at: now,
      })
    }

    return apiSuccess({
      ok: true,
      message: `Taximètre réinitialisé · ${closedTrips} course(s) fermée(s)`,
      closed_trips: closedTrips,
    })
  } catch (err) {
    return apiError('Erreur reset: ' + String(err), 500)
  }
}
