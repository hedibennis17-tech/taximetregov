'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDate, OBLIGATIONS, OBL_STATUS, TAX_PERIODS } from '@/lib/data'

const WORKFLOW = ['ACTIVITÉS','→','TRANSACTIONS','→','REVENUE LEDGER','→','CALCUL TPS/TVQ','→','OBLIGATION CRÉÉE','→','DÉCLARATION','→','PAIEMENT','→','CONFIRMÉ GOV','→','AUDIT']

export default function ObligationsPage() {
  const totalDue  = OBLIGATIONS.filter(o=>o.status!=='PAID').reduce((s,o)=>s+o.amount,0)
  const totalPaid = OBLIGATIONS.filter(o=>o.status==='PAID').reduce((s,o)=>s+o.amount,0)
  const nextObl   = OBLIGATIONS.find(o=>o.status==='UPCOMING')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Obligations fiscales</h1>
          <p className="text-sm text-slate-500 mt-1">TPS/TVQ · Échéances · Statuts · Historique · Prochains paiements</p>
        </div>
        <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · ESTIMATION · AUCUNE TRANSMISSION OFFICIELLE À REVENU QUÉBEC
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase mb-2">Cycle obligation fiscale</div>
          <div className="flex items-center gap-1 flex-wrap text-sm font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Total payé (YTD)',    v:money(totalPaid),  c:'#059669',bg:'bg-green-50 dark:bg-green-500/8',   icon:'✅'},
            {l:'À payer (prochain)',  v:money(totalDue),   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8',    icon:'📅'},
            {l:'Obligations totales', v:OBLIGATIONS.length,c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8',icon:'📋'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent shadow-sm`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Prochaine obligation — bannière */}
        {nextObl&&(
          <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold opacity-80 mb-1">📅 PROCHAINE OBLIGATION</div>
                <div className="text-xl font-black">{nextObl.type} — {nextObl.period}</div>
                <div className="text-sm opacity-90 mt-0.5">Montant estimé : {money2(nextObl.amount)}</div>
                <div className="text-sm opacity-75 mt-1">Échéance : {nextObl.due} · PILOTE</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-black">{money(nextObl.amount)}</div>
                <Link href="/declarations" className="mt-2 block text-sm font-bold bg-white text-blue-600 px-3 py-1.5 rounded-xl hover:bg-blue-50 text-center">→ Préparer déclaration</Link>
              </div>
            </div>
          </div>
        )}

        {/* Liste obligations */}
        <div className="space-y-3">
          {OBLIGATIONS.map(o=>{
            const sc = OBL_STATUS[o.status] ?? {label:o.status,color:'#64748B',bg:'rgba(100,116,139,0.10)'}
            const tp = TAX_PERIODS.find(p=>p.period===o.period)
            return (
              <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{o.type}</span>
                      <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-500">{o.period}</div>
                    <div className="text-sm font-mono text-slate-400 mt-0.5">{o.id}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{money(o.amount)}</div>
                    <div className="text-sm text-slate-400">Échéance: {o.due}</div>
                    {o.status==='PAID'&&o.paidAt&&<div className="text-sm font-bold text-green-600 dark:text-green-400">✓ Payé le {o.paidAt}</div>}
                  </div>
                </div>

                {/* Décomposition TPS/TVQ si données dispo */}
                {tp&&(
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3">
                      <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-1">TPS (5%)</div>
                      <div className="text-sm font-black text-purple-700 dark:text-purple-300">{money2(tp.tpsCollected)}</div>
                      <div className="text-sm text-slate-400">sur {money(tp.gross)} bruts</div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3">
                      <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">TVQ (9,975%)</div>
                      <div className="text-sm font-black text-indigo-700 dark:text-indigo-300">{money2(tp.tvqCollected)}</div>
                      <div className="text-sm text-slate-400">sur {money(tp.gross)} bruts</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {o.status==='UPCOMING'&&(
                    <>
                      <Link href="/declarations" className="px-3 py-1.5 rounded-xl text-sm font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100">📋 Préparer déclaration</Link>
                      <Link href="/fiscal" className="px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🧾 Voir fiscal</Link>
                    </>
                  )}
                  {o.status==='PAID'&&(
                    <Link href="/payments" className="px-3 py-1.5 rounded-xl text-sm font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-100">✅ Voir paiement</Link>
                  )}
                  <Link href="/audit" className="px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="text-sm text-slate-500 leading-relaxed">
            Les montants affichés sont calculés automatiquement à titre d'estimation. Les déclarations officielles doivent être préparées et soumises via les canaux gouvernementaux autorisés. Consultez un comptable certifié pour toute question fiscale.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
