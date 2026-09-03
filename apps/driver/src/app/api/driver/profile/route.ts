// GET/PUT /api/driver/profile
import { NextRequest } from 'next/server'
import { db, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const result = await db.execute(sql`
      SELECT
        dp.id,
        dp.public_driver_id,
        dp.first_name,
        dp.last_name,
        dp.preferred_language,
        dp.verification_status,
        dp.onboarding_status,
        dp.driver_license_number_masked,
        dp.phone_number_masked,
        dp.created_at,
        -- Wallet balance (computed)
        COALESCE((
          SELECT
            SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END)
          FROM wallet_entries we
          JOIN wallet_accounts wa ON wa.id = we.wallet_account_id
          WHERE wa.driver_id = dp.id
        ), 0) as wallet_balance,
        -- Active platforms
        (
          SELECT json_agg(json_build_object(
            'provider', p.display_name,
            'status', dpa.connection_status
          ))
          FROM driver_provider_accounts dpa
          JOIN providers p ON p.id = dpa.provider_id
          WHERE dpa.driver_id = dp.id
            AND dpa.connection_status = 'CONNECTED'
        ) as connected_platforms
      FROM driver_profiles dp
      WHERE dp.id = ${ctx.driverId}
    `)

    if (!result.length) return apiError('Profil introuvable', 404)

    return apiSuccess(result[0])
  } catch {
    return apiError('Erreur serveur', 500)
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const { firstName, lastName, preferredLanguage } = await req.json()

    await db.execute(sql`
      UPDATE driver_profiles
      SET
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name),
        preferred_language = COALESCE(${preferredLanguage}, preferred_language),
        updated_at = now()
      WHERE id = ${ctx.driverId}
    `)

    return apiSuccess({ message: 'Profil mis à jour' })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
