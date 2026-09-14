'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { govFetch, money } from '@/lib/api-client'

interface TaxGovData {
  summary: {
    drivers_with_tax_account: number; total_gross_revenue: number
    total_tps_collected: number; total_tvq_collected: number; total_tax_solde: number
    filings_accepted: number; filings_draft: number; periods_open: number
  }
  taxAccounts: Array<Record<string,string>>
  allPeriods: Array<Record<string,string>>
  allFilings: Array<Record<string,string|boolean>>
  allCalcs: Array<Record<string,string|boolean|number>>
  mode_pilote: boolean
}

// Données de démo affichées si API non disponible
const DEMO: TaxGovData = {
  summary: {
    drivers_with_tax_account: 3, total_gross_revenue: 834.75,
    total_tps_collected: 41.74, total_tvq_collected: 83.26, total_tax_solde: 112.32,
    filings_accepted: 1, filings_draft: 1, periods_open: 1,
  },
  taxAccounts: [
    { id:'acc-hedi', driver_id:'drv-hedi', tps_status:'REGISTERED', tvq_status:'REGISTERED', filing_frequency:'QUARTERLY', tax_account_status:'ACTIVE', tps_registration_masked:'DEMO-••••-TPS-HEDI', tvq_registration_masked:'DEMO-••••-TVQ-HEDI' },
    { id:'acc-ahmed', driver_id:'drv-ahmed', tps_status:'REGISTERED', tvq_status:'REGISTERED', filing_frequency:'QUARTERLY', tax_account_status:'ACTIVE', tps_registration_masked:'DEMO-••••-TPS-AHME', tvq_registration_masked:'DEMO-••••-TVQ-AHME' },
    { id:'acc-sophie', driver_id:'drv-sophie', tps_status:'REGISTERED', tvq_status:'REGISTERED', filing_frequency:'QUARTERLY', tax_account_status:'ACTIVE', tps_registration_masked:'DEMO-••••-TPS-SOPH', tvq_registration_masked:'DEMO-••••-TVQ-SOPH' },
  ],
  allPeriods: [
    { id:'per-q3', tax_account_id:'acc-hedi', period_start:'2026-07-01', period_end:'2026-09-30', filing_due_date:'2026-10-31', period_status:'OPEN', gross_revenue_taxi:'158.25', gross_revenue_rideshare:'75.50', gross_revenue_delivery:'46.50', gross_revenue_other:'0' },
    { id:'per-q2', tax_account_id:'acc-hedi', period_start:'2026-04-01', period_end:'2026-06-30', filing_due_date:'2026-07-31', period_status:'FILED', gross_revenue_taxi:'143.50', gross_revenue_rideshare:'68.00', gross_revenue_delivery:'39.25', gross_revenue_other:'0' },
    { id:'per-q3b', tax_account_id:'acc-ahmed', period_start:'2026-07-01', period_end:'2026-09-30', filing_due_date:'2026-10-31', period_status:'OPEN', gross_revenue_taxi:'134.75', gross_revenue_rideshare:'55.00', gross_revenue_delivery:'38.75', gross_revenue_other:'0' },
  ],
  allFilings: [
    { id:'fil-1', tax_account_id:'acc-hedi', tax_period_id:'per-q2', filing_status:'ACCEPTED', filing_type:'COMBINED_TPS_TVQ', gateway_mode:'SIMULATION', is_simulation:true, accepted_at:'2026-07-29T14:00:00Z', government_reference:'DEMO-REF-Q2-2026-HEDI' },
    { id:'fil-2', tax_account_id:'acc-hedi', tax_period_id:'per-q3', filing_status:'DRAFT', filing_type:'COMBINED_TPS_TVQ', gateway_mode:'SIMULATION', is_simulation:true },
    { id:'fil-3', tax_account_id:'acc-ahmed', tax_period_id:'per-q3b', filing_status:'DRAFT', filing_type:'COMBINED_TPS_TVQ', gateway_mode:'SIMULATION', is_simulation:true },
  ],
  allCalcs: [
    { id:'calc-1', tax_period_id:'per-q2', tps_collected:13.96, tps_balance:12.56, tvq_collected:27.77, tvq_balance:24.98, gross_revenue_taxable:277.25, is_estimate:false, calculation_status:'FINAL' },
    { id:'calc-2', tax_period_id:'per-q3', tps_collected:14.01, tps_balance:12.57, tvq_collected:27.87, tvq_balance:25.00, gross_revenue_taxable:280.25, is_estimate:true, calculation_status:'ESTIMATE' },
    { id:'calc-3', tax_period_id:'per-q3b', tps_collected:11.37, tps_balance:10.24, tvq_collected:22.63, tvq_balance:20.37, gross_revenue_taxable:227.50, is_estimate:true, calculation_status:'ESTIMATE' },
  ],
  mode_pilote: true,
}

