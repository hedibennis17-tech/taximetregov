// GET /api/drivers/[id] — Dossier chauffeur complet
import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  const { id } = await params

  try {
    const db = getDb()

    const [profile, revenue, trips, platforms, documents, taxAccount] = await Promise.all([
      // Profil complet
      db.execute(sql`
        SELECT
          dp.id, dp.public_driver_id,
          dp.first_name, dp.last_name,
          dp.verification_status, dp.onboarding_status,
          dp.preferred_language, dp.phone_number_masked,
          dp.created_at, dp.updated_at,
          u.email
        FROM driver_profiles dp
        JOIN users u ON u.id = dp.user_id
        WHERE dp.id = ${id}
        LIMIT 1
      `),

      // Revenus (3 derniers mois)
      db.execute(sql`
        SELECT
          source_type,
          SUM(gross_amount) as gross,
          SUM(tip_amount)   as tips,
          SUM(net_amount)   as net,
          COUNT(*)          as count,
          MAX(activity_date) as last_activity
        FROM revenue_ledger
        WHERE driver_id = ${id}
          AND activity_date >= now() - interval '3 months'
        GROUP BY source_type
        ORDER BY gross DESC
      `),

      // Courses récentes
      db.execute(sql`
        SELECT
          public_trip_id, trip_reference, trip_status,
          distance_meters, elapsed_seconds,
          final_amount, currency, started_at, completed_at
        FROM taxi_trips
        WHERE driver_id = ${id}
        ORDER BY created_at DESC
        LIMIT 10
      `),

      // Plateformes connectées
      db.execute(sql`
        SELECT
          p.display_name, p.provider_code,
          dpa.connection_status, dpa.connected_at,
          dpa.last_sync_at
        FROM driver_provider_accounts dpa
        JOIN providers p ON p.id = dpa.provider_id
        WHERE dpa.driver_id = ${id}
        ORDER BY dpa.connected_at DESC
      `),

      // Documents
      db.execute(sql`
        SELECT
          dt.label, d.status, d.expires_at,
          d.uploaded_at, d.verified_at
        FROM documents d
        JOIN document_types dt ON dt.id = d.document_type_id
        WHERE d.driver_id = ${id}
        ORDER BY d.uploaded_at DESC
        LIMIT 10
      `),

      // Compte fiscal
      db.execute(sql`
        SELECT
          ta.tps_status, ta.tvq_status,
          ta.tps_registration_masked, ta.tvq_registration_masked,
          ta.filing_frequency, ta.status
        FROM tax_accounts ta
        WHERE ta.driver_id = ${id}
        LIMIT 1
      `),
    ])

    if (!profile.length) return apiError('Chauffeur introuvable', 404)

    return apiSuccess({
      profile:    profile[0],
      revenue,
      trips,
      platforms,
      documents,
      taxAccount: taxAccount[0] ?? null,
    })
  } catch (err) {
    console.error('[gov/drivers/detail]', err)
    return apiError('Erreur serveur', 500)
  }
}
