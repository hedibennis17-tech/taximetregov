'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_DOCS, DOC_STATUS } from '@/lib/data'

export default function Page() {
  // page
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Approuvés', v:ENT_DOCS.filter(d=>d.status==='APPROVED').length, c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Expirants', v:ENT_DOCS.filter(d=>d.status==='EXPIRING').length, c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Expirés',   v:ENT_DOCS.filter(d=>d.status==='EXPIRED').length,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {ENT_DOCS.map(d=>{
            const sc=DOC_STATUS[d.status]!
            return (
              <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.label}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">{d.number} · {d.entity}</div>
                    {d.expires&&<div className="text-[9px] text-slate-400">Expire: {fmtDate(d.expires)}</div>}
                  </div>
                  {(d.status==='EXPIRED'||d.status==='EXPIRING')&&(
                    <button className="text-[9px] font-bold text-white bg-qc-blue px-3 py-1.5 rounded-lg hover:opacity-90 cursor-pointer whitespace-nowrap">Renouveler</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-[9px] text-slate-400 text-center">Workflow: UPLOAD → RECEIVED → VALIDATION → UNDER REVIEW → APPROVED/REJECTED</div>

      </div>
    </AppShell>
  )
}
