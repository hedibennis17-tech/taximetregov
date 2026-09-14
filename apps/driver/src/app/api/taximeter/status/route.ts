import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/taximeters?driver_id=eq.${ctx.driverId}&select=id,status,current_mode,public_taximeter_id,vehicle_id,device_id&limit=1`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const taximeters = await res.json() as Array<{ id: string; status: string; current_mode: string; public_taximeter_id: string }>

    if (!taximeters.length) return apiSuccess({ hasActiveMeter: false, taximeter: null })

    const txm = taximeters[0]!
    let activeTrip = null

    if (txm.status === 'IN_TRIP') {
      const tripRes = await fetch(
        `${SB_URL}/rest/v1/taxi_trips?taximeter_id=eq.${txm.id}&trip_status=in.(STARTED,PAUSED)&select=id,public_trip_id,trip_reference,trip_status,distance_meters,elapsed_seconds,waiting_seconds,started_at,fare_snapshot&limit=1`,
        { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
      )
      const trips = await tripRes.json() as unknown[]
      activeTrip = trips[0] ?? null
    }

    return apiSuccess({
      hasActiveMeter: txm.status === 'IN_TRIP',
      taximeter: { ...txm, active_trip: activeTrip },
    })
  } catch (err) {
    return apiError('Erreur status: ' + String(err), 500)
  }
}
