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
      `${SB_URL}/rest/v1/taxi_trips?driver_id=eq.${ctx.driverId}&select=id,public_trip_id,trip_reference,trip_status,distance_meters,elapsed_seconds,final_amount,estimated_amount,currency,started_at,completed_at&order=started_at.desc&limit=50`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const trips = await res.json() as unknown[]
    return apiSuccess({ trips })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
