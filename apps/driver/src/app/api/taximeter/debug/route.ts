import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  return res.json() as Promise<unknown>
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''

  try {
    const ctx = await requireAuth(req)
    const authed = !(ctx instanceof Response)
    const driverId = authed ? (ctx as { driverId: string | null }).driverId : null

    const taximeters = driverId ? await sbGet(
      `taximeters?driver_id=eq.${driverId}&select=id,status,current_mode,public_taximeter_id`
    ) : null

    const activeTrips = driverId ? await sbGet(
      `taxi_trips?driver_id=eq.${driverId}&trip_status=in.(STARTED,PAUSED)&select=id,public_trip_id,trip_reference,trip_status,started_at&order=started_at.desc&limit=5`
    ) : null

    const allTrips = driverId ? await sbGet(
      `taxi_trips?driver_id=eq.${driverId}&select=id,trip_reference,trip_status,started_at&order=started_at.desc&limit=5`
    ) : null

    return apiSuccess({
      auth: {
        token_present: !!token,
        token_length: token.length,
        authenticated: authed,
        driver_id: driverId,
      },
      taximeters,
      active_trips: activeTrips,
      recent_trips: allTrips,
      env: {
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    })
  } catch (err) {
    return apiError('Debug error: ' + String(err), 500)
  }
}
