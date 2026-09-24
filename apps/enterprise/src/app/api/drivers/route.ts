// GET /api/drivers — Chauffeurs de l'enterprise (depuis Supabase)
// TAXIMETER.GOV · Enterprise Gov · Source unique : Supabase
import { NextRequest } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': KEY(),
      'Authorization': `Bearer ${KEY()}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase ${path}: ${await res.text()}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    // Chauffeurs depuis driver_profiles + vehicles joint
    const drivers = await sbGet(
      `driver_profiles?select=id,driver_number,first_name,last_name,status,identity_verification_status,phone,province,language,created_at,vehicles(id,make,model,year,license_plate_masked,vehicle_type,fuel_type,vehicle_status)&order=created_at.asc&limit=50`
    ) as Array<Record<string, unknown>>

    // Revenue par chauffeur (mois courant)
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`

    const ledgerRows = await sbGet(
      `revenue_ledger?select=driver_id,gross_amount,tip_amount,fee_amount,net_amount,tax_amount&activity_date=gte.${monthStart}`
    ) as Array<Record<string, string>>

    // Agréger par driver_id
    const revenueByDriver = ledgerRows.reduce((acc: Record<string, Record<string,number>>, r) => {
      const id = r['driver_id'] ?? ''
      if (!acc[id]) acc[id] = { gross:0, tips:0, fees:0, net:0, taxes:0, count:0 }
      acc[id]!.gross  += parseFloat(r['gross_amount'] ?? '0')
      acc[id]!.tips   += parseFloat(r['tip_amount']   ?? '0')
      acc[id]!.fees   += parseFloat(r['fee_amount']   ?? '0')
      acc[id]!.net    += parseFloat(r['net_amount']    ?? '0')
      acc[id]!.taxes  += parseFloat(r['tax_amount']   ?? '0')
      acc[id]!.count  += 1
      return acc
    }, {})

    const result = drivers.map(d => ({
      ...d,
      revenue: revenueByDriver[d['id'] as string] ?? { gross:0, tips:0, fees:0, net:0, taxes:0, count:0 },
    }))

    return Response.json({ drivers: result, total: result.length, source: 'SUPABASE', pilot: true })

  } catch (err) {
    // Fallback DEMO si Supabase inaccessible
    return Response.json({
      drivers: DEMO_DRIVERS,
      total: DEMO_DRIVERS.length,
      source: 'DEMO_FALLBACK',
      error: String(err),
      pilot: true,
    })
  }
}

// Fallback DEMO — aligné sur 0031_demo_pilot_data.sql
const DEMO_DRIVERS = [
  {
    id: 'DEMO-DRV-0001', driver_number: 'DEMO-DRV-0001',
    first_name: 'Ahmed', last_name: 'Benali', status: 'ACTIVE',
    identity_verification_status: 'VERIFIED', phone: '514-555-0101', province: 'QC', language: 'fr',
    vehicles: [{ make:'Toyota', model:'Camry Hybrid', year:2023, license_plate_masked:'••• 4821', vehicle_type:'SEDAN', fuel_type:'HYBRID', vehicle_status:'ACTIVE' }],
    revenue: { gross: 93.25, tips: 9.00, fees: 16.70, net: 66.25, taxes: 13.95, count: 3 },
  },
  {
    id: 'DEMO-DRV-0002', driver_number: 'DEMO-DRV-0002',
    first_name: 'Sophie', last_name: 'Tremblay', status: 'ACTIVE',
    identity_verification_status: 'VERIFIED', phone: '438-555-0102', province: 'QC', language: 'fr',
    vehicles: [{ make:'Hyundai', model:'Ioniq 5', year:2024, license_plate_masked:'••• 7634', vehicle_type:'ELECTRIC', fuel_type:'ELECTRIC', vehicle_status:'ACTIVE' }],
    revenue: { gross: 110.75, tips: 11.50, fees: 17.30, net: 82.00, taxes: 16.59, count: 3 },
  },
  {
    id: 'DEMO-DRV-0003', driver_number: 'DEMO-DRV-0003',
    first_name: 'Marco', last_name: 'Lépine', status: 'UNDER_REVIEW',
    identity_verification_status: 'PENDING', phone: '450-555-0103', province: 'QC', language: 'fr',
    vehicles: [{ make:'Honda', model:'Odyssey', year:2022, license_plate_masked:'••• 1058', vehicle_type:'MINIVAN', fuel_type:'GASOLINE', vehicle_status:'ACTIVE' }],
    revenue: { gross: 0, tips: 0, fees: 0, net: 0, taxes: 0, count: 0 },
  },
]
