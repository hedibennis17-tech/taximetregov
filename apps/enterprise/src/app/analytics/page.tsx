'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, money, money2, DEPARTMENTS, ANALYTICS_MONTHLY, ANALYTICS_REGIONS, UBER_DRIVERS_SAMPLE } from '@/lib/data'

const UberLogo = ({size=24,className=''}:{size?:number;className?:string}) => (
  <svg viewBox="0 0 72 24" width={size*3} height={size} className={className} fill="currentColor">
    <text x="0" y="20" style={{fontFamily:'system-ui',fontWeight:900,fontSize:'22px',letterSpacing:'-1px'}}>uber</text>
  </svg>
)
const UberEatsLogo = ({size=20,className=''}:{size?:number;className?:string}) => (
  <div className={`flex items-center gap-1 ${className}`} style={{fontSize:size*0.75}}>
    <span style={{fontFamily:'system-ui',fontWeight:900,letterSpacing:'-0.5px',color:'#06B029'}}>Uber</span>
    <span style={{fontFamily:'system-ui',fontWeight:900,letterSpacing:'-0.5px',color:'#000'}}>Eats</span>
  </div>
)

const maxMonthGross = Math.max(...ANALYTICS_MONTHLY.map(m=>m.gross))
const maxRegionGross = Math.max(...ANALYTICS_REGIONS.map(r=>r.gross))

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('Q3')
  const [deptF, setDeptF]   = useState('ALL')

  const active  = DEPARTMENTS.filter(d=>d.status==='ACTIVE')
  const selDept = deptF!=='ALL' ? active.find(d=>d.slug===deptF) : null

  const totalGross   = selDept ? selDept.gross  : active.reduce((s,d)=>s+d.gross,0)
  const totalTPS     = selDept ? selDept.tps    : active.reduce((s,d)=>s+d.tps,0)
  const totalTVQ     = selDept ? selDept.tvq    : active.reduce((s,d)=>s+d.tvq,0)
  const totalTips    = selDept ? selDept.tips   : active.reduce((s,d)=>s+d.tips,0)
  const totalDrivers = selDept ? selDept.drivers: active.reduce((s,d)=>s+d.drivers,0)
  const totalActs    = selDept ? selDept.activities: active.reduce((s,d)=>s+d.activities,0)
  const reconRate    = 97.2
  const conformRate  = 94.8

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        {/* Header avec logos */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {/* Logo Uber */}
              <div className="text-black dark:text-white font-black tracking-tighter" style={{fontSize:'1.6rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"/>
              {/* Logo Uber Eats */}
              <div className="flex items-center gap-1">
                <span className="font-black" style={{fontFamily:'system-ui',letterSpacing:'-0.5px',color:'#06B029',fontSize:'1rem'}}>Uber</span>
                <span className="font-black dark:text-white" style={{fontFamily:'system-ui',letterSpacing:'-0.5px',fontSize:'1rem'}}>Eats</span>
              </div>
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">Analytics — Québec</div>
            <div className="text-sm text-slate-400">Tous départements · DONNÉES SYNTHÉTIQUES</div>
          </div>
        </div>

        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · DONNÉES SYNTHÉTIQUES · Aucune transmission gouvernementale réelle
        </div>

        {/* Filtres période + dept */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {['Q3','YTD','12M'].map(p=>(
              <button key={p} onClick={()=>setPeriod(p)} className="px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all" style={{background:period===p?'#000':'transparent',color:period===p?'white':'#64748B'}}>{p}</button>
            ))}
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 flex-wrap">
            <button onClick={()=>setDeptF('ALL')} className="px-2.5 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all" style={{background:deptF==='ALL'?'#000':'transparent',color:deptF==='ALL'?'white':'#64748B'}}>Tous</button>
            {active.map(d=>(
              <button key={d.slug} onClick={()=>setDeptF(d.slug)} className="px-2.5 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all" style={{background:deptF===d.slug?d.color:'transparent',color:deptF===d.slug?'white':'#64748B'}}>
                {d.emoji} {d.name.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* KPI principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Revenus bruts (DEMO)',  v:money(totalGross),      c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'TPS collectée (DEMO)',  v:money(totalTPS),         c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
            {l:'TVQ collectée (DEMO)',  v:money(totalTVQ),         c:'#4F46E5',bg:'bg-indigo-50 dark:bg-indigo-500/8'},
            {l:'Pourboires (DEMO)',     v:money(totalTips),        c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Chauffeurs (SYNTH.)',    v:totalDrivers.toLocaleString('fr-CA'), c:'#000',bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'Activités (DEMO)',       v:(totalActs/1000).toFixed(0)+'k',      c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Taux rapprochement',    v:`${reconRate}%`,                       c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Taux conformité (ind.)',v:`${conformRate}%`,                     c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Graphique mensuel 12 mois */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Évolution 12 mois — Revenus</div>
            <div className="text-sm text-slate-400 mb-3">Oct 2025 – Sep 2026 · SYNTHÉTIQUE</div>
            <div className="flex items-end gap-0.5 h-24">
              {ANALYTICS_MONTHLY.map(m=>(
                <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">{(m.gross/1000).toFixed(0)}k$</div>
                  <div className="w-full rounded-t-sm" style={{height:`${(m.gross/maxMonthGross)*100}%`,background:'#000'}}/>
                  <div className="text-sm text-slate-400 rotate-45 origin-left">{m.m.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenus par département */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Par département (DEMO)</div>
            {active.map(d=>(
              <div key={d.id} className="mb-2.5">
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{d.emoji} {d.name}</span>
                  <div className="flex gap-3">
                    <span style={{color:d.color}} className="font-black">{money(d.gross)}</span>
                    <span className="text-purple-500 text-sm">TPS: {money2(d.tps)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${(d.gross/active.reduce((s,x)=>Math.max(s,x.gross),0))*100}%`,background:d.color}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activités mensuelles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Activités mensuelles</div>
          <div className="text-sm text-slate-400 mb-3">Courses + livraisons · SYNTHÉTIQUE</div>
          <div className="flex items-end gap-0.5 h-16">
            {ANALYTICS_MONTHLY.map(m=>{
              const max = Math.max(...ANALYTICS_MONTHLY.map(x=>x.acts))
              return (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t-sm" style={{height:`${(m.acts/max)*100}%`,background:'#06B029'}}/>
                  <div className="text-sm text-slate-400 rotate-45 origin-left">{m.m.split(' ')[0]}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Analytique géographique */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Activité par région (DEMO)</div>
          <div className="text-sm text-slate-400 mb-3">⚠️ DONNÉES SYNTHÉTIQUES — Non officielles</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                {['Région','Chauffeurs*','Véhicules','Activités','Revenus (DEMO)','TPS (DEMO)'].map(h=>(
                  <th key={h} className="px-3 py-2 text-left text-sm font-bold text-white whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ANALYTICS_REGIONS.map(r=>(
                  <tr key={r.region} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{r.region}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{r.drivers.toLocaleString('fr-CA')}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{r.vehicles.toLocaleString('fr-CA')}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{r.acts.toLocaleString('fr-CA')}</td>
                    <td className="px-3 py-2 font-bold text-green-600 dark:text-green-400">{money(r.gross)}</td>
                    <td className="px-3 py-2 text-purple-600 dark:text-purple-400">{money2(r.tps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-400 italic mt-2">* Nb chauffeurs par région = synthétique · {UBER_DRIVERS_SAMPLE.length} chauffeurs échantillon disponibles dans pilote</div>
        </div>

        {/* Export */}
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-black text-white cursor-pointer hover:bg-slate-800">↓ Exporter PDF · DEMO</button>
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200">↓ CSV</button>
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200">↓ Excel</button>
        </div>
      </div>
    </AppShell>
  )
}
