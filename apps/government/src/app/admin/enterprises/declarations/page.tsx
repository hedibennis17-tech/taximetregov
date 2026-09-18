'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money2, fmtDate, DECLARATIONS, DECL_STATUS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'
import Link from 'next/link'

const WORKFLOW = ['DRAFT','→','PREPARED','→','SUBMITTED','→','RECEIVED','→','ACCEPTED','↕','CORRECTED']

export default function Page() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">📤</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Declaration Control</h1></div>
        <p className="text-sm text-slate-500 mb-4">DRAFT → PREPARED → SUBMITTED → RECEIVED → ACCEPTED · Workflow déclaratif</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/declarations"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · SIMULATION · AUCUNE DÉCLARATION OFFICIELLE</div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow de déclaration</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={['→','↕'].includes(s)?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={!['→','↕'].includes(s)?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
          <div className="text-[8px] text-slate-400 mt-2">Transactions → Revenue Ledger → Calcul fiscal → Déclaration → Paiement → Confirmation → Audit</div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Acceptées',  v:DECLARATIONS.filter(d=>d.status==='ACCEPTED').length,  c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'En cours',   v:DECLARATIONS.filter(d=>d.status==='DRAFT'||d.status==='SUBMITTED').length, c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Manquantes', v:DECLARATIONS.filter(d=>d.status==='MISSING').length,   c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste déclarations */}
        <div className="space-y-2">
          {DECLARATIONS.map(d=>{
            const ent = ENTERPRISES.find(e=>e.id===d.entId)
            const sc = DECL_STATUS[d.status]!
            return (
              <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{d.type} — {d.period}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">{d.id} · {ent?.tradeName??d.entId}</div>
                    {d.ref&&<div className="text-[9px] text-green-600 dark:text-green-400 font-mono mt-0.5">Réf: {d.ref}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    {d.total>0&&<div className="text-base font-black text-slate-800 dark:text-white">{money2(d.total)}</div>}
                    <div className="text-[9px] text-purple-600 dark:text-purple-400">TPS: {money2(d.tps)} · TVQ: {money2(d.tvq)}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-[8px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {d.draftAt&&<span>Brouillon: {fmtDate(d.draftAt)}</span>}
                  {d.submittedAt&&<span>Soumise: {fmtDate(d.submittedAt)}</span>}
                  {d.acceptedAt&&<span className="text-green-600 dark:text-green-400">✓ Acceptée: {fmtDate(d.acceptedAt)}</span>}
                  {d.status==='MISSING'&&<span className="text-red-500 font-bold">⚠️ DÉCLARATION MANQUANTE</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
