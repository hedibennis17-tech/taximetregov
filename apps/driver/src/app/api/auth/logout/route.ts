// POST /api/auth/logout
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'

import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const db = getDb()
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
      || req.cookies.get('session_token')?.value

    if (!token) return apiError('Non authentifié', 401)

    const tokenHash = createHash('sha256').update(token).digest('hex')

    await db.execute(sql`
      UPDATE user_sessions
      SET status = 'REVOKED', last_activity_at = now()
      WHERE session_token_hash = ${tokenHash}
    `)

    return apiSuccess({ message: 'Déconnecté avec succès' })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
