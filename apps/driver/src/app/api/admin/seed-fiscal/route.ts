import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function sbGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } })
  return res.json() as Promise<unknown[]>
}
async function sbPost(path: string, body: unknown) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY(), Authorization: `Bearer ${KEY()}`, Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify(body) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path}: ${text}`)
  return text ? JSON.parse(text) as unknown[] : []
}

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret') ?? ''
  if (secret !== 'TAXIMETREGOV_SEED_2026') return apiError('Non autorisé', 403)
  try {
    const steps: string[] = []
    const users = await sbGet(`users?email=eq.hedibennis70@gmail.com&select=id`) as Array<{id:string}>
    if (!users[0]) throw new Error('User Hedi introuvable')
    const profiles = await sbGet(`driver_profiles?user_id=eq.${users[0].id}&select=id`) as Array<{id:string}>
    if (!profiles[0]) throw new Error('Driver profile introuvable')
    const driverId = profiles[0].id
    const taxAccs = await sbGet(`tax_accounts?driver_id=eq.${driverId}&select=id`) as Array<{id:string}>
    if (!taxAccs[0]) throw new Error('Tax account introuvable — lancer seed principal dabord')
    const taxAccountId = taxAccs[0].id
    const jurs = await sbGet(`jurisdictions?code=eq.QC&select=id`) as Array<{id:string}>
    const jurId = jurs[0]?.id

    // Rule set
    let ruleSetId: string
    const existR = await sbGet(`tax_rule_sets?code=eq.QC-TPS-TVQ-2024&select=id`) as Array<{id:string}>
    if (existR[0]) { ruleSetId = existR[0].id; steps.push('✅ Rule set existe') }
    else {
      const r = await sbPost('tax_rule_sets', { jurisdiction_id: jurId, code: 'QC-TPS-TVQ-2024', version: '2024.1', label: 'TPS/TVQ Québec 2024', tps_rate: 0.05000, tvq_rate: 0.09975, effective_from: '2024-01-01', status: 'DRAFT', source_reference: 'Gouvernement du Québec' }) as Array<{id:string}>
      ruleSetId = r[0]!.id; steps.push('✅ Rule set créé')
    }

    // Periods
    const periodDefs = [
      { period_start:'2026-04-01', period_end:'2026-06-30', filing_due_date:'2026-07-31', period_status:'FILED', gross_revenue_taxi:158.25, gross_revenue_rideshare:75.50, gross_revenue_delivery:43.50, gross_revenue_other:0, tps_status:'FILED', tvq_status:'FILED' },
      { period_start:'2026-07-01', period_end:'2026-09-30', filing_due_date:'2026-10-31', period_status:'OPEN', gross_revenue_taxi:158.25, gross_revenue_rideshare:75.50, gross_revenue_delivery:46.50, gross_revenue_other:0, tps_status:'PENDING', tvq_status:'PENDING' },
    ]
    const periodIds: string[] = []
    for (const p of periodDefs) {
      const ex = await sbGet(`tax_periods?tax_account_id=eq.${taxAccountId}&period_start=eq.${p.period_start}&select=id`) as Array<{id:string}>
      if (ex[0]) { periodIds.push(ex[0].id); steps.push(`✅ Période ${p.period_start} existe`) }
      else { const c = await sbPost('tax_periods', { ...p, tax_account_id: taxAccountId }) as Array<{id:string}>; periodIds.push(c[0]!.id); steps.push(`✅ Période ${p.period_start} créée`) }
    }

    // Calculations
    const calcDefs = [
      { pi:0, tps_collected:13.96, tps_remitted:13.96, tps_credits:1.40, tps_adjustments:0, tps_balance:12.56, tvq_collected:27.77, tvq_remitted:27.77, tvq_credits:2.79, tvq_adjustments:0, tvq_balance:24.98, gross_revenue_taxable:277.25, net_revenue_taxable:221.80, is_estimate:false, calculation_status:'FINAL' },
      { pi:1, tps_collected:14.01, tps_remitted:0, tps_credits:1.44, tps_adjustments:0, tps_balance:12.57, tvq_collected:27.87, tvq_remitted:0, tvq_credits:2.87, tvq_adjustments:0, tvq_balance:25.00, gross_revenue_taxable:280.25, net_revenue_taxable:224.20, is_estimate:true, calculation_status:'ESTIMATE' },
    ]
    const calcIds: string[] = []
    for (const c of calcDefs) {
      const pid = periodIds[c.pi]!
      const ex = await sbGet(`tax_calculations?tax_period_id=eq.${pid}&select=id`) as Array<{id:string}>
      if (ex[0]) { calcIds.push(ex[0].id); steps.push('✅ Calcul existe') }
      else {
        const { pi, ...body } = c
        const cr = await sbPost('tax_calculations', { ...body, tax_period_id: pid, tax_rule_set_id: ruleSetId, calculation_version: 1 }) as Array<{id:string}>
        calcIds.push(cr[0]!.id); steps.push(`✅ Calcul ${c.is_estimate ? 'estimation' : 'final'} créé`)
      }
    }

    // Filings
    const filingDefs = [
      { pi:0, ci:0, filing_type:'COMBINED_TPS_TVQ', filing_status:'ACCEPTED', gateway_mode:'SIMULATION', is_simulation:true, prepared_at:'2026-07-15T10:00:00Z', submitted_at:'2026-07-28T09:30:00Z', accepted_at:'2026-07-29T14:00:00Z', government_reference:'DEMO-REF-Q2-2026-HEDI' },
      { pi:1, ci:1, filing_type:'COMBINED_TPS_TVQ', filing_status:'DRAFT', gateway_mode:'SIMULATION', is_simulation:true },
    ]
    for (const f of filingDefs) {
      const pid = periodIds[f.pi]!; const cid = calcIds[f.ci]!
      const ex = await sbGet(`tax_filings?tax_period_id=eq.${pid}&select=id`) as Array<{id:string}>
      if (!ex[0]) {
        const { pi, ci, ...body } = f
        await sbPost('tax_filings', { ...body, tax_account_id: taxAccountId, tax_period_id: pid, calculation_id: cid })
        steps.push(`✅ Filing ${f.filing_status} créé`)
      } else { steps.push(`✅ Filing existe`) }
    }

    // Notifications
    for (const n of [
      { ntype:'TAX_PERIOD_OPENED', title:'Période fiscale Q3-2026 ouverte', body:'Juillet–septembre 2026. Échéance: 31 octobre.', h:48 },
      { ntype:'TAX_DECLARATION_DUE', title:'Déclaration Q3 due le 31 octobre', body:'Préparez votre déclaration TPS/TVQ Q3-2026.', h:24 },
    ]) {
      await fetch(`${SB_URL}/rest/v1/notifications`, { method:'POST', headers:{'Content-Type':'application/json',apikey:KEY(),Authorization:`Bearer ${KEY()}`,Prefer:'resolution=ignore-duplicates,return=minimal'}, body:JSON.stringify({ driver_id:driverId, notification_type:n.ntype, channel:'IN_APP', title:n.title, body:n.body, status:'UNREAD', priority:'HIGH', created_at:new Date(Date.now()-n.h*3600000).toISOString() }) })
    }
    steps.push('✅ Notifications fiscales créées')

    return apiSuccess({ ok:true, message:'✅ Données fiscales complètes (V2)', driver_id:driverId, tax_account_id:taxAccountId, rule_set_id:ruleSetId, period_ids:periodIds, steps })
  } catch (err) { return apiError('Erreur: '+String(err), 500) }
}
