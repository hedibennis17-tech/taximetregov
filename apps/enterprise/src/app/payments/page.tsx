'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'


export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">⚠️ DEMO PAYMENT — AUCUN PAIEMENT GOUVERNEMENTAL RÉEL · {PILOT}</div>
        <div className="space-y-3">
          {[{period:'Q1 2026',due:20481.78,paid:20481.78,paidAt:'2026-04-28',ref:'VIR-2026-04-28-001',status:'PAID'},{period:'Q2 2026',due:21638.34,paid:21638.34,paidAt:'2026-07-30',ref:'VIR-2026-07-30-001',status:'PAID'},{period:'Q3 2026',due:61806.6,paid:0,paidAt:null,ref:null,status:'UPCOMING'}].map(p=>(
            <div key={p.period} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${p.status==='PAID'?'#059669':p.status==='OVERDUE'?'#DC2626':'#003DA5'}`}}>
              <div className="flex items-start justify-between gap-2">
                <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-slate-800 dark:text-white">TPS/TVQ — {p.period}</span><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${p.status==='PAID'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>{p.status==='PAID'?'Payé':'À venir'}</span></div>{p.paidAt&&<div className="text-[9px] text-slate-400">Payé: {fmtDate(p.paidAt)} · Réf: {p.ref}</div>}</div>
                <div className="text-right shrink-0"><div className="text-base font-black text-slate-800 dark:text-white">{money2(p.due)}</div>{p.paid>0&&<div className="text-[10px] text-green-600 dark:text-green-400 font-bold">Payé: {money2(p.paid)}</div>}</div>
              </div>
              {p.status==='UPCOMING'&&<button className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white bg-qc-blue hover:opacity-90 cursor-pointer">💵 Soumettre paiement (DEMO)</button>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
