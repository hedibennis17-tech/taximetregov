'use client'
// ================================================================
// ADMIN GOV — CENTRE FISCAL GOUVERNEMENTAL
// Source: tax_accounts + tax_periods + tax_calculations + tax_filings
// ================================================================
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'

interface TaxGovData {
  summary: {
    drivers_with_tax_account: number
    total_gross_revenue: number
    total_tps_collected: number
    total_tvq_collected: number
    total_tax_solde: number
    filings_accepted: number
    filings_draft: number
    periods_open: number
    account_status_counts: Record<string,number>
  }
  taxAccounts: Array<Record<string,string>>
  allPeriods: Array<Record<string,string>>
  allFilings: Array<Record<string,string|boolean>>
  allCalcs: Array<Record<string,string|boolean|number>>
  mode_pilote: boolean
}

const FILING_STATUS: Record<string, { label:string; color:string; icon:string }> = {
  DRAFT:    { label:'Brouillon', color:'text-slate-400', icon:'✏️' },
  PREPARED: { label:'Préparée',  color:'text-blue-400',  icon:'📋' },
  SUBMITTED:{ label:'Soumise',   color:'text-purple-400',icon:'📤' },
  ACCEPTED: { label:'Acceptée',  color:'text-green-400', icon:'✅' },
  REJECTED: { label:'Rejetée',   color:'text-red-400',   icon:'❌' },
  AMENDED:  { label:'Modifiée',  color:'text-amber-400', icon:'🔄' },
}

const PERIOD_STATUS: Record<string, { label:string; color:string }> = {
  OPEN:     { label:'Ouverte',   color:'text-blue-400' },
  FILED:    { label:'Déclarée',  color:'text-green-400' },
  ACCEPTED: { label:'Acceptée',  color:'text-green-400' },
  CLOSED:   { label:'Fermée',    color:'text-slate-400' },
}

function money(n: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(n)
}

