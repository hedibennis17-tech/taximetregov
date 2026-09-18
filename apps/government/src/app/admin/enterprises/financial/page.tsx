'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, money, money2, FINANCIAL_BREAKDOWN } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

export default function Page() {
  const [entId, setEntId] = useState('ENT-DEMO-001')
  const fb = FINANCIAL_BREAKDOWN.find(f=>f.entId===entId)
  const ent = ENTERPRISES.find(e=>e.id===entId)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">💰</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Financial Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Reconstruction chaîne financière · GrossMt → Fees → Tips → TPS → TVQ → Driver → Enterprise</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/financial"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · ESTIMATION DÉMONSTRATION</div>

        <select value={entId} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setEntId(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs font-bold border bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
          {ENTERPRISES.map(e=><option key={e.id} value={e.id}>{e.tradeName} ({e.id})</option>)}
        </select>

        {fb && ent ? (
          <div className="space-y-3">
            {/* Chaîne financière */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Chaîne financière — {ent.tradeName} · {fb.period}</div>
              <div className="space-y-0">
                {[
                  {l:'① Montant brut',         v:money(fb.gross),      c:'text-green-600 dark:text-green-400',  border:'border-green-100 dark:border-green-500/15', note:'Total des activités facturées'},
                  {l:'② Frais plateforme',      v:`- ${money(fb.fees)}`,c:'text-red-500',                        border:'border-slate-100 dark:border-slate-800',    note:`${((fb.fees/fb.gross)*100).toFixed(1)}% du brut`},
                  {l:'③ Pourboires',            v:`+ ${money(fb.tips)}`,c:'text-blue-600 dark:text-blue-400',   border:'border-slate-100 dark:border-slate-800',    note:'Collectés via plateforme'},
                  {l:'④ TPS collectée (5%)',    v:`→ ${money2(fb.tps)}`,c:'text-purple-600 dark:text-purple-400',border:'border-slate-100 dark:border-slate-800',   note:'À remettre au gouvernement fédéral'},
                  {l:'⑤ TVQ collectée (9.975%)',v:`→ ${money2(fb.tvq)}`,c:'text-purple-600 dark:text-purple-400',border:'border-slate-100 dark:border-slate-800',  note:'À remettre à Revenu Québec'},
                  {l:'⑥ Ajustements',           v:money(fb.adjustments),c:'text-amber-600 dark:text-amber-400', border:'border-slate-100 dark:border-slate-800',    note:'Corrections et refacturations'},
                  {l:'⑦ Remboursements',        v:money(fb.refunds),    c:'text-red-500',                       border:'border-slate-100 dark:border-slate-800',    note:'Remboursements clients'},
                  {l:'⑧ Revenu chauffeur',      v:money(fb.driverRev),  c:'text-blue-600 dark:text-blue-400',   border:'border-blue-100 dark:border-blue-500/15',   note:`${((fb.driverRev/fb.gross)*100).toFixed(1)}% du brut`},
                  {l:'⑨ Revenu entreprise',     v:money(fb.entRev),     c:'text-green-700 dark:text-green-400', border:'border-green-100 dark:border-green-500/15', note:`${((fb.entRev/fb.gross)*100).toFixed(1)}% du brut`},
                ].map((r,i)=>(
                  <div key={r.l} className={`flex justify-between items-start py-2.5 border-b ${r.border}`}>
                    <div>
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r.l}</div>
                      <div className="text-[8px] text-slate-400 italic">{r.note}</div>
                    </div>
                    <div className={`text-sm font-black ${r.c}`}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé visuel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/20 rounded-2xl p-4">
                <div className="text-[9px] font-bold text-green-700 dark:text-green-400 mb-1">Revenu entreprise</div>
                <div className="text-2xl font-black text-green-700 dark:text-green-400">{money(fb.entRev)}</div>
                <div className="text-[9px] text-slate-400 mt-1">{((fb.entRev/fb.gross)*100).toFixed(1)}% du brut · Q3 DEMO</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
                <div className="text-[9px] font-bold text-blue-700 dark:text-blue-400 mb-1">Revenu chauffeurs</div>
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{money(fb.driverRev)}</div>
                <div className="text-[9px] text-slate-400 mt-1">{((fb.driverRev/fb.gross)*100).toFixed(1)}% du brut · Q3 DEMO</div>
              </div>
            </div>
          </div>
        ):<div className="text-center py-8 text-[10px] text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">Aucune donnée financière pour cette entreprise dans le pilote</div>}
      </div>
    </AppShell>
  )
}
