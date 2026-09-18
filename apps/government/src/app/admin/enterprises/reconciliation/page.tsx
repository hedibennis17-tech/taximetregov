'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money2, fmtDate, RECONCILIATION_ITEMS, RECON_STATUS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'
import Link from 'next/link'

export default function Page() {
  const matched  = RECONCILIATION_ITEMS.filter(r=>r.status==='MATCHED').length
  const variance = RECONCILIATION_ITEMS.filter(r=>r.status==='VARIANCE').length
  const missing  = RECONCILIATION_ITEMS.filter(r=>r.status==='MISSING').length

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🔄</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Data Reconciliation Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Provider · Driver · Enterprise · Taximeter · Revenue Ledger · Tax — Comparaison multi-sources</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/reconciliation"/>
        <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 px-3 py-2 rounded-xl">
          Variance détectée → Analyse → Justification → Résolution → Audit · NE PAS qualifier automatiquement une variance de fraude · {PILOT}
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Équilibrés',   v:matched,  c:'#059669',bg:'bg-green-50 dark:bg-green-500/10', icon:'✅'},
            {l:'Variances',    v:variance, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10',icon:'⚠️'},
            {l:'Manquants',    v:missing,  c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',   icon:'❌'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Réconciliations */}
        <div className="space-y-3">
          {RECONCILIATION_ITEMS.map(r=>{
            const ent = ENTERPRISES.find(e=>e.id===r.entId)
            const sc = RECON_STATUS[r.status]!
            return (
              <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{sc.icon}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{r.id}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{ent?.tradeName??r.entId} · {r.txId!=='—'?`TX: ${r.txId}`:'Aucune TX associée'} · {fmtDate(r.period)}</div>
                    {r.note&&<div className="text-[9px] text-slate-500 italic mt-0.5">{r.note}</div>}
                  </div>
                  {r.diff>0&&<div className="text-right shrink-0"><div className="text-base font-black text-red-500">Écart: {money2(r.diff)}</div></div>}
                </div>
                {/* Tableau comparaison sources */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[9px]">
                  {[
                    {l:'Plateforme',  v:r.providerAmt,c:'#003DA5'},
                    {l:'Chauffeur',   v:r.driverAmt,  c:'#059669'},
                    {l:'Pourboire',   v:r.tips,        c:'#B45309'},
                    {l:'TPS',         v:r.tps,         c:'#7C3AED'},
                    {l:'TVQ',         v:r.tvq,         c:'#7C3AED'},
                    {l:'Revenue Ledger',v:r.ledgerAmt, c:r.ledgerAmt===r.providerAmt?'#059669':'#DC2626'},
                  ].map(s=>(
                    <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                      <div className="text-[8px] text-slate-400 mb-0.5">{s.l}</div>
                      <div className="font-black" style={{color:s.c}}>{money2(s.v)}</div>
                    </div>
                  ))}
                </div>
                {r.status!=='MATCHED'&&(
                  <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link href="/compliance/cases" className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100">→ Ouvrir dossier analyse</Link>
                    <Link href="/admin/enterprises/audit" className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
