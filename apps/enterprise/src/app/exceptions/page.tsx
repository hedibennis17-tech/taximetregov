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
          {[{id:'EXC-001',type:'TRANSACTION',title:'TX-005 — Exception taximètre',desc:'Course DRV-QC-0004 non réconciliée.',priority:'HIGH',status:'OPEN'},{id:'EXC-002',type:'DOCUMENT',title:'Permis DRV-QC-0004 expirant',desc:'Expire le 2026-09-30.',priority:'MEDIUM',status:'OPEN'},{id:'EXC-003',type:'VEHICLE',title:'Inspection TXM-004 expirée',desc:'Inspection septembre 2026.',priority:'HIGH',status:'OPEN'}].map(e=>(
            <div key={e.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm" style={{borderLeft:`3px solid ${e.priority==='HIGH'?'#DC2626':'#B45309'}`}}>
              <div className="flex items-start justify-between gap-2">
                <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{e.title}</span><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${e.priority==='HIGH'?'text-red-500 bg-red-50 dark:bg-red-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{e.priority}</span></div><div className="text-[9px] text-slate-400">{e.type} · {e.desc}</div></div>
                <button className="text-[9px] font-bold text-qc-blue hover:underline cursor-pointer whitespace-nowrap">Résoudre</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
