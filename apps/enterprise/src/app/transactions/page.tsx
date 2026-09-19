'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, money2, fmtDt, ALL_TRANSACTIONS, ENT_DRIVERS, TX_STATUS_FULL, SYNC_STATUS } from '@/lib/data'

const RECON_CONF: Record<string,{label:string;color:string;icon:string}> = {
  MATCHED: {label:'Équilibré',color:'#059669',icon:'✅'},
  VARIANCE:{label:'Variance', color:'#B45309',icon:'⚠️'},
  MISSING: {label:'Manquant', color:'#DC2626',icon:'❌'},
}

export default function TransactionsPage() {
  const [statusF, setStatusF] = useState('ALL')
  const [reconF,  setReconF]  = useState('ALL')
  const [search,  setSearch]  = useState('')

  const filtered = ALL_TRANSACTIONS.filter(t=>{
    if (statusF!=='ALL' && t.status!==statusF) return false
    if (reconF!=='ALL'  && t.recon!==reconF)   return false
    if (search && !`${t.id} ${t.extId} ${t.driverId} ${t.actId} ${t.provider}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totals = {
    gross:      ALL_TRANSACTIONS.reduce((s,t)=>s+t.gross,0),
    tps:        ALL_TRANSACTIONS.reduce((s,t)=>s+t.tps,0),
    tvq:        ALL_TRANSACTIONS.reduce((s,t)=>s+t.tvq,0),
    driverAmt:  ALL_TRANSACTIONS.reduce((s,t)=>s+t.driverAmt,0),
    entAmt:     ALL_TRANSACTIONS.reduce((s,t)=>s+t.entAmt,0),
    adj:        ALL_TRANSACTIONS.reduce((s,t)=>s+t.adj,0),
    refund:     ALL_TRANSACTIONS.reduce((s,t)=>s+t.refund,0),
    exceptions: ALL_TRANSACTIONS.filter(t=>t.status==='EXCEPTION'||t.status==='DISPUTED').length,
  }

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue Ledger · TPS/TVQ · Ajustements · Remboursements · Réconciliation</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · ESTIMATION · Aucune transmission officielle</div>

        {/* Chaîne financière */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Décomposition d'une transaction</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['BRUT','→','- FRAIS','→','+ POURBOIRE','→','- TPS','→','- TVQ','→','± AJUST.','→','- REMBOURS.','→','= CHAUFFEUR + ENTREPRISE'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-1.5 py-0.5 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total transactions',v:ALL_TRANSACTIONS.length,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Revenus bruts',     v:money(totals.gross),    c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'TPS collectée',     v:money(totals.tps),      c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
            {l:'Exceptions',        v:totals.exceptions,      c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Résumé financier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Résumé financier DEMO</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {l:'Revenus bruts',  v:money(totals.gross),       c:'text-green-600 dark:text-green-400'},
              {l:'TPS collectée',  v:money(totals.tps),          c:'text-purple-600 dark:text-purple-400'},
              {l:'TVQ collectée',  v:money(totals.tvq),          c:'text-purple-600 dark:text-purple-400'},
              {l:'Ajustements',   v:money(totals.adj),           c:'text-amber-600 dark:text-amber-400'},
              {l:'Remboursements',v:money(totals.refund),        c:'text-red-500'},
              {l:'Part chauffeurs',v:money(totals.driverAmt),    c:'text-blue-600 dark:text-blue-400'},
              {l:'Part entreprise',v:money(totals.entAmt),       c:'text-green-700 dark:text-green-300'},
              {l:'Total taxes',   v:money(totals.tps+totals.tvq),c:'text-purple-700 dark:text-purple-300'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
                <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
                <div className="text-[8px] text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="TX ID, réf. externe, chauffeur, fournisseur…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['ALL','RECONCILED','VALIDATED','PENDING','EXCEPTION','DISPUTED','ADJUSTED','REFUNDED'].map(s=>(
              <button key={s} onClick={()=>setStatusF(s)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:statusF===s?'#003DA5':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {s==='ALL'?`Toutes (${ALL_TRANSACTIONS.length})`:(TX_STATUS_FULL[s]?.label??s)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['ALL','MATCHED','VARIANCE','MISSING'].map(r=>(
              <button key={r} onClick={()=>setReconF(r)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:reconF===r?'#7C3AED':'transparent',color:reconF===r?'white':'#64748B',borderColor:reconF===r?'#7C3AED':'rgba(148,163,184,0.30)'}}>
                {r==='ALL'?'Réconciliation':((RECON_CONF[r]?.icon??'')+' '+(RECON_CONF[r]?.label??r))}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} transaction(s)</span>
            <Link href="/reconciliation" className="text-[9px] font-bold text-qc-blue hover:underline">→ Centre réconciliation</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['TX ID','Date','Chauffeur','Fournisseur','Brut','Tip','TPS','TVQ','Adj.','Rembrs.','Chauffeur','Ent.','Statut','Recon.','Sync'].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(t=>{
                  const drv = ENT_DRIVERS.find(d=>d.id===t.driverId)
                  const sc  = TX_STATUS_FULL[t.status]!
                  const rc  = RECON_CONF[t.recon]!
                  const ss  = SYNC_STATUS[t.syncStatus]!
                  return (
                    <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2.5">
                        <div className="text-[9px] font-mono text-blue-600 dark:text-blue-400">{t.id}</div>
                        <div className="text-[7px] font-mono text-slate-400">{t.extId}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-mono text-slate-400 whitespace-nowrap">{fmtDt(t.at)}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-700 dark:text-slate-300 whitespace-nowrap">{drv?.name??t.driverId}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-500 whitespace-nowrap">{t.provider}</td>
                      <td className="px-3 py-2.5 font-bold text-green-600 dark:text-green-400 whitespace-nowrap">{money2(t.gross)}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-500">{t.tip>0?money2(t.tip):'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-purple-600 dark:text-purple-400 whitespace-nowrap">{t.tps>0?money2(t.tps):'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-purple-600 dark:text-purple-400 whitespace-nowrap">{t.tvq>0?money2(t.tvq):'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-amber-600 dark:text-amber-400">{t.adj!==0?money2(t.adj):'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-red-500">{t.refund!==0?money2(t.refund):'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-blue-600 dark:text-blue-400 whitespace-nowrap">{money2(t.driverAmt)}</td>
                      <td className="px-3 py-2.5 text-[9px] text-green-600 dark:text-green-400 whitespace-nowrap">{money2(t.entAmt)}</td>
                      <td className="px-3 py-2.5"><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></td>
                      <td className="px-3 py-2.5"><span className="text-[10px]">{rc.icon}</span></td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/><span className="text-[8px]" style={{color:ss.color}}>{ss.label}</span></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
