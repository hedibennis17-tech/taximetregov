'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDate, ALL_PAYMENTS, ALL_DECLARATIONS, PAY_STATUS_CONF } from '@/lib/data'

const METHODS = ['VIREMENT BANCAIRE','CHÈQUE CERTIFIÉ','PAIEMENT EN LIGNE','INSTITUTION FINANCIÈRE']

export default function PaymentsPage() {
  const [showForm, setShowForm] = useState(false)

  const totalDue    = ALL_PAYMENTS.reduce((s,p)=>s+p.due,0)
  const totalPaid   = ALL_PAYMENTS.filter(p=>p.status==='PAID').reduce((s,p)=>s+p.paid,0)
  const totalBalance= ALL_PAYMENTS.reduce((s,p)=>s+p.balance,0)
  const nextPay     = ALL_PAYMENTS.find(p=>p.status==='UPCOMING')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paiements</h1>
            <p className="text-sm text-slate-500 mt-1">Montant dû · Payé · Référence · Solde · Remboursements</p>
          </div>
          <button onClick={()=>setShowForm(!showForm)} className="px-3 py-2 rounded-xl text-[10px] font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700 shrink-0">+ Soumettre</button>
        </div>
        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · SIMULATION · AUCUN PAIEMENT GOUVERNEMENTAL RÉEL EFFECTUÉ
        </div>

        {/* Form soumission DEMO */}
        {showForm&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Soumettre un paiement (DEMO)</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 block mb-1">Déclaration liée</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none">
                  {ALL_DECLARATIONS.map(d=><option key={d.id}>{d.id} — {d.period} ({money2(d.total)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 block mb-1">Méthode de paiement</label>
                <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none">
                  {METHODS.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              {['Montant payé ($)','Numéro de référence','Date de paiement','Institution financière'].map(f=>(
                <div key={f}>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">{f}</label>
                  <input placeholder={f} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"/>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700">Enregistrer paiement · DEMO</button>
              <button onClick={()=>setShowForm(false)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">Annuler</button>
            </div>
            <div className="text-[8px] text-red-500 text-center mt-2">PILOTE — Aucun paiement réel soumis</div>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Total payé YTD',     v:money(totalPaid),   c:'#059669',bg:'bg-green-50 dark:bg-green-500/8',  icon:'✅'},
            {l:'Total dû (obligations)',v:money(totalDue), c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8',   icon:'📋'},
            {l:'Solde à payer',      v:money(totalBalance),c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/8', icon:'⏳'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent shadow-sm`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Prochain paiement */}
        {nextPay&&(
          <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <div className="text-[9px] font-bold opacity-80 mb-1">📅 PROCHAIN PAIEMENT</div>
              <div className="text-xl font-black">{nextPay.type} — {nextPay.period}</div>
              <div className="text-[10px] opacity-75 mt-1">Échéance : {nextPay.dueDate} · Solde : {money2(nextPay.balance)}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-black">{money(nextPay.due)}</div>
              <button onClick={()=>setShowForm(true)} className="mt-2 block text-[10px] font-bold bg-white text-blue-600 px-3 py-1.5 rounded-xl hover:bg-blue-50 cursor-pointer">→ Soumettre · DEMO</button>
            </div>
          </div>
        )}

        {/* Liste paiements */}
        <div className="space-y-3">
          {ALL_PAYMENTS.map(p=>{
            const sc = PAY_STATUS_CONF[p.status]!
            const decl = ALL_DECLARATIONS.find(d=>d.id===p.declId)
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sc.icon}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{p.type} — {p.period}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">{p.id}</div>
                    {p.ref&&<div className="text-[9px] font-mono text-green-600 dark:text-green-400">Réf: {p.ref}</div>}
                    {decl?.govRef&&<div className="text-[9px] font-mono text-blue-600 dark:text-blue-400">Réf. GOV: {decl.govRef}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{money2(p.due)}</div>
                    <div className="text-[9px] text-slate-400">Échéance: {p.dueDate}</div>
                  </div>
                </div>

                {/* Tableau dû/payé/solde */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    {l:'Montant dû',  v:money2(p.due),    c:'text-slate-800 dark:text-slate-200'},
                    {l:'Payé',        v:p.paid>0?money2(p.paid):'—', c:'text-green-600 dark:text-green-400'},
                    {l:'Solde',       v:money2(p.balance), c:p.balance>0?'text-red-500':'text-green-600 dark:text-green-400'},
                  ].map(r=>(
                    <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                      <div className={`text-sm font-black ${r.c}`}>{r.v}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">{r.l}</div>
                    </div>
                  ))}
                </div>

                {/* Détails paiement effectué */}
                {p.status==='PAID'&&(
                  <div className="bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/20 rounded-xl p-3 mb-3">
                    <div className="grid grid-cols-2 gap-x-4 text-[9px]">
                      <div><span className="text-slate-500">Méthode:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{p.method}</span></div>
                      <div><span className="text-slate-500">Date:</span> <span className="font-bold text-green-600 dark:text-green-400">{p.paidAt?fmtDate(p.paidAt):'—'}</span></div>
                    </div>
                    {p.notes&&<div className="text-[9px] text-slate-500 italic mt-1.5">{p.notes}</div>}
                  </div>
                )}
                {p.status==='UPCOMING'&&p.notes&&(
                  <div className="text-[9px] text-amber-600 dark:text-amber-400 italic mb-3">{p.notes}</div>
                )}

                {/* Pénalités */}
                {p.lateDays>0&&(
                  <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl p-3 mb-3">
                    <div className="text-[9px] font-bold text-red-600 dark:text-red-400">⚠️ Retard: {p.lateDays} jour(s) · Pénalité estimée: {money2(p.penaltyAmt)}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  {p.declId&&<Link href="/declarations" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100">📋 Déclaration liée</Link>}
                  <Link href="/obligations" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">📅 Obligation</Link>
                  <Link href="/audit" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-[9px] text-slate-400 text-center">{PILOT} · Paiements simulés · Aucun virement gouvernemental réel</div>
      </div>
    </AppShell>
  )
}
