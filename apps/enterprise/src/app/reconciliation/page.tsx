'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_TRANSACTIONS, TX_STATUS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="space-y-2">
          {ENT_TRANSACTIONS.map(tx=>{const matched=tx.status==='RECONCILED'; return (
            <div key={tx.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm" style={{borderLeft:`3px solid ${matched?'#059669':'#DC2626'}`}}>
              <div className="flex items-center gap-2 mb-2"><span className="text-base">{matched?'✅':'⚠️'}</span><span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{tx.id}</span><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${matched?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>{matched?'ÉQUILIBRÉ':'EXCEPTION'}</span></div>
              <div className="grid grid-cols-3 gap-2 text-[9px]">
                {[{l:'Source',v:money2(tx.gross),c:'#003DA5'},{l:'Ledger',v:money2(tx.gross),c:'#059669'},{l:'Écart',v:tx.status==='EXCEPTION'?'À analyser':'0,00 $',c:tx.status==='EXCEPTION'?'#DC2626':'#059669'}].map(s=>(<div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center"><div className="text-[8px] text-slate-400 mb-0.5">{s.l}</div><div className="font-black" style={{color:s.c}}>{s.v}</div></div>))}
              </div>
            </div>
          )})}
        </div>
      </div>
    </AppShell>
  )
}
