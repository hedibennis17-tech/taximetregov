// GET /api/activities — Activités enterprise (depuis Supabase)
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
  if (!res.ok) throw new Error(`Supabase ${path}: ${await res.text()}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50'), 200)
    const status = searchParams.get('status')
    const driver = searchParams.get('driver_id')

    let qs = `driver_activities?select=id,public_id,activity_type_code,status,source_type,gross_amount,tip_amount,fee_amount,tax_amount,net_amount,reconciliation_status,started_at,completed_at,location_start_reference,location_end_reference,driver_profiles(driver_number,first_name,last_name),vehicles(make,model,license_plate_masked)&order=started_at.desc&limit=${limit}`
    if (status) qs += `&status=eq.${status}`
    if (driver) qs += `&driver_id=eq.${driver}`

    const activities = await sbGet(qs) as unknown[]
    return Response.json({ activities, total: (activities as unknown[]).length, source: 'SUPABASE', pilot: true })

  } catch (err) {
    return Response.json({ activities: DEMO_ACTIVITIES, total: DEMO_ACTIVITIES.length, source: 'DEMO_FALLBACK', error: String(err), pilot: true })
  }
}

// Fallback DEMO — aligné sur 0031_demo_pilot_data.sql
const DEMO_ACTIVITIES = [
  { id:'DEMO-ACT-001', public_id:'DEMO-ACT-001', activity_type_code:'TAXI_TRIP',       status:'FINALIZED', source_type:'TAXIMETER',    gross_amount:'28.75', tip_amount:'4.00',  fee_amount:'0',    tax_amount:'4.30',  net_amount:'24.45', reconciliation_status:'MATCHED',       started_at: new Date(Date.now()-5*3600000).toISOString(),  location_start_reference:'Vieux-Montréal',      location_end_reference:'Plateau-Mont-Royal', driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'},   vehicles:{make:'Toyota',model:'Camry Hybrid',license_plate_masked:'••• 4821'} },
  { id:'DEMO-ACT-002', public_id:'DEMO-ACT-002', activity_type_code:'RIDESHARE_TRIP',  status:'FINALIZED', source_type:'PROVIDER_API',  gross_amount:'42.00', tip_amount:'5.00',  fee_amount:'8.40', tax_amount:'6.29',  net_amount:'33.60', reconciliation_status:'MATCHED',       started_at: new Date(Date.now()-10*3600000).toISOString(), location_start_reference:'Centre-ville',         location_end_reference:'Rosemont',           driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'},   vehicles:{make:'Toyota',model:'Camry Hybrid',license_plate_masked:'••• 4821'} },
  { id:'DEMO-ACT-003', public_id:'DEMO-ACT-003', activity_type_code:'FOOD_DELIVERY',   status:'FINALIZED', source_type:'PROVIDER_API',  gross_amount:'22.50', tip_amount:'0',     fee_amount:'4.50', tax_amount:'3.37',  net_amount:'18.00', reconciliation_status:'PARTIAL_MATCH', started_at: new Date(Date.now()-18*3600000).toISOString(), location_start_reference:'Marché Atwater',       location_end_reference:'Griffintown',        driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'},   vehicles:{make:'Toyota',model:'Camry Hybrid',license_plate_masked:'••• 4821'} },
  { id:'DEMO-ACT-004', public_id:'DEMO-ACT-004', activity_type_code:'TAXI_TRIP',       status:'FINALIZED', source_type:'TAXIMETER',    gross_amount:'24.25', tip_amount:'2.50',  fee_amount:'0',    tax_amount:'3.63',  net_amount:'20.62', reconciliation_status:'MATCHED',       started_at: new Date(Date.now()-51*3600000).toISOString(), location_start_reference:'Laval-des-Rapides',   location_end_reference:'Chomedey',           driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'},vehicles:{make:'Hyundai',model:'Ioniq 5',license_plate_masked:'••• 7634'} },
  { id:'DEMO-ACT-005', public_id:'DEMO-ACT-005', activity_type_code:'RIDESHARE_TRIP',  status:'FINALIZED', source_type:'PROVIDER_API',  gross_amount:'55.00', tip_amount:'6.00',  fee_amount:'11.00',tax_amount:'8.24',  net_amount:'44.00', reconciliation_status:'MISMATCH',      started_at: new Date(Date.now()-32*3600000).toISOString(), location_start_reference:'Mile End',            location_end_reference:'YUL Trudeau',        driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'},vehicles:{make:'Hyundai',model:'Ioniq 5',license_plate_masked:'••• 7634'} },
  { id:'DEMO-ACT-006', public_id:'DEMO-ACT-006', activity_type_code:'GROCERY_DELIVERY',status:'FINALIZED', source_type:'PROVIDER_API',  gross_amount:'31.50', tip_amount:'3.00',  fee_amount:'6.30', tax_amount:'4.72',  net_amount:'25.20', reconciliation_status:'UNDER_REVIEW',  started_at: new Date(Date.now()-39*3600000).toISOString(), location_start_reference:'Marché Jean-Talon',   location_end_reference:'Outremont',          driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'},vehicles:{make:'Hyundai',model:'Ioniq 5',license_plate_masked:'••• 7634'} },
]
