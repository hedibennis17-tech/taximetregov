'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'


export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="space-y-2">
          {['Rapport revenus Q3','Rapport TPS/TVQ Q3','Rapport transactions','Rapport chauffeurs','Rapport conformité','Rapport réconciliation'].map(r=>(
            <div key={r} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-2"><span className="text-base">📊</span><div><div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r}</div><div className="text-[8px] text-slate-400">PDF · CSV · PILOTE DEMO</div></div></div>
              <button className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-qc-blue text-white hover:opacity-90 cursor-pointer">Export</button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
