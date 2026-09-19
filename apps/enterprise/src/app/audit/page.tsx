'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'


export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Historique audit</div>
          {[{at:'2026-09-18T10:38:00Z',user:'Robert Simard',action:'SYNC_COMPLETED',obj:'Revenue Ledger',result:'9 840 enr.'},{at:'2026-09-18T10:00:00Z',user:'SYSTÈME',action:'TRIP_TRANSMITTED',obj:'TRIP-001',result:'TX-001 créé'},{at:'2026-09-17T14:00:00Z',user:'Louise Côté',action:'REPORT_EXPORTED',obj:'Revenus Q2',result:'PDF généré'},{at:'2026-09-16T10:00:00Z',user:'Robert Simard',action:'DOCUMENT_UPLOADED',obj:'DOC-003',result:'En attente validation'}].map((a,i)=>(
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs">
              <div className="text-[8px] font-mono text-slate-400 shrink-0">{fmtDt(a.at)}</div>
              <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 shrink-0">{a.user}</div>
              <div className="flex-1 text-[9px] text-slate-600 dark:text-slate-300">{a.action} · {a.obj}</div>
              <div className="text-[8px] text-slate-400 shrink-0">{a.result}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