const FILING_STATUS: Record<string, { label:string; color:string; icon:string }> = {
  DRAFT:    { label:'Brouillon', color:'text-slate-400', icon:'✏️' },
  PREPARED: { label:'Préparée',  color:'text-blue-400',  icon:'📋' },
  SUBMITTED:{ label:'Soumise',   color:'text-purple-400',icon:'📤' },
  ACCEPTED: { label:'Acceptée',  color:'text-green-400', icon:'✅' },
  REJECTED: { label:'Rejetée',   color:'text-red-400',   icon:'❌' },
}

const PERIOD_STATUS: Record<string, { label:string; color:string }> = {
  OPEN:  { label:'Ouverte',  color:'text-blue-400' },
  FILED: { label:'Déclarée', color:'text-green-400' },
  CLOSED:{ label:'Fermée',   color:'text-slate-400' },
}

const TABS = [
  { key:'overview',     label:'Vue globale',       emoji:'📊' },
  { key:'periods',      label:'Périodes',           emoji:'📅' },
  { key:'filings',      label:'Déclarations',       emoji:'📋' },
  { key:'calculations', label:'Calculs TPS/TVQ',    emoji:'🧮' },
  { key:'accounts',     label:'Comptes fiscaux',    emoji:'🏛️' },
]

export default function TaxCenterPage() {
  const [data, setData] = useState<TaxGovData>(DEMO) // Démo par défaut
  const [loading, setLoading] = useState(true)
  const [usingDemo, setUsingDemo] = useState(false)
  const [tab, setTab] = useState('overview')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await govFetch<TaxGovData>('/api/tax')
      setData(result)
      setUsingDemo(false)
    } catch {
      // Données de démo si API non disponible
      setData(DEMO)
      setUsingDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const s = data.summary

  return (
    <AppShell>
      <PageHeader
        title="Centre fiscal gouvernemental"
        subtitle={`TPS · TVQ · Québec · ${usingDemo ? 'DONNÉES DEMO' : 'TAXIMETER.GOV'}`}
        actions={
          <button onClick={() => void load()} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw size={14} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
          </button>
        }
      />

      <div className="mx-4 mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle size={12} className="text-amber-400 shrink-0" />
        <p className="text-[9px] text-amber-400">
          Mode pilote — Données synthétiques — Aucune intégration Revenu Québec active
          {usingDemo && ' · AFFICHAGE DEMO LOCAL'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        <KpiCard label="Dossiers fiscaux actifs" value={s.drivers_with_tax_account} icon={<span className="text-lg">🏛️</span>} />
        <KpiCard label="Revenus bruts totaux" value={money(s.total_gross_revenue)} icon={<span className="text-lg">💰</span>} />
        <KpiCard label="TPS estimée (5%)" value={money(s.total_tps_collected)} icon={<span className="text-lg">📊</span>} />
        <KpiCard label="TVQ estimée (9,975%)" value={money(s.total_tvq_collected)} icon={<span className="text-lg">📊</span>} />
        <KpiCard label="Déclarations acceptées" value={s.filings_accepted} icon={<CheckCircle size={16} className="text-green-400" />} />
        <KpiCard label="Solde fiscal total" value={money(s.total_tax_solde)} icon={<span className="text-lg">⚖️</span>} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
              ${tab === t.key ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 pb-8">

        {/* ── VUE GLOBALE ── */}
        {tab === 'overview' && (
          <>
            <Card className="p-5 text-center border-amber-500/30 bg-amber-500/5">
              <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">Solde fiscal estimé — Tous chauffeurs</div>
              <div className="text-5xl font-black text-amber-400">{money(s.total_tax_solde)}</div>
              <div className="text-[10px] text-slate-400 mt-1">TPS {money(s.total_tps_collected)} · TVQ {money(s.total_tvq_collected)}</div>
              <div className="text-[9px] text-amber-400/70 mt-2">⚠️ Estimation TAXIMETER.GOV · À valider avant transmission officielle</div>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label:'Brouillon', count: s.filings_draft,    color:'text-slate-400', bg:'bg-slate-800' },
                { label:'Ouverte',   count: s.periods_open,     color:'text-blue-400',  bg:'bg-blue-500/10' },
                { label:'Acceptée',  count: s.filings_accepted, color:'text-green-400', bg:'bg-green-500/10' },
              ].map(r => (
                <div key={r.label} className={`p-3 rounded-xl ${r.bg} text-center`}>
                  <div className={`text-3xl font-black ${r.color}`}>{r.count}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{r.label}</div>
                </div>
              ))}
            </div>

            <Card className="p-4">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Revenus par type — Toutes périodes</div>
              {[
                { label:'Taxi',      val: data.allPeriods.reduce((s2,p) => s2+parseFloat(p['gross_revenue_taxi']??'0'),0), icon:'🚕' },
                { label:'Rideshare', val: data.allPeriods.reduce((s2,p) => s2+parseFloat(p['gross_revenue_rideshare']??'0'),0), icon:'🚗' },
                { label:'Livraison', val: data.allPeriods.reduce((s2,p) => s2+parseFloat(p['gross_revenue_delivery']??'0'),0), icon:'📦' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-lg">{r.icon}</span>
                  <span className="flex-1 text-sm text-white">{r.label}</span>
                  <span className="font-bold text-green-400">{money(r.val)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span className="text-sm text-white">Total brut</span>
                <span className="text-lg text-white">{money(s.total_gross_revenue)}</span>
              </div>
            </Card>

            {/* Rapprochement sommaire */}
            <Card className="p-4 border-slate-700">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Rapprochement sommaire</div>
              {[
                { label:'Revenus TAXIMETER.GOV',   val: money(s.total_gross_revenue), color:'text-white' },
                { label:'TPS perçue (estimée)',    val: money(s.total_tps_collected), color:'text-purple-400' },
                { label:'TVQ perçue (estimée)',    val: money(s.total_tvq_collected), color:'text-purple-400' },
                { label:'Solde à remettre',        val: money(s.total_tax_solde),     color:'text-amber-400' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{r.label}</span>
                  <span className={`font-bold ${r.color}`}>{r.val}</span>
                </div>
              ))}
              <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-700">
                <p className="text-[9px] text-slate-500">Une différence n'est jamais automatiquement une fraude — elle devient une exception à vérifier.</p>
              </div>
            </Card>
          </>
        )}

        {/* ── PÉRIODES ── */}
        {tab === 'periods' && (
          <>
            <div className="text-xs text-slate-400 mb-1">{data.allPeriods.length} période(s)</div>
            {data.allPeriods.map(p => {
              const ps = PERIOD_STATUS[p['period_status']??''] ?? { label:p['period_status'], color:'text-slate-400' }
              const total = ['gross_revenue_taxi','gross_revenue_rideshare','gross_revenue_delivery'].reduce((s2,k) => s2+parseFloat(p[k]??'0'), 0)
              const tps = Math.round(total * 0.05 * 100)/100
              const tvq = Math.round(total * 0.09975 * 100)/100
              return (
                <Card key={p['id']} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-bold text-white">{p['period_start']} → {p['period_end']}</div>
                      <div className={`text-[10px] font-semibold ${ps.color}`}>{ps.label}</div>
                      <div className="text-[9px] text-slate-500">Échéance: {p['filing_due_date']}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">{money(total)}</div>
                      <div className="text-[9px] text-amber-400">TPS {money(tps)} · TVQ {money(tvq)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[9px]">
                    {[
                      { label:'Taxi', val: p['gross_revenue_taxi']??'0', icon:'🚕' },
                      { label:'Rideshare', val: p['gross_revenue_rideshare']??'0', icon:'🚗' },
                      { label:'Livraison', val: p['gross_revenue_delivery']??'0', icon:'📦' },
                    ].map(r => (
                      <div key={r.label} className="bg-slate-800 rounded-lg p-2 text-center">
                        <div className="text-base mb-0.5">{r.icon}</div>
                        <div className="text-slate-400">{r.label}</div>
                        <div className="font-bold text-white">{money(parseFloat(r.val))}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </>
        )}

        {/* ── DÉCLARATIONS ── */}
        {tab === 'filings' && (
          <>
            <div className="text-xs text-slate-400 mb-1">{data.allFilings.length} déclaration(s)</div>
            {data.allFilings.map(f2 => {
              const fs = FILING_STATUS[String(f2['filing_status']??'DRAFT')] ?? FILING_STATUS['DRAFT']!
              return (
                <Card key={String(f2['id'])} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`text-sm font-bold ${fs.color}`}>{fs.icon} {fs.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{String(f2['filing_type']??'—')}</div>
                      {f2['government_reference'] && <div className="text-[9px] font-mono text-slate-500 mt-1">{String(f2['government_reference'])}</div>}
                      {f2['is_simulation'] && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">SIMULATION</span>}
                    </div>
                    <div className="text-[9px] text-slate-500 text-right">
                      <div>{String(f2['gateway_mode']??'—')}</div>
                      {f2['accepted_at'] && <div className="text-green-400 mt-1">✓ {new Date(String(f2['accepted_at'])).toLocaleDateString('fr-CA')}</div>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </>
        )}

        {/* ── CALCULS ── */}
        {tab === 'calculations' && (
          <>
            <div className="text-xs text-slate-400 mb-1">{data.allCalcs.length} calcul(s)</div>
            {data.allCalcs.map(c => {
              const tpsBal = parseFloat(String(c['tps_balance']??0))
              const tvqBal = parseFloat(String(c['tvq_balance']??0))
              return (
                <Card key={String(c['id'])} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-bold text-white">{String(c['calculation_status']??'—')}</div>
                      <div className="text-[9px] text-slate-400">{c['is_estimate'] ? '📊 Estimation' : '✅ Calcul final'}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Rev. bruts: {money(parseFloat(String(c['gross_revenue_taxable']??0)))}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-400">{money(tpsBal + tvqBal)}</div>
                      <div className="text-[9px] text-slate-400">Solde total</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    {[
                      { label:'TPS collectée', val: parseFloat(String(c['tps_collected']??0)) },
                      { label:'TVQ collectée', val: parseFloat(String(c['tvq_collected']??0)) },
                      { label:'TPS solde',     val: tpsBal },
                      { label:'TVQ solde',     val: tvqBal },
                    ].map(r => (
                      <div key={r.label} className="bg-slate-800 rounded-lg p-2">
                        <div className="text-slate-400">{r.label}</div>
                        <div className="font-bold text-white">{money(r.val)}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </>
        )}

        {/* ── COMPTES FISCAUX ── */}
        {tab === 'accounts' && (
          <>
            <div className="text-xs text-slate-400 mb-1">{data.taxAccounts.length} compte(s)</div>
            {data.taxAccounts.map(a => (
              <Card key={a['id']} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-white">
                      TPS: <span className="text-green-400">{a['tps_status']}</span>
                      {' · '}TVQ: <span className="text-green-400">{a['tvq_status']}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">TPS: {a['tps_registration_masked']}</div>
                    <div className="text-[9px] text-slate-400">TVQ: {a['tvq_registration_masked']}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{a['filing_frequency']}</div>
                  </div>
                  <div className={`text-[10px] px-2 py-1 rounded-full font-bold ${a['tax_account_status']==='ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {a['tax_account_status']}
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </AppShell>
  )
}
