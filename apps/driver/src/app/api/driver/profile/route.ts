// GET/PUT /api/driver/profile — Schéma V2 réel
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY
             ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
             ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` }
  })
  return res.json() as Promise<unknown[]>
}

export async function GET(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil chauffeur introuvable — compte non configuré', 404)

  try {
    // Profil principal
    const profiles = await sbGet(
      `driver_profiles?id=eq.${ctx.driverId}&select=id,driver_number,first_name,last_name,preferred_name,phone,province,country,language,status,identity_verification_status,business_status,onboarding_completed_at,created_at`
    ) as Array<Record<string, unknown>>

    if (!profiles.length) return apiError('Profil introuvable', 404)
    const profile = profiles[0]!

    // Véhicule
    const vehicles = await sbGet(
      `vehicles?driver_id=eq.${ctx.driverId}&is_active=eq.true&select=id,vehicle_number,make,model,year,color,vehicle_type,fuel_type,license_plate_masked,taximeter_status,vehicle_status&limit=1`
    )

    // Wallet
    const wallets = await sbGet(
      `wallet_accounts?driver_id=eq.${ctx.driverId}&select=id,currency,is_active&limit=1`
    )

    // Tax account
    const taxAccounts = await sbGet(
      `tax_accounts?driver_id=eq.${ctx.driverId}&select=id,tps_status,tvq_status,filing_frequency,tax_account_status&limit=1`
    )

    // Plateformes connectées
    const platforms = await sbGet(
      `driver_provider_accounts?driver_id=eq.${ctx.driverId}&provider_account_status=eq.ACTIVE&select=public_provider_account_id,display_name,provider_account_status,last_sync_at`
    )

    // Revenue summary ce mois
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const ledger = await sbGet(
      `revenue_ledger?driver_id=eq.${ctx.driverId}&activity_date=gte.${monthStart}&select=gross_amount,net_amount,tip_amount,fee_amount,source_type`
    ) as Array<Record<string, string>>

    const totalGross = ledger.reduce((s, r) => s + parseFloat(r['gross_amount'] ?? '0'), 0)
    const totalNet   = ledger.reduce((s, r) => s + parseFloat(r['net_amount']   ?? '0'), 0)
    const totalTips  = ledger.reduce((s, r) => s + parseFloat(r['tip_amount']   ?? '0'), 0)

    // Onboarding steps
    const steps = await sbGet(
      `driver_onboarding_steps?driver_id=eq.${ctx.driverId}&select=step_key,status,completed_at`
    )

    return apiSuccess({
      profile: {
        ...profile,
        email: ctx.email,
      },
      vehicle:      vehicles[0] ?? null,
      wallet:       wallets[0] ?? null,
      tax_account:  taxAccounts[0] ?? null,
      platforms,
      onboarding_steps: steps,
      revenue_summary: {
        total_gross: totalGross.toFixed(2),
        total_net:   totalNet.toFixed(2),
        total_tips:  totalTips.toFixed(2),
        total_activities: ledger.length.toString(),
        month: monthStart,
      }
    })
  } catch (err) {
    console.error('[profile]', err)
    return apiError('Erreur serveur', 500)
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  if (!ctx.driverId) return apiError('Profil introuvable', 404)

  try {
    const body = await req.json() as Record<string, string>
    const patch: Record<string, string> = {}
    if (body['firstName'])         patch['first_name']      = body['firstName']
    if (body['lastName'])          patch['last_name']        = body['lastName']
    if (body['preferredLanguage']) patch['language']         = body['preferredLanguage']
    if (body['phone'])             patch['phone']            = body['phone']
    patch['updated_at'] = new Date().toISOString()

    const key = SB_KEY()
    await fetch(`${SB_URL}/rest/v1/driver_profiles?id=eq.${ctx.driverId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    })

    return apiSuccess({ message: 'Profil mis à jour' })
  } catch {
    return apiError('Erreur serveur', 500)
  }
}
