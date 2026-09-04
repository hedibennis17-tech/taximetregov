// ================================================================
// POST /api/auth/setup
// Crée automatiquement le profil chauffeur après login Supabase
// Appelé depuis la page home au premier chargement
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return apiError('Token requis', 401)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return apiError('Configuration Supabase manquante', 503)
  }

  try {
    // 1. Valider le token Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!user || error) return apiError('Token invalide', 401)

    const db = getDb()

    // 2. Vérifier si le profil existe déjà
    const existing = await db.execute(sql`
      SELECT dp.id, dp.public_driver_id
      FROM driver_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE u.email = ${user.email ?? ''}
      LIMIT 1
    `).catch(() => [] as unknown[])

    if ((existing as unknown[]).length > 0) {
      const row = (existing as { id: string; public_driver_id: string }[])[0]!
      return apiSuccess({ alreadyExists: true, driverId: row.id, publicDriverId: row.public_driver_id })
    }

    // 3. Créer l'utilisateur dans notre table users
    const firstName = (user.user_metadata?.first_name as string | undefined) ?? ''
    const lastName  = (user.user_metadata?.last_name  as string | undefined) ?? ''

    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, status, email_verified, created_at, updated_at)
      VALUES (
        ${user.id}::uuid,
        ${user.email ?? ''},
        'SUPABASE_AUTH',
        'ACTIVE',
        true,
        now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET updated_at = now()
    `)

    // 4. Assigner le rôle DRIVER
    await db.execute(sql`
      INSERT INTO user_roles (id, user_id, role_id, created_at)
      SELECT gen_random_uuid(), ${user.id}::uuid, r.id, now()
      FROM roles r WHERE r.code = 'DRIVER'
      ON CONFLICT DO NOTHING
    `)

    // 5. Générer le public_driver_id séquentiel
    const seqResult = await db.execute(sql`
      SELECT COUNT(*) + 1 as seq FROM driver_profiles
    `)
    const seq = String((seqResult[0] as { seq: string }).seq).padStart(8, '0')
    const publicDriverId    = `DRV-QC-${seq}`
    const governmentDriverId = publicDriverId

    // 6. Récupérer la juridiction QC
    const jur = await db.execute(sql`
      SELECT id FROM jurisdictions WHERE code = 'QC' LIMIT 1
    `)
    const jurId = (jur[0] as { id: string } | undefined)?.id

    // 7. Créer le profil chauffeur
    await db.execute(sql`
      INSERT INTO driver_profiles (
        id, user_id, public_driver_id, government_driver_id,
        first_name, last_name, preferred_language,
        verification_status, onboarding_status,
        jurisdiction_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${user.id}::uuid,
        ${publicDriverId},
        ${governmentDriverId},
        ${firstName || 'Chauffeur'},
        ${lastName  || ''},
        'fr',
        'PENDING',
        'IN_PROGRESS',
        ${jurId ?? null}::uuid,
        now(), now()
      )
    `)

    // 8. Récupérer le nouveau profil
    const profile = await db.execute(sql`
      SELECT id, public_driver_id FROM driver_profiles
      WHERE user_id = ${user.id}::uuid LIMIT 1
    `)
    const p = profile[0] as { id: string; public_driver_id: string }

    // 9. Créer wallet + tax account
    await db.execute(sql`
      INSERT INTO wallet_accounts (id, driver_id, currency, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${p.id}::uuid, 'CAD', 'ACTIVE', now(), now())
      ON CONFLICT (driver_id) DO NOTHING
    `)

    if (jurId) {
      await db.execute(sql`
        INSERT INTO tax_accounts (id, driver_id, jurisdiction_id, status, tps_status, tvq_status, filing_frequency, created_at, updated_at)
        VALUES (gen_random_uuid(), ${p.id}::uuid, ${jurId}::uuid, 'PENDING', 'NOT_REGISTERED', 'NOT_REGISTERED', 'QUARTERLY', now(), now())
        ON CONFLICT (driver_id) DO NOTHING
      `)
    }

    return apiSuccess({
      created:        true,
      driverId:       p.id,
      publicDriverId: p.public_driver_id,
      email:          user.email,
      message:        'Profil chauffeur créé avec succès',
    })

  } catch (err) {
    console.error('[auth/setup]', err)
    return apiError('Erreur création profil', 500)
  }
}
