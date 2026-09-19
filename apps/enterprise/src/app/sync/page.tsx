'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { CONNECTIONS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="space-y-3">
          {CONNECTIONS.map(c=>(
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">{c.provider}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[{l:'Données reçues',v:c.dataRx.toLocaleString('fr-CA'),c:'#059669'},{l:'Erreurs',v:c.errors,c:c.errors>0?'#DC2626':'#059669'},{l:'Santé',v:`${c.health}%`,c:c.health>=90?'#059669':'#B45309'},{l:'Méthode',v:c.method,c:'#003DA5'}].map(s=>(<div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center"><div className="text-sm font-black" style={{color:s.c}}>{s.v}</div><div className="text-[8px] text-slate-400 mt-0.5">{s.l}</div></div>))}
              </div>
              <div className="text-[9px] text-slate-400 mt-2">Dernière sync: {fmtDt(c.lastSync)}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
