'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDate, PAYMENTS, PAY_STATUS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

export default function Page() {
  const totalDue  = PAYMENTS.reduce((s,p)=>s+p.due,0)
  const totalPaid = PAYMENTS.reduce((s,p)=>s+p.paid,0)
  const overdue   = PAYMENTS.filter(p=>p.status==='OVERDUE').reduce((s,p)=>s+p.balance,0)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">💵</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Payment & Refund Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Montant dû · Payé · Date · Référence · Solde · Statut · SIMULATION</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/payments"/>
        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">{PILOT} · PAIEMENTS GOUVERNEMENTAUX RÉELS NON CONNECTÉS · SIMULATION UNIQUEMENT</div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Total dû (DEMO)',       v:money(totalDue),    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
            {l:'Total payé (DEMO)',     v:money(totalPaid),   c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'En retard (DEMO)',      v:money(overdue),     c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent shadow-sm`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {PAYMENTS.map(p=>{
            const ent = ENTERPRISES.find(e=>e.id===p.entId)
            const sc = PAY_STATUS[p.status]!
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{ent?.tradeName??p.entId} · {p.period}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">{p.id} · Décl: {p.declId}</div>
                    {p.paidAt&&<div className="text-[9px] text-slate-400">Payé le: {fmtDate(p.paidAt)} · Méthode: {p.method??'—'}</div>}
                    {p.ref&&<div className="text-[9px] font-mono text-green-600 dark:text-green-400">Réf: {p.ref}</div>}
                    {p.status==='OVERDUE'&&<div className="text-[9px] font-bold text-red-500 mt-1">⚠️ PAIEMENT EN RETARD — PILOTE</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-slate-800 dark:text-white">{money2(p.due)}</div>
                    <div className="text-[9px] text-slate-400">Dû</div>
                    {p.paid>0&&<div className="text-[10px] font-bold text-green-600 dark:text-green-400">Payé: {money2(p.paid)}</div>}
                    {p.balance>0&&<div className="text-[10px] font-bold text-red-500">Solde: {money2(p.balance)}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
