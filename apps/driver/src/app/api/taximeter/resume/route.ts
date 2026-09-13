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
    const { tripReference } = await req.json() as { tripReference: string }
    await fetch(`${SB_URL}/rest/v1/taxi_trips?trip_reference=eq.${tripReference}&driver_id=eq.${ctx.driverId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' }, body: JSON.stringify({ trip_status: 'STARTED', updated_at: new Date().toISOString() }) })
    return apiSuccess({ status: 'STARTED', tripReference })
  } catch (err) { return apiError('Erreur resume: ' + String(err), 500) }
}
