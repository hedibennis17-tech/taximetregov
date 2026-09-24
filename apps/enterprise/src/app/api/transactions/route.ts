// GET /api/transactions — Transactions enterprise (depuis Supabase revenue_ledger)
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

export async function GET(req: NextRequest) {
  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const driver = searchParams.get('driver_id')
    const from   = searchParams.get('from')
    const to     = searchParams.get('to')

    let qs = `revenue_ledger?select=id,source_type,activity_type,entry_type,gross_amount,fee_amount,tip_amount,adjustment_amount,tax_amount,net_amount,currency,activity_date,is_settled,source_reference,driver_id,driver_profiles(driver_number,first_name,last_name)&order=activity_date.desc&limit=${limit}&offset=${offset}`
    if (driver) qs += `&driver_id=eq.${driver}`
    if (from)   qs += `&activity_date=gte.${from}`
    if (to)     qs += `&activity_date=lte.${to}`

    const transactions = await sbGet(qs) as unknown[]
    return Response.json({ transactions, total: (transactions as unknown[]).length, source: 'SUPABASE', pilot: true })

  } catch (err) {
    return Response.json({ transactions: DEMO_TX, total: DEMO_TX.length, source: 'DEMO_FALLBACK', error: String(err), pilot: true })
  }
}

const DEMO_TX = [
  { id:'RL-001', source_type:'TAXI',     activity_type:'TAXI_TRIP',       gross_amount:'28.75', tip_amount:'4.00', fee_amount:'0',    tax_amount:'4.30', net_amount:'24.45', activity_date: new Date(Date.now()-5*3600000).toISOString().split('T')[0],  is_settled:true,  driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'} },
  { id:'RL-002', source_type:'UBER',     activity_type:'RIDESHARE_TRIP',  gross_amount:'42.00', tip_amount:'5.00', fee_amount:'8.40', tax_amount:'6.29', net_amount:'33.60', activity_date: new Date(Date.now()-10*3600000).toISOString().split('T')[0], is_settled:false, driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'} },
  { id:'RL-003', source_type:'DOORDASH', activity_type:'FOOD_DELIVERY',   gross_amount:'22.50', tip_amount:'0',    fee_amount:'4.50', tax_amount:'3.37', net_amount:'18.00', activity_date: new Date(Date.now()-18*3600000).toISOString().split('T')[0], is_settled:false, driver_profiles:{driver_number:'DEMO-DRV-0001',first_name:'Ahmed',last_name:'Benali'} },
  { id:'RL-004', source_type:'TAXI',     activity_type:'TAXI_TRIP',       gross_amount:'24.25', tip_amount:'2.50', fee_amount:'0',    tax_amount:'3.63', net_amount:'20.62', activity_date: new Date(Date.now()-51*3600000).toISOString().split('T')[0], is_settled:true,  driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'} },
  { id:'RL-005', source_type:'LYFT',     activity_type:'RIDESHARE_TRIP',  gross_amount:'55.00', tip_amount:'6.00', fee_amount:'11.00',tax_amount:'8.24', net_amount:'44.00', activity_date: new Date(Date.now()-32*3600000).toISOString().split('T')[0], is_settled:false, driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'} },
  { id:'RL-006', source_type:'INSTACART',activity_type:'GROCERY_DELIVERY',gross_amount:'31.50', tip_amount:'3.00', fee_amount:'6.30', tax_amount:'4.72', net_amount:'25.20', activity_date: new Date(Date.now()-39*3600000).toISOString().split('T')[0], is_settled:false, driver_profiles:{driver_number:'DEMO-DRV-0002',first_name:'Sophie',last_name:'Tremblay'} },
]
