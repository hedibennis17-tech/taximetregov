'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, CURRENT_ENT, REVENUE, OBLIGATIONS, ENT_CONNECTIONS, NOTIFICATIONS, ENT_DRIVERS, ENT_VEHICLES, ENT_DOCS, ENT_ACTIVITIES, ENT_TRANSACTIONS, RECENT_EVENTS, MONTHLY, CONN_STATUS, OBL_STATUS, DEPARTMENTS } from '@/lib/data'

const maxMonth = Math.max(...MONTHLY.map(m=>m.gross))

export default function Dashboard() {
  const [deptFilter, setDeptFilter] = useState('ALL')

  const activeDepts  = DEPARTMENTS.filter(d=>d.status==='ACTIVE')
  const selDept      = deptFilter!=='ALL' ? DEPARTMENTS.find(d=>d.slug===deptFilter) : null

  // KPI: soit tout Uber QC (synthétique), soit département sélectionné
  const totalDrivers  = selDept ? selDept.drivers   : DEPARTMENTS.reduce((s,d)=>s+d.drivers,0)
  const totalVehicles = selDept ? selDept.vehicles  : DEPARTMENTS.reduce((s,d)=>s+d.vehicles,0)
  const totalActs     = selDept ? selDept.activities: DEPARTMENTS.reduce((s,d)=>s+d.activities,0)
  const totalTxs      = selDept ? selDept.transactions: DEPARTMENTS.reduce((s,d)=>s+d.transactions,0)
  const totalGross    = selDept ? selDept.gross     : DEPARTMENTS.reduce((s,d)=>s+d.gross,0)
  const totalTPS      = selDept ? selDept.tps       : DEPARTMENTS.reduce((s,d)=>s+d.tps,0)
  const totalTVQ      = selDept ? selDept.tvq       : DEPARTMENTS.reduce((s,d)=>s+d.tvq,0)
  const totalAlerts   = selDept ? selDept.alerts    : DEPARTMENTS.reduce((s,d)=>s+d.alerts,0)
  const totalExc      = selDept ? selDept.exceptions: DEPARTMENTS.reduce((s,d)=>s+d.exceptions,0)
  const totalTips     = selDept ? selDept.tips      : DEPARTMENTS.reduce((s,d)=>s+d.tips,0)

  const nextObl = OBLIGATIONS.find(o=>o.status==='UPCOMING')
  const unread  = NOTIFICATIONS.filter(n=>!n.read).length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Données synthétiques · Aucune transmission officielle</div>
        <div className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-2 rounded-xl flex items-center justify-between">
          <span>⚙️ Wizard de configuration Enterprise disponible</span>
          <Link href="/onboarding" className="font-black hover:underline">→ Configurer le compte</Link>
        </div>

        {/* Header Uber */}
        <div className="rounded-2xl p-5 shadow-sm" style={{background:'linear-gradient(135deg, #002B7A 0%, #003DA5 60%, #0047C0 100%)'}}>
          <div className="flex items-center gap-4 mb-4">
            <div className="shrink-0">
              <div className="text-white font-black tracking-tighter" style={{fontSize:'2.8rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
              <div className="text-sm font-bold mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>QUÉBEC · ENTERPRISE GOV · PILOTE</div>
            </div>
            <div className="flex-1">
              <div className="text-white font-black">{CURRENT_ENT.legalName}</div>
              <div className="text-sm" style={{color:'rgba(255,255,255,0.55)'}}>{CURRENT_ENT.tradeName} · NEQ: {CURRENT_ENT.neq}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-400"/>
                <span className="text-sm font-bold text-green-400">Connecté · PILOTE</span>
                <span className="text-sm" style={{color:'rgba(255,255,255,0.4)'}}>{activeDepts.length} départements actifs</span>
              </div>
            </div>
            {unread>0&&<div className="shrink-0 text-center bg-red-500/20 border border-red-500/30 rounded-xl px-2.5 py-2">
              <div className="text-lg font-black text-red-400">{unread}</div>
              <div className="text-xs text-red-400">alertes</div>
            </div>}
          </div>

          {/* Sélecteur département */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button onClick={()=>setDeptFilter('ALL')} className="text-sm font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all" style={{background:deptFilter==='ALL'?'white':'rgba(255,255,255,0.1)',color:deptFilter==='ALL'?'black':'rgba(255,255,255,0.7)'}}>
              Tous les départements
            </button>
            {activeDepts.map(d=>(
              <button key={d.slug} onClick={()=>setDeptFilter(d.slug)} className="text-sm font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all" style={{background:deptFilter===d.slug?d.color:'rgba(255,255,255,0.08)',color:deptFilter===d.slug?'white':'rgba(255,255,255,0.6)'}}>
                {d.emoji} {d.name}
              </button>
            ))}
          </div>

          {/* KPI Uber consolidé ou par dept */}
          <div className="grid grid-cols-4 gap-2" style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:'12px'}}>
            {[
              {l:'Chauffeurs (SYNTH.)',  v:totalDrivers.toLocaleString('fr-CA')},
              {l:'Véhicules (SYNTH.)',   v:totalVehicles.toLocaleString('fr-CA')},
              {l:'Activités (DEMO)',     v:(totalActs/1000).toFixed(0)+'k'},
              {l:'Revenus bruts (DEMO)', v:'$'+(totalGross/1_000_000).toFixed(1)+'M'},
            ].map(s=>(
              <div key={s.l}>
                <div className="text-white font-black text-lg">{s.v}</div>
                <div className="text-xs" style={{color:'rgba(255,255,255,0.45)'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chaîne workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 flex-wrap text-sm font-bold">
            {['🏢 UBER QC','→','🏬 DÉPARTEMENTS','→','👤 CHAUFFEURS','→','🚗 VÉHICULES','→','📍 ACTIVITÉS','→','💳 TRANSACTIONS','→','💰 REVENUS','→','🧾 TPS/TVQ','→','📤 DÉCLARATIONS','→','TAXIMETER.GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'text-blue-700 dark:text-blue-400'}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI opérationnels */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            {l:'TPS (DEMO)',       v:money(totalTPS),  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10', icon:'🧾', href:'/fiscal'},
            {l:'TVQ (DEMO)',       v:money(totalTVQ),  c:'#4F46E5',bg:'bg-indigo-50 dark:bg-indigo-500/10', icon:'🧾', href:'/fiscal'},
            {l:'Pourboires (DEMO)',v:money(totalTips), c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10',     icon:'💳', href:'/transactions'},
            {l:'Transactions',     v:totalTxs.toLocaleString('fr-CA'),c:'#000',bg:'bg-slate-100 dark:bg-slate-800',icon:'💳',href:'/transactions'},
            {l:'Exceptions',       v:totalExc,         c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',       icon:'⚠️', href:'/exceptions'},
            {l:'Alertes',          v:totalAlerts,      c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',   icon:'🔔', href:'/notifications'},
          ].map(s=>(
            <Link key={s.l} href={s.href} className={`${s.bg} rounded-xl p-3 text-center hover:opacity-80 transition-opacity border border-white dark:border-transparent`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5 leading-tight">{s.l}</div>
            </Link>
          ))}
        </div>

        {/* Départements aperçu + graphique */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Barres départements */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Revenus par département (DEMO)</div>
            <div className="text-sm text-slate-400 mb-3">Données synthétiques · PILOTE</div>
            {activeDepts.slice(0,5).map(d=>{
              const maxGross = Math.max(...activeDepts.map(x=>x.gross))
              return (
                <div key={d.id} className="mb-2.5">
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{d.emoji} {d.name}</span>
                    <span className="font-black" style={{color:d.color}}>{money(d.gross)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${(d.gross/maxGross)*100}%`,background:d.color}}/>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Alertes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes</div>
            {NOTIFICATIONS.slice(0,5).map(n=>(
              <div key={n.id} className={`flex items-start gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 ${!n.read?'opacity-100':'opacity-55'}`}>
                <span className="text-base shrink-0">{n.type==='CRITICAL'?'🚨':n.type==='WARNING'?'⚠️':'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                  <div className="text-sm text-slate-400">{n.desc}</div>
                </div>
                {!n.read&&<div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"/>}
              </div>
            ))}
          </div>
        </div>

        {/* Prochaine obligation */}
        {nextObl&&(
          <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{background:'linear-gradient(135deg, #002B7A 0%, #003DA5 60%, #0047C0 100%)'}}>
            <div>
              <div className="text-sm font-bold mb-0.5" style={{color:'rgba(255,255,255,0.5)'}}>📅 PROCHAINE OBLIGATION</div>
              <div className="text-sm font-black text-white">{nextObl.type} — {nextObl.period}</div>
              <div className="text-sm" style={{color:'rgba(255,255,255,0.5)'}}>Échéance: {nextObl.due} · {money2(nextObl.amount)} · DEMO</div>
            </div>
            <Link href="/obligations" className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-slate-100 shrink-0">→ Obligations</Link>
          </div>
        )}

        {/* Connexions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Connexions</div>
          {ENT_CONNECTIONS.slice(0,5).map(c=>{
            const cs = CONN_STATUS[c.status] ?? {label:c.status,color:'#64748B',dot:'bg-slate-400'}
            return (
              <div key={c.id} className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cs.dot}`}/>
                <div className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                <div className="text-sm text-slate-400">{c.dataRx.toLocaleString('fr-CA')} enreg.</div>
                <span className="text-sm font-bold" style={{color:cs.color}}>{cs.label}</span>
              </div>
            )
          })}
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Activité récente</div>
          {RECENT_EVENTS.slice(0,5).map((e,i)=>(
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-base shrink-0">{e.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{e.title}</div>
                <div className="text-sm text-slate-400">{e.desc}</div>
              </div>
              <div className="text-sm font-mono text-slate-400 shrink-0">{fmtDt(e.at)}</div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            {l:'Départements', href:'/departments',icon:'🏬'},
            {l:'Chauffeurs',   href:'/drivers',   icon:'👤'},
            {l:'Activités',    href:'/activities',icon:'📍'},
            {l:'Fiscal',       href:'/fiscal',    icon:'🧾'},
            {l:'Déclarations', href:'/declarations',icon:'📤'},
            {l:'Gov',          href:'/government',icon:'🏛️'},
          ].map(a=>(
            <Link key={a.l} href={a.href} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center hover:border-black dark:hover:border-white transition-colors shadow-sm">
              <div className="text-xl mb-1">{a.icon}</div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{a.l}</div>
            </Link>
          ))}
        </div>

        <div className="text-sm text-slate-400 text-center">⚠️ {CURRENT_ENT.revenusNote}</div>
      </div>
    </AppShell>
  )
}
