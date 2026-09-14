import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  return res.json() as Promise<unknown>
}

async function sbPatch(path: string, body: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  return res.status
}

// GET = diagnostic
export async function GET(req: NextRequest) {
  const hediUser = await sbGet(`users?email=eq.hedibennis70@gmail.com&select=id,email,status`)
  const taximeters = await sbGet(`taximeters?select=id,driver_id,status,current_mode`)
  const activeTrips = await sbGet(`taxi_trips?trip_status=in.(STARTED,PAUSED)&select=id,trip_reference,trip_status,driver_id,started_at`)

  return apiSuccess({ hedi_user: hediUser, taximeters, active_trips: activeTrips })
}

// POST = fix forcé — ferme toutes les courses actives de Hedi
export async function POST(req: NextRequest) {
  const now = new Date().toISOString()
  const results: string[] = []

  try {
    // 1. Trouver le driver_id de Hedi
    const users = await sbGet(`users?email=eq.hedibennis70@gmail.com&select=id`) as Array<{id:string}>
    if (!users[0]) return apiError('User Hedi introuvable', 404)

    const profiles = await sbGet(`driver_profiles?user_id=eq.${users[0].id}&select=id`) as Array<{id:string}>
    if (!profiles[0]) return apiError('Profile introuvable', 404)
    const driverId = profiles[0].id

    // 2. Fermer toutes les courses actives
    const trips = await sbGet(
      `taxi_trips?driver_id=eq.${driverId}&trip_status=in.(STARTED,PAUSED)&select=id,trip_reference`
    ) as Array<{id:string; trip_reference:string}>

    for (const t of trips) {
      const status = await sbPatch(`taxi_trips?id=eq.${t.id}`, {
        trip_status: 'COMPLETED',
        final_amount: 3.50,
        completed_at: now,
        updated_at: now,
      })
      results.push(`Trip ${t.trip_reference}: PATCH ${status}`)
    }

    // 3. Reset tous les taximetres de Hedi
    const txms = await sbGet(`taximeters?driver_id=eq.${driverId}&select=id`) as Array<{id:string}>
    for (const t of txms) {
      const status = await sbPatch(`taximeters?id=eq.${t.id}`, {
        status: 'READY', current_mode: 'AVAILABLE', updated_at: now,
      })
      results.push(`Taximeter ${t.id.slice(0,8)}: PATCH ${status}`)
    }

    // 4. Aussi fermer par trip_id connu
    const knownTripId = '69954100-095f-4028-9dc4-ff039d3da5e1'
    const knownTxmId  = 'd9331e4d-2e71-4ed8-9e9d-9790bf3e554c'
    await sbPatch(`taxi_trips?id=eq.${knownTripId}`, { trip_status:'COMPLETED', final_amount:3.50, completed_at:now, updated_at:now })
    await sbPatch(`taximeters?id=eq.${knownTxmId}`, { status:'READY', current_mode:'AVAILABLE', updated_at:now })
    results.push(`Direct fix: trip + taximeter réinitialisés`)

    return apiSuccess({ ok: true, fixed: results, driver_id: driverId })
  } catch (err) {
    return apiError('Erreur: ' + String(err), 500)
  }
}
