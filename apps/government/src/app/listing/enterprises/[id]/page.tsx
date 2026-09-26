'use client'
// ================================================================
// TAXIMETER.GOV — UBER QUÉBEC — Enterprise 360° Gov
// Mêmes données que taximetregov-enterprise.vercel.app
// ================================================================
import { AppShell } from '@/components/layout/AppShell'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react'
import { ENTERPRISES } from '../data'
import { govFetch } from '@/lib/api-client'

const money = (n: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD', maximumFractionDigits:0 }).format(n)
const money2 = (n: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(n)

const TABS = ['Overview','Profil','Départements','Chauffeurs','Déclarations','Paiements','Connexions','Notifications','Activité récente','Données publiques']

function Chip({ v }: { v: string }) {
  const ok  = /ACCEPTED|ACTIVE|CONNECTED|SYNCED|PAID/.test(v)
  const warn= /DRAFT|UPCOMING|SIMULATION|SUSPENDED|EXPIRING/.test(v)
  const c   = ok ? 'bg-emerald-500/15 text-emerald-300' : warn ? 'bg-amber-500/15 text-amber-200' : 'bg-slate-700 text-slate-300'
  return <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${c}`}>{v}</span>
}

function Row({ l, v, sub }: { l: string; v: string|number; sub?: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-800 last:border-0 gap-3">
      <span className="text-xs text-slate-400 shrink-0">{l}</span>
      <div className="text-right">
        <span className="text-xs text-white">{v}</span>
        {sub && <div className="text-[8px] text-slate-500">{sub}</div>}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-3">
      <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-800 text-xs font-bold text-white">{title}</div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

interface Dept  { id:string; name:string; emoji:string; color:string; drivers:number; vehicles:number; activities:number; transactions:number; gross:number; tips:number; tps:number; tvq:number }
interface Driver { id:string; name:string; status:string; vehicle:string|null; actQ3:number; revQ3:number }
interface Decl  { id:string; period:string; status:string; tps:number; tvq:number; total:number; gross:number; govRef:string|null }
interface Pay   { id:string; period:string; amount:number; status:string; paidAt:string|null }
interface Conn  { provider:string; status:string; dataRx:number }
interface Notif { id:string; type:string; title:string; desc:string; read:boolean }
interface Recent{ id:string; type:string; desc:string; sub:string; at:string }

interface EntData {
  enterprise_id:string; name:string; commercial_name:string; neq:string; province:string; city:string; status:string; note:string
  kpis: { drivers:number; vehicles:number; departments:number; activities:number; transactions:number; gross:number; tips:number; tps:number; tvq:number; fees:number; net:number; alerts:number; declarations:number; exception:number; compliance:number; gross_q3:number; tps_q3:number; tvq_q3:number }
  departments:Dept[]; drivers:Driver[]; declarations:Decl[]; payments:Pay[]; connections:Conn[]; notifications:Notif[]; recent:Recent[]
  public_data:Record<string,string>
}

export default function EnterpriseGovPage() {
  const { id } = useParams<{ id:string }>()
  const router = useRouter()
  const [tab,  setTab]  = useState('Overview')
  const [dept, setDept] = useState('ALL')
  const [data, setData] = useState<EntData|null>(null)
  const [loading, setLoading] = useState(true)
  const [err,  setErr]  = useState<string|null>(null)

  const staticEnt = ENTERPRISES.find(e => e.id === id)

  const load = useCallback(async () => {
    try { setLoading(true); setErr(null)
      const r = await govFetch<EntData>(`/api/enterprises/${id}`)
      setData(r)
    } catch(e) { setErr((e as Error).message) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])

  const k = data?.kpis
  const depts = data?.departments ?? []
  const filteredDepts = dept === 'ALL' ? depts : depts.filter(d => d.id === dept)

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            <ArrowLeft size={14} className="text-slate-400" />
          </button>
          {/* Logo Uber style */}
          <div className="flex-1 flex items-center gap-2">
            <div className="px-3 py-1 rounded-lg" style={{ background:'#000' }}>
              <span className="font-black text-white text-sm" style={{ letterSpacing:'-0.04em' }}>uber</span>
            </div>
            <div>
              <div className="font-black text-white text-sm">Uber Québec · Enterprise Gov</div>
              <div className="text-[8px] text-slate-500">{id} · DONNÉES SYNTHÉTIQUES</div>
            </div>
          </div>
          <button onClick={() => void load()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <RefreshCw size={13} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
          </button>
        </div>
        {/* Status */}
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />Connecté</span>
          <span className="text-amber-400 font-bold">PILOTE</span>
          <span className="text-slate-500">{depts.length} depts actifs</span>
          {k && <span className="text-red-400">{k.alerts} alertes</span>}
        </div>
      </div>

      {loading && <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={20} /><p className="text-xs text-slate-400 mt-2">Chargement…</p></div>}
      {err && <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center"><p className="text-sm text-red-400 mb-2">{err}</p><button onClick={() => void load()} className="px-4 py-1.5 bg-qc-blue text-white rounded-lg text-xs">Réessayer</button></div>}

      {data && !loading && (<>

        {/* KPI Bar — mêmes chiffres que enterprise.vercel.app */}
        <div className="border-b border-slate-800 bg-black/20">
          <div className="px-4 py-2 overflow-x-auto">
            <div className="flex gap-3" style={{ minWidth:'max-content' }}>
              {[
                { l:'Chauffeurs (S.)', v: k!.drivers.toLocaleString('fr-CA'),       c:'text-white' },
                { l:'Véhicules (S.)',  v: k!.vehicles.toLocaleString('fr-CA'),      c:'text-blue-400' },
                { l:'Activités (S.)', v: (k!.activities/1000).toFixed(0)+'k',      c:'text-purple-400' },
                { l:'Transactions',   v: (k!.transactions/1000).toFixed(0)+'k',    c:'text-slate-300' },
                { l:'Rev. bruts',     v: money(k!.gross),                            c:'text-emerald-400' },
                { l:'TPS (DEMO)',     v: money(k!.tps),                              c:'text-purple-400' },
                { l:'TVQ (DEMO)',     v: money(k!.tvq),                              c:'text-indigo-400' },
                { l:'Pourboires',     v: money(k!.tips),                             c:'text-blue-300' },
                { l:'Exceptions',     v: k!.exception,                               c:'text-red-400' },
                { l:'Conformité',     v: k!.compliance+'%',                          c:'text-emerald-400' },
                { l:'Q3 Bruts',       v: money(k!.gross_q3),                         c:'text-amber-400' },
                { l:'Q3 TPS',         v: money(k!.tps_q3),                           c:'text-purple-400' },
                { l:'Q3 TVQ',         v: money(k!.tvq_q3),                           c:'text-indigo-400' },
              ].map(ki => (
                <div key={ki.l} className="text-center shrink-0">
                  <div className={`text-sm font-black ${ki.c}`}>{ki.v}</div>
                  <div className="text-[7px] text-slate-500 mt-0.5">{ki.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Switcher */}
        <div className="px-4 py-1.5 border-b border-slate-800 overflow-x-auto">
          <div className="flex gap-1.5" style={{ minWidth:'max-content' }}>
            <button onClick={() => setDept('ALL')}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold border ${dept==='ALL'?'bg-slate-700 text-white border-slate-600':'text-slate-500 border-slate-800'}`}>
              Tous les départements
            </button>
            {depts.map(d => (
              <button key={d.id} onClick={() => setDept(d.id)}
                style={{ borderColor: dept===d.id ? d.color : undefined, color: dept===d.id ? d.color : undefined }}
                className={`px-3 py-1 rounded-lg text-[9px] font-bold border ${dept===d.id?'':'border-slate-800 text-slate-500'}`}>
                {d.emoji} {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-1 border-b border-slate-800 overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth:'max-content' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold shrink-0 ${tab===t?'bg-qc-blue text-white':'text-slate-400 border border-slate-800'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 pb-8">

          {/* ── OVERVIEW ── */}
          {tab === 'Overview' && (<>
            {/* Warning note */}
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3 text-[8px] text-amber-400">
              ⚠️ {data.note}
            </div>

            {/* Finance block */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l:'Rev. bruts (DEMO)',   v: money(k!.gross),   c:'text-emerald-400' },
                { l:'TPS collectée (DEMO)',v: money(k!.tps),     c:'text-purple-400' },
                { l:'TVQ collectée (DEMO)',v: money(k!.tvq),     c:'text-indigo-400' },
                { l:'Pourboires (DEMO)',   v: money(k!.tips),    c:'text-blue-400' },
              ].map(ki => (
                <div key={ki.l} className={`bg-slate-900 border border-slate-800 rounded-xl p-3`}>
                  <div className={`text-xl font-black ${ki.c}`}>{ki.v}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{ki.l}</div>
                </div>
              ))}
            </div>

            {/* Revenus par département */}
            <Card title="Revenus par département (DEMO)">
              <div className="text-[8px] text-slate-500 py-1">Données synthétiques · PILOTE</div>
              {filteredDepts.map(d => {
                const pct = Math.round(d.gross / k!.gross * 100)
                return (
                  <div key={d.id} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-white">{d.emoji} {d.name}</span>
                      <span className="font-black" style={{ color: d.color }}>{pct}%  · {money(d.gross)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:d.color }} />
                    </div>
                  </div>
                )
              })}
            </Card>

            {/* Obligation Q3 */}
            <div className="rounded-2xl p-4 mb-3" style={{ background:'#000' }}>
              <div className="text-[8px] text-amber-400 font-bold mb-1">📅 PROCHAINE OBLIGATION</div>
              <div className="text-sm font-black text-white">TPS/TVQ — Q3 2026</div>
              <div className="text-xs text-slate-400">Échéance: 2026-10-31 · {money2(k!.tps_q3 + k!.tvq_q3)} · DEMO</div>
              <button onClick={() => setTab('Déclarations')} className="mt-2 px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold">→ Obligations</button>
            </div>

            {/* Connexions */}
            <Card title="Connexions">
              {data.connections.map(c => (
                <div key={c.provider} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.status==='CONNECTED'?'bg-green-400':'bg-amber-400'}`} />
                    <span className="text-xs text-white">{c.provider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500">{c.dataRx.toLocaleString()} enreg.</span>
                    <Chip v={c.status} />
                  </div>
                </div>
              ))}
            </Card>

            {/* Activité récente */}
            <Card title="Activité récente">
              {data.recent.map(r => (
                <div key={r.id} className="flex items-start gap-2 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-base shrink-0">{r.type==='SYNC'?'🔄':r.type==='TX'?'💳':'⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{r.desc}</div>
                    <div className="text-[9px] text-slate-400 truncate">{r.sub}</div>
                  </div>
                  <div className="text-[8px] text-slate-500 shrink-0">{new Date(r.at).toLocaleString('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              ))}
            </Card>
          </>)}

          {/* ── PROFIL ── */}
          {tab === 'Profil' && (
            <Card title="Profil légal — ENT-UBER-DEMO">
              <Row l="Nom légal"      v={data.name}            sub="DEMO" />
              <Row l="Commercial"     v={data.commercial_name} sub="DEMO" />
              <Row l="Enterprise ID"  v={data.enterprise_id} />
              <Row l="NEQ"            v={data.neq}             sub="FICTIF — DEMO UNIQUEMENT" />
              <Row l="Province"       v={data.province} />
              <Row l="Statut"         v={data.status} />
              <Row l="Données"        v="SYNTHETIC_DEMO"       sub="Aucune donnée réelle Uber" />
            </Card>
          )}

          {/* ── DÉPARTEMENTS ── */}
          {tab === 'Départements' && (<>
            <div className="text-[9px] text-slate-500 mb-2">1 organisation · {depts.length} départements actifs · SYNTHETIC_DEMO</div>
            {filteredDepts.map(d => (
              <div key={d.id} style={{ borderColor: d.color+'40' }} className="bg-slate-900 border rounded-xl p-4 mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{d.emoji}</span>
                  <span className="font-black text-white">{d.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">DEMO</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { l:'Chauffeurs', v: d.drivers.toLocaleString('fr-CA'),    c:'text-blue-400' },
                    { l:'Véhicules',  v: d.vehicles.toLocaleString('fr-CA'),   c:'text-slate-300' },
                    { l:'Activités',  v: d.activities.toLocaleString('fr-CA'), c:'text-purple-400' },
                    { l:'Rev. bruts', v: money(d.gross),                        c:'text-emerald-400' },
                    { l:'TPS',        v: money(d.tps),                          c:'text-purple-400' },
                    { l:'TVQ',        v: money(d.tvq),                          c:'text-indigo-400' },
                  ].map(ki => (
                    <div key={ki.l} className="bg-slate-800 rounded-lg p-2">
                      <div className={`text-sm font-black ${ki.c}`}>{ki.v}</div>
                      <div className="text-[8px] text-slate-500">{ki.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>)}

          {/* ── CHAUFFEURS ── */}
          {tab === 'Chauffeurs' && (
            <Card title={`Chauffeurs · ${data.drivers.length} DEMO`}>
              {data.drivers.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-qc-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {d.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{d.name}</div>
                    <div className="text-[9px] text-slate-500">{d.id} · {d.actQ3} activités Q3</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{money(d.revQ3)}</div>
                    <Chip v={d.status} />
                  </div>
                </div>
              ))}
              <div className="py-2 text-[8px] text-slate-600">SYNTHETIC_DEMO — Pas de liste réelle Uber · Total DEMO: {money(k!.gross)}</div>
            </Card>
          )}

          {/* ── DÉCLARATIONS ── */}
          {tab === 'Déclarations' && (
            <Card title="Déclarations TPS/TVQ (DEMO)">
              {data.declarations.map(d => (
                <div key={d.id} className="py-3 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-black text-white">{d.period}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{money2(d.tps+d.tvq)} TPS+TVQ · Rev. {money(d.gross)}</div>
                      {d.govRef && <div className="text-[9px] text-slate-500 font-mono mt-0.5">{d.govRef}</div>}
                    </div>
                    <Chip v={d.status==='ACCEPTED'?'ACCEPTED':d.status==='DRAFT'?'DRAFT':'SUBMITTED'} />
                  </div>
                  {d.status === 'ACCEPTED' && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                      <div className="bg-slate-800 rounded p-1.5"><span className="text-slate-400">TPS: </span><span className="text-white">{money2(d.tps)}</span></div>
                      <div className="bg-slate-800 rounded p-1.5"><span className="text-slate-400">TVQ: </span><span className="text-white">{money2(d.tvq)}</span></div>
                    </div>
                  )}
                </div>
              ))}
              <a href="https://www.revenuquebec.ca" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 mt-2 text-[9px] text-qc-blue hover:underline">
                <ExternalLink size={11} /> Revenu Québec — Mon dossier entreprises
              </a>
            </Card>
          )}

          {/* ── PAIEMENTS ── */}
          {tab === 'Paiements' && (
            <Card title="Paiements TPS/TVQ (DEMO)">
              {data.payments.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-slate-800 last:border-0">
                  <div>
                    <div className="text-xs font-bold text-white">{p.period}</div>
                    {p.paidAt && <div className="text-[9px] text-slate-500">Payé: {p.paidAt}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400">{money2(p.amount)}</div>
                    <Chip v={p.status} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── CONNEXIONS ── */}
          {tab === 'Connexions' && (
            <Card title="Connexions API (DEMO)">
              {data.connections.map(c => (
                <div key={c.provider} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${c.status==='CONNECTED'?'bg-green-400':'bg-amber-400'}`} />
                    <span className="text-xs font-bold text-white">{c.provider}</span>
                  </div>
                  <div className="text-right">
                    <Chip v={c.status} />
                    <div className="text-[8px] text-slate-500 mt-0.5">{c.dataRx.toLocaleString()} enreg.</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'Notifications' && (
            <Card title={`Notifications (${data.notifications.filter(n=>!n.read).length} non lues)`}>
              {data.notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${n.type==='ALERT'?'bg-red-400':n.type==='WARNING'?'bg-amber-400':n.type==='SUCCESS'?'bg-green-400':'bg-blue-400'}`} />
                  <div>
                    <div className={`text-xs font-bold ${n.read?'text-slate-400':'text-white'}`}>{n.title}</div>
                    <div className="text-[9px] text-slate-500">{n.desc}</div>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-qc-blue shrink-0 ml-auto mt-1" />}
                </div>
              ))}
            </Card>
          )}

          {/* ── ACTIVITÉ RÉCENTE ── */}
          {tab === 'Activité récente' && (
            <Card title="Journal d'activité récente">
              {data.recent.map(r => (
                <div key={r.id} className="flex items-start gap-2 py-2.5 border-b border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{r.type==='SYNC'?'🔄':r.type==='TX'?'💳':'⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{r.desc}</div>
                    <div className="text-[9px] text-slate-400">{r.sub}</div>
                    <div className="text-[8px] text-slate-600">{new Date(r.at).toLocaleString('fr-CA')}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── DONNÉES PUBLIQUES ── */}
          {tab === 'Données publiques' && (
            <Card title="Données PUBLIC_VERIFIED">
              {Object.entries(data.public_data).map(([k2, v]) => (
                <Row key={k2} l={k2.replaceAll('_',' ')} v={v} />
              ))}
              <div className="py-2 text-[8px] text-slate-500">
                Source: Uber Canada / Public First · Revenu Québec · Travelnet · CTQ
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 text-[8px] text-slate-500 space-y-0.5">
            <div>⚠️ {data.note}</div>
            <div>Enterprise ID: {data.enterprise_id} · TAXIMETER.GOV GOV · Source: apps/enterprise/lib/data.ts</div>
          </div>
        </div>
      </>)}
    </AppShell>
  )
}
