'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { CONNECTIONS, CONN_STATUS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="space-y-3">
          {CONNECTIONS.map(c=>{const cs=CONN_STATUS[c.status]??CONN_STATUS['PENDING']!; return (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2"><div className={`w-3 h-3 rounded-full shrink-0 ${cs.dot}`}/><div className="flex-1"><div className="text-sm font-bold text-slate-800 dark:text-white">{c.provider}</div><div className="text-[9px] text-slate-400">{c.method} · Santé: {c.health}% · {c.dataRx.toLocaleString('fr-CA')} enr. · {c.errors} erreur(s)</div></div><span className="text-[9px] font-bold" style={{color:cs.color}}>{cs.label}</span></div>
              <div className="flex gap-1 flex-wrap">{c.scopes.map((s:string)=><span key={s} className="text-[7px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{s}</span>)}</div>
              <div className="text-[8px] text-slate-400 mt-1.5 font-mono">Sync: {fmtDt(c.lastSync)}</div>
            </div>
          )})}
          <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-2">🔮 Providers planifiés (accord requis)</div>
            <div className="flex gap-1.5 flex-wrap">{['UBER','LYFT','DOORDASH','DHL','UPS','GLS','SKIP'].map(p=><span key={p} className="text-[9px] font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg">{p}</span>)}</div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
