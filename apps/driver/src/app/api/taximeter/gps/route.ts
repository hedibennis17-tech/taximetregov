import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)
  try {
    const { tripId, latitude, longitude, accuracy, speedKmh, distanceDelta } = await req.json() as Record<string, unknown>
    // GPS points
    await fetch(`${SB_URL}/rest/v1/trip_gps_points`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' }, body: JSON.stringify({ trip_id: tripId, latitude, longitude, accuracy_meters: accuracy, speed_kmh: speedKmh, recorded_at: new Date().toISOString() }) })
    // Update distance
    if (distanceDelta && Number(distanceDelta) > 0) {
      const trips = await (await fetch(`${SB_URL}/rest/v1/taxi_trips?id=eq.${tripId}&select=distance_meters`, { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } })).json() as Array<{distance_meters: number}>
      if (trips[0]) {
        await fetch(`${SB_URL}/rest/v1/taxi_trips?id=eq.${tripId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' }, body: JSON.stringify({ distance_meters: (trips[0].distance_meters ?? 0) + Number(distanceDelta), updated_at: new Date().toISOString() }) })
      }
    }
    return apiSuccess({ recorded: true })
  } catch (err) { return apiError('Erreur GPS: ' + String(err), 500) }
}
