// ================================================================
// TAXIMÈTRE.GOV — AUTH MIDDLEWARE (DRIVER)
// Supporte: Supabase Auth token + session custom
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
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
    || req.cookies.get('session_token')?.value

  if (!token) return apiError('Non authentifié', 401)

  // 1. Essayer Supabase Auth token
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        // Chercher le driver_profile lié
        const db = getDb()
        const profiles = await db.execute(sql`
          SELECT dp.id
          FROM driver_profiles dp
          JOIN users u ON u.id = dp.user_id
          WHERE u.email = ${user.email ?? ''}
          LIMIT 1
        `).catch(() => [] as unknown[])

        const driverId = profiles.length
          ? (profiles[0] as { id: string }).id
          : null

        return {
          userId:   user.id,
          email:    user.email ?? '',
          role:     'DRIVER',
          driverId,
        }
      }
    } catch { /* continuer */ }
  }

  // 2. Fallback: session custom (user_sessions table)
  try {
    const db = getDb()
    const result = await db.execute(sql`
      SELECT s.user_id, u.email, r.code as role, dp.id as driver_id
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      WHERE s.session_token_hash = encode(sha256(${token}::bytea), 'hex')
        AND s.status = 'ACTIVE' AND s.expires_at > now()
      LIMIT 1
    `)
    if (result.length) {
      const row = result[0] as { user_id: string; email: string; role: string; driver_id: string | null }
      return { userId: row.user_id, email: row.email, role: row.role, driverId: row.driver_id }
    }
  } catch { /* ignore */ }

  return apiError('Non authentifié', 401)
}

export function requireDriverScope(ctx: AuthContext, driverId: string): Response | null {
  if (ctx.role === 'DRIVER' && ctx.driverId !== driverId) return apiError('Accès refusé', 403)
  return null
}

export function requireGovRole(ctx: AuthContext): Response | null {
  const govRoles = ['SUPER_ADMIN', 'GOV_ADMIN', 'GOV_AUDITOR', 'GOV_TAX_OFFICER', 'GOV_INSPECTOR']
  if (!govRoles.includes(ctx.role)) return apiError('Accès réservé aux utilisateurs gouvernementaux', 403)
  return null
}
