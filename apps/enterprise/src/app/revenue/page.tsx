'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { REVENUE } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {l:'Revenus bruts Q3',  v:money(REVENUE.grossQ3),  c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'Pourboires',        v:money(REVENUE.tips),     c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/8'},
            {l:'Revenus nets Q3',   v:money(REVENUE.netQ3),    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
            {l:'Part chauffeurs',   v:money(REVENUE.driverQ3), c:'#64748B',bg:'bg-slate-100 dark:bg-slate-800'},
          ].map(s=>(<div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent`}><div className="text-lg font-black" style={{color:s.c}}>{s.v}</div><div className="text-[9px] text-slate-400 mt-1">{s.l}</div></div>))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Décomposition financière Q3</div>
          {[
            {l:'① Revenus bruts',          v:money(REVENUE.grossQ3),       c:'text-green-600 dark:text-green-400'},
            {l:'② + Pourboires',            v:`+${money(REVENUE.tips)}`,    c:'text-amber-600 dark:text-amber-400'},
            {l:'③ - Frais (8%)',            v:`-${money(REVENUE.fees)}`,    c:'text-red-500'},
            {l:'④ → TPS (5%)',              v:money(REVENUE.tpsQ3),         c:'text-purple-600 dark:text-purple-400'},
            {l:'⑤ → TVQ (9,975%)',          v:money(REVENUE.tvqQ3),         c:'text-purple-600 dark:text-purple-400'},
            {l:'⑥ Ajustements',             v:money(REVENUE.adj),            c:'text-slate-500'},
            {l:'⑦ Part chauffeurs (78%)',   v:money(REVENUE.driverQ3),      c:'text-blue-600 dark:text-blue-400'},
            {l:'⑧ Part entreprise (22%)',   v:money(REVENUE.entQ3),         c:'text-green-700 dark:text-green-400'},
          ].map(r=>(<div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"><span className="text-[10px] text-slate-500">{r.l}</span><span className={`text-[10px] font-bold ${r.c}`}>{r.v}</span></div>))}
        </div>
        <div className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/15 p-3 rounded-xl">{PILOT} · Données synthétiques</div>
      </div>
    </AppShell>
  )
}
