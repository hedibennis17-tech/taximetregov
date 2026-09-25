'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'


const PILOT = '⚠️ PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE'
const m2 = (n: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(n)

type Dept = { name:string; service_type:string; status:string; emoji?:string }
type Org  = {
  id: string; public_org_id: string; legal_name: string; trade_name: string
  neq: string; org_type: string; sector: string; status: string
  tps_registered: boolean; tvq_registered: boolean
  address_city: string; address_province: string; is_demo: boolean
  departments: Dept[]
  driver_stats: { total:number; active:number }
  revenue_q3: { gross:number; taxes:number }
  dept_count: number
}

type SearchResult = {
  type:string; id:string; label:string; sublabel:string; link:string; icon:string
}

const STATUS_COLOR: Record<string,string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  PILOT:  'bg-blue-100  text-blue-700  dark:bg-blue-500/20  dark:text-blue-400',
  SUSPENDED: 'bg-red-100 text-red-700',
}
const SECTOR_ICON: Record<string,string> = {
  TRANSPORT:'🚗', TAXI:'🚕', DELIVERY:'📦', GROCERY:'🛒', LOGISTICS:'🚛', OTHER:'🏢',
}

export default function EnterprisesPage() {

  const [orgs,       setOrgs]       = useState<Org[]>([])
  const [loading,    setLoading]    = useState(true)
  const [source,     setSource]     = useState('')
  const [search,     setSearch]     = useState('')
  const [searchRes,  setSearchRes]  = useState<SearchResult[]>([])
  const [searching,  setSearching]  = useState(false)
  const [filter,     setFilter]     = useState('ALL')
  const [sector,     setSector]     = useState('ALL')
  const [expanded,   setExpanded]   = useState<string|null>(null)
  const [orgDetail,  setOrgDetail]  = useState<Record<string,unknown>|null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch('/api/enterprises')
      .then(r => r.json())
      .then(d => { setOrgs(d.organizations ?? []); setSource(d.source ?? ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Global search
  useEffect(() => {
    if (search.length < 2) { setSearchRes([]); return }
    const t = setTimeout(() => {
      setSearching(true)
      fetch(`/api/search?q=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => { setSearchRes(d.results ?? []); setSearching(false) })
        .catch(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Load org detail
  const loadDetail = useCallback((orgId: string) => {
    if (expanded === orgId) { setExpanded(null); setOrgDetail(null); return }
    setExpanded(orgId)
    setDetailLoading(true)
    fetch(`/api/enterprises/${orgId}`)
      .then(r => r.json())
      .then(d => { setOrgDetail(d); setDetailLoading(false) })
      .catch(() => setDetailLoading(false))
  }, [expanded])

  const filtered = orgs.filter(o => {
    if (filter !== 'ALL' && o.status !== filter) return false
    if (sector !== 'ALL' && o.sector !== sector) return false
    if (search.length >= 2) return (
      o.legal_name.toLowerCase().includes(search.toLowerCase()) ||
      o.trade_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.neq?.includes(search)
    )
    return true
  })

  const totalDrivers  = orgs.reduce((s,o) => s + o.driver_stats.total, 0)
  const totalGross    = orgs.reduce((s,o) => s + o.revenue_q3.gross, 0)
  const totalActive   = orgs.filter(o => o.status === 'ACTIVE').length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{background:'linear-gradient(135deg,#001A4D 0%,#002B7A 50%,#003DA5 100%)'}}>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-black text-xl">🏢 Registre des Entreprises</div>
                <div className="text-sm mt-1" style={{color:'rgba(255,255,255,0.5)'}}>
                  Government Enterprise Registry · {source === 'SUPABASE' ? '✅ Supabase' : '⚠️ Mode DEMO'}
                </div>
              </div>
              <div className="flex gap-4">
                {[{l:'Entreprises',v:orgs.length},{l:'Actives',v:totalActive},{l:'Chauffeurs',v:totalDrivers},{l:'Revenu Q3',v:m2(totalGross)}].map(k=>(
                  <div key={k.l} className="text-center">
                    <div className="text-lg font-black text-white">{k.v}</div>
                    <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PILOT */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          ⚠️ {PILOT}
        </div>

        {/* GLOBAL SEARCH */}
        <div className="relative">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
            <span className="text-xl">🔎</span>
            <input
              className="flex-1 text-sm text-slate-700 dark:text-slate-300 outline-none bg-transparent"
              placeholder="Rechercher entreprise, NEQ, chauffeur, véhicule, transaction..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {searching && <span className="text-xs text-slate-400">...</span>}
            {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm">✕</button>}
          </div>

          {/* Résultats recherche globale */}
          {searchRes.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
              {['org','driver','vehicle','activity'].map(type => {
                const items = searchRes.filter(r => r.type === type)
                if (!items.length) return null
                const labels: Record<string,string> = {org:'🏢 ENTREPRISES',driver:'🚗 CHAUFFEURS',vehicle:'🚙 VÉHICULES',activity:'📍 ACTIVITÉS'}
                return (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-black text-slate-400 bg-slate-50 dark:bg-slate-800 uppercase tracking-widest">
                      {labels[type]}
                    </div>
                    {items.map(r => (
                      <button key={r.id} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-left cursor-pointer"
                        onClick={() => {
                          if (type === 'org') loadDetail(r.id)
                          setSearch('')
                          setSearchRes([])
                        }}>
                        <span className="text-xl shrink-0">{r.icon}</span>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.label}</div>
                          <div className="text-xs text-slate-400">{r.sublabel}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FILTRES */}
        <div className="flex gap-2 flex-wrap">
          {['ALL','ACTIVE','PILOT','SUSPENDED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all"
              style={{background:filter===f?'#003DA5':'white',color:filter===f?'white':'#64748B',borderColor:filter===f?'#003DA5':'#E2E8F0'}}>
              {f==='ALL'?`Toutes (${orgs.length})`:f}
            </button>
          ))}
          <div className="w-px bg-slate-200"/>
          {['ALL','TRANSPORT','TAXI','DELIVERY','GROCERY','LOGISTICS'].map(s => (
            <button key={s} onClick={() => setSector(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all"
              style={{background:sector===s?'#7C3AED':'white',color:sector===s?'white':'#64748B',borderColor:sector===s?'#7C3AED':'#E2E8F0'}}>
              {s==='ALL'?'Tous secteurs':s}
            </button>
          ))}
        </div>

        {/* LISTE ORGANISATIONS */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement depuis Supabase...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(org => {
              const isExpanded = expanded === org.public_org_id
              const detail = isExpanded ? orgDetail : null
              return (
                <div key={org.public_org_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">

                  {/* ORG HEADER */}
                  <div className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => loadDetail(org.public_org_id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                          {SECTOR_ICON[org.sector] ?? '🏢'}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 dark:text-white text-base">{org.trade_name || org.legal_name}</div>
                          <div className="text-xs text-slate-500">{org.legal_name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-mono text-slate-400">NEQ: {org.neq}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[org.status] ?? 'bg-slate-100 text-slate-500'}`}>{org.status}</span>
                            {org.is_demo && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">DEMO</span>}
                            {org.tps_registered && <span className="text-xs text-green-600 font-bold">TPS ✓</span>}
                            {org.tvq_registered && <span className="text-xs text-green-600 font-bold">TVQ ✓</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-sm shrink-0">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* ORG STATS */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        {l:'Département',  v:org.dept_count,                                  icon:'🏗️'},
                        {l:'Chauffeurs',   v:org.driver_stats.total,                          icon:'👤'},
                        {l:'Actifs',       v:org.driver_stats.active,                         icon:'✅'},
                        {l:'Revenu Q3',    v:m2(org.revenue_q3.gross),                        icon:'💰'},
                        {l:'Taxes Q3',     v:m2(org.revenue_q3.taxes || org.revenue_q3.gross * 0.14975), icon:'🧾'},
                      ].map(k=>(
                        <div key={k.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 text-center">
                          <div className="text-sm font-black text-slate-700 dark:text-slate-300">{k.v}</div>
                          <div className="text-xs text-slate-400">{k.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* DEPARTMENTS */}
                    {org.departments.length > 0 && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {org.departments.map(d => (
                          <span key={d.name} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                            {d.emoji} {d.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ORG DETAIL (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      {detailLoading ? (
                        <div className="p-4 text-center text-slate-400 text-sm">Chargement du dossier...</div>
                      ) : detail ? (
                        <OrgDetailPanel detail={detail} />
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400">Aucune entreprise trouvée</div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── PANEL DÉTAIL ORGANISATION ──────────────────────────────────────────────────
function OrgDetailPanel({ detail }: { detail: Record<string,unknown> }) {
  const [tab, setTab] = useState<'profil'|'chauffeurs'|'activites'|'fiscal'>('chauffeurs')
  const org      = detail['organization'] as Record<string,unknown>
  const drivers  = detail['drivers']      as Record<string,unknown>[]
  const activities= detail['activities'] as Record<string,unknown>[]
  const revenue  = detail['revenue']      as Record<string,unknown>

  const m2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
  const tStyle = (t:string): React.CSSProperties => ({
    background: tab===t?'#003DA5':'transparent', color:tab===t?'white':'#64748B',
    border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:700,
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-1 flex-wrap">
        {['chauffeurs','activites','fiscal','profil'].map(t=>(
          <button key={t} style={tStyle(t)} onClick={()=>setTab(t as typeof tab)}>
            {t==='chauffeurs'?`👤 Chauffeurs (${drivers?.length??0})`:t==='activites'?`📍 Activités (${activities?.length??0})`:t==='fiscal'?'🧾 Fiscal':t==='profil'?'📋 Profil':''}
          </button>
        ))}
      </div>

      {tab === 'chauffeurs' && (
        <div className="space-y-2">
          {(drivers ?? []).map((d, i) => {
            const veh = (d['vehicles'] as Record<string,unknown>[])?.[0]
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {(d['first_name'] as string)[0]}{(d['last_name'] as string)[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-800 dark:text-white">
                    {d['first_name'] as string} {d['last_name'] as string}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{d['driver_number'] as string}</div>
                  {veh && <div className="text-xs text-slate-400">{veh['year'] as string} {veh['make'] as string} {veh['model'] as string} · {veh['license_plate_masked'] as string}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d['status']==='ACTIVE'?'bg-green-100 text-green-700':d['status']==='UNDER_REVIEW'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>
                    {d['status'] as string}
                  </span>
                  <span className="text-xs text-slate-400">{d['identity_verification_status'] as string}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'activites' && (
        <div className="space-y-2">
          {(activities ?? []).map((a, i) => {
            const drv = a['driver_profiles'] as Record<string,string> | null
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="text-xl shrink-0">
                  {a['activity_type_code']==='TAXI_TRIP'?'🚕':a['activity_type_code']==='RIDESHARE_TRIP'?'🚗':'📦'}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300">{a['public_id'] as string}</div>
                  <div className="text-xs text-slate-400">{drv ? `${drv['first_name']} ${drv['last_name']} · ${drv['driver_number']}` : ''}</div>
                  <div className="text-xs text-slate-400">{(a['location_start_reference'] as string)} → {(a['location_end_reference'] as string)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-700 dark:text-slate-300">{a['gross_amount'] as string} $</div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${a['reconciliation_status']==='MATCHED'?'bg-green-100 text-green-700':a['reconciliation_status']==='MISMATCH'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                    {a['reconciliation_status'] as string}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'fiscal' && revenue && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const t = revenue['totals'] as Record<string,number>
            const tps = revenue['tps'] as number
            const tvq = revenue['tvq'] as number
            return [
              {l:'Revenu brut Q3', v:m2(t?.gross??0), c:'#003DA5'},
              {l:'TPS (5%)',        v:m2(tps??0),      c:'#059669'},
              {l:'TVQ (9,975%)',    v:m2(tvq??0),      c:'#059669'},
              {l:'Total dû',        v:m2((tps??0)+(tvq??0)), c:'#DC2626'},
              {l:'Pourboires',     v:m2(t?.tips??0),  c:'#7C3AED'},
              {l:'Activités',      v:String(t?.count??0),c:'#64748B'},
            ].map(k=>(
              <div key={k.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                <div className="text-base font-black" style={{color:k.c}}>{k.v}</div>
                <div className="text-xs text-slate-400 mt-0.5">{k.l}</div>
                <div className="text-xs text-amber-500 font-bold mt-0.5">DEMO</div>
              </div>
            ))
          })()}
          <div className="col-span-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-2 text-xs font-bold text-red-600 dark:text-red-400">
            ⚠️ NON TRANSMIS À REVENU QUÉBEC · DONNÉES SYNTHÉTIQUES · TAXIMETER.GOV PILOTE
          </div>
        </div>
      )}

      {tab === 'profil' && org && (
        <div className="grid grid-cols-2 gap-2">
          {[
            {l:'Nom légal',       v:org['legal_name'] as string},
            {l:'Nom commercial',  v:org['trade_name'] as string},
            {l:'NEQ',             v:org['neq'] as string},
            {l:'Type',            v:org['org_type'] as string},
            {l:'Secteur',         v:org['sector'] as string},
            {l:'Statut',          v:org['status'] as string},
            {l:'TPS enregistrée', v:org['tps_registered']?'Oui':'Non'},
            {l:'TVQ enregistrée', v:org['tvq_registered']?'Oui':'Non'},
            {l:'Ville',           v:`${org['address_city']}, ${org['address_province']}`},
            {l:'Contact',         v:org['contact_email'] as string},
          ].map(({l,v})=>(
            <div key={l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
              <div className="text-xs font-bold text-slate-400">{l}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
