'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, money, money2, FISCAL_PERIODS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

const PERIOD_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  CLOSED: {label:'Clôturée',color:'#059669',bg:'rgba(5,150,105,0.12)'},
  OPEN:   {label:'En cours', color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  OVERDUE:{label:'En retard',color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
}

export default function Page() {
  const [entId, setEntId] = useState('ENT-DEMO-001')
  const [period, setPeriod] = useState('quarterly')
  const periods = FISCAL_PERIODS.filter(p=>p.entId===entId)
  const ent = ENTERPRISES.find(e=>e.id===entId)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🧾</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Fiscal Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">TPS calculée · collectée · déclarée · payée · remboursable · solde · TVQ idem</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/fiscal"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · ESTIMATION · AUCUNE TRANSMISSION OFFICIELLE À REVENU QUÉBEC</div>

        <div className="flex gap-2">
          <select value={entId} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setEntId(e.target.value)} className="flex-1 px-3 py-2 rounded-xl text-xs font-bold border bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
            {ENTERPRISES.map(e=><option key={e.id} value={e.id}>{e.tradeName}</option>)}
          </select>
          {['monthly','quarterly','annual'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:period===p?'#003DA5':'transparent',color:period===p?'white':'#64748B',borderColor:period===p?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {p==='monthly'?'Mensuel':p==='quarterly'?'Trimestriel':'Annuel'}
            </button>
          ))}
        </div>

        {periods.length>0?(
          <div className="space-y-3">
            {periods.map(fp=>{
              const ps = PERIOD_STATUS[fp.status]!
              const tpsBalance = fp.tpsCollected - fp.tpsPaid
              const tvqBalance = fp.tvqCollected - fp.tvqPaid
              return (
                <div key={fp.period} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderLeft:`3px solid ${ps.color}`}}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{fp.period} — {ent?.tradeName}</div>
                      <div className="text-[9px] text-slate-400">Revenus bruts: {money(fp.gross)}</div>
                    </div>
                    <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{color:ps.color,background:ps.bg}}>{ps.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* TPS */}
                    <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3">
                      <div className="text-[9px] font-black text-purple-700 dark:text-purple-400 mb-2">TPS (5%)</div>
                      {[
                        {l:'Calculée',    v:money2(fp.tpsCalc)},
                        {l:'Collectée',   v:money2(fp.tpsCollected)},
                        {l:'Déclarée',    v:fp.tpsDeclared>0?money2(fp.tpsDeclared):'—'},
                        {l:'Payée',       v:fp.tpsPaid>0?money2(fp.tpsPaid):'—'},
                        {l:'Remboursable',v:fp.tpsRefund>0?money2(fp.tpsRefund):'0,00 $'},
                        {l:'SOLDE',       v:money2(tpsBalance),bold:true},
                      ].map(r=>(
                        <div key={r.l} className="flex justify-between py-0.5">
                          <span className="text-[8px] text-slate-500">{r.l}</span>
                          <span className={`text-[9px] font-${(r as {bold?:boolean}).bold?'black':'semibold'} ${(r as {bold?:boolean}).bold?'text-purple-700 dark:text-purple-300':'text-slate-800 dark:text-slate-200'}`}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                    {/* TVQ */}
                    <div className="bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3">
                      <div className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 mb-2">TVQ (9,975%)</div>
                      {[
                        {l:'Calculée',    v:money2(fp.tvqCalc)},
                        {l:'Collectée',   v:money2(fp.tvqCollected)},
                        {l:'Déclarée',    v:fp.tvqDeclared>0?money2(fp.tvqDeclared):'—'},
                        {l:'Payée',       v:fp.tvqPaid>0?money2(fp.tvqPaid):'—'},
                        {l:'Remboursable',v:fp.tvqRefund>0?money2(fp.tvqRefund):'0,00 $'},
                        {l:'SOLDE',       v:money2(tvqBalance),bold:true},
                      ].map(r=>(
                        <div key={r.l} className="flex justify-between py-0.5">
                          <span className="text-[8px] text-slate-500">{r.l}</span>
                          <span className={`text-[9px] font-${(r as {bold?:boolean}).bold?'black':'semibold'} ${(r as {bold?:boolean}).bold?'text-indigo-700 dark:text-indigo-300':'text-slate-800 dark:text-slate-200'}`}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {fp.status==='OVERDUE'&&<div className="mt-2 text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 p-2 rounded-lg">⚠️ DÉCLARATION EN RETARD · Solde dû: {money(tpsBalance+tvqBalance)}</div>}
                </div>
              )
            })}
          </div>
        ):<div className="text-center py-8 text-[10px] text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">Aucune donnée fiscale pour cette entreprise dans le pilote</div>}
      </div>
    </AppShell>
  )
}
