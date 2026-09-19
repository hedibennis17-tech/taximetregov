'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_TRANSACTIONS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Décomposition d'une transaction — TX-001</div>
          {(() => { const tx=ENT_TRANSACTIONS[0]!; return (
            <div className="space-y-0">
              {[{l:'① Montant brut',v:money2(tx.gross),c:'text-green-600 dark:text-green-400'},{l:'② + Pourboire',v:`+${money2(tx.tip)}`,c:'text-amber-600 dark:text-amber-400'},{l:'③ - Frais (8%)',v:`-${money2(tx.fees)}`,c:'text-red-500'},{l:'④ → TPS (5%)',v:money2(tx.tps),c:'text-purple-600 dark:text-purple-400'},{l:'⑤ → TVQ (9,975%)',v:money2(tx.tvq),c:'text-purple-600 dark:text-purple-400'},{l:'⑥ → Chauffeur (80%)',v:money2(tx.driverAmt),c:'text-blue-600 dark:text-blue-400'},{l:'⑦ → Entreprise (20%)',v:money2(tx.entAmt),c:'text-green-700 dark:text-green-400'}].map(r=>(<div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"><span className="text-[10px] text-slate-500">{r.l}</span><span className={`text-[10px] font-bold ${r.c}`}>{r.v}</span></div>))}
            </div>
          )})()}
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">💡 Centre de transparence</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300">L'entreprise peut consulter la décomposition de chaque transaction pour comprendre comment les montants TPS/TVQ ont été calculés et quelles données ont été transmises à TAXIMETER.GOV.</div>
        </div>
      </div>
    </AppShell>
  )
}
