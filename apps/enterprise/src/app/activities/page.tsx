'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_ACTIVITIES } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="grid grid-cols-3 gap-2">
          {[{l:'Total',v:ENT_ACTIVITIES.length,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Complétées',v:ENT_ACTIVITIES.filter(a=>a.status==='COMPLETED').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Exceptions',v:0,c:'#64748B',bg:'bg-slate-100 dark:bg-slate-800'},
          ].map(s=>(<div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}><div className="text-xl font-black" style={{color:s.c}}>{s.v}</div><div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div></div>))}
        </div>
        <div className="space-y-2">
          {ENT_ACTIVITIES.map(a=>(
            <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{a.type==='TAXI'?'🚕':'🚗'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{a.id}</span>
                    <span className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{a.type}</span>
                    <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full">{a.status}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{a.driverId} · {fmtDt(a.at)}</div>
                  <div className="text-[9px] text-slate-400">{a.origin} → {a.dest} · {a.dist}km · {a.dur}min</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-green-600 dark:text-green-400">{money2(a.fare)}</div>
                  {a.tip>0&&<div className="text-[9px] text-slate-400">+{money2(a.tip)} tip</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
