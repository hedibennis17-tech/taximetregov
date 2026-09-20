'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, fmtDt, ENT_VEHICLES, ENT_DRIVERS, ENT_ACTIVITIES, VEHICLE_DETAIL, SYNC_STATUS, DOC_STATUS, ENT_DOCS_FULL } from '@/lib/data'

const VEH_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:      {label:'Actif',        color:'#059669',bg:'rgba(5,150,105,0.12)'},
  MAINTENANCE: {label:'Maintenance',  color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  AVAILABLE:   {label:'Disponible',   color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  INACTIVE:    {label:'Inactif',      color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}

export default function VehiclesPage() {
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = ENT_VEHICLES.filter(v=>{
    if (filter!=='ALL' && v.status!==filter) return false
    if (search && !`${v.plate} ${v.id} ${v.make} ${v.model} ${v.vin}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const expDocs = ENT_DOCS_FULL.filter(d=>d.ownerType==='VEHICLE'&&(d.status==='EXPIRING'||d.status==='EXPIRED')).length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Véhicules</h1>
            <p className="text-sm text-slate-500 mt-1">Gestion de la flotte · Conformité · Taximètre · Synchronisation</p>
          </div>
          <button className="px-3 py-2 rounded-xl text-sm font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700 shrink-0">+ Ajouter</button>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total',        v:ENT_VEHICLES.length,                                   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Actifs',       v:ENT_VEHICLES.filter(v=>v.status==='ACTIVE').length,    c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Maintenance',  v:ENT_VEHICLES.filter(v=>v.status==='MAINTENANCE').length,c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Docs ⚠️',      v:expDocs,                                               c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Plaque, VIN, marque, modèle…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{v:'ALL',l:`Tous (${ENT_VEHICLES.length})`},{v:'ACTIVE',l:'Actifs'},{v:'MAINTENANCE',l:'Maintenance'},{v:'AVAILABLE',l:'Disponibles'}].map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)} className="px-3 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:filter===f.v?'#003DA5':'transparent',color:filter===f.v?'white':'#64748B',borderColor:filter===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.map(v=>{
            const sc   = VEH_STATUS[v.status]!
            const drv  = ENT_DRIVERS.find(d=>d.id===v.driver)
            const det  = VEHICLE_DETAIL[v.id]
            const ss   = SYNC_STATUS[det?.syncStatus??'DEMO']!
            const acts = ENT_ACTIVITIES.filter(a=>a.vehicleId===v.id).length
            const expInsp = new Date(v.inspection) < new Date('2026-11-01')
            return (
              <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">🚗</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{v.year} {v.make} {v.model}</span>
                      <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      {det?.taximeterId&&<span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">🚕 TAXIMÈTRE</span>}
                      {expInsp&&<span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">⚠️ Inspection</span>}
                    </div>
                    <div className="text-sm font-mono text-slate-400 mb-1">{v.id} · {v.plate} · {v.vin}</div>
                    <div className="flex gap-3 text-sm text-slate-400 flex-wrap">
                      {drv?<span>👤 {drv.name}</span>:<span className="text-amber-500">Sans chauffeur</span>}
                      <span>📍 {acts} activités</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/>
                        <span style={{color:ss.color}}>{ss.label}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/vehicles/${v.id}`} className="px-2.5 py-1.5 rounded-lg text-sm font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 shrink-0">→ Dossier</Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
