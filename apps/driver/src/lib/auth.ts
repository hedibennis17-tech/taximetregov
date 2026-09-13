// ================================================================
// TAXIMÈTRE.GOV — AUTH MIDDLEWARE SERVEUR
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiError } from './db'
import { sql } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

export interface AuthContext {
  userId:   string
  email:    string
  role:     string
  driverId: string | null
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | Response> {
  // Récupérer le token du header Authorization
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies.get('session_token')?.value ?? ''

  if (!token) return apiError('Non authentifié — connectez-vous', 401)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return apiError('Configuration serveur manquante', 503)

  try {
    // Valider le token avec Supabase
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) return apiError('Session invalide — reconnectez-vous', 401)

    // Chercher le profil driver
    const db = getDb()
    const rows = await db.execute(sql`
      SELECT dp.id as driver_id
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE u.email = ${user.email ?? ''}
         OR dp.user_id::text = ${user.id}
      LIMIT 1
    `).catch(() => [] as unknown[])

    const driverId = (rows as { driver_id: string }[])[0]?.driver_id ?? null

    return {
      userId:   user.id,
      email:    user.email ?? '',
      role:     'DRIVER',
      driverId,
    }
  } catch (err) {
    console.error('[requireAuth]', err)
    return apiError('Erreur authentification', 500)
  }
}

export function requireGovRole(ctx: AuthContext): Response | null {
  const govRoles = ['SUPER_ADMIN', 'GOV_ADMIN', 'GOV_AUDITOR', 'GOV_TAX_OFFICER', 'GOV_INSPECTOR']
  if (!govRoles.includes(ctx.role)) return apiError('Accès gouvernemental requis', 403)
  return null
}

export function requireDriverScope(ctx: AuthContext, driverId: string): Response | null {
  if (ctx.role === 'DRIVER' && ctx.driverId !== driverId) return apiError('Accès refusé', 403)
  return null
}
