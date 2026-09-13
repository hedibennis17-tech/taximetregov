// POST /api/auth/setup — Auto-création profil chauffeur
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return apiError('Token requis', 401)

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
    if (!user || error) return apiError('Token invalide', 401)

    const db = getDb()

    // Vérifier si profil existe déjà
    const existing = await db.execute(sql`
      SELECT dp.id, dp.public_driver_id
      FROM driver_profiles dp
      WHERE dp.user_id::text = ${user.id}
         OR EXISTS (
           SELECT 1 FROM users u
           WHERE u.id = dp.user_id AND u.email = ${user.email ?? ''}
         )
      LIMIT 1
    `).catch(() => [] as unknown[])

    if ((existing as unknown[]).length > 0) {
      const row = (existing as { id: string; public_driver_id: string }[])[0]!
      return apiSuccess({ alreadyExists: true, driverId: row.id, publicDriverId: row.public_driver_id })
    }

    // Créer l'utilisateur
    const firstName = (user.user_metadata?.first_name as string | undefined) ?? 'Chauffeur'
    const lastName  = (user.user_metadata?.last_name  as string | undefined) ?? ''

    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, status, email_verified, created_at, updated_at)
      VALUES (${user.id}::uuid, ${user.email ?? ''}, 'SUPABASE_AUTH', 'ACTIVE', true, now(), now())
      ON CONFLICT (id) DO UPDATE SET email = ${user.email ?? ''}, updated_at = now()
    `)

    // Rôle DRIVER
    await db.execute(sql`
      INSERT INTO user_roles (id, user_id, role_id, created_at)
      SELECT gen_random_uuid(), ${user.id}::uuid, r.id, now()
      FROM roles r WHERE r.code = 'DRIVER'
      ON CONFLICT DO NOTHING
    `)

    // Numéro séquentiel
    const seq = await db.execute(sql`SELECT LPAD((COUNT(*) + 1)::text, 8, '0') as seq FROM driver_profiles`)
    const publicId = `DRV-QC-${(seq[0] as { seq: string }).seq}`

    // Juridiction QC
    const jur = await db.execute(sql`SELECT id FROM jurisdictions WHERE code = 'QC' LIMIT 1`)
    const jurId = (jur[0] as { id: string } | undefined)?.id

    // Profil
    await db.execute(sql`
      INSERT INTO driver_profiles (
        id, user_id, public_driver_id, government_driver_id,
        first_name, last_name, preferred_language,
        verification_status, onboarding_status,
        jurisdiction_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${user.id}::uuid,
        ${publicId}, ${publicId},
        ${firstName}, ${lastName}, 'fr',
        'PENDING', 'IN_PROGRESS',
        ${jurId ?? null}::uuid, now(), now()
      ) ON CONFLICT DO NOTHING
    `)

    const profile = await db.execute(sql`
      SELECT id, public_driver_id FROM driver_profiles WHERE user_id = ${user.id}::uuid LIMIT 1
    `)
    const p = profile[0] as { id: string; public_driver_id: string }

    // Wallet
    await db.execute(sql`
      INSERT INTO wallet_accounts (id, driver_id, currency, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${p.id}::uuid, 'CAD', 'ACTIVE', now(), now())
      ON CONFLICT (driver_id) DO NOTHING
    `)

    // Tax account
    if (jurId) {
      await db.execute(sql`
        INSERT INTO tax_accounts (id, driver_id, jurisdiction_id, status, tps_status, tvq_status, filing_frequency, created_at, updated_at)
        VALUES (gen_random_uuid(), ${p.id}::uuid, ${jurId}::uuid, 'PENDING', 'NOT_REGISTERED', 'NOT_REGISTERED', 'QUARTERLY', now(), now())
        ON CONFLICT (driver_id) DO NOTHING
      `)
    }

    return apiSuccess({
      created: true,
      driverId: p.id,
      publicDriverId: p.public_driver_id,
    })
  } catch (err) {
    console.error('[setup]', err)
    return apiError('Erreur création profil', 500)
  }
}
