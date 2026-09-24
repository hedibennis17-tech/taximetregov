// GET /api/fiscal — Données fiscales enterprise (depuis Supabase)
// TAXIMETER.GOV · Enterprise Gov · Source unique : Supabase
import { NextRequest } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { 'apikey': KEY(), 'Authorization': `Bearer ${KEY()}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase: ${await res.text()}`)
  return res.json()
}

const r2 = (n: number) => Math.round(n * 100) / 100

export async function GET(_req: NextRequest) {
  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    const [taxRecords, taxAccounts] = await Promise.all([
      sbGet(`provider_tax_records?select=id,tax_type,taxable_amount,reported_tax_amount,government_calculated_amount,variance_amount,tax_status,reporting_period_start,driver_id,driver_profiles(driver_number,first_name,last_name)&order=reporting_period_start.desc&limit=100`),
      sbGet(`tax_accounts?select=id,driver_id,tps_status,tvq_status,filing_frequency,tax_account_status,driver_profiles(driver_number,first_name,last_name)&limit=50`),
    ]) as [unknown[], unknown[]]

    // Agréger TPS/TVQ depuis revenue_ledger
    const now = new Date()
    const qStart = `${now.getFullYear()}-07-01`
    const ledger = await sbGet(
      `revenue_ledger?select=gross_amount,tip_amount,tax_amount&activity_date=gte.${qStart}`
    ) as Array<Record<string,string>>

    const gross = ledger.reduce((s,r) => s + parseFloat(r['gross_amount']??'0'), 0)
    const tps   = r2(gross * 0.05)
    const tvq   = r2(gross * 0.09975)

    return Response.json({
      taxRecords,
      taxAccounts,
      summary: {
        period: 'Q3 ' + now.getFullYear(),
        grossRevenue: r2(gross),
        tpsCollected: tps,
        tvqCollected: tvq,
        totalDue: r2(tps + tvq),
        status: 'PILOT_DEMO',
        note: 'NON TRANSMIS À REVENU QUÉBEC · DONNÉES SYNTHÉTIQUES',
      },
      source: 'SUPABASE',
      pilot: true,
    })

  } catch (err) {
    const gross = 204.00
    return Response.json({
      taxRecords: DEMO_TAX,
      taxAccounts: [],
      summary: {
        period: 'Q3 2026', grossRevenue: gross,
        tpsCollected: r2(gross*0.05), tvqCollected: r2(gross*0.09975),
        totalDue: r2(gross*0.14975),
        status: 'PILOT_DEMO', note: 'NON TRANSMIS À REVENU QUÉBEC · DONNÉES SYNTHÉTIQUES',
      },
      source: 'DEMO_FALLBACK', error: String(err), pilot: true,
    })
  }
}

const DEMO_TAX = [
  { id:'PTX-001', tax_type:'TPS_TVQ', taxable_amount:'28.75', reported_tax_amount:'4.30', government_calculated_amount:'4.30', variance_amount:'0', tax_status:'MATCHED',  reporting_period_start:'2026-09-01', driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'} },
  { id:'PTX-002', tax_type:'TPS_TVQ', taxable_amount:'42.00', reported_tax_amount:'6.29', government_calculated_amount:'6.29', variance_amount:'0', tax_status:'MATCHED',  reporting_period_start:'2026-09-01', driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'} },
  { id:'PTX-003', tax_type:'TPS_TVQ', taxable_amount:'55.00', reported_tax_amount:'8.24', government_calculated_amount:'8.24', variance_amount:'0', tax_status:'MATCHED',  reporting_period_start:'2026-09-01', driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'} },
  { id:'PTX-004', tax_type:'TPS_TVQ', taxable_amount:'24.25', reported_tax_amount:'3.63', government_calculated_amount:'3.63', variance_amount:'0', tax_status:'MATCHED',  reporting_period_start:'2026-09-01', driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'} },
  { id:'PTX-005', tax_type:'TPS_TVQ', taxable_amount:'22.50', reported_tax_amount:'3.37', government_calculated_amount:'3.57', variance_amount:'-0.20', tax_status:'VARIANCE', reporting_period_start:'2026-09-01', driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'} },
]
