// GET /api/enterprises/[id] — Enterprise 360° data depuis Supabase
// Source unique: providers, driver_provider_accounts, revenue_ledger, taxi_trips,
//               tax_calculations, tax_filings, audit_logs, notifications, documents, vehicles

import { type NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'count=exact' }
  })
  const data = await res.json() as unknown[]
  const count = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0')
  return { data, count }
}

// Données DEMO statiques Uber Québec (SYNTHETIC_DEMO)
// Source impact économique: Uber/Public First, déc. 2025 (PUBLIC_VERIFIED)
const UBER_DEMO = {
  enterprise_id: 'ENT-UBER-DEMO',
  name: 'Uber Canada Inc.',
  commercial_name: 'Uber Québec',
  neq: 'NOT_VERIFIED_DEMO',
  province: 'QC',
  city: 'Montréal',
  address: '1 Place Ville Marie, Bureau 3700 (DEMO)',
  postal_code: 'H3B 4M4 (DEMO)',
  website: 'https://www.uber.com/ca/fr-ca/',
  org_type: 'PLATFORM',
  status: 'DEMO',
  data_status: 'SYNTHETIC_DEMO',
  // Impact économique QC 2024 — PUBLIC_VERIFIED (Uber/Public First, déc. 2025)
  economic_impact_qc_2024: '1.9G$ (PUBLIC_VERIFIED — Uber/Public First, déc. 2025)',
  // Revenus internes Uber Québec — PRIVATE_NOT_AVAILABLE
  internal_revenue: 'PRIVATE_NOT_AVAILABLE',
  departments: [
    { id:'DEPT-UBER-TAXI',    name:'Uber Taxi',         service:'TAXI',     drivers_demo: 2800, active: true },
    { id:'DEPT-UBER-RIDES',   name:'Uber Rides',        service:'RIDESHARE',drivers_demo: 6200, active: true },
    { id:'DEPT-UBER-GREEN',   name:'Uber Green',        service:'GREEN',    drivers_demo: 1100, active: true },
    { id:'DEPT-UBER-EATS',    name:'Uber Eats',         service:'FOOD',     drivers_demo: 4800, active: true },
    { id:'DEPT-UBER-GROCERY', name:'Uber Eats Grocery', service:'GROCERY',  drivers_demo: 980,  active: true },
    { id:'DEPT-UBER-COURIER', name:'Uber Courier',      service:'DELIVERY', drivers_demo: 1520, active: true },
  ],
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  const enterpriseId = params.id
  if (enterpriseId !== 'ENT-UBER-DEMO') {
    // Pour les autres entreprises — données minimales DEMO
    return apiSuccess({
      enterprise_id: enterpriseId,
      data_status: 'SYNTHETIC_DEMO',
      message: 'Dossier complet disponible pour ENT-UBER-DEMO uniquement en mode DEMO',
    })
  }

  try {
    // 1. Providers (code UBER)
    const providers = await sbGet(`providers?code=eq.UBER&select=id,code,name,status,api_enabled,webhook_enabled`)

    // 2. Driver provider accounts (chauffeurs Uber)
    const driverAccounts = await sbGet(`driver_provider_accounts?provider_code=eq.UBER&select=id,driver_id,account_status,services&limit=50`)

    // 3. Revenue ledger Uber
    const revenueUber = await sbGet(`revenue_ledger?source_type=eq.UBER&select=id,gross_amount,net_amount,fee_amount,tip_amount,activity_date&limit=100`)

    // 4. Taxi trips Uber
    const trips = await sbGet(`taxi_trips?select=id,trip_status,final_amount,distance_meters,started_at&limit=50`)

    // 5. Tax accounts
    const taxAccounts = await sbGet(`tax_accounts?select=id,driver_id,tps_status,tvq_status,tax_account_status&limit=20`)

    // 6. Tax filings
    const taxFilings = await sbGet(`tax_filings?select=id,filing_status,filing_type,gateway_mode&limit=20`)

    // 7. Audit logs Uber
    const auditLogs = await sbGet(`audit_logs?action=like.*UBER*&select=id,action,created_at&limit=20`)

    // 8. Notifications
    const notifications = await sbGet(`notifications?select=id,notification_type,status,created_at&limit=10`)

    // 9. Documents
    const documents = await sbGet(`documents?select=id,status,issued_at&limit=20`)

    // 10. Vehicles
    const vehicles = await sbGet(`vehicles?select=id,make,model,year,vehicle_status&limit=20`)

    // Calculs depuis revenue_ledger
    const r2 = (n: number) => Math.round(n * 100) / 100
    const ledgerData = revenueUber.data as Array<Record<string,string>>
    const totalGross = ledgerData.reduce((s, r) => s + parseFloat(r['gross_amount'] ?? '0'), 0)
    const totalNet   = ledgerData.reduce((s, r) => s + parseFloat(r['net_amount'] ?? '0'), 0)
    const totalFees  = ledgerData.reduce((s, r) => s + parseFloat(r['fee_amount'] ?? '0'), 0)
    const totalTips  = ledgerData.reduce((s, r) => s + parseFloat(r['tip_amount'] ?? '0'), 0)
    const tpsDemo    = r2(totalGross * 0.05)
    const tvqDemo    = r2(totalGross * 0.09975)

    return apiSuccess({
      ...UBER_DEMO,
      kpis: {
        // Source: driver_provider_accounts (DB réelle)
        drivers_db:        driverAccounts.count,
        // Source: SYNTHETIC_DEMO
        drivers_demo:      UBER_DEMO.departments.reduce((s,d) => s + d.drivers_demo, 0),
        vehicles_db:       vehicles.count,
        departments:       UBER_DEMO.departments.length,
        // Source: revenue_ledger (DB réelle)
        activities_db:     revenueUber.count,
        trips_db:          trips.count,
        // Source: revenue_ledger calculé
        gross_revenue:     r2(totalGross),
        net_revenue:       r2(totalNet),
        fees:              r2(totalFees),
        tips:              r2(totalTips),
        tps_demo:          tpsDemo,
        tvq_demo:          tvqDemo,
        // Source: tax_filings (DB réelle)
        declarations_db:   taxFilings.count,
        payments_demo:     0,
        // Source: audit_logs (DB réelle)
        audits_db:         auditLogs.count,
        documents_db:      documents.count,
        alerts_db:         notifications.count,
        compliance_score:  85, // SYNTHETIC_DEMO
        api_connected:     providers.data.length > 0,
        webhook_active:    false,
      },
      supabase: {
        providers:             providers.data,
        driver_accounts_count: driverAccounts.count,
        revenue_entries_count: revenueUber.count,
        trips_count:           trips.count,
        tax_accounts_count:    taxAccounts.count,
        tax_filings_count:     taxFilings.count,
        audit_logs_count:      auditLogs.count,
        documents_count:       documents.count,
        vehicles_count:        vehicles.count,
        notifications_count:   notifications.count,
      },
      data_sources: {
        economic_impact_1_9B: 'PUBLIC_VERIFIED — Uber/Public First, déc. 2025',
        internal_revenues:    'PRIVATE_NOT_AVAILABLE',
        driver_list:          'SYNTHETIC_DEMO',
        transactions:         'SYNTHETIC_DEMO + revenue_ledger DB',
        tax_data:             'SYNTHETIC_DEMO — Estimation TPS 5% / TVQ 9.975%',
        fiscal_status:        'PUBLIC_VERIFIED — Revenu Québec: chauffeurs = travailleurs autonomes',
      },
    })
  } catch (err) {
    return apiError('Erreur Enterprise 360°: ' + String(err), 500)
  }
}
