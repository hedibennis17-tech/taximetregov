'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, fmtDt, ENT_DRIVERS, ENT_ACTIVITIES, ENT_TRANSACTIONS, DRIVER_DETAIL, SYNC_STATUS } from '@/lib/data'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:    {label:'Actif',      color:'#059669',bg:'rgba(5,150,105,0.12)'},
  SUSPENDED: {label:'Suspendu',   color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:   {label:'En attente', color:'#B45309',bg:'rgba(180,83,9,0.10)'},
}
const DOC_BADGE: Record<string,{label:string;color:string}> = {
  OK:      {label:'Docs OK',       color:'#059669'},
  EXPIRING:{label:'Doc expirant',  color:'#B45309'},
  EXPIRED: {label:'Doc expiré',    color:'#DC2626'},
}

export default function DriversPage() {
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = ENT_DRIVERS.filter(d=>{
    if (filter==='ACTIVE'    && d.status!=='ACTIVE')    return false
    if (filter==='SUSPENDED' && d.status!=='SUSPENDED') return false
    if (filter==='DOCS'      && d.docs==='OK')           return false
    if (filter==='EMPLOYEE'  && d.relation!=='EMPLOYEE') return false
    if (filter==='CONTRACTOR'&& d.relation!=='CONTRACTOR') return false
    if (search && !`${d.name} ${d.id} ${d.plate??''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Chauffeurs</h1>
            <p className="text-sm text-slate-500 mt-1">Gestion de la force de travail · Conformité · Synchronisation</p>
          </div>
          <button className="px-3 py-2 rounded-xl text-[10px] font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700 shrink-0">+ Ajouter</button>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Isolation par enterprise_id</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total',        v:ENT_DRIVERS.length,                                      c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Actifs',       v:ENT_DRIVERS.filter(d=>d.status==='ACTIVE').length,       c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Docs ⚠️',      v:ENT_DRIVERS.filter(d=>d.docs!=='OK').length,             c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Suspendus',    v:ENT_DRIVERS.filter(d=>d.status==='SUSPENDED').length,    c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres + recherche */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Nom, Driver ID, plaque…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{v:'ALL',l:`Tous (${ENT_DRIVERS.length})`},{v:'ACTIVE',l:'Actifs'},{v:'SUSPENDED',l:'Suspendus'},{v:'DOCS',l:'Docs ⚠️'},{v:'EMPLOYEE',l:'Employés'},{v:'CONTRACTOR',l:'Sous-traitants'}].map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:filter===f.v?'#003DA5':'transparent',color:filter===f.v?'white':'#64748B',borderColor:filter===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.map(d=>{
            const sc  = STATUS_CONF[d.status]!
            const dc  = DOC_BADGE[d.docs]!
            const det = DRIVER_DETAIL[d.id]
            const ss  = SYNC_STATUS[det?.syncStatus??'DEMO']!
            const drvActs = ENT_ACTIVITIES.filter(a=>a.driverId===d.id).length
            const drvRev  = ENT_TRANSACTIONS.filter(t=>t.driverId===d.id).reduce((s,t)=>s+t.gross,0)
            return (
              <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white shrink-0">{d.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{d.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      {d.docs!=='OK'&&<span className="text-[8px] font-bold" style={{color:dc.color}}>⚠️ {dc.label}</span>}
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{d.relation}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mb-1">{d.id}{d.plate?` · ${d.plate}`:''}{d.vehicle?` · ${d.vehicle}`:''}</div>
                    <div className="flex gap-3 text-[9px] text-slate-400 flex-wrap">
                      <span>📍 {drvActs} activités</span>
                      {drvRev>0&&<span>💰 {money(drvRev)}</span>}
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/>
                        <span style={{color:ss.color}}>{ss.label}</span>
                      </div>
                      {det?.lastSync&&<span>Sync: {fmtDt(det.lastSync)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Link href={`/drivers/${d.id}`} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 whitespace-nowrap">→ Profil</Link>
                    {d.status==='ACTIVE'&&<button className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 cursor-pointer whitespace-nowrap">Suspendre</button>}
                    {d.status==='SUSPENDED'&&<button className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 cursor-pointer whitespace-nowrap">Réactiver</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Workflow ajout */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow ajout chauffeur</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['IDENTIFICATION','→','INVITATION','→','LIAISON DRIVER GOV','→','VÉRIFICATION','→','DOCUMENTS','→','VÉHICULE','→','ACTIVATION','→','SYNC TAXIMETER.GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
          <div className="text-[8px] text-slate-400 mt-1.5">Un chauffeur déjà inscrit sur Driver Gov ne crée pas de deuxième compte — liaison Enterprise ↔ Driver Gov</div>
        </div>
      </div>
    </AppShell>
  )
}
