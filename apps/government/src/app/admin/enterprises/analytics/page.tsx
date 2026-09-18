'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, money, ANALYTICS_MONTHLY } from '@/lib/enterprise-phase2-data'
import { ENTERPRISES } from '@/lib/enterprise-data'
import { P2Nav } from '@/components/enterprise/P2Nav'

export default function Page() {
  const [period, setPeriod] = useState('monthly')
  const maxGross = Math.max(...ANALYTICS_MONTHLY.map(m=>m.gross))
  const totalGross = ANALYTICS_MONTHLY.reduce((s:number,m:typeof ANALYTICS_MONTHLY[0])=>s+m.gross,0)
  const totalTps   = ANALYTICS_MONTHLY.reduce((s:number,m:typeof ANALYTICS_MONTHLY[0])=>s+m.tps,0)
  const totalTvq   = ANALYTICS_MONTHLY.reduce((s:number,m:typeof ANALYTICS_MONTHLY[0])=>s+m.tvq,0)
  const totalActs  = ANALYTICS_MONTHLY.reduce((s:number,m:typeof ANALYTICS_MONTHLY[0])=>s+m.activities,0)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">📈</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Analytics</h1></div>
        <p className="text-sm text-slate-500 mb-4">Revenus · Taxes · Activités · Chauffeurs · Véhicules · Plateformes · Conformité · Réconciliation</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/analytics"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Périodes */}
        <div className="flex gap-1.5">
          {['monthly','quarterly','annual'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:period===p?'#003DA5':'transparent',color:period===p?'white':'#64748B',borderColor:period===p?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {p==='monthly'?'Mensuel':p==='quarterly'?'Trimestriel':'Annuel'}
            </button>
          ))}
        </div>

        {/* Totaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Revenus YTD (DEMO)',  v:money(totalGross),  c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'TPS YTD',             v:money(totalTps),    c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
            {l:'TVQ YTD',             v:money(totalTvq),    c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
            {l:'Activités YTD',       v:totalActs.toLocaleString('fr-CA'),c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Graphique barres revenus mensuels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Revenus mensuels — Jan à Sep 2026 (pilote)</div>
          <div className="flex items-end gap-1.5 h-32">
            {ANALYTICS_MONTHLY.map(m=>(
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[7px] font-bold text-green-600 dark:text-green-400">{(m.gross/1000).toFixed(0)}k</div>
                <div className="w-full rounded-t-lg" style={{height:`${(m.gross/maxGross)*100}%`,background:'#003DA5',opacity:0.85}}/>
                <div className="text-[7px] text-slate-400 whitespace-nowrap">{m.month.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique TPS/TVQ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">TPS + TVQ mensuelles (pilote)</div>
          <div className="flex items-end gap-1.5 h-24">
            {ANALYTICS_MONTHLY.map(m=>(
              <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col rounded-t-lg overflow-hidden" style={{height:'100%'}}>
                  <div style={{height:`${(m.tvq/(m.tps+m.tvq))*100}%`,background:'#7C3AED',opacity:0.7}}/>
                  <div style={{height:`${(m.tps/(m.tps+m.tvq))*100}%`,background:'#003DA5',opacity:0.85}}/>
                </div>
                <div className="text-[7px] text-slate-400">{m.month.split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{background:'#003DA5'}}/><span className="text-[8px] text-slate-500">TPS</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{background:'#7C3AED',opacity:0.7}}/><span className="text-[8px] text-slate-500">TVQ</span></div>
          </div>
        </div>

        {/* Tableau par secteur */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Par secteur — Q3 2026</div>
          {['TAXI','DELIVERY','LOGISTICS','BROKER','AUTO_PARTS','COURIER'].map((sector:string)=>{
            const sEnts = ENTERPRISES.filter((e:typeof ENTERPRISES[0])=>e.sector===sector)
            if (!sEnts.length) return null
            const totalRev = sEnts.reduce((s:number,e:typeof ENTERPRISES[0])=>s+e.grossQ3,0)
            const totalDrivers = sEnts.reduce((s:number,e:typeof ENTERPRISES[0])=>s+e.drivers,0)
            return (
              <div key={sector} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-[10px]">
                <span className="text-slate-600 dark:text-slate-400">{sector} ({sEnts.length} ent.)</span>
                <div className="flex gap-4">
                  <span className="text-slate-400">{totalDrivers} chauffeurs</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{money(totalRev)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