export default function TaxCenterPage() {
  const [data, setData] = useState<TaxGovData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [tab, setTab] = useState('overview')

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      // Gov utilise son propre cookie de session
      const res = await fetch('/api/tax', { credentials: 'include' })
      const json = await res.json() as { success: boolean; data: TaxGovData; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Erreur API')
      setData(json.data)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const s = data?.summary

  const TABS = [
    { key:'overview',     label:'Vue globale',          emoji:'📊' },
    { key:'periods',      label:'Périodes fiscales',    emoji:'📅' },
    { key:'filings',      label:'Déclarations',         emoji:'📋' },
    { key:'calculations', label:'Calculs',              emoji:'🧮' },
    { key:'accounts',     label:'Comptes fiscaux',      emoji:'🏛️' },
  ]

  return (
    <AppShell>
      <PageHeader title="Centre fiscal gouvernemental" subtitle="TPS · TVQ · Québec · TAXIMETER.GOV" />

      {/* Mode pilote */}
      <div className="mx-4 mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle size={12} className="text-amber-400 shrink-0" />
        <p className="text-[9px] text-amber-400">Mode pilote — Données synthétiques — Aucune intégration Revenu Québec active</p>
      </div>

      {loading && <div className="py-16 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}
      {error && (
        <div className="mx-4">
          <Card className="p-4 text-center border-red-500/30">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={() => void load()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs">Réessayer</button>
          </Card>
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 px-4 mb-4">
            <KpiCard label="Chauffeurs avec dossier fiscal" value={s?.drivers_with_tax_account ?? 0} icon={<span>👥</span>} />
            <KpiCard label="Revenus bruts totaux" value={money(s?.total_gross_revenue ?? 0)} icon={<span>💰</span>} />
            <KpiCard label="TPS collectée (estimée)" value={money(s?.total_tps_collected ?? 0)} icon={<span>📊</span>} />
            <KpiCard label="TVQ collectée (estimée)" value={money(s?.total_tvq_collected ?? 0)} icon={<span>📊</span>} />
            <KpiCard label="Déclarations acceptées" value={s?.filings_accepted ?? 0} icon={<CheckCircle size={16} className="text-green-400" />} />
            <KpiCard label="Périodes ouvertes" value={s?.periods_open ?? 0} icon={<Clock size={16} className="text-amber-400" />} />
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
                {/* Solde total estimé */}
                <Card className="p-5 text-center border-amber-500/30 bg-amber-500/5">
                  <div className="text-[9px] text-slate-400 tracking-widest uppercase mb-1">Solde fiscal total estimé</div>
                  <div className="text-4xl font-black text-amber-400">{money(s?.total_tax_solde ?? 0)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">TPS {money((s?.total_tps_collected ?? 0) * 0.9)} · TVQ {money((s?.total_tvq_collected ?? 0) * 0.9)}</div>
                  <div className="text-[9px] text-slate-500 mt-2">Estimation TAXIMETER.GOV · Mode pilote</div>
                </Card>

                {/* Statuts déclarations */}
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Statuts des déclarations</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label:'Brouillon', count: s?.filings_draft ?? 0, color:'text-slate-400', bg:'bg-slate-800' },
                      { label:'Soumises',  count: data.allFilings.filter(f => f['filing_status'] === 'SUBMITTED').length, color:'text-purple-400', bg:'bg-purple-500/10' },
                      { label:'Acceptées', count: s?.filings_accepted ?? 0, color:'text-green-400', bg:'bg-green-500/10' },
                    ].map(r => (
                      <div key={r.label} className={`p-3 rounded-xl ${r.bg} text-center`}>
                        <div className={`text-2xl font-black ${r.color}`}>{r.count}</div>
                        <div className="text-[9px] text-slate-400">{r.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Revenus par type */}
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Revenus par type d'activité</div>
                  {[
                    { label:'Taxi',       val: data.allPeriods.reduce((s2, p) => s2 + parseFloat(p['gross_revenue_taxi'] ?? '0'), 0),       icon:'🚕' },
                    { label:'Rideshare',  val: data.allPeriods.reduce((s2, p) => s2 + parseFloat(p['gross_revenue_rideshare'] ?? '0'), 0),  icon:'🚗' },
                    { label:'Livraison',  val: data.allPeriods.reduce((s2, p) => s2 + parseFloat(p['gross_revenue_delivery'] ?? '0'), 0),   icon:'📦' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
                      <span>{r.icon}</span>
                      <span className="flex-1 text-sm text-white">{r.label}</span>
                      <span className="font-bold text-green-400">{money(r.val)}</span>
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* ── PÉRIODES FISCALES ── */}
            {tab === 'periods' && (
              <>
                <div className="text-xs text-slate-400 mb-2">{data.allPeriods.length} période(s)</div>
                {data.allPeriods.map(p => {
                  const ps = PERIOD_STATUS[p['period_status'] as string] ?? { label: p['period_status'], color:'text-slate-400' }
                  const total = parseFloat(p['gross_revenue_taxi'] ?? '0') + parseFloat(p['gross_revenue_rideshare'] ?? '0') + parseFloat(p['gross_revenue_delivery'] ?? '0')
                  return (
                    <Card key={p['id']} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-bold text-white">{p['period_start']} → {p['period_end']}</div>
                          <div className={`text-[10px] font-semibold ${ps.color}`}>{ps.label}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">{money(total)}</div>
                          <div className="text-[9px] text-slate-500">Échéance: {p['filing_due_date']}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[9px]">
                        <div className="bg-slate-800 rounded-lg p-1.5 text-center">
                          <div className="text-slate-400">Taxi</div>
                          <div className="font-bold text-white">{money(parseFloat(p['gross_revenue_taxi'] ?? '0'))}</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-1.5 text-center">
                          <div className="text-slate-400">Rideshare</div>
                          <div className="font-bold text-white">{money(parseFloat(p['gross_revenue_rideshare'] ?? '0'))}</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-1.5 text-center">
                          <div className="text-slate-400">Livraison</div>
                          <div className="font-bold text-white">{money(parseFloat(p['gross_revenue_delivery'] ?? '0'))}</div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </>
            )}

            {/* ── DÉCLARATIONS ── */}
            {tab === 'filings' && (
              <>
                <div className="text-xs text-slate-400 mb-2">{data.allFilings.length} déclaration(s)</div>
                {data.allFilings.map(f2 => {
                  const fs = FILING_STATUS[String(f2['filing_status'] ?? 'DRAFT')] ?? FILING_STATUS['DRAFT']!
                  return (
                    <Card key={String(f2['id'])} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`text-sm font-bold ${fs.color}`}>{fs.icon} {fs.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{String(f2['filing_type'] ?? '—')}</div>
                          {f2['government_reference'] && <div className="text-[9px] font-mono text-slate-500 mt-1">{String(f2['government_reference'])}</div>}
                          {f2['is_simulation'] && <div className="text-[9px] text-amber-400 mt-1">🔶 Simulation</div>}
                        </div>
                        <div className="text-right text-[9px] text-slate-500">
                          {f2['gateway_mode'] && <div>{String(f2['gateway_mode'])}</div>}
                          {f2['accepted_at'] && <div className="text-green-400">✓ {new Date(String(f2['accepted_at'])).toLocaleDateString('fr-CA')}</div>}
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
                <div className="text-xs text-slate-400 mb-2">{data.allCalcs.length} calcul(s)</div>
                {data.allCalcs.map(c => (
                  <Card key={String(c['id'])} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-bold text-white">{String(c['calculation_status'] ?? '—')}</div>
                        <div className="text-[9px] text-slate-400">{c['is_estimate'] ? '📊 Estimation' : '✅ Calcul final'}</div>
                      </div>
                      <div className="font-bold text-amber-400">
                        {money(parseFloat(String(c['tps_balance'] ?? 0)) + parseFloat(String(c['tvq_balance'] ?? 0)))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      {[
                        { label:'TPS collectée', val: String(c['tps_collected'] ?? 0) },
                        { label:'TVQ collectée', val: String(c['tvq_collected'] ?? 0) },
                        { label:'TPS solde',     val: String(c['tps_balance'] ?? 0) },
                        { label:'TVQ solde',     val: String(c['tvq_balance'] ?? 0) },
                      ].map(r => (
                        <div key={r.label} className="bg-slate-800 rounded-lg p-1.5">
                          <div className="text-slate-400">{r.label}</div>
                          <div className="font-bold text-white">{money(parseFloat(r.val))}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-[9px] text-slate-500">Revenus bruts imposables: {money(parseFloat(String(c['gross_revenue_taxable'] ?? 0)))}</div>
                  </Card>
                ))}
              </>
            )}

            {/* ── COMPTES FISCAUX ── */}
            {tab === 'accounts' && (
              <>
                <div className="text-xs text-slate-400 mb-2">{data.taxAccounts.length} compte(s) fiscal(aux)</div>
                {data.taxAccounts.map(a => (
                  <Card key={a['id']} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">{a['id']?.slice(0,8)}…</div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          TPS: <span className={a['tps_status'] === 'REGISTERED' ? 'text-green-400' : 'text-amber-400'}>{a['tps_status']}</span>
                          {' · '}
                          TVQ: <span className={a['tvq_status'] === 'REGISTERED' ? 'text-green-400' : 'text-amber-400'}>{a['tvq_status']}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">{a['filing_frequency']}</div>
                      </div>
                      <div className={`text-[10px] px-2 py-1 rounded-full font-bold ${a['tax_account_status'] === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {a['tax_account_status']}
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </AppShell>
  )
}
