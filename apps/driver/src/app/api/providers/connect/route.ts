// ================================================================
// POST /api/providers/connect — Initier connexion OAuth provider
// ================================================================
// RÈGLE ABSOLUE: MOCK_ONLY jusqu'à approbation partenaire
// Le driver ne fournit JAMAIS son mot de passe Uber/Lyft/etc.
// Architecture: Driver → Taximètre.gov → Provider OAuth → Token
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sql } from 'drizzle-orm'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable', 404)

  try {
    const db = getDb()
    const { providerId, providerCode } = await req.json()
    if (!providerId && !providerCode) {
      return apiError('providerId ou providerCode requis', 400)
    }

    // Récupérer le provider
    const providers = await db.execute(sql`
      SELECT
        p.id, p.provider_code, p.display_name, p.status,
        pc.status         as connector_status,
        pc.auth_type,
        pc.partner_approval_reference,
        pc.supports_oauth
      FROM providers p
      LEFT JOIN platform_connectors pc ON pc.provider_id = p.id
      WHERE ${providerCode
        ? sql`p.provider_code = ${providerCode}`
        : sql`p.id = ${providerId}`}
      LIMIT 1
    `)

    if (!providers.length) {
      return apiError('Provider introuvable', 404)
    }

    const provider = providers[0] as {
      id: string; provider_code: string; display_name: string
      status: string; connector_status: string; auth_type: string
      partner_approval_reference: string | null; supports_oauth: boolean
    }

    // Vérification MOCK_ONLY
    const isMockOnly = provider.connector_status === 'MOCK_ONLY'
      || !provider.partner_approval_reference

    // Vérifier si déjà connecté
    const existing = await db.execute(sql`
      SELECT id, connection_status FROM driver_provider_accounts
      WHERE driver_id = ${ctx.driverId} AND provider_id = ${provider.id}
      LIMIT 1
    `)

    if (existing.length > 0) {
      const acc = existing[0] as { id: string; connection_status: string }
      if (acc.connection_status === 'CONNECTED') {
        return apiError(`Déjà connecté à ${provider.display_name}`, 409)
      }
    }

    if (isMockOnly) {
      // MODE MOCK: simuler une connexion pour développement
      // En production: rediriger vers OAuth du provider
      const mockAccountId = randomBytes(16).toString('hex')

      if (existing.length > 0) {
        // Mettre à jour le compte existant
        const acc = existing[0] as { id: string }
        await db.execute(sql`
          UPDATE driver_provider_accounts SET
            connection_status = 'CONNECTED',
            connected_at      = now(),
            updated_at        = now()
          WHERE id = ${acc.id}
        `)
      } else {
        // Créer un nouveau compte provider
        await db.execute(sql`
          INSERT INTO driver_provider_accounts (
            id, driver_id, provider_id,
            connection_status, connection_type,
            provider_driver_id_masked,
            connected_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            ${ctx.driverId},
            ${provider.id},
            'CONNECTED',
            'OAUTH_MOCK',
            ${'****' + mockAccountId.slice(-4)},
            now(), now(), now()
          )
        `)
      }

      // Audit
      await db.execute(sql`
        INSERT INTO audit_logs (
          id, actor_id, action, module, resource_type, resource_id,
          severity, result, actor_type, occurred_at, created_at
        ) VALUES (
          gen_random_uuid(), ${ctx.userId},
          'PROVIDER_CONNECTED_MOCK', 'PROVIDER',
          'driver_provider_account', ${provider.id},
          'INFO', 'SUCCESS', 'USER', now(), now()
        )
      `)

      return apiSuccess({
        connected:    true,
        isMockOnly:   true,
        providerCode: provider.provider_code,
        displayName:  provider.display_name,
        status:       'CONNECTED',
        note:         'Mode développement — connexion simulée. Approbation partenaire officielle requise pour production.',
      })
    }

    // MODE PRODUCTION (quand approbation obtenue):
    // Générer state OAuth + rediriger vers provider
    // const oauthState = randomBytes(32).toString('base64url')
    // const oauthUrl = buildOAuthUrl(provider, oauthState)
    // return apiSuccess({ redirectUrl: oauthUrl, state: oauthState })

    return apiError(
      `${provider.display_name}: approbation programme partenaire officielle requise`,
      503
    )
  } catch (err) {
    console.error('[providers/connect]', err)
    return apiError('Erreur serveur', 500)
  }
}
