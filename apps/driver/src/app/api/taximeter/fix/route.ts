import { type NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbPatch(path: string, body: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  return res.status
}
async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } })
  return res.json() as Promise<unknown[]>
}

export async function GET(_req: NextRequest) {
  const now = new Date().toISOString()
  const results: string[] = []
  try {
    // 1. Fermer toutes les courses actives
    const trips = await sbGet(`taxi_trips?trip_status=in.(STARTED,PAUSED)&select=id,trip_reference`)
    for (const t of trips as Array<{id:string;trip_reference:string}>) {
      const s = await sbPatch(`taxi_trips?id=eq.${t.id}`, { trip_status:'COMPLETED', final_amount:3.50, completed_at:now, updated_at:now })
      results.push(`Course ${t.trip_reference}: HTTP ${s}`)
    }
    // 2. Reset taximetres IN_TRIP
    const txms = await sbGet(`taximeters?status=eq.IN_TRIP&select=id`)
    for (const t of txms as Array<{id:string}>) {
      const s = await sbPatch(`taximeters?id=eq.${t.id}`, { status:'READY', current_mode:'AVAILABLE', updated_at:now })
      results.push(`Taximetre ${t.id.slice(0,8)}: HTTP ${s}`)
    }
    // 3. Fix direct IDs connus (Hedi)
    const s1 = await sbPatch(`taxi_trips?id=eq.69954100-095f-4028-9dc4-ff039d3da5e1`, { trip_status:'COMPLETED', final_amount:3.50, completed_at:now, updated_at:now })
    const s2 = await sbPatch(`taximeters?id=eq.d9331e4d-2e71-4ed8-9e9d-9790bf3e554c`, { status:'READY', current_mode:'AVAILABLE', updated_at:now })
    results.push(`Fix direct: trip=${s1} taximeter=${s2}`)

    const remaining = await sbGet(`taxi_trips?trip_status=in.(STARTED,PAUSED)&select=trip_reference`)
    return apiSuccess({ ok: true, actions: results, remaining_active: remaining })
  } catch (err) { return apiError('Erreur: ' + String(err), 500) }
}
