// ================================================================
// POST /api/auth/login
// Authentification chauffeur et admin
// ================================================================

import { NextRequest } from 'next/server'
import { db, apiSuccess, apiError } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createHash, randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return apiError('Email et mot de passe requis', 400)
    }

    // Chercher l'utilisateur
    const users = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.password_hash,
        u.status,
        r.code as role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.email = ${email.toLowerCase()}
      LIMIT 1
    `)

    if (!users.length) {
      return apiError('Email ou mot de passe incorrect', 401)
    }

    const user = users[0] as {
      id: string
      email: string
      password_hash: string
      status: string
      role: string
    }

    // Vérifier statut compte
    if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      return apiError('Compte suspendu ou verrouillé', 403)
    }

    // Vérifier mot de passe (hash SHA-256 simple pour le dev)
    // En production: Argon2id via le service auth
    const passwordHash = createHash('sha256').update(password).digest('hex')
    const isValid = user.password_hash === passwordHash
      || user.password_hash.includes('placeholder') // Premier login

    if (!isValid) {
      return apiError('Email ou mot de passe incorrect', 401)
    }

    // Créer token de session
    const sessionToken = randomBytes(48).toString('base64url')
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex')

    await db.execute(sql`
      INSERT INTO user_sessions (
        id, user_id, session_token_hash, status,
        expires_at, created_at, last_activity_at
      ) VALUES (
        gen_random_uuid(),
        ${user.id},
        ${tokenHash},
        'ACTIVE',
        now() + interval '24 hours',
        now(),
        now()
      )
    `)

    // Récupérer le profil driver si applicable
    const driverProfile = await db.execute(sql`
      SELECT id, public_driver_id, verification_status
      FROM driver_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `)

    const driver = driverProfile[0] as {
      id: string
      public_driver_id: string
      verification_status: string
    } | undefined

    return apiSuccess({
      token: sessionToken,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.role,
      },
      driver: driver ? {
        id:               driver.id,
        publicDriverId:   driver.public_driver_id,
        verificationStatus: driver.verification_status,
      } : null,
    })

  } catch (err) {
    console.error('[auth/login]', err)
    return apiError('Erreur serveur', 500)
  }
}
