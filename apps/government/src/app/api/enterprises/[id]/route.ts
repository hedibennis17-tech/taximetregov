// GET /api/enterprises/[id] — Dossier complet d'une organisation
// TAXIMETER.GOV · Government Gov · Source unique : Supabase
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
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const orgId = params.id

  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    // Organisation
    const orgs = await sbGet(
      `organizations?select=*,departments(id,public_dept_id,name,service_type,status,emoji)&public_org_id=eq.${orgId}&limit=1`
    ) as unknown[]
    const org = (orgs as Record<string,unknown>[])[0]
    if (!org) throw new Error(`Organisation ${orgId} non trouvée`)

    const dbOrgId = org['id'] as string

    // Chauffeurs de l'organisation
    const drivers = await sbGet(
      `driver_profiles?select=id,driver_number,first_name,last_name,status,identity_verification_status,phone,language,vehicles(id,vehicle_number,make,model,year,license_plate_masked,vehicle_type,fuel_type,vehicle_status)&organization_id=eq.${dbOrgId}&order=first_name.asc`
    ) as unknown[]

    // Activités récentes
    const activities = await sbGet(
      `driver_activities?select=id,public_id,activity_type_code,status,source_type,gross_amount,tip_amount,fee_amount,tax_amount,net_amount,reconciliation_status,started_at,location_start_reference,location_end_reference,driver_profiles(first_name,last_name,driver_number)&organization_id=eq.${dbOrgId}&order=started_at.desc&limit=25`
    ) as unknown[]

    // Revenue
    const revenue = await sbGet(
      `revenue_ledger?select=id,source_type,activity_type,gross_amount,tip_amount,fee_amount,tax_amount,net_amount,activity_date,is_settled,driver_id&driver_id=in.(${(drivers as Record<string,unknown>[]).map(d=>d['id']).join(',') || 'null'})&order=activity_date.desc&limit=50`
    ) as unknown[]

    // Totaux
    const revTotals = (revenue as Record<string,string>[]).reduce((acc, r) => ({
      gross: acc.gross + parseFloat(r['gross_amount']??'0'),
      tips:  acc.tips  + parseFloat(r['tip_amount']??'0'),
      taxes: acc.taxes + parseFloat(r['tax_amount']??'0'),
      net:   acc.net   + parseFloat(r['net_amount']??'0'),
      count: acc.count + 1,
    }), {gross:0,tips:0,taxes:0,net:0,count:0})

    return Response.json({
      organization: org,
      drivers,
      activities,
      revenue: {
        entries: revenue,
        totals: revTotals,
        tps:    Math.round(revTotals.gross * 0.05 * 100) / 100,
        tvq:    Math.round(revTotals.gross * 0.09975 * 100) / 100,
      },
      source: 'SUPABASE',
      pilot: true,
    })

  } catch (err) {
    // Fallback DEMO complet pour ORG-UBER-QC-DEMO
    if (orgId === 'ORG-UBER-QC-DEMO') {
      return Response.json({ ...DEMO_UBER, source: 'DEMO_FALLBACK', error: String(err), pilot: true })
    }
    return Response.json({ error: String(err), pilot: true }, { status: 404 })
  }
}

