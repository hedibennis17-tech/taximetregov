// GET /api/auth/me — profil utilisateur courant
import { NextRequest } from 'next/server'
import { db, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx

  try {
    const profile = await db.execute(sql`
      SELECT
        dp.id,
        dp.public_driver_id,
        dp.first_name,
        dp.last_name,
        dp.verification_status,
        dp.onboarding_status,
        dp.driver_license_number_masked,
        dp.phone_number_masked,
        u.email,
        r.code as role
      FROM users u
      LEFT JOIN driver_profiles dp ON dp.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ${ctx.userId}
      LIMIT 1
    `)

    const p = profile[0] as Record<string, unknown>

    return apiSuccess({
      userId:   ctx.userId,
      email:    ctx.email,
      role:     ctx.role,
      driver:   p?.id ? {
        id:                 p.id,
        publicDriverId:     p.public_driver_id,
        firstName:          p.first_name,
        lastName:           p.last_name,
        verificationStatus: p.verification_status,
        onboardingStatus:   p.onboarding_status,
        driverLicenseMasked: p.driver_license_number_masked,
        phoneMasked:        p.phone_number_masked,
      } : null,
    })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
