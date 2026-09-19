'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { NOTIFICATIONS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="space-y-2">
          {NOTIFICATIONS.map(n=>(
            <div key={n.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-3 shadow-sm ${!n.read?'border-blue-200 dark:border-blue-500/30':'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{n.type==='CRITICAL'?'🚨':n.type==='WARNING'?'⚠️':n.type==='SUCCESS'?'✅':'ℹ️'}</span>
                <div className="flex-1"><div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{n.title}</div><div className="text-[9px] text-slate-400">{n.desc} · {fmtDt(n.at)}</div></div>
                {!n.read&&<div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
