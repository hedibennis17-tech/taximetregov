// GET /api/enterprises — Registre des organisations (gouvernement)
// TAXIMETER.GOV · Government Gov · Source unique : Supabase organizations table
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
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    if (!SB_URL) throw new Error('SUPABASE_URL manquant')

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.toLowerCase() ?? ''
    const status = searchParams.get('status') ?? ''
    const sector = searchParams.get('sector') ?? ''
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

    // Fetch organizations + departments count
    let qs = `organizations?select=id,public_org_id,legal_name,trade_name,neq,org_type,sector,status,tps_registered,tvq_registered,address_city,address_province,contact_email,is_demo,created_at,departments(id,name,service_type,status)&is_demo=eq.true&order=legal_name.asc&limit=${limit}`
    if (status) qs += `&status=eq.${status}`
    if (sector) qs += `&sector=eq.${sector}`

    const orgs = await sbGet(qs) as unknown[]

    // Fetch driver counts per org
    const drivers = await sbGet(
      `driver_profiles?select=organization_id,status&organization_id=not.is.null`
    ) as Array<Record<string,string>>

    const driverCountByOrg = drivers.reduce((acc: Record<string, {total:number;active:number}>, d) => {
      const id = d['organization_id'] ?? ''
      if (!acc[id]) acc[id] = {total:0, active:0}
      acc[id]!.total++
      if (d['status'] === 'ACTIVE') acc[id]!.active++
      return acc
    }, {})

    // Fetch revenue totals per org
    const revenue = await sbGet(
      `revenue_ledger?select=driver_id,gross_amount,tip_amount,tax_amount&created_at=gte.${new Date(Date.now()-90*86400000).toISOString()}`
    ) as Array<Record<string,string>>

    // Map driver_id → org_id
    const driverOrgMap: Record<string,string> = {}
    drivers.forEach(d => { if (d['id']) driverOrgMap[d['id']] = d['organization_id'] ?? '' })

    const revByOrg = revenue.reduce((acc: Record<string,{gross:number;taxes:number}>, r) => {
      const orgId = driverOrgMap[r['driver_id'] ?? ''] ?? ''
      if (!orgId) return acc
      if (!acc[orgId]) acc[orgId] = {gross:0, taxes:0}
      acc[orgId]!.gross  += parseFloat(r['gross_amount'] ?? '0')
      acc[orgId]!.taxes  += parseFloat(r['tax_amount']   ?? '0')
      return acc
    }, {})

    // Enrichir les orgs
    let result = (orgs as Array<Record<string,unknown>>).map(org => ({
      ...org,
      driver_stats: driverCountByOrg[(org['id'] as string)] ?? {total:0, active:0},
      revenue_q3:   revByOrg[(org['id'] as string)] ?? {gross:0, taxes:0},
      dept_count:   ((org['departments'] as unknown[]) ?? []).length,
    }))

    // Filtre search côté serveur
    if (search) {
      result = result.filter(o =>
        (o['legal_name'] as string)?.toLowerCase().includes(search) ||
        (o['trade_name'] as string)?.toLowerCase().includes(search) ||
        (o['neq'] as string)?.includes(search) ||
        (o['public_org_id'] as string)?.toLowerCase().includes(search)
      )
    }

    return Response.json({
      organizations: result,
      total: result.length,
      source: 'SUPABASE',
      pilot: true,
    })

  } catch (err) {
    return Response.json({
      organizations: DEMO_ORGS,
      total: DEMO_ORGS.length,
      source: 'DEMO_FALLBACK',
      error: String(err),
      pilot: true,
    })
  }
}

// Fallback DEMO aligné sur migration 0032
const DEMO_ORGS = [
  {
    id: 'ORG-UBER-QC-DEMO', public_org_id: 'ORG-UBER-QC-DEMO',
    legal_name: 'Uber Canada Inc. (DEMO)', trade_name: 'Uber Québec',
    neq: '1234567890', org_type: 'ENTERPRISE', sector: 'TRANSPORT', status: 'ACTIVE',
    tps_registered: true, tvq_registered: true,
    address_city: 'Montréal', address_province: 'QC', is_demo: true,
    departments: [
      {name:'Uber Rides',   service_type:'RIDESHARE',       status:'ACTIVE'},
      {name:'Uber Green',   service_type:'RIDESHARE',       status:'ACTIVE'},
      {name:'Uber Taxi',    service_type:'TAXI',            status:'ACTIVE'},
      {name:'Uber Eats',    service_type:'FOOD_DELIVERY',   status:'ACTIVE'},
      {name:'Uber Grocery', service_type:'GROCERY_DELIVERY',status:'ACTIVE'},
      {name:'Uber Courier', service_type:'PARCEL_DELIVERY', status:'ACTIVE'},
    ],
    driver_stats: {total:4, active:3},
    revenue_q3: {gross:204.00, taxes:30.59},
    dept_count: 6,
  },
  { id:'ORG-LYFT-QC-DEMO', public_org_id:'ORG-LYFT-QC-DEMO', legal_name:'Lyft Canada Inc. (DEMO)', trade_name:'Lyft Québec', neq:'2345678901', org_type:'ENTERPRISE', sector:'TRANSPORT', status:'ACTIVE', tps_registered:true, tvq_registered:true, address_city:'Montréal', address_province:'QC', is_demo:true, departments:[], driver_stats:{total:0,active:0}, revenue_q3:{gross:0,taxes:0}, dept_count:0 },
  { id:'ORG-TAXI-MTL-DEMO', public_org_id:'ORG-TAXI-MTL-DEMO', legal_name:'Taxi Montréal SENC (DEMO)', trade_name:'Taxi Montréal', neq:'3456789012', org_type:'ENTERPRISE', sector:'TAXI', status:'ACTIVE', tps_registered:true, tvq_registered:true, address_city:'Montréal', address_province:'QC', is_demo:true, departments:[], driver_stats:{total:0,active:0}, revenue_q3:{gross:0,taxes:0}, dept_count:0 },
  { id:'ORG-DRD-QC-DEMO', public_org_id:'ORG-DRD-QC-DEMO', legal_name:'DoorDash Canada Inc. (DEMO)', trade_name:'DoorDash Québec', neq:'4567890123', org_type:'ENTERPRISE', sector:'DELIVERY', status:'PILOT', tps_registered:false, tvq_registered:false, address_city:'Montréal', address_province:'QC', is_demo:true, departments:[], driver_stats:{total:0,active:0}, revenue_q3:{gross:0,taxes:0}, dept_count:0 },
  { id:'ORG-PUROLATOR-DEMO', public_org_id:'ORG-PUROLATOR-DEMO', legal_name:'Purolator Inc. (DEMO)', trade_name:'Purolator', neq:'6789012345', org_type:'ENTERPRISE', sector:'LOGISTICS', status:'ACTIVE', tps_registered:true, tvq_registered:true, address_city:'Montréal', address_province:'QC', is_demo:true, departments:[], driver_stats:{total:0,active:0}, revenue_q3:{gross:0,taxes:0}, dept_count:0 },
]
