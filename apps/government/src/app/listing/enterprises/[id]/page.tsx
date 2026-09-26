'use client'
// ================================================================
// TAXIMETER.GOV — ENTERPRISE 360° CONTROL CENTER
// Source: /api/enterprises/[id] → pilot-demo (même données que Control Center)
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react'
import { ENTERPRISES, CATEGORY_LABELS } from '../data'
import { govFetch } from '@/lib/api-client'

function money(n: number) {
  return new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(n)
}
function clean(s: string) { return s.replace(/^DEMO[-_]/, '').replaceAll('_', ' ') }

const TABS = [
  'Overview','Profil','Départements','Chauffeurs','Véhicules','Activités',
  'Transactions','Revenus','TPS/TVQ','Déclarations','Paiements','Relevés',
  'Cas','Alertes','Documents','Connexions Gov','API','Webhooks',
  'Réconciliation','Analytics','Rapports','Conformité','Audit','Notifications','Intelligence','Communication Gov',
]

function Badge({ t }: { t:'verified'|'demo'|'private' }) {
  const c = t==='verified' ? 'bg-green-500/15 text-green-400' : t==='demo' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
  return <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${c}`}>{t==='verified'?'✓ VÉRIFIÉ':t==='demo'?'⚠ DEMO':'🔒 PRIVÉ'}</span>
}

function Row({ label, value, badge }: { label:string; value:string|number; badge?:'verified'|'demo'|'private' }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 gap-2">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 text-right">
        <span className="text-xs text-white">{value}</span>
        {badge && <Badge t={badge} />}
      </div>
    </div>
  )
}

function Card({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-3">
      <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-800 text-xs font-bold text-white">{title}</div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

function Kpi({ label, value, color='text-white', sub }: { label:string; value:string|number; color?:string; sub?:string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
      <div className={`text-lg font-black ${color}`}>{value}</div>
      <div className="text-[8px] text-slate-400 mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-[7px] text-slate-600">{sub}</div>}
    </div>
  )
}

function StatusChip({ v }: { v:string }) {
  const c = /MATCHED|READY|COMPLETED|ACTIVE|ONLINE|VALID|RECEIVED|PAID|SETTLED|RECONCILED/.test(v)
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
    : /REVIEW|PARTIAL|PENDING|WARNING|MISMATCH|OPEN|MONITORING/.test(v)
    ? 'bg-amber-500/15 text-amber-200 border-amber-400/25'
    : 'bg-slate-700 text-slate-300 border-slate-600'
  return <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${c}`}>{clean(v)}</span>
}

interface EntData {
  kpis: Record<string, number>
  departments: Array<{ id:string; name:string; service:string; color:string }>
  drivers: Array<Record<string, string>>
  activities: Array<Record<string, string|number>>
  transactions: Array<Record<string, string|number>>
  tax_records: Array<Record<string, string|number>>
  tips: Array<Record<string, string|number>>
  settlements: Array<Record<string, string|number>>
  cases: Array<Record<string, string|number>>
  alerts: Array<Record<string, string|number>>
  reports: Array<Record<string, string|number>>
  statements: Array<Record<string, string|number>>
  accounts: Array<Record<string, string>>
  by_provider: Array<{ provider:string; gross:number; net:number; activities:number }>
  data_sources: Record<string, string>
  economic_impact: string
  supabase_db: Record<string, number>
}

