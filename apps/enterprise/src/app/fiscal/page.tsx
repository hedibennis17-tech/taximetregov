'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { FISCAL_PERIODS, REVENUE } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">⚠️ SIMULATION · AUCUNE TRANSMISSION OFFICIELLE À REVENU QUÉBEC · {PILOT}</div>
        <div className="space-y-3">
          {FISCAL_PERIODS.map(fp=>{
            const isOpen=fp.status==='OPEN'
            return (
              <div key={fp.period} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${isOpen?'#003DA5':'#059669'}`}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{fp.period}</div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${isOpen?'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10':'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10'}`}>{fp.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/15 rounded-xl p-3">
                    <div className="text-[9px] font-black text-purple-700 dark:text-purple-400 mb-2">TPS (5%)</div>
                    <div className="flex justify-between py-0.5"><span className="text-[8px] text-slate-500">Calculée</span><span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">{money2(fp.tps)}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-[8px] text-slate-500">Payée</span><span className="text-[9px] font-bold" style={{color:fp.tpsPaid>0?'#059669':'#DC2626'}}>{fp.tpsPaid>0?money2(fp.tpsPaid):'—'}</span></div>
                    <div className="flex justify-between py-0.5 border-t border-purple-100 dark:border-purple-500/10 mt-1"><span className="text-[8px] font-bold text-purple-700 dark:text-purple-400">Solde</span><span className="text-[9px] font-black text-purple-700 dark:text-purple-400">{money2(fp.tps-fp.tpsPaid)}</span></div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200 dark:border-indigo-500/15 rounded-xl p-3">
                    <div className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 mb-2">TVQ (9,975%)</div>
                    <div className="flex justify-between py-0.5"><span className="text-[8px] text-slate-500">Calculée</span><span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">{money2(fp.tvq)}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-[8px] text-slate-500">Payée</span><span className="text-[9px] font-bold" style={{color:fp.tvqPaid>0?'#059669':'#DC2626'}}>{fp.tvqPaid>0?money2(fp.tvqPaid):'—'}</span></div>
                    <div className="flex justify-between py-0.5 border-t border-indigo-100 dark:border-indigo-500/10 mt-1"><span className="text-[8px] font-bold text-indigo-700 dark:text-indigo-400">Solde</span><span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400">{money2(fp.tvq-fp.tvqPaid)}</span></div>
                  </div>
                </div>
                {fp.declRef&&<div className="text-[9px] font-mono text-green-600 dark:text-green-400 mt-2">Réf: {fp.declRef}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
