'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useGovDrivers, money, statusConfig } from '@/lib/api'
import { useState, useCallback, useEffect } from 'react'
import { Search, RefreshCw, Users, CheckCircle, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react'
import Link from 'next/link'

const PILOT_BANNER = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE'

// Données pilotes DEMO affichées si Supabase retourne 0 (avant seed)
const DEMO_DRIVERS = [
  // ── COMPTE RÉEL — Hedi Bennis (driver_id: 4c4a0130) ──────────
  { id:'4c4a0130-6a95-4a62-8dda-9d7a03237f18', driver_number:'DR-A4BE38D0', first_name:'Hedi', last_name:'Bennis', email:'hedibennis70@gmail.com', status:'ACTIVE', identity_verification_status:'APPROVED', city:'Laval, QC', services:['TAXI','RIDESHARE','DELIVERY'], gross:263.63, trips:8, tips:23.00, platforms:4, verif_date:'2026-09-01', last_active:'Actif', real:true },
  { id:'drv-demo-001', driver_number:'DRV-QC-0001', first_name:'Jean',   last_name:'Tremblay', email:'jean.tremblay.demo@taximetregov.qc', status:'ACTIVE',    identity_verification_status:'APPROVED',      city:'Montréal',     services:['TAXI','RIDESHARE'], gross:42800, trips:312, tips:4280, platforms:3, verif_date:'2026-09-01', last_active:'Il y a 2h' },
  { id:'drv-demo-002', driver_number:'DRV-QC-0002', first_name:'Marie',  last_name:'Gagnon',   email:'marie.gagnon.demo@taximetregov.qc',  status:'ACTIVE',    identity_verification_status:'APPROVED',      city:'Laval',        services:['RIDESHARE','DELIVERY'], gross:38600, trips:284, tips:3860, platforms:2, verif_date:'2026-09-05', last_active:'Il y a 45m' },
  { id:'drv-demo-003', driver_number:'DRV-QC-0003', first_name:'Karim',  last_name:'Hassan',   email:'karim.hassan.demo@taximetregov.qc',  status:'ACTIVE',    identity_verification_status:'APPROVED',      city:'Montréal',     services:['DELIVERY'], gross:29400, trips:0, tips:2940, platforms:2, verif_date:'2026-09-10', last_active:'Il y a 20m' },
  { id:'drv-demo-004', driver_number:'DRV-QC-0004', first_name:'Sophie', last_name:'Martin',   email:'sophie.martin.demo@taximetregov.qc', status:'PENDING',   identity_verification_status:'PENDING',       city:'Longueuil',    services:['TAXI'], gross:0, trips:0, tips:0, platforms:0, verif_date:null, last_active:'Jamais' },
  { id:'drv-demo-005', driver_number:'DRV-QC-0005', first_name:'Ali',    last_name:'Bouchard', email:'ali.bouchard.demo@taximetregov.qc',   status:'PENDING',   identity_verification_status:'PENDING',       city:'Québec City',  services:['RIDESHARE','DELIVERY'], gross:0, trips:0, tips:0, platforms:0, verif_date:null, last_active:'Jamais' },
  { id:'drv-demo-006', driver_number:'DRV-QC-0006', first_name:'Nadia',  last_name:'Patel',    email:'nadia.patel.demo@taximetregov.qc',   status:'ACTIVE',    identity_verification_status:'APPROVED',      city:'Brossard',     services:['DELIVERY'], gross:31200, trips:0, tips:3120, platforms:1, verif_date:'2026-09-08', last_active:'Il y a 1h' },
  { id:'drv-demo-007', driver_number:'DRV-QC-0007', first_name:'Marc',   last_name:'Leblanc',  email:'marc.leblanc.demo@taximetregov.qc',  status:'SUSPENDED', identity_verification_status:'APPROVED',      city:'Montréal',     services:['TAXI'], gross:12400, trips:89, tips:1240, platforms:1, verif_date:'2026-07-15', last_active:'Il y a 60j' },
  { id:'drv-demo-008', driver_number:'DRV-QC-0008', first_name:'Amira',  last_name:'Tremblay', email:'amira.tremblay.demo@taximetregov.qc',status:'ACTIVE',    identity_verification_status:'UNDER_REVIEW',  city:'Laval',        services:['RIDESHARE'], gross:18700, trips:142, tips:1870, platforms:1, verif_date:null, last_active:'Il y a 3h' },
]

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;icon:React.ElementType}> = {
  ACTIVE:    { label:'Actif',         color:'#059669', bg:'rgba(5,150,105,0.12)',   icon:CheckCircle },
  PENDING:   { label:'En attente',    color:'#B45309', bg:'rgba(180,83,9,0.10)',    icon:Clock },
  SUSPENDED: { label:'Suspendu',      color:'#DC2626', bg:'rgba(220,38,38,0.10)',   icon:XCircle },
  INACTIVE:  { label:'Inactif',       color:'#64748B', bg:'rgba(100,116,139,0.10)', icon:Clock },
}
const VERIF_CONF: Record<string,{label:string;color:string}> = {
  APPROVED:      { label:'Vérifié',       color:'text-green-400' },
  PENDING:       { label:'En attente',    color:'text-amber-400' },
  UNDER_REVIEW:  { label:'En révision',   color:'text-blue-400'  },
  REJECTED:      { label:'Rejeté',        color:'text-red-400'   },
}
const SERVICE_ICONS: Record<string,string> = { TAXI:'🚕', RIDESHARE:'🚗', DELIVERY:'📦', VTC:'🚙' }
const TPS=0.05; const TVQ=0.09975; const r2=(n:number)=>Math.round(n*100)/100

