'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_TRANSACTIONS, TX_STATUS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">{ENT_TRANSACTIONS.length} transactions</div>
          {ENT_TRANSACTIONS.map(tx=>{
            const sc=TX_STATUS[tx.status]!
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{tx.id}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{tx.driverId} · {tx.source} · {fmtDt(tx.at)}</div>
                  <div className="text-[9px] text-slate-400 font-mono">TPS:{money2(tx.tps)} · TVQ:{money2(tx.tvq)} · Frais:{money2(tx.fees)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-800 dark:text-white">{money2(tx.gross)}</div>
                  <div className="text-[9px] text-green-600 dark:text-green-400">Chauffeur: {money2(tx.driverAmt)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
