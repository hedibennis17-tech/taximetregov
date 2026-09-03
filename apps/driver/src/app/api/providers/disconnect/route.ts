// POST /api/providers/disconnect — Déconnecter un provider
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const db = getDb()
    const { providerCode } = await req.json()
    if (!providerCode) return apiError('providerCode requis', 400)

    const result = await db.execute(sql`
      UPDATE driver_provider_accounts dpa
      SET
        connection_status = 'DISCONNECTED',
        disconnected_at   = now(),
        updated_at        = now()
      FROM providers p
      WHERE p.id = dpa.provider_id
        AND p.provider_code = ${providerCode}
        AND dpa.driver_id   = ${ctx.driverId}
        AND dpa.connection_status = 'CONNECTED'
      RETURNING dpa.id
    `)

    if (!result.length) {
      return apiError('Compte provider non trouvé ou déjà déconnecté', 404)
    }

    await db.execute(sql`
      INSERT INTO audit_logs (
        id, actor_id, action, module, resource_type,
        severity, result, actor_type, occurred_at, created_at
      ) VALUES (
        gen_random_uuid(), ${ctx.userId},
        'PROVIDER_DISCONNECTED', 'PROVIDER',
        'driver_provider_account',
        'INFO', 'SUCCESS', 'USER', now(), now()
      )
    `)

    return apiSuccess({
      disconnected: true,
      providerCode,
      note: 'Données historiques préservées — seule la connexion active est révoquée',
    })
  } catch (err) {
    console.error('[providers/disconnect]', err)
    return apiError('Erreur serveur', 500)
  }
}
