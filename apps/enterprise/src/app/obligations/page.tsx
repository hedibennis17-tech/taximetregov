'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { OBLIGATIONS, OBL_STATUS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="space-y-3">
          {OBLIGATIONS.map(o=>{
            const sc=OBL_STATUS[o.status]!
            return (
              <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-2">
                  <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-slate-800 dark:text-white">{o.type} — {o.period}</span><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></div><div className="text-[9px] text-slate-400">Échéance: {fmtDate(o.due)}{o.paidAt?` · Payé: ${fmtDate(o.paidAt)}`:''}</div></div>
                  <div className="text-right shrink-0"><div className="text-base font-black text-slate-800 dark:text-white">{money2(o.amount)}</div></div>
                </div>
                {o.status==='UPCOMING'&&<Link href="/declarations" className="mt-2 block text-[9px] font-bold text-white bg-qc-blue px-3 py-1.5 rounded-lg hover:opacity-90 text-center">→ Préparer la déclaration</Link>}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
