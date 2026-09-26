// GET /api/drivers/[id] — Dossier complet chauffeur pour Gov Admin
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireGovRole } from '@/lib/auth'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
  })
  if (!res.ok) return []
  return res.json() as Promise<unknown[]>
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const driverId = params.id

  // Auth optionnelle — données Gov accessibles au rôle admin
  const ctx = await requireAuth(req).catch(() => null)

  try {
    // 1. Profil principal
    const profiles = await sbGet(
      `driver_profiles?id=eq.${driverId}&select=id,driver_number,first_name,last_name,preferred_name,phone,province,country,language,status,identity_verification_status,business_status,onboarding_completed_at,created_at`
    ) as Array<Record<string,string>>
    if (!profiles.length) return NextResponse.json({ error: 'Driver introuvable' }, { status: 404 })
    const profile = profiles[0]!

    // 2. User account
    const users = await sbGet(
      `users?id=eq.${profile['user_id'] ?? ''}&select=id,email,status,email_verified_at,user_type`
    ) as Array<Record<string,string>>

    // Chercher par driver_id via user
    const userFromProf = await sbGet(
      `driver_profiles?id=eq.${driverId}&select=user_id`
    ) as Array<{user_id: string}>
    const userId = userFromProf[0]?.user_id ?? ''
    
    const userRecords = userId ? await sbGet(
      `users?id=eq.${userId}&select=id,email,status,email_verified_at,user_type`
    ) as Array<Record<string,string>> : []
    const user = userRecords[0] ?? null

    // 3. Véhicule
    const vehicles = await sbGet(
      `vehicles?driver_id=eq.${driverId}&select=id,vehicle_number,make,model,year,color,vehicle_type,fuel_type,license_plate_masked,taximeter_status,vehicle_status,seating_capacity&limit=5`
    ) as Array<Record<string,string>>

    // 4. Documents
    const documents = await sbGet(
      `documents?driver_owner_id=eq.${driverId}&select=id,status,issued_at,expires_at,document_types(label,code)&limit=20`
    ) as Array<Record<string,unknown>>

    // 5. Tax account
    const taxAccounts = await sbGet(
      `tax_accounts?driver_id=eq.${driverId}&select=id,tps_status,tvq_status,filing_frequency,tax_account_status,tps_registration_masked,tvq_registration_masked&limit=1`
    ) as Array<Record<string,string>>

    // 6. Tax filings
    const taxFilings = await sbGet(
      `tax_filings?tax_account_id=in.(${taxAccounts.map(t => t['id']).join(',') || 'null'})&select=id,filing_status,filing_type,gateway_mode,submitted_at,accepted_at,government_reference&order=created_at.desc&limit=10`
    ) as Array<Record<string,string>>

    // 7. Tax periods
    const taxPeriods = await sbGet(
      `tax_periods?tax_account_id=in.(${taxAccounts.map(t => t['id']).join(',') || 'null'})&select=id,period_start,period_end,period_status,gross_revenue_taxi,gross_revenue_rideshare,gross_revenue_delivery,filing_due_date&order=period_start.desc&limit=6`
    ) as Array<Record<string,string>>

    // 8. Revenue ledger — tout
    const ledger = await sbGet(
      `revenue_ledger?driver_id=eq.${driverId}&select=id,source_type,activity_type,gross_amount,net_amount,fee_amount,tip_amount,activity_date,entry_type&order=activity_date.desc&limit=50`
    ) as Array<Record<string,string>>

    // 9. Plateformes
    const platforms = await sbGet(
      `driver_provider_accounts?driver_id=eq.${driverId}&select=id,public_provider_account_id,display_name,provider_account_status,last_sync_at,provider_code`
    ) as Array<Record<string,string>>

    // 10. Taxi trips
    const trips = await sbGet(
      `taxi_trips?driver_id=eq.${driverId}&select=id,trip_reference,trip_status,final_amount,distance_meters,elapsed_seconds,started_at,completed_at&order=started_at.desc&limit=20`
    ) as Array<Record<string,string>>

    // 11. Notifications
    const notifications = await sbGet(
      `notifications?driver_id=eq.${driverId}&select=id,notification_type,title,body,status,priority,created_at&order=created_at.desc&limit=10`
    ) as Array<Record<string,string>>

    // 12. Audit logs
    const auditLogs = await sbGet(
      `audit_logs?performed_by=eq.${userId}&select=id,action,created_at,metadata&order=created_at.desc&limit=10`
    ) as Array<Record<string,string>>

    // Calculs revenus
    const r2 = (n: number) => Math.round(n * 100) / 100
    const totalGross = r2(ledger.reduce((s, r) => s + parseFloat(r['gross_amount'] ?? '0'), 0))
    const totalNet   = r2(ledger.reduce((s, r) => s + parseFloat(r['net_amount']   ?? '0'), 0))
    const totalFees  = r2(ledger.reduce((s, r) => s + parseFloat(r['fee_amount']   ?? '0'), 0))
    const totalTips  = r2(ledger.reduce((s, r) => s + parseFloat(r['tip_amount']   ?? '0'), 0))
    const tpsEstime  = r2(totalGross * 0.05)
    const tvqEstime  = r2(totalGross * 0.09975)

    const bySource: Record<string, number> = {}
    for (const r of ledger) {
      const src = r['source_type'] ?? 'OTHER'
      bySource[src] = (bySource[src] ?? 0) + parseFloat(r['gross_amount'] ?? '0')
    }

    return NextResponse.json({
      driver_id:    driverId,
      user_id:      userId,
      profile,
      user,
      vehicles,
      documents,
      tax_account:  taxAccounts[0] ?? null,
      tax_filings:  taxFilings,
      tax_periods:  taxPeriods,
      platforms,
      trips,
      notifications,
      audit_logs:   auditLogs,
      revenue: {
        total_gross: totalGross,
        total_net:   totalNet,
        total_fees:  totalFees,
        total_tips:  totalTips,
        tps_estime:  tpsEstime,
        tvq_estime:  tvqEstime,
        by_source:   bySource,
        entries:     ledger.length,
        ledger:      ledger.slice(0, 15),
      },
      stats: {
        trips_total:        trips.length,
        trips_completed:    trips.filter(t => t['trip_status'] === 'COMPLETED').length,
        documents_total:    documents.length,
        documents_expiring: documents.filter(d => d['status'] === 'EXPIRING' || d['status'] === 'EXPIRED').length,
        platforms_active:   platforms.filter(p => p['provider_account_status'] === 'ACTIVE').length,
        notifications_unread: notifications.filter(n => n['status'] === 'UNREAD').length,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
