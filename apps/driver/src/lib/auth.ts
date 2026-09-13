import { NextRequest } from 'next/server'
import { apiError } from './db'
import { createClient } from '@supabase/supabase-js'

export interface AuthContext {
  userId:   string
  email:    string
  role:     string
  driverId: string | null
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | Response> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return apiError('Non authentifié', 401)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return apiError('Config manquante', 503)

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!user || error) return apiError('Session invalide', 401)

    // Chercher le driver_profile via l'API REST (bypass RLS)
    const res = await fetch(
      `${url}/rest/v1/driver_profiles?select=id&user_id=eq.${user.id}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    const profiles = await res.json() as Array<{ id: string }>
    const driverId = profiles[0]?.id ?? null

    return { userId: user.id, email: user.email ?? '', role: 'DRIVER', driverId }
  } catch (err) {
    console.error('[requireAuth]', err)
    return apiError('Erreur auth', 500)
  }
}

export function requireGovRole(ctx: AuthContext): Response | null {
  const gov = ['SUPER_ADMIN','GOV_ADMIN','GOV_AUDITOR','GOV_TAX_OFFICER','GOV_INSPECTOR']
  if (!gov.includes(ctx.role)) return apiError('Accès gouvernemental requis', 403)
  return null
}

export function requireDriverScope(ctx: AuthContext, driverId: string): Response | null {
  if (ctx.role === 'DRIVER' && ctx.driverId !== driverId) return apiError('Accès refusé', 403)
  return null
}
