// GET /api/search?q=... — Recherche globale gouvernementale
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
  if (!res.ok) return []
  return res.json()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (q.length < 2) return Response.json({ results: [], query: q })

  const ql = q.toLowerCase()

  try {
    // Recherche parallèle dans toutes les tables
    const [orgs, drivers, vehicles, activities] = await Promise.all([
      sbGet(`organizations?select=id,public_org_id,legal_name,trade_name,neq,status,sector&is_demo=eq.true&limit=20`),
      sbGet(`driver_profiles?select=id,driver_number,first_name,last_name,status,organization_id,organizations(legal_name,trade_name)&limit=50`),
      sbGet(`vehicles?select=id,vehicle_number,make,model,year,license_plate_masked,vehicle_status,driver_id,driver_profiles(first_name,last_name,driver_number,organizations(legal_name))&limit=30`),
      sbGet(`driver_activities?select=id,public_id,activity_type_code,status,gross_amount,started_at,driver_profiles(first_name,last_name,driver_number)&order=started_at.desc&limit=30`),
    ]) as [unknown[], unknown[], unknown[], unknown[]]

    const results: { type:string; id:string; label:string; sublabel:string; link:string; icon:string }[] = []

    // Organisations
    ;(orgs as Record<string,string>[]).filter(o =>
      o['legal_name']?.toLowerCase().includes(ql) ||
      o['trade_name']?.toLowerCase().includes(ql) ||
      o['neq']?.includes(q) ||
      o['public_org_id']?.toLowerCase().includes(ql)
    ).forEach(o => results.push({
      type:'org', id:o['public_org_id'], icon:'🏢',
      label: o['trade_name'] || o['legal_name'],
      sublabel: `NEQ: ${o['neq']} · ${o['sector']} · ${o['status']}`,
      link: `/enterprises/${o['public_org_id']}`,
    }))

    // Chauffeurs
    ;(drivers as Record<string,unknown>[]).filter(d =>
      `${d['first_name']} ${d['last_name']}`.toLowerCase().includes(ql) ||
      (d['driver_number'] as string)?.toLowerCase().includes(ql)
    ).forEach(d => {
      const org = d['organizations'] as Record<string,string> | null
      results.push({
        type:'driver', id:d['driver_number'] as string, icon:'🚗',
        label: `${d['first_name']} ${d['last_name']}`,
        sublabel: `${d['driver_number']} · ${org?.['trade_name'] || org?.['legal_name'] || 'Sans organisation'} · ${d['status']}`,
        link: `/drivers/${d['driver_number']}`,
      })
    })

    // Véhicules
    ;(vehicles as Record<string,unknown>[]).filter(v =>
      (v['license_plate_masked'] as string)?.toLowerCase().includes(ql) ||
      `${v['make']} ${v['model']}`.toLowerCase().includes(ql) ||
      (v['vehicle_number'] as string)?.toLowerCase().includes(ql)
    ).forEach(v => {
      const drv = v['driver_profiles'] as Record<string,unknown> | null
      results.push({
        type:'vehicle', id:v['vehicle_number'] as string, icon:'🚙',
        label: `${v['year']} ${v['make']} ${v['model']}`,
        sublabel: `${v['license_plate_masked']} · ${drv ? `${drv['first_name']} ${drv['last_name']}` : 'Sans chauffeur'}`,
        link: `/vehicles/${v['vehicle_number']}`,
      })
    })

    // Activités
    ;(activities as Record<string,unknown>[]).filter(a =>
      (a['public_id'] as string)?.toLowerCase().includes(ql)
    ).forEach(a => {
      const drv = a['driver_profiles'] as Record<string,string> | null
      results.push({
        type:'activity', id:a['public_id'] as string, icon:'📍',
        label: `Activité ${a['public_id']}`,
        sublabel: `${a['activity_type_code']} · ${drv ? `${drv['first_name']} ${drv['last_name']}` : ''} · ${a['gross_amount']}$`,
        link: `/activities/${a['public_id']}`,
      })
    })

    return Response.json({ results: results.slice(0,20), query: q, source: 'SUPABASE' })

  } catch (err) {
    // Fallback DEMO
    const demoResults = DEMO_ALL_SEARCHABLE.filter(r =>
      r.label.toLowerCase().includes(ql) || r.sublabel.toLowerCase().includes(ql)
    ).slice(0, 10)
    return Response.json({ results: demoResults, query: q, source: 'DEMO_FALLBACK', error: String(err) })
  }
}

const DEMO_ALL_SEARCHABLE = [
  { type:'org',    id:'ORG-UBER-QC-DEMO', icon:'🏢', label:'Uber Québec',       sublabel:'NEQ: 1234567890 · TRANSPORT · ACTIVE', link:'/enterprises/ORG-UBER-QC-DEMO' },
  { type:'org',    id:'ORG-LYFT-QC-DEMO', icon:'🏢', label:'Lyft Québec',       sublabel:'NEQ: 2345678901 · TRANSPORT · ACTIVE', link:'/enterprises/ORG-LYFT-QC-DEMO' },
  { type:'org',    id:'ORG-TAXI-MTL-DEMO',icon:'🏢', label:'Taxi Montréal',     sublabel:'NEQ: 3456789012 · TAXI · ACTIVE',      link:'/enterprises/ORG-TAXI-MTL-DEMO' },
  { type:'driver', id:'HEDI-DRV-0001',    icon:'🚗', label:'Hedi Bennis',       sublabel:'HEDI-DRV-0001 · Uber Québec · ACTIVE', link:'/drivers/HEDI-DRV-0001' },
  { type:'driver', id:'DEMO-DRV-0001',    icon:'🚗', label:'Ahmed Benali',      sublabel:'DEMO-DRV-0001 · Uber Québec · ACTIVE', link:'/drivers/DEMO-DRV-0001' },
  { type:'driver', id:'DEMO-DRV-0002',    icon:'🚗', label:'Sophie Tremblay',   sublabel:'DEMO-DRV-0002 · Uber Québec · ACTIVE', link:'/drivers/DEMO-DRV-0002' },
  { type:'driver', id:'DEMO-DRV-0003',    icon:'🚗', label:'Marco Lépine',      sublabel:'DEMO-DRV-0003 · Uber Québec · UNDER_REVIEW', link:'/drivers/DEMO-DRV-0003' },
  { type:'vehicle',id:'HEDI-VEH-001',     icon:'🚙', label:'Toyota Prius Prime 2024', sublabel:'••• 7070 · Hedi Bennis', link:'/vehicles/HEDI-VEH-001' },
  { type:'vehicle',id:'DEMO-VEH-001',     icon:'🚙', label:'Toyota Camry Hybrid 2023', sublabel:'••• 4821 · Ahmed Benali', link:'/vehicles/DEMO-VEH-001' },
  { type:'vehicle',id:'DEMO-VEH-002',     icon:'🚙', label:'Hyundai Ioniq 5 2024',    sublabel:'••• 7634 · Sophie Tremblay', link:'/vehicles/DEMO-VEH-002' },
]
