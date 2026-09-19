'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, money2, fmtDt, ALL_ACTIVITIES, ENT_DRIVERS, ACT_TYPE_ICONS, SYNC_STATUS } from '@/lib/data'

const PROVIDER_COLORS: Record<string,string> = {
  'DIRECT':'#003DA5','UBER DEMO':'#000000','LYFT DEMO':'#EA0063','DOORDASH DEMO':'#FF3008',
}

export default function ActivitiesPage() {
  const [typeF,  setTypeF]  = useState('ALL')
  const [provF,  setProvF]  = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = ALL_ACTIVITIES.filter(a=>{
    if (typeF!=='ALL' && a.type!==typeF) return false
    if (provF!=='ALL' && a.provider!==provF) return false
    if (search && !`${a.id} ${a.driverId} ${a.type} ${a.provider} ${a.origin} ${a.dest??''} ${a.extRef}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalGross = ALL_ACTIVITIES.reduce((s,a)=>s+a.fare,0)
  const totalTps   = ALL_ACTIVITIES.reduce((s,a)=>s+a.tps,0)
  const totalTvq   = ALL_ACTIVITIES.reduce((s,a)=>s+a.tvq,0)
  const synced     = ALL_ACTIVITIES.filter(a=>a.syncStatus==='SYNCED').length
  const providers  = [...new Set(ALL_ACTIVITIES.map(a=>a.provider))]
  const types      = [...new Set(ALL_ACTIVITIES.map(a=>a.type))]
  const maxGross   = Math.max(...ALL_ACTIVITIES.map(a=>a.fare))

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre des activités</h1>
          <p className="text-sm text-slate-500 mt-1">Taxi · Rideshare · Livraison · Source TAXIMETER.GOV · Fournisseurs</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Anti-duplication: source + external_reference</div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chaîne activité → financier</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['ACTIVITÉ','→','VALIDATION','→','TRANSACTION','→','REVENUE LEDGER','→','TPS/TVQ','→','RÉCONCILIATION'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total activités', v:ALL_ACTIVITIES.length,    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Revenus bruts',   v:money(totalGross),        c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'TPS collectée',  v:money(totalTps),           c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
            {l:'Synchronisées',  v:`${synced}/${ALL_ACTIVITIES.length}`,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Mini graphique barres revenus par activité */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-3">Revenus par activité (DEMO)</div>
          <div className="flex items-end gap-1 h-16">
            {ALL_ACTIVITIES.map(a=>(
              <div key={a.id} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t-sm" style={{height:`${(a.fare/maxGross)*100}%`,background:PROVIDER_COLORS[a.provider]??'#003DA5',opacity:0.75}}/>
                <div className="text-[6px] text-slate-400 whitespace-nowrap overflow-hidden">{a.id.split('-').pop()}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(PROVIDER_COLORS).map(([p,c])=>(
              <div key={p} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{background:c}}/><span className="text-[8px] text-slate-500">{p}</span></div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Activity ID, chauffeur, type, fournisseur…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={()=>setTypeF('ALL')} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:typeF==='ALL'?'#003DA5':'transparent',color:typeF==='ALL'?'white':'#64748B',borderColor:typeF==='ALL'?'#003DA5':'rgba(148,163,184,0.30)'}}>Tous</button>
            {types.map(t=>(
              <button key={t} onClick={()=>setTypeF(t)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:typeF===t?'#003DA5':'transparent',color:typeF===t?'white':'#64748B',borderColor:typeF===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {ACT_TYPE_ICONS[t]??'📋'} {t}
              </button>
            ))}
            <select value={provF} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setProvF(e.target.value)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
              <option value="ALL">Tous fournisseurs</option>
              {providers.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} activité(s)</span>
            <span className="text-[8px] text-amber-600 dark:text-amber-400">PILOTE · Anti-doublon actif</span>
          </div>
          {filtered.map(a=>{
            const drv = ENT_DRIVERS.find(d=>d.id===a.driverId)
            const ss  = SYNC_STATUS[a.syncStatus]!
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-xl shrink-0">{ACT_TYPE_ICONS[a.type]??'📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{a.id}</span>
                    <span className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{a.type}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{color:PROVIDER_COLORS[a.provider]??'#64748B',background:'rgba(0,0,0,0.05)'}}>{a.provider}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{drv?.name??a.driverId} · {a.vehicleId} · {fmtDt(a.at)}</div>
                  <div className="text-[9px] text-slate-400">{a.origin} → {a.dest} · {a.dist}km · {a.dur}min{a.wait>0?` · Att: ${a.wait}min`:''}</div>
                  <div className="text-[8px] font-mono text-slate-400">Réf: {a.extRef} · TX: {a.txId}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-green-600 dark:text-green-400">{money2(a.fare)}</div>
                  {a.tip>0&&<div className="text-[9px] text-slate-400">+ {money2(a.tip)} tip</div>}
                  <div className="text-[8px] text-slate-400">TPS: {money2(a.tps)}</div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/>
                    <span className="text-[8px] font-bold" style={{color:ss.color}}>{ss.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Résumé par fournisseur */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-3">Par fournisseur</div>
          {providers.map(p=>{
            const pActs = ALL_ACTIVITIES.filter(a=>a.provider===p)
            const pGross = pActs.reduce((s,a)=>s+a.fare,0)
            return (
              <div key={p} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{background:PROVIDER_COLORS[p]??'#64748B'}}/>
                  <span className="text-slate-700 dark:text-slate-300">{p}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-400">{pActs.length} actes</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{money(pGross)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
