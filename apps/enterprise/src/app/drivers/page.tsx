'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_DRIVERS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="grid grid-cols-4 gap-2">
          {[{l:'Actifs',   v:ENT_DRIVERS.filter(d=>d.status==='ACTIVE').length,    c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Suspendus',v:ENT_DRIVERS.filter(d=>d.status==='SUSPENDED').length, c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'Employés', v:ENT_DRIVERS.filter(d=>d.relation==='EMPLOYEE').length, c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Sous-trait.',v:ENT_DRIVERS.filter(d=>d.relation==='CONTRACTOR').length,c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(<div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}><div className="text-xl font-black" style={{color:s.c}}>{s.v}</div><div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div></div>))}
        </div>
        <div className="space-y-2">
          {ENT_DRIVERS.map(d=>(
            <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white shrink-0">{d.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${d.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>{d.status}</span>
                    {d.docs!=='OK'&&<span className="text-[8px] font-bold text-amber-500">⚠️ Doc {d.docs}</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">{d.id} · {d.relation}{d.plate?` · ${d.plate}`:''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-green-600 dark:text-green-400">{money(d.revQ3)}</div>
                  <div className="text-[8px] text-slate-400">{d.actQ3} activités Q3</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