export default function Enterprise360Page() {
  const { id } = useParams<{ id:string }>()
  const router = useRouter()
  const [tab, setTab] = useState('Overview')
  const [dept, setDept] = useState('ALL')
  const [data, setData] = useState<EntData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string|null>(null)

  const staticEnt = ENTERPRISES.find(e => e.id === id)

  const load = useCallback(async () => {
    try { setLoading(true); setErr(null)
      const r = await govFetch<EntData>(`/api/enterprises/${id}`)
      setData(r)
    } catch (e) { setErr((e as Error).message) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])

  const k = data?.kpis ?? {}
  const depts = data?.departments ?? []

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-slate-800">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft size={14} className="text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white">{staticEnt?.name ?? id}</span>
            <Badge t="demo" />
            <span className="text-[8px] text-slate-600">{id}</span>
          </div>
          <div className="text-[8px] text-slate-500">Enterprise 360° · Source: pilot-demo + Supabase DB</div>
        </div>
        <button onClick={() => void load()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <RefreshCw size={13} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
        </button>
      </div>

      {loading && <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={20} /><p className="text-xs text-slate-400 mt-2">Chargement Enterprise 360°…</p></div>}
      {err && <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center"><p className="text-sm text-red-400 mb-2">{err}</p><button onClick={() => void load()} className="px-4 py-1.5 bg-qc-blue text-white rounded-lg text-xs">Réessayer</button></div>}

      {data && !loading && (<>

        {/* KPI Bar — même données que Control Center */}
        <div className="border-b border-slate-800 px-4 py-2 overflow-x-auto">
          <div className="text-[8px] text-slate-600 mb-1.5">Source: QC-PILOT-2026-Q3 + Supabase DB</div>
          <div className="flex gap-2" style={{ minWidth:'max-content' }}>
            {[
              { l:'Chauffeurs',   v: k['drivers']??0,           c:'text-blue-400',   s:'pilot-demo' },
              { l:'En ligne',     v: k['drivers_online']??0,     c:'text-emerald-400',s:'pilot-demo' },
              { l:'Activités',    v: k['activities']??0,         c:'text-sky-400',    s:'pilot-demo' },
              { l:'Rev. bruts',   v: money(k['gross_revenue']??0),c:'text-amber-400', s:'pilot-demo' },
              { l:'Rev. nets',    v: money(k['net_revenue']??0),  c:'text-emerald-400',s:'pilot-demo' },
              { l:'Taxes calc.',  v: money(k['tax_calculated']??0),c:'text-orange-400',s:'pilot-demo'},
              { l:'TPS (5%)',     v: money(k['tps_only']??0),    c:'text-purple-400', s:'DEMO' },
              { l:'TVQ (9.975%)', v: money(k['tvq_only']??0),    c:'text-purple-400', s:'DEMO' },
              { l:'Décl. (DB)',   v: k['declarations_db']??0,    c:'text-amber-300',  s:'Supabase' },
              { l:'Alertes',      v: k['alerts']??0,             c:'text-red-400',    s:'pilot-demo' },
              { l:'Cas ouverts',  v: k['open_cases']??0,         c:'text-amber-400',  s:'pilot-demo' },
              { l:'Relevés',      v: k['settlements']??0,        c:'text-cyan-400',   s:'pilot-demo' },
              { l:'Véhicules (DB)',v: k['vehicles_db']??0,       c:'text-slate-300',  s:'Supabase' },
              { l:'Docs (DB)',    v: k['documents_db']??0,       c:'text-slate-300',  s:'Supabase' },
            ].map(kpi => (
              <div key={kpi.l} className="text-center px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl flex-shrink-0 min-w-[68px]">
                <div className={`text-sm font-black ${kpi.c}`}>{kpi.v}</div>
                <div className="text-[8px] text-slate-400">{kpi.l}</div>
                <div className="text-[7px] text-slate-600">{kpi.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Switcher */}
        <div className="px-4 py-2 border-b border-slate-800 overflow-x-auto">
          <div className="flex gap-1.5" style={{ minWidth:'max-content' }}>
            <button onClick={() => setDept('ALL')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${dept==='ALL'?'bg-slate-700 text-white border-slate-600':'text-slate-500 border-slate-800'}`}>
              ALL
            </button>
            {depts.map(d => (
              <button key={d.id} onClick={() => setDept(d.id)}
                style={{ borderColor: dept===d.id ? d.color : undefined, color: dept===d.id ? d.color : undefined }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${dept===d.id?'':'border-slate-800 text-slate-500'}`}>
                ● {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-1.5 border-b border-slate-800 overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth:'max-content' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold flex-shrink-0 ${tab===t?'bg-qc-blue text-white':'text-slate-400 border border-slate-800 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="px-4 py-3 pb-8">

          {/* ── OVERVIEW ── */}
          {tab === 'Overview' && (<>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
              <p className="text-[9px] text-amber-400">⚠️ Source: QC-PILOT-2026-Q3 (même données que Control Center). Impact 1,9G$ = PUBLIC_VERIFIED. Revenus internes = PRIVATE_NOT_AVAILABLE.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Kpi label="Rev. bruts" value={money(k['gross_revenue']??0)} color="text-amber-400" sub="pilot-demo" />
              <Kpi label="Rev. nets" value={money(k['net_revenue']??0)} color="text-emerald-400" sub="pilot-demo" />
              <Kpi label="Taxes calc." value={money(k['tax_calculated']??0)} color="text-orange-400" sub="pilot-demo" />
              <Kpi label="Pourboires" value={money(k['tips']??0)} color="text-amber-300" sub="pilot-demo" />
            </div>
            <Card title="Revenus par fournisseur (pilot-demo)">
              {data.by_provider.map(p => (
                <div key={p.provider} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                  <div><span className="text-xs font-bold text-white">{p.provider}</span><span className="text-[9px] text-slate-500 ml-2">{p.activities} activités</span></div>
                  <div className="text-right"><div className="text-xs font-bold text-amber-400">{money(p.gross)}</div><div className="text-[9px] text-slate-400">net {money(p.net)}</div></div>
                </div>
              ))}
            </Card>
            <Card title="Impact économique PUBLIC_VERIFIED">
              <Row label="Impact QC 2024" value="1,9 milliard $" badge="verified" />
              <Row label="Source" value="Uber/Public First, déc. 2025" badge="verified" />
              <Row label="Revenus internes" value="PRIVATE_NOT_AVAILABLE" badge="private" />
              <Row label="Statut fiscal chauffeurs" value="Travailleurs autonomes — Revenu Québec" badge="verified" />
            </Card>
          </>)}

          {/* ── PROFIL ── */}
          {tab === 'Profil' && (
            <Card title="Profil légal">
              <Row label="Nom légal" value="Uber Canada Inc." badge="demo" />
              <Row label="Commercial" value="Uber Québec" badge="demo" />
              <Row label="Enterprise ID" value="ENT-UBER-DEMO" />
              <Row label="NEQ" value="NOT_VERIFIED_DEMO" badge="private" />
              <Row label="Province" value="QC" />
              <Row label="Site web" value="uber.com" badge="verified" />
              <Row label="Type" value="PLATFORM" />
              <Row label="Statut" value="DEMO / PILOT" badge="demo" />
            </Card>
          )}

          {/* ── DÉPARTEMENTS ── */}
          {tab === 'Départements' && (
            <>{depts.map(d => (
              <div key={d.id} style={{ borderColor: d.color + '40' }} className="bg-slate-900 border rounded-xl p-4 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width:10, height:10, borderRadius:'50%', background:d.color }} />
                  <span className="font-bold text-white text-sm">{d.name}</span>
                  <Badge t="demo" />
                </div>
                <div className="text-[9px] text-slate-500">
                  Service: {d.service} · Activités: {data.by_provider.find(p => p.provider === d.service || p.provider === 'UBER' || p.provider === 'TAXI')?.activities ?? 0} DEMO
                </div>
              </div>
            ))}</>
          )}

          {/* ── CHAUFFEURS ── */}
          {tab === 'Chauffeurs' && (
            <Card title={`Chauffeurs — ${data.drivers.length} pilot-demo`}>
              {data.drivers.map(d => (
                <div key={d['id']} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-qc-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(d['name'] as string).split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{d['name']}</div>
                    <div className="text-[9px] text-slate-500">{d['number']} · {d['location']}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusChip v={String(d['status'])} />
                    <StatusChip v={String(d['presence'])} />
                  </div>
                </div>
              ))}
              <div className="py-2 text-[8px] text-slate-600">SYNTHETIC_DEMO — Pas de liste réelle Uber</div>
            </Card>
          )}

          {/* ── ACTIVITÉS ── */}
          {tab === 'Activités' && (
            <Card title={`Activités — ${data.activities.length} pilot-demo`}>
              {data.activities.slice(0,10).map(a => (
                <div key={String(a['id'])} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-white truncate">{String(a['driver'])} · {clean(String(a['type']))}</div>
                    <div className="text-[9px] text-slate-500">{String(a['provider'])} · {String(a['id'])}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-emerald-400">{money(parseFloat(String(a['net'])))}</span>
                    <StatusChip v={String(a['reconciliation'])} />
                  </div>
                </div>
              ))}
              {data.activities.length > 10 && <div className="py-2 text-[9px] text-slate-500">+{data.activities.length-10} autres activités</div>}
            </Card>
          )}

          {/* ── TRANSACTIONS ── */}
          {tab === 'Transactions' && (
            <Card title={`Transactions — ${data.transactions.length} pilot-demo`}>
              {data.transactions.map(t => (
                <div key={String(t['id'])} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 gap-2">
                  <div>
                    <div className="text-xs text-white">{String(t['driver'])} · {String(t['provider'])}</div>
                    <div className="text-[9px] text-slate-500">{String(t['id'])}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{money(parseFloat(String(t['total'])))}</span>
                    <StatusChip v={String(t['status'])} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── REVENUS ── */}
          {tab === 'Revenus' && (<>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Kpi label="Revenus bruts" value={money(k['gross_revenue']??0)} color="text-amber-400" sub="pilot-demo" />
              <Kpi label="Revenus nets" value={money(k['net_revenue']??0)} color="text-emerald-400" sub="pilot-demo" />
              <Kpi label="Frais plateforme" value={money(k['fees']??0)} color="text-red-400" sub="pilot-demo" />
              <Kpi label="Pourboires" value={money(k['tips']??0)} color="text-amber-300" sub="pilot-demo" />
            </div>
            <Card title="Revenus internes Uber">
              <Row label="Chiffre d'affaires Uber QC 2024" value="PRIVATE_NOT_AVAILABLE" badge="private" />
              <Row label="Impact économique QC 2024" value="1,9G$ — Uber/Public First" badge="verified" />
            </Card>
            <Card title="Relevés de règlement (pilot-demo)">
              {data.settlements.map(s => (
                <div key={String(s['id'])} className="py-2 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between">
                    <span className="text-xs text-white">{String(s['driver'])} · {String(s['provider'])}</span>
                    <StatusChip v={String(s['status'])} />
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    Brut: {money(parseFloat(String(s['gross'])))} · Payé: {money(parseFloat(String(s['paid'])))}
                  </div>
                </div>
              ))}
            </Card>
          </>)}

          {/* ── TPS/TVQ ── */}
          {tab === 'TPS/TVQ' && (<>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Kpi label="TPS (5%)" value={money(k['tps_only']??0)} color="text-purple-400" sub="DEMO estimé" />
              <Kpi label="TVQ (9.975%)" value={money(k['tvq_only']??0)} color="text-purple-400" sub="DEMO estimé" />
              <Kpi label="Total taxes" value={money(k['tax_calculated']??0)} color="text-orange-400" sub="pilot-demo" />
            </div>
            <Card title="Registres fiscaux (pilot-demo)">
              {data.tax_records.map(r => (
                <div key={String(r['id'])} className="py-2 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between">
                    <span className="text-xs text-white">{String(r['driver'])} · {String(r['provider'])}</span>
                    <StatusChip v={String(r['status'])} />
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    Taxable: {money(parseFloat(String(r['taxable'])))} · Δ variance: {money(parseFloat(String(r['variance'])))}
                  </div>
                </div>
              ))}
            </Card>
            <Card title="Sources fiscales">
              <Row label="Mécanisme Uber" value="Répondant fiscal — Revenu Québec" badge="verified" />
              <Row label="Données réelles Uber" value="PRIVATE_NOT_AVAILABLE" badge="private" />
              <Row label="SEV 2e génération" value="Requis depuis jan. 2026 — CTQ" badge="verified" />
            </Card>
          </>)}

          {/* ── DÉCLARATIONS ── */}
          {tab === 'Déclarations' && (
            <Card title={`Déclarations (Supabase DB: ${k['declarations_db']??0})`}>
              <Row label="Enregistrements DB" value={String(k['declarations_db']??0)} />
              <Row label="Mode" value="SIMULATION — Aucune transmission officielle" badge="demo" />
            </Card>
          )}

          {/* ── PAIEMENTS ── */}
          {tab === 'Paiements' && (
            <Card title="Paiements — pilot-demo">
              {data.settlements.map(s => (
                <div key={String(s['id'])} className="py-2 border-b border-slate-800 last:border-0 flex justify-between">
                  <div>
                    <div className="text-xs text-white">{String(s['id'])} · {String(s['provider'])}</div>
                    <div className="text-[9px] text-slate-500">{String(s['start'])} → {String(s['end'])}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{money(parseFloat(String(s['paid'])))}</div>
                    <StatusChip v={String(s['status'])} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── RELEVÉS ── */}
          {tab === 'Relevés' && (
            <Card title={`Relevés — ${data.statements.length} pilot-demo`}>
              {data.statements.map(s => (
                <div key={String(s['id'])} className="py-2 border-b border-slate-800 last:border-0 flex justify-between">
                  <div>
                    <div className="text-xs text-white">{String(s['driver'])} · {clean(String(s['type']))}</div>
                    <div className="text-[9px] text-slate-500">{String(s['reference'])}</div>
                  </div>
                  <StatusChip v={String(s['status'])} />
                </div>
              ))}
            </Card>
          )}

          {/* ── CAS ── */}
          {tab === 'Cas' && (
            <Card title={`Cas de réconciliation — ${data.cases.length} pilot-demo`}>
              {data.cases.map(c => (
                <div key={String(c['id'])} className="py-3 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">{clean(String(c['type']))} · {String(c['provider'])}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{String(c['note'])}</div>
                    </div>
                    <StatusChip v={String(c['status'])} />
                  </div>
                  {parseFloat(String(c['difference'])) > 0 && (
                    <div className="text-[9px] text-amber-400 mt-1">Δ {money(parseFloat(String(c['difference'])))}</div>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* ── ALERTES ── */}
          {tab === 'Alertes' && (
            <Card title={`Alertes — ${data.alerts.length} pilot-demo`}>
              {data.alerts.map(a => (
                <div key={String(a['id'])} className="py-3 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">{String(a['title'])}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{String(a['message'])}</div>
                      <div className="text-[8px] text-slate-600 mt-0.5">{String(a['service'])}</div>
                    </div>
                    <StatusChip v={String(a['status'])} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── RAPPORTS ── */}
          {tab === 'Rapports' && (
            <Card title={`Rapports — ${data.reports.length} pilot-demo`}>
              {data.reports.map(r => (
                <div key={String(r['id'])} className="py-2 border-b border-slate-800 last:border-0 flex justify-between">
                  <div>
                    <div className="text-xs text-white">{clean(String(r['type']))}</div>
                    <div className="text-[9px] text-slate-500">{String(r['id'])} · {String(r['records'])} lignes · {String(r['format'])}</div>
                  </div>
                  <StatusChip v={String(r['status'])} />
                </div>
              ))}
            </Card>
          )}

          {/* ── CONFORMITÉ ── */}
          {tab === 'Conformité' && (<>
            <Kpi label="Score conformité" value={`${k['compliance_demo']??85}%`} color="text-teal-400" sub="SYNTHETIC_DEMO" />
            <div className="mt-3">
              <Card title="Comptes plateforme (pilot-demo)">
                {data.accounts.filter(a => a['provider']==='UBER' || a['provider']==='TAXI').map(a => (
                  <div key={a['id']} className="py-2 border-b border-slate-800 last:border-0 flex justify-between">
                    <div>
                      <div className="text-xs text-white">{a['name']} · {a['provider']}</div>
                      <div className="text-[9px] text-slate-500">{a['idPublic']}</div>
                    </div>
                    <StatusChip v={String(a['status'])} />
                  </div>
                ))}
              </Card>
            </div>
          </>)}

          {/* ── AUDIT ── */}
          {tab === 'Audit' && (
            <Card title={`Audit log (Supabase DB: ${k['audits_db']??0})`}>
              <Row label="Entrées audit DB" value={String(k['audits_db']??0)} />
              <Row label="Source" value="audit_logs — Supabase" />
              <Row label="Politique" value="Chaque événement archivé" badge="verified" />
            </Card>
          )}

          {/* ── RÉCONCILIATION ── */}
          {tab === 'Réconciliation' && (<>
            <Card title="Réconciliation (pilot-demo)">
              <Row label="Revenus TAXIMETER.GOV" value={money(k['gross_revenue']??0)} badge="demo" />
              <Row label="TPS estimée" value={money(k['tps_only']??0)} badge="demo" />
              <Row label="TVQ estimée" value={money(k['tvq_only']??0)} badge="demo" />
              <Row label="Cas ouverts" value={String(k['open_cases']??0)} />
              <Row label="Note" value="Un écart ≠ fraude automatique" badge="verified" />
            </Card>
            <Card title="Variance TVQ Uber (pilot-demo)">
              {data.tax_records.filter(r => r['status']==='REVIEW_REQUIRED').map(r => (
                <div key={String(r['id'])} className="py-2 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between">
                    <span className="text-xs text-white">{String(r['provider'])} · {String(r['driver'])}</span>
                    <span className="text-xs font-bold text-amber-400">Δ {money(parseFloat(String(r['variance'])))}</span>
                  </div>
                </div>
              ))}
            </Card>
          </>)}

          {/* ── ANALYTICS ── */}
          {tab === 'Analytics' && (<>
            <Card title="Métriques globales (pilot-demo)">
              <Row label="Chauffeurs total" value={String(k['drivers']??0)} />
              <Row label="En ligne" value={String(k['drivers_online']??0)} />
              <Row label="Activités" value={String(k['activities']??0)} />
              <Row label="Rev. bruts" value={money(k['gross_revenue']??0)} />
              <Row label="Cas ouverts" value={String(k['open_cases']??0)} />
            </Card>
            <Card title="Par fournisseur">
              {data.by_provider.map(p => (
                <div key={p.provider} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-white">{p.provider}</span>
                  <div className="text-right text-xs">
                    <div className="text-amber-400 font-bold">{money(p.gross)}</div>
                    <div className="text-slate-500">{p.activities} activités</div>
                  </div>
                </div>
              ))}
            </Card>
          </>)}

          {/* ── CONNEXIONS GOV ── */}
          {tab === 'Connexions Gov' && (<>
            <Card title="Government Integration Layer">
              <Row label="Revenu Québec" value="DEMO — Aucune connexion réelle" badge="demo" />
              <Row label="SAAQ" value="DEMO" badge="demo" />
              <Row label="CTQ" value="DEMO" badge="demo" />
            </Card>
            <a href="https://www.revenuquebec.ca" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-qc-blue/10 border border-qc-blue/30 text-qc-blue text-xs font-bold mb-3">
              <ExternalLink size={14} /> Revenu Québec — Mon dossier entreprises
            </a>
          </>)}

          {/* ── API ── */}
          {tab === 'API' && (
            <Card title="API Center">
              <Row label="Statut" value="DEMO / CONFIGURED" badge="demo" />
              <Row label="Dernière sync" value="N/A — DEMO" badge="demo" />
              <Row label="Events today" value="0" badge="demo" />
              <Row label="Idempotency" value="Activé" />
            </Card>
          )}

          {/* ── WEBHOOKS ── */}
          {tab === 'Webhooks' && (
            <Card title="Webhook Center">
              <Row label="Statut" value="INACTIF — DEMO" badge="demo" />
              <Row label="Events" value="0" badge="demo" />
              <Row label="Queue morte" value="0" />
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'Notifications' && (
            <Card title={`Notifications (Supabase DB: ${k['notifications_db']??0})`}>
              <Row label="Total DB" value={String(k['notifications_db']??0)} />
              <Row label="Alertes actives" value={String(k['alerts']??0)} badge="demo" />
            </Card>
          )}

          {/* ── INTELLIGENCE ── */}
          {tab === 'Intelligence' && (
            <Card title="Intelligence — Architecture future">
              <Row label="Anomaly detection" value="Prévu — Phase future" badge="demo" />
              <Row label="Pattern analysis" value="Prévu" badge="demo" />
              <Row label="Note" value="Une anomalie ≠ preuve de fraude" badge="verified" />
            </Card>
          )}

          {/* ── COMMUNICATION GOV ── */}
          {tab === 'Communication Gov' && (
            <Card title="Communication gouvernementale">
              <Row label="Mode actuel" value="SIMULATION — MODE 1: Redirection officielle" badge="demo" />
              <Row label="Revenu Québec" value="DEMO" badge="demo" />
              <Row label="Transmission réelle" value="Aucune sans autorisation officielle" badge="demo" />
            </Card>
          )}

          {/* ── DOCUMENTS, SÉCURITÉ, VÉHICULES ── */}
          {tab === 'Documents' && <Card title={`Documents (Supabase DB: ${k['documents_db']??0})`}><Row label="Total DB" value={String(k['documents_db']??0)} /><Row label="Licences" value="TO_BE_VERIFIED" badge="demo" /></Card>}
          {tab === 'Véhicules' && <Card title={`Véhicules (Supabase DB: ${k['vehicles_db']??0})`}><Row label="Total DB" value={String(k['vehicles_db']??0)} /><Row label="Source" value="Table vehicles — Supabase" /></Card>}

          {/* Footer */}
          <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700">
            <div className="text-[8px] text-slate-500 space-y-0.5">
              <div>✓ PUBLIC_VERIFIED: Impact 1,9G$ QC 2024 — Uber/Public First déc. 2025</div>
              <div>✓ PUBLIC_VERIFIED: Statut fiscal — Revenu Québec</div>
              <div>⚠ SYNTHETIC_DEMO: Revenus, chauffeurs, activités = pilot-demo QC-PILOT-2026-Q3</div>
              <div>🔒 PRIVATE_NOT_AVAILABLE: Revenus internes Uber, NEQ réel, liste nominative</div>
              <div>Source DB: providers, revenue_ledger, vehicles, documents, tax_filings, audit_logs</div>
            </div>
          </div>
        </div>
      </>)}
    </AppShell>
  )
}
