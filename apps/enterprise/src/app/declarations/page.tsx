'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'


export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">⚠️ SIMULATION · AUCUNE DÉCLARATION OFFICIELLE · {PILOT}</div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Workflow déclaratif</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['DONNÉES','→','CALCUL','→','RÉVISION','→','PRÉPARATION','→','SOUMISSION','→','REÇUE','→','CONFIRMÉE'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}>{s}</span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[{period:'Q1 2026',status:'ACCEPTED',tps:6840,tvq:13641.78,total:20481.78,ref:'DAS-2026-Q1-001',date:'2026-04-25'},{period:'Q2 2026',status:'ACCEPTED',tps:7224,tvq:14414.34,total:21638.34,ref:'DAS-2026-Q2-001',date:'2026-07-28'},{period:'Q3 2026',status:'DRAFT',tps:20640,tvq:41166.6,total:61806.6,ref:null,date:null}].map(d=>(
            <div key={d.period} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-slate-800 dark:text-white">TPS/TVQ — {d.period}</span><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${d.status==='ACCEPTED'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>{d.status}</span></div>{d.ref&&<div className="text-[9px] font-mono text-green-600 dark:text-green-400">Réf: {d.ref}{d.date?` · ${fmtDate(d.date)}`:''}</div>}</div>
                <div className="text-right shrink-0"><div className="text-base font-black text-slate-800 dark:text-white">{money2(d.total)}</div><div className="text-[9px] text-purple-600 dark:text-purple-400">TPS:{money2(d.tps)} · TVQ:{money2(d.tvq)}</div></div>
              </div>
              {d.status==='DRAFT'&&<button className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white bg-qc-blue hover:opacity-90 cursor-pointer">📤 Soumettre la déclaration Q3 (DEMO)</button>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
