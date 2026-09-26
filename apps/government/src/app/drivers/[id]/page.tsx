'use client'
// ================================================================
// TAXIMETER.GOV — DOSSIER CHAUFFEUR COMPLET
// Source: Supabase — toutes les tables du compte
// ================================================================
import { AppShell } from '@/components/layout/AppShell'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react'

const money = (n: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(n)
const date  = (s: string) => s ? new Date(s).toLocaleDateString('fr-CA') : '—'
const dt    = (s: string) => s ? new Date(s).toLocaleString('fr-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const TABS = ['Profil','Revenus','Fiscal','Courses','Documents','Plateformes','Notifications','Audit']

function StatusBadge({ v }: { v: string }) {
  const ok   = /ACTIVE|VERIFIED|APPROVED|REGISTERED|COMPLETED|ACCEPTED|SYNCED/.test(v ?? '')
  const warn = /PENDING|REVIEW|DRAFT|EXPIRING|SUBMITTED/.test(v ?? '')
  const err  = /EXPIRED|REJECTED|SUSPENDED|ERROR/.test(v ?? '')
  const c = ok ? 'bg-green-500/15 text-green-400' : warn ? 'bg-amber-500/15 text-amber-400' : err ? 'bg-red-500/15 text-red-400' : 'bg-slate-700 text-slate-300'
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c}`}>{v}</span>
}

function Row({ l, v }: { l: string; v: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-400">{l}</span>
      <span className="text-xs text-white font-medium text-right max-w-[60%]">{v || '—'}</span>
    </div>
  )
}

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-3">
      <div className={`px-4 py-2.5 border-b border-slate-800 text-xs font-bold text-white ${accent ?? 'bg-slate-800/60'}`}>{title}</div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

interface DriverData {
  driver_id: string; user_id: string
  profile: Record<string,string>; user: Record<string,string> | null
  vehicles: Array<Record<string,string>>; documents: Array<Record<string,unknown>>
  tax_account: Record<string,string> | null; tax_filings: Array<Record<string,string>>
  tax_periods: Array<Record<string,string>>; platforms: Array<Record<string,string>>
  trips: Array<Record<string,string>>; notifications: Array<Record<string,string>>
  audit_logs: Array<Record<string,string>>
  revenue: { total_gross:number; total_net:number; total_fees:number; total_tips:number; tps_estime:number; tvq_estime:number; by_source:Record<string,number>; entries:number; ledger:Array<Record<string,string>> }
  stats: { trips_total:number; trips_completed:number; documents_total:number; documents_expiring:number; platforms_active:number; notifications_unread:number }
}

export default function DriverDossierPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab,  setTab]  = useState('Profil')
  const [data, setData] = useState<DriverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err,  setErr]  = useState<string|null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setErr(null)
      const res = await fetch(`/api/drivers/${id}`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const json = await res.json() as DriverData
      setData(json)
    } catch(e) { setErr((e as Error).message) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])

  const p  = data?.profile
  const u  = data?.user
  const rv = data?.revenue
  const st = data?.stats ?? { trips_total:0, trips_completed:0, documents_total:0, documents_expiring:0, platforms_active:0, notifications_unread:0 }

  const fullName = p ? `${p['first_name'] ?? ''} ${p['last_name'] ?? ''}`.trim() : '—'
  const initials = p ? `${p['first_name']?.[0] ?? ''}${p['last_name']?.[0] ?? ''}` : '?'

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <ArrowLeft size={14} className="text-slate-400" />
          </button>
          {data && (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-qc-blue flex items-center justify-center text-white font-black text-lg shrink-0">
                {initials}
              </div>
              <div>
                <div className="font-black text-white text-base">{fullName}</div>
                <div className="text-[9px] text-slate-400">{u?.['email'] ?? '—'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge v={p?.['status'] ?? '—'} />
                  <span className="text-[8px] text-slate-500">{p?.['driver_number'] ?? '—'}</span>
                </div>
              </div>
            </div>
          )}
          <button onClick={() => void load()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 ml-auto">
            <RefreshCw size={13} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
          </button>
        </div>

        {/* KPI Bar */}
        {st && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { l:'Courses',    v: st.trips_completed,        c:'text-blue-400'    },
              { l:'Revenus',    v: money(rv?.total_gross??0), c:'text-emerald-400' },
              { l:'TPS est.',   v: money(rv?.tps_estime??0),  c:'text-purple-400'  },
              { l:'TVQ est.',   v: money(rv?.tvq_estime??0),  c:'text-indigo-400'  },
            ].map(k => (
              <div key={k.l} className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                <div className={`text-sm font-black ${k.c}`}>{k.v}</div>
                <div className="text-[8px] text-slate-500">{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={20} /><p className="text-xs text-slate-400 mt-2">Chargement dossier…</p></div>}
      {err && <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-sm text-red-400">{err}</p></div>}

      {data && !loading && (<>
        {/* Tabs */}
        <div className="px-4 py-1.5 border-b border-slate-800 overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth:'max-content' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 ${tab===t?'bg-qc-blue text-white':'text-slate-400 border border-slate-800'}`}>
                {t}
                {t === 'Notifications' && st.notifications_unread > 0 && <span className="ml-1 text-red-400">({st.notifications_unread})</span>}
                {t === 'Documents' && st.documents_expiring > 0 && <span className="ml-1 text-amber-400">⚠</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 pb-8">

          {/* ── PROFIL ── */}
          {tab === 'Profil' && (<>
            <Card title="👤 Identité">
              <Row l="Nom complet"    v={fullName} />
              <Row l="Prénom"         v={p?.['first_name'] ?? '—'} />
              <Row l="Nom"            v={p?.['last_name'] ?? '—'} />
              <Row l="No. chauffeur"  v={p?.['driver_number'] ?? '—'} />
              <Row l="Driver ID"      v={data.driver_id} />
              <Row l="Téléphone"      v={p?.['phone'] ?? '—'} />
              <Row l="Province"       v={p?.['province'] ?? '—'} />
              <Row l="Langue"         v={p?.['language'] ?? '—'} />
            </Card>

            <Card title="🔐 Compte">
              <Row l="Email"          v={u?.['email'] ?? '—'} />
              <Row l="User ID"        v={data.user_id} />
              <Row l="Type"           v={u?.['user_type'] ?? '—'} />
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">Statut compte</span>
                <StatusBadge v={u?.['status'] ?? '—'} />
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">Identité vérifiée</span>
                <StatusBadge v={p?.['identity_verification_status'] ?? '—'} />
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-slate-400">Statut profil</span>
                <StatusBadge v={p?.['status'] ?? '—'} />
              </div>
            </Card>

            {data.vehicles.length > 0 && (
              <Card title="🚗 Véhicule">
                {data.vehicles.map(v => (
                  <div key={v['id']} className="py-2">
                    <Row l="Véhicule"    v={`${v['year']} ${v['make']} ${v['model']}`} />
                    <Row l="Couleur"     v={v['color'] ?? '—'} />
                    <Row l="Plaque"      v={v['license_plate_masked'] ?? '—'} />
                    <Row l="Type"        v={v['vehicle_type'] ?? '—'} />
                    <Row l="Carburant"   v={v['fuel_type'] ?? '—'} />
                    <Row l="Places"      v={v['seating_capacity'] ?? '—'} />
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-xs text-slate-400">Taximètre</span>
                      <StatusBadge v={v['taximeter_status'] ?? '—'} />
                    </div>
                  </div>
                ))}
              </Card>
            )}

            <Card title="🏦 Compte fiscal">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">TPS</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white">{data.tax_account?.['tps_registration_masked'] ?? '—'}</span>
                  <StatusBadge v={data.tax_account?.['tps_status'] ?? '—'} />
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">TVQ</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white">{data.tax_account?.['tvq_registration_masked'] ?? '—'}</span>
                  <StatusBadge v={data.tax_account?.['tvq_status'] ?? '—'} />
                </div>
              </div>
              <Row l="Fréquence décl." v={data.tax_account?.['filing_frequency'] ?? '—'} />
              <div className="flex justify-between py-2">
                <span className="text-xs text-slate-400">Statut compte fiscal</span>
                <StatusBadge v={data.tax_account?.['tax_account_status'] ?? '—'} />
              </div>
            </Card>
          </>)}

          {/* ── REVENUS ── */}
          {tab === 'Revenus' && (<>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 col-span-2 text-center">
                <div className="text-3xl font-black text-emerald-400">{money(rv?.total_gross??0)}</div>
                <div className="text-xs text-slate-400 mt-1">Revenus bruts totaux · {rv?.entries} entrées</div>
              </div>
              {[
                { l:'Revenus nets',  v: money(rv?.total_net??0),   c:'text-emerald-300' },
                { l:'Frais platef.', v: money(rv?.total_fees??0),  c:'text-red-400' },
                { l:'Pourboires',    v: money(rv?.total_tips??0),  c:'text-blue-400' },
                { l:'TPS estimée',   v: money(rv?.tps_estime??0),  c:'text-purple-400' },
                { l:'TVQ estimée',   v: money(rv?.tvq_estime??0),  c:'text-indigo-400' },
              ].map(k => (
                <div key={k.l} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <div className={`text-lg font-black ${k.c}`}>{k.v}</div>
                  <div className="text-[9px] text-slate-500">{k.l}</div>
                </div>
              ))}
            </div>

            <Card title="Revenus par source">
              {Object.entries(rv?.by_source ?? {}).map(([src, gross]) => (
                <div key={src} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-white">{src}</span>
                  <span className="text-xs font-bold text-emerald-400">{money(gross)}</span>
                </div>
              ))}
            </Card>

            <Card title="Dernières transactions (revenue_ledger)">
              {rv?.ledger.map(r => (
                <div key={r['id']} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 gap-2">
                  <div>
                    <div className="text-xs text-white">{r['source_type']} · {r['activity_type']}</div>
                    <div className="text-[9px] text-slate-500">{date(r['activity_date'] ?? '')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{money(parseFloat(r['gross_amount']??'0'))}</div>
                    <div className="text-[9px] text-slate-500">net {money(parseFloat(r['net_amount']??'0'))}</div>
                  </div>
                </div>
              ))}
            </Card>
          </>)}

          {/* ── FISCAL ── */}
          {tab === 'Fiscal' && (<>
            <Card title="Déclarations TPS/TVQ">
              {data.tax_filings.length === 0 && <p className="py-4 text-sm text-slate-400 text-center">Aucune déclaration</p>}
              {data.tax_filings.map(f => (
                <div key={f['id']} className="py-3 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">{f['filing_type']} · {f['gateway_mode']}</div>
                      {f['government_reference'] && <div className="text-[9px] font-mono text-slate-500">{f['government_reference']}</div>}
                      {f['accepted_at'] && <div className="text-[9px] text-green-400">✓ Acceptée: {date(f['accepted_at'])}</div>}
                    </div>
                    <StatusBadge v={f['filing_status'] ?? '—'} />
                  </div>
                </div>
              ))}
            </Card>

            <Card title="Périodes fiscales">
              {data.tax_periods.map(p2 => (
                <div key={p2['id']} className="py-3 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-white">{p2['period_start']} → {p2['period_end']}</div>
                      <div className="text-[9px] text-slate-500">Taxi: {money(parseFloat(p2['gross_revenue_taxi']??'0'))} · Ride: {money(parseFloat(p2['gross_revenue_rideshare']??'0'))}</div>
                      <div className="text-[9px] text-slate-500">Échéance: {p2['filing_due_date']}</div>
                    </div>
                    <StatusBadge v={p2['period_status'] ?? '—'} />
                  </div>
                </div>
              ))}
            </Card>
          </>)}

          {/* ── COURSES ── */}
          {tab === 'Courses' && (
            <Card title={`Courses · ${st?.trips_completed}/${st?.trips_total} complétées`}>
              {data.trips.length === 0 && <p className="py-4 text-sm text-slate-400 text-center">Aucune course</p>}
              {data.trips.map(t => (
                <div key={t['id']} className="py-2.5 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{t['trip_reference']}</div>
                      <div className="text-[9px] text-slate-500">{dt(t['started_at']??'')}</div>
                      {t['distance_meters'] && <div className="text-[9px] text-slate-500">{(parseInt(t['distance_meters'])/1000).toFixed(1)} km · {Math.round(parseInt(t['elapsed_seconds']??'0')/60)} min</div>}
                    </div>
                    <div className="text-right">
                      {t['final_amount'] && <div className="text-xs font-bold text-emerald-400">{money(parseFloat(t['final_amount']))}</div>}
                      <StatusBadge v={t['trip_status'] ?? '—'} />
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === 'Documents' && (
            <Card title={`Documents · ${st?.documents_expiring} en alerte`}>
              {data.documents.length === 0 && <p className="py-4 text-sm text-slate-400 text-center">Aucun document</p>}
              {data.documents.map(doc => {
                const dt2 = doc as Record<string, unknown>
                const docType = dt2['document_types'] as Record<string,string> | null
                return (
                  <div key={String(dt2['id'])} className="py-2.5 border-b border-slate-800 last:border-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">{docType?.['label'] ?? '—'}</div>
                        <div className="text-[9px] text-slate-500">Émis: {date(String(dt2['issued_at']??''))} · Expire: {date(String(dt2['expires_at']??''))}</div>
                      </div>
                      <StatusBadge v={String(dt2['status'] ?? '—')} />
                    </div>
                  </div>
                )
              })}
            </Card>
          )}

          {/* ── PLATEFORMES ── */}
          {tab === 'Plateformes' && (
            <Card title={`Plateformes · ${st?.platforms_active} actives`}>
              {data.platforms.length === 0 && <p className="py-4 text-sm text-slate-400 text-center">Aucune plateforme</p>}
              {data.platforms.map(p2 => (
                <div key={p2['id']} className="py-2.5 border-b border-slate-800 last:border-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{p2['display_name'] ?? p2['provider_code']}</div>
                      <div className="text-[9px] font-mono text-slate-500">{p2['public_provider_account_id']}</div>
                      <div className="text-[9px] text-slate-500">Sync: {dt(p2['last_sync_at']??'')}</div>
                    </div>
                    <StatusBadge v={p2['provider_account_status'] ?? '—'} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'Notifications' && (
            <Card title={`Notifications · ${st?.notifications_unread} non lues`}>
              {data.notifications.map(n => (
                <div key={n['id']} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${n['status']==='UNREAD'?'bg-qc-blue':'bg-slate-600'}`} />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{n['title']}</div>
                    <div className="text-[9px] text-slate-400">{n['body']}</div>
                    <div className="text-[8px] text-slate-600">{dt(n['created_at']??'')}</div>
                  </div>
                  <StatusBadge v={n['priority'] ?? '—'} />
                </div>
              ))}
            </Card>
          )}

          {/* ── AUDIT ── */}
          {tab === 'Audit' && (
            <Card title="Journal d'audit">
              {data.audit_logs.length === 0 && <p className="py-4 text-sm text-slate-400 text-center">Aucun événement</p>}
              {data.audit_logs.map(a => (
                <div key={a['id']} className="py-2 border-b border-slate-800 last:border-0">
                  <div className="text-xs text-white">{a['action']}</div>
                  <div className="text-[9px] text-slate-500">{dt(a['created_at']??'')}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </>)}
    </AppShell>
  )
}