import React from 'react'

const FILTERS = [
  { v:'',          l:'Tous' },
  { v:'ACTIVE',    l:'Actifs' },
  { v:'PENDING',   l:'En attente' },
  { v:'SUSPENDED', l:'Suspendus' },
]

export default function DriversPage() {
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('')
  const [usedDemo, setUsedDemo] = useState(false)

  const { drivers: supaDrivers, total, loading, error, refresh } = useGovDrivers({
    status: filter || undefined, search: search || undefined,
  })

  type AnyDriver = { id:string; driver_number:string; first_name:string; last_name:string; email:string; status:string; identity_verification_status:string; city?:string; services?:string[]; gross?:number; tips?:number; platforms?:number; last_active?:string }

  const drivers = (supaDrivers.length === 0 && !loading) ? DEMO_DRIVERS as AnyDriver[] : supaDrivers as unknown as AnyDriver[]
  const showPilot = supaDrivers.length === 0

  const filtered = filter
    ? drivers.filter((d: AnyDriver) => d.status === filter)
    : search
    ? drivers.filter((d: AnyDriver) => `${d.first_name} ${d.last_name} ${d.driver_number} ${d.email}`.toLowerCase().includes(search.toLowerCase()))
    : drivers

  const stats = {
    total:    drivers.length,
    active:   drivers.filter((d: AnyDriver) => d.status==='ACTIVE').length,
    pending:  drivers.filter((d: AnyDriver) => d.status==='PENDING').length,
    suspended:drivers.filter((d: AnyDriver) => d.status==='SUSPENDED').length,
    verified: drivers.filter((d: AnyDriver) => d.identity_verification_status==='APPROVED').length,
  }

  return (
    <AppShell>
      <PageHeader title="Chauffeurs & Véhicules" subtitle={`${stats.total} chauffeur(s) · Centre de gestion gouvernemental · TAXIMETER.GOV`}/>
      <div className="px-4 md:px-6 pb-8 space-y-4">

        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">
          {PILOT_BANNER}
          {showPilot && <span className="ml-2 text-blue-400">· AFFICHAGE DEMO LOCAL (Supabase: 0 résultats — lancez /api/admin/seed-pilots)</span>}
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total chauffeurs',  v:stats.total,    c:'text-blue-400',  bg:'bg-blue-500/10',  i:'👥'},
            {l:'Actifs vérifiés',   v:stats.verified, c:'text-green-400', bg:'bg-green-500/10', i:'✅'},
            {l:'En attente',        v:stats.pending,  c:'text-amber-400', bg:'bg-amber-500/10', i:'⏳'},
            {l:'Suspendus',         v:stats.suspended,c:'text-red-400',   bg:'bg-red-500/10',   i:'🚫'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className="text-xl mb-1">{s.i}</div>
              <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Stats revenus globaux demo */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Revenus bruts Q3 (pilote)',  v:money(drivers.reduce((s: number,d: AnyDriver)=>s+(d.gross||0),0)), c:'text-green-400', bg:'bg-green-500/8'},
            {l:'TPS estimée (pilote)',        v:money(r2(drivers.reduce((s: number,d: AnyDriver)=>s+(d.gross||0),0)*TPS)), c:'text-purple-400', bg:'bg-purple-500/8'},
            {l:'TVQ estimée (pilote)',        v:money(r2(drivers.reduce((s: number,d: AnyDriver)=>s+(d.gross||0),0)*TVQ)), c:'text-purple-400', bg:'bg-purple-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 border border-white/5`}>
              <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres + recherche */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Nom, no. chauffeur, email, ville…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white pl-9 outline-none focus:border-qc-blue"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all" style={{
                background:filter===f.v?'#003DA5':'rgba(255,255,255,0.04)',
                color:filter===f.v?'white':'#94A3B8',
                borderColor:filter===f.v?'#003DA5':'rgba(255,255,255,0.08)',
              }}>{f.l}{f.v&&` (${drivers.filter((d:AnyDriver)=>d.status===f.v).length})`}</button>
            ))}
          </div>
        </div>

        {/* Liste chauffeurs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 dark:text-white">{filtered.length} chauffeur(s)</div>
            <div className="flex items-center gap-2">
              {showPilot && <span className="text-[9px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">DEMO LOCAL</span>}
              <button onClick={refresh} className="p-1 rounded hover:bg-slate-800 cursor-pointer">
                <RefreshCw size={12} className={loading?'animate-spin text-qc-blue':'text-slate-400'}/>
              </button>
            </div>
          </div>

          {filtered.map((d: AnyDriver)=>{
            const sc = STATUS_CONF[d.status] ?? STATUS_CONF['PENDING']!
            const vc = VERIF_CONF[d.identity_verification_status] ?? VERIF_CONF['PENDING']!
            const gross = d.gross || 0
            return (
              <Link key={d.id} href={`/drivers/${d.id}`}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-50/80 dark:bg-slate-800/50 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white" style={{background:'#003DA5'}}>
                  {d.first_name[0]}{d.last_name[0]}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{d.first_name} {d.last_name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    <span className={`text-[8px] font-semibold ${vc.color}`}>{vc.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{d.driver_number} · {d.email}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(d.services || []).map((s: string)=>(
                      <span key={s} className="text-[9px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{SERVICE_ICONS[s]||'•'} {s}</span>
                    ))}
                    <span className="text-[9px] text-slate-600 dark:text-slate-500">📍 {d.city}</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="text-right shrink-0 space-y-0.5">
                  {gross > 0
                    ? <><div className="text-xs font-bold text-green-400">{money(gross)}</div><div className="text-[9px] text-slate-500 dark:text-slate-400">revenus Q3</div></>
                    : <div className="text-[9px] text-slate-600 dark:text-slate-500">Pas encore actif</div>
                  }
                  {(d.platforms ?? 0) > 0 && <div className="text-[9px] text-blue-400">{d.platforms} plateforme(s)</div>}
                  <div className="text-[8px] text-slate-600">{d.last_active}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Seed button */}
        <div className="p-3 bg-slate-900 border border-blue-500/20 rounded-xl">
          <div className="text-[10px] font-bold text-blue-400 mb-1">🔧 Seed des données pilotes Supabase</div>
          <div className="text-[9px] text-slate-400 mb-2">Lance le seed pour enregistrer les 8 chauffeurs DEMO dans Supabase.</div>
          <button
            onClick={async()=>{
              try {
                const res = await fetch('/api/admin/seed-pilots', {method:'POST'})
                const data = await res.json() as {steps?:string[]}
                if (data.steps) { alert('✅ Seed OK!\n'+data.steps.join('\n')); refresh() }
              } catch(e) { alert('Erreur seed: '+String(e)) }
            }}
            className="px-4 py-2 bg-qc-blue text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
          >
            🚀 Lancer le seed pilotes (8 chauffeurs)
          </button>
        </div>
      </div>
    </AppShell>
  )
}
