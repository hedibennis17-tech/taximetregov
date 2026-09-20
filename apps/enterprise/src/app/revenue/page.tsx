'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, REVENUE, MONTHLY, ALL_TRANSACTIONS, ENT_DRIVERS } from '@/lib/data'

const r2=(n:number)=>Math.round(n*100)/100
const maxMonth = Math.max(...MONTHLY.map(m=>m.gross))

export default function RevenuePage() {
  const [period, setPeriod] = useState('Q3')

  const grossToday = ALL_TRANSACTIONS.filter(t=>t.at.startsWith('2026-09-18')).reduce((s,t)=>s+t.gross,0)

  const byDriver = ENT_DRIVERS.map(d=>{
    const txs = ALL_TRANSACTIONS.filter(t=>t.driverId===d.id)
    return {name:d.name, id:d.id, gross:r2(txs.reduce((s,t)=>s+t.gross,0)), driverAmt:r2(txs.reduce((s,t)=>s+t.driverAmt,0)), count:txs.length}
  }).filter(d=>d.gross>0).sort((a,b)=>b.gross-a.gross)

  const byProvider = [...new Set(ALL_TRANSACTIONS.map(t=>t.provider))].map(p=>{
    const txs = ALL_TRANSACTIONS.filter(t=>t.provider===p)
    return {provider:p, gross:r2(txs.reduce((s,t)=>s+t.gross,0)), count:txs.length}
  }).sort((a,b)=>b.gross-a.gross)

  const maxDrv = Math.max(...byDriver.map(d=>d.gross))
  const maxPrv = Math.max(...byProvider.map(p=>p.gross))

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Revenus</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue Ledger · Décomposition · Chauffeurs · Fournisseurs · PILOTE</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · ESTIMATION · Aucune transmission officielle</div>

        {/* Filtres période */}
        <div className="flex gap-1.5">
          {['Aujourd\'hui','Q3','YTD'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p==='Aujourd\'hui'?'TODAY':p)} className="px-3 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:period===(p==='Aujourd\'hui'?'TODAY':p)?'#003DA5':'transparent',color:period===(p==='Aujourd\'hui'?'TODAY':p)?'white':'#64748B',borderColor:period===(p==='Aujourd\'hui'?'TODAY':p)?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {p}
            </button>
          ))}
        </div>

        {/* KPI revenus */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Revenus bruts Q3',    v:money(REVENUE.grossQ3),           c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'Revenus nets Q3',     v:money(REVENUE.netQ3),             c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
            {l:'Part entreprise Q3',  v:money(REVENUE.entQ3),             c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'Aujourd\'hui (DEMO)', v:money(grossToday),                c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent shadow-sm`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Décomposition chaîne financière */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Décomposition revenue Q3 2026</div>
          <div className="space-y-0">
            {[
              {l:'① Revenus bruts',         v:money(REVENUE.grossQ3),                        c:'text-green-600 dark:text-green-400',  border:'border-green-100 dark:border-green-500/15',bold:false,note:'Total activités facturées'},
              {l:'② + Pourboires',           v:`+ ${money(REVENUE.tips)}`,                    c:'text-blue-600 dark:text-blue-400',    border:'border-slate-100 dark:border-slate-800',  bold:false,note:`${((REVENUE.tips/REVENUE.grossQ3)*100).toFixed(1)}% du brut`},
              {l:'③ − Frais plateforme',    v:`− ${money(REVENUE.fees)}`,                    c:'text-red-500',                        border:'border-slate-100 dark:border-slate-800',  bold:false,note:'Commissions fournisseurs'},
              {l:'④ − TPS collectée (5%)',  v:`− ${money(REVENUE.tpsQ3)}`,                   c:'text-purple-600 dark:text-purple-400',border:'border-slate-100 dark:border-slate-800',  bold:false,note:'Remise gouvernement fédéral'},
              {l:'⑤ − TVQ collectée (9.975%)',v:`− ${money(REVENUE.tvqQ3)}`,                 c:'text-purple-600 dark:text-purple-400',border:'border-slate-100 dark:border-slate-800',  bold:false,note:'Remise Revenu Québec'},
              {l:'⑥ ± Ajustements',         v:money(REVENUE.adj),                            c:'text-amber-600 dark:text-amber-400',  border:'border-slate-100 dark:border-slate-800',  bold:false,note:'Corrections et refacturations'},
              {l:'⑦ − Remboursements',      v:money(REVENUE.refunds),                        c:'text-red-500',                        border:'border-slate-100 dark:border-slate-800',  bold:false,note:'Remboursements clients'},
              {l:'⑧ Part chauffeurs (~78%)',v:money(REVENUE.driverQ3),                       c:'text-blue-700 dark:text-blue-300',    border:'border-blue-100 dark:border-blue-500/15', bold:false,note:'Revenus versés aux chauffeurs'},
              {l:'⑨ REVENU ENTREPRISE',     v:money(REVENUE.entQ3),                          c:'text-green-700 dark:text-green-300',  border:'border-green-100 dark:border-green-500/15',bold:true,note:`${((REVENUE.entQ3/REVENUE.grossQ3)*100).toFixed(1)}% du brut`},
            ].map(r=>(
              <div key={r.l} className={`flex justify-between items-start py-2.5 border-b ${r.border} ${r.bold?'bg-slate-50 dark:bg-slate-800 px-3 rounded-xl -mx-3':''}`}>
                <div>
                  <div className={`text-sm ${r.bold?'font-black':'font-semibold'} text-slate-800 dark:text-slate-200`}>{r.l}</div>
                  <div className="text-sm text-slate-400 italic">{r.note}</div>
                </div>
                <div className={`text-sm font-black ${r.c} shrink-0 ml-2`}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Graphique mensuel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Évolution mensuelle</div>
            <div className="text-sm text-slate-400 mb-4">Avr–Sep 2026 · PILOTE</div>
            <div className="flex items-end gap-2 h-24">
              {MONTHLY.map(m=>(
                <div key={m.m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">{(m.gross/1000).toFixed(0)}k</div>
                  <div className="w-full rounded-t-lg" style={{height:`${(m.gross/maxMonth)*100}%`,background:'#003DA5',opacity:0.8}}/>
                  <div className="text-sm text-slate-400">{m.m}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Par fournisseur */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Par fournisseur</div>
            {byProvider.map(p=>(
              <div key={p.provider} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{p.provider}</span>
                  <span className="text-sm font-black text-green-600 dark:text-green-400">{money(p.gross)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-qc-blue" style={{width:`${(p.gross/maxPrv)*100}%`}}/>
                </div>
                <div className="text-sm text-slate-400 mt-0.5">{p.count} transaction(s)</div>
              </div>
            ))}
          </div>
        </div>

        {/* Par chauffeur */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Revenus par chauffeur (DEMO)</div>
          {byDriver.map(d=>(
            <div key={d.id} className="mb-3 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{d.name}</span>
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 dark:text-blue-400">Chauffeur: {money(d.driverAmt)}</span>
                  <span className="font-black text-green-600 dark:text-green-400">Brut: {money(d.gross)}</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-qc-blue" style={{width:`${(d.gross/maxDrv)*100}%`}}/>
              </div>
              <div className="text-sm text-slate-400 mt-0.5">{d.count} transaction(s)</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
