'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, ACTIVITIES, ACT_TYPE_ICONS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

export default function Page() {
  const [entF, setEntF] = useState('ALL')
  const [typeF, setTypeF] = useState('ALL')

  const filtered = ACTIVITIES.filter(a=>{
    if (entF!=='ALL' && a.entId!==entF) return false
    if (typeF!=='ALL' && a.type!==typeF) return false
    return true
  })
  const types = [...new Set(ACTIVITIES.map(a=>a.type))]

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">📦</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Activity Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Taxi · Rideshare · Livraison · Colis · Transport · Sous-traitance · PILOTE</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/activities"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Filtres */}
        <div className="flex gap-1.5 flex-wrap">
          <select value={entF} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setEntF(e.target.value)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
            <option value="ALL">Toutes entreprises</option>
            {ENTERPRISES.map(e=><option key={e.id} value={e.id}>{e.tradeName}</option>)}
          </select>
          {['ALL',...types].map(t=>(
            <button key={t} onClick={()=>setTypeF(t)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:typeF===t?'#003DA5':'transparent',color:typeF===t?'white':'#64748B',borderColor:typeF===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t==='ALL'?'Tous types':`${ACT_TYPE_ICONS[t]??'📋'} ${t}`}
            </button>
          ))}
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total activités', v:ACTIVITIES.length, c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Complétées',      v:ACTIVITIES.filter(a=>a.status==='COMPLETED').length, c:'#059669', bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'En attente',      v:ACTIVITIES.filter(a=>a.status==='PENDING').length,   c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Erreurs',         v:ACTIVITIES.filter(a=>a.status==='ERROR').length,     c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.map(a=>{
            const ent = ENTERPRISES.find(e=>e.id===a.entId)
            const icon = ACT_TYPE_ICONS[a.type]??'📋'
            return (
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{a.id}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${a.status==='COMPLETED'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':a.status==='ERROR'?'text-red-500 bg-red-50 dark:bg-red-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{a.status}</span>
                      <span className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{a.type}</span>
                    </div>
                    <div className="text-[9px] text-slate-500">{ent?.tradeName??a.entId} · {a.driverId} · {a.provider}</div>
                    <div className="text-[9px] text-slate-400">{fmtDt(a.at)} · {a.origin} → {a.dest} · {a.dist}km · {a.dur}min</div>
                  </div>
                  <div className="text-right shrink-0">
                    {a.txId?<div className="text-[8px] font-mono text-blue-600 dark:text-blue-400">{a.txId}</div>:<div className="text-[8px] text-slate-400">TX: —</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