const DEMO_UBER = {
  organization: {
    id: 'ORG-UBER-QC-DEMO', public_org_id: 'ORG-UBER-QC-DEMO',
    legal_name: 'Uber Canada Inc. (DEMO)', trade_name: 'Uber Québec',
    neq: '1234567890', org_type: 'ENTERPRISE', sector: 'TRANSPORT', status: 'ACTIVE',
    tps_registered: true, tvq_registered: true, tps_number: 'TPS-DEMO-UBER-001', tvq_number: 'TVQ-DEMO-UBER-001',
    address_line1: '720 rue King Ouest, Bureau 4200', address_city: 'Montréal', address_province: 'QC', address_postal: 'H3C 2M7',
    contact_email: 'demo.uber@pilot.taximetregov.invalid', is_demo: true,
    departments: [
      {public_dept_id:'DEPT-UBER-RIDES',   name:'Uber Rides',   service_type:'RIDESHARE',       status:'ACTIVE', emoji:'🚗'},
      {public_dept_id:'DEPT-UBER-GREEN',   name:'Uber Green',   service_type:'RIDESHARE',       status:'ACTIVE', emoji:'🌱'},
      {public_dept_id:'DEPT-UBER-TAXI',    name:'Uber Taxi',    service_type:'TAXI',            status:'ACTIVE', emoji:'🚕'},
      {public_dept_id:'DEPT-UBER-EATS',    name:'Uber Eats',    service_type:'FOOD_DELIVERY',   status:'ACTIVE', emoji:'🍔'},
      {public_dept_id:'DEPT-UBER-GROCERY', name:'Uber Grocery', service_type:'GROCERY_DELIVERY',status:'ACTIVE', emoji:'🛒'},
      {public_dept_id:'DEPT-UBER-COURIER', name:'Uber Courier', service_type:'PARCEL_DELIVERY', status:'ACTIVE', emoji:'📦'},
    ],
  },
  drivers: [
    { id:'HEDI-DRV-ID', driver_number:'HEDI-DRV-0001', first_name:'Hedi',   last_name:'Bennis',  status:'ACTIVE', identity_verification_status:'VERIFIED', phone:'514-555-7070', vehicles:[{make:'Toyota', model:'Prius Prime',  year:2024, license_plate_masked:'••• 7070', vehicle_type:'SEDAN', fuel_type:'PLUG_IN_HYBRID'}] },
    { id:'DRV-ID-0001', driver_number:'DEMO-DRV-0001', first_name:'Ahmed',  last_name:'Benali',  status:'ACTIVE', identity_verification_status:'VERIFIED', phone:'514-555-0101', vehicles:[{make:'Toyota', model:'Camry Hybrid', year:2023, license_plate_masked:'••• 4821', vehicle_type:'SEDAN', fuel_type:'HYBRID'}] },
    { id:'DRV-ID-0002', driver_number:'DEMO-DRV-0002', first_name:'Sophie', last_name:'Tremblay',status:'ACTIVE', identity_verification_status:'VERIFIED', phone:'438-555-0102', vehicles:[{make:'Hyundai',model:'Ioniq 5',      year:2024, license_plate_masked:'••• 7634', vehicle_type:'ELECTRIC',fuel_type:'ELECTRIC'}] },
    { id:'DRV-ID-0003', driver_number:'DEMO-DRV-0003', first_name:'Marco',  last_name:'Lépine',  status:'UNDER_REVIEW', identity_verification_status:'PENDING', phone:'450-555-0103', vehicles:[{make:'Honda',model:'Odyssey',year:2022,license_plate_masked:'••• 1058',vehicle_type:'MINIVAN',fuel_type:'GASOLINE'}] },
  ],
  activities: [
    { id:'HEDI-ACT-001', public_id:'HEDI-ACT-001', activity_type_code:'TAXI_TRIP',      status:'FINALIZED', source_type:'TAXIMETER',   gross_amount:'32.50', tip_amount:'4.50', tax_amount:'4.87', net_amount:'27.63', reconciliation_status:'MATCHED',       started_at:new Date(Date.now()-2*3600000).toISOString(),  location_start_reference:'Plateau-Mont-Royal', location_end_reference:'Centre-Ville',  driver_profiles:{first_name:'Hedi',  last_name:'Bennis',  driver_number:'HEDI-DRV-0001'} },
    { id:'HEDI-ACT-002', public_id:'HEDI-ACT-002', activity_type_code:'RIDESHARE_TRIP', status:'FINALIZED', source_type:'PROVIDER_API', gross_amount:'24.00', tip_amount:'2.00', tax_amount:'3.59', net_amount:'20.41', reconciliation_status:'MATCHED',       started_at:new Date(Date.now()-26*3600000).toISOString(), location_start_reference:'Mile-Ex',            location_end_reference:'Rosemont',      driver_profiles:{first_name:'Hedi',  last_name:'Bennis',  driver_number:'HEDI-DRV-0001'} },
    { id:'DEMO-ACT-001', public_id:'DEMO-ACT-001', activity_type_code:'TAXI_TRIP',      status:'FINALIZED', source_type:'TAXIMETER',   gross_amount:'28.75', tip_amount:'4.00', tax_amount:'4.30', net_amount:'24.45', reconciliation_status:'MATCHED',       started_at:new Date(Date.now()-5*3600000).toISOString(),  location_start_reference:'Vieux-Montréal',     location_end_reference:'Plateau',       driver_profiles:{first_name:'Ahmed', last_name:'Benali',  driver_number:'DEMO-DRV-0001'} },
    { id:'DEMO-ACT-002', public_id:'DEMO-ACT-002', activity_type_code:'RIDESHARE_TRIP', status:'FINALIZED', source_type:'PROVIDER_API', gross_amount:'42.00', tip_amount:'5.00', tax_amount:'6.29', net_amount:'33.60', reconciliation_status:'MATCHED',       started_at:new Date(Date.now()-10*3600000).toISOString(), location_start_reference:'Centre-ville',        location_end_reference:'Rosemont',      driver_profiles:{first_name:'Ahmed', last_name:'Benali',  driver_number:'DEMO-DRV-0001'} },
    { id:'DEMO-ACT-004', public_id:'DEMO-ACT-004', activity_type_code:'TAXI_TRIP',      status:'FINALIZED', source_type:'TAXIMETER',   gross_amount:'24.25', tip_amount:'2.50', tax_amount:'3.63', net_amount:'20.62', reconciliation_status:'MATCHED',       started_at:new Date(Date.now()-51*3600000).toISOString(), location_start_reference:'Laval-des-Rapides',  location_end_reference:'Chomedey',      driver_profiles:{first_name:'Sophie',last_name:'Tremblay',driver_number:'DEMO-DRV-0002'} },
    { id:'DEMO-ACT-005', public_id:'DEMO-ACT-005', activity_type_code:'RIDESHARE_TRIP', status:'FINALIZED', source_type:'PROVIDER_API', gross_amount:'55.00', tip_amount:'6.00', tax_amount:'8.24', net_amount:'44.00', reconciliation_status:'MISMATCH',      started_at:new Date(Date.now()-32*3600000).toISOString(), location_start_reference:'Mile End',            location_end_reference:'YUL',           driver_profiles:{first_name:'Sophie',last_name:'Tremblay',driver_number:'DEMO-DRV-0002'} },
  ],
  revenue: {
    totals: { gross: 353.25, tips: 27.00, taxes: 52.90, net: 270.71, count: 10 },
    tps: Math.round(353.25 * 0.05 * 100) / 100,
    tvq: Math.round(353.25 * 0.09975 * 100) / 100,
    entries: [],
  },
}
