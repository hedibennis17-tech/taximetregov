import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  return res.json() as Promise<unknown>
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')

  // Chercher tous les cookies Supabase
  const cookies: Record<string,string> = {}
  req.cookies.getAll().forEach(c => {
    if (c.name.includes('auth') || c.name.includes('sb-') || c.name.includes('supabase')) {
      cookies[c.name] = c.value.slice(0, 50) + '...'
    }
  })

  // Essayer de valider le token si présent
  let supabaseUser = null
  if (token) {
    try {
      const sb = createClient(SB_URL!, KEY())
      const { data: { user } } = await sb.auth.getUser(token)
      supabaseUser = user ? { id: user.id, email: user.email } : null
    } catch { /* ignore */ }
  }

  // Chercher Hedi directement (pas besoin d'auth pour le debug)
  const hediUser = await sbGet(`users?email=eq.hedibennis70@gmail.com&select=id,email,status`)
  const hediProfile = await sbGet(`driver_profiles?select=id,driver_number,status&limit=3`)
  const taximeters = await sbGet(`taximeters?select=id,driver_id,status,current_mode&limit=5`)
  const activeTrips = await sbGet(`taxi_trips?trip_status=in.(STARTED,PAUSED)&select=id,trip_reference,trip_status,driver_id,started_at&limit=5`)

  return apiSuccess({
    request: {
      has_auth_header: !!token,
      token_length: token.length,
      auth_cookies: cookies,
      all_headers: Object.fromEntries(
        ['authorization','cookie','x-forwarded-for'].map(h => [h, req.headers.get(h)?.slice(0,80) ?? null])
      ),
    },
    supabase_user: supabaseUser,
    db: {
      hedi_user: hediUser,
      driver_profiles: hediProfile,
      taximeters,
      active_trips: activeTrips,
    },
    env: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      has_publishable_key: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  })
}
