'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDate, REVENUE, TAX_PERIODS, OBLIGATIONS, OBL_STATUS } from '@/lib/data'

const r2=(n:number)=>Math.round(n*100)/100
const TPS_RATE=0.05; const TVQ_RATE=0.09975

export default function FiscalPage() {
  const [period, setPeriod] = useState('Q3')

  const current = TAX_PERIODS.find(p=>p.period.includes(period)) ?? TAX_PERIODS[TAX_PERIODS.length-1]!
  const nextObl = OBLIGATIONS.find(o=>o.status==='UPCOMING')

  const PERIOD_STATUS: Record<string,{label:string;color:string;bg:string}> = {
    PAID:   {label:'Clôturée · Payée',color:'#059669',bg:'rgba(5,150,105,0.12)'},
    OPEN:   {label:'Période en cours', color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
    OVERDUE:{label:'En retard',        color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  }

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">TPS / TVQ</h1>
          <p className="text-sm text-slate-500 mt-1">Calculée · Collectée · Déclarée · Payée · Solde · Remboursable</p>
        </div>
        <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · ESTIMATION UNIQUEMENT · AUCUNE TRANSMISSION OFFICIELLE À REVENU QUÉBEC
        </div>

        {/* Sélection période */}
        <div className="flex gap-1.5">
          {['Q1','Q2','Q3'].map(q=>(
            <button key={q} onClick={()=>setPeriod(q)} className="px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:period===q?'#003DA5':'transparent',color:period===q?'white':'#64748B',borderColor:period===q?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {q} 2026
            </button>
          ))}
        </div>

        {/* Status période */}
        {current&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:`3px solid ${PERIOD_STATUS[current.status]?.color??'#003DA5'}`}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">{current.period}</div>
                <div className="text-sm text-slate-400">{fmtDate(current.start)} → {fmtDate(current.end)}</div>
              </div>
              <span className="text-sm px-2.5 py-1.5 rounded-full font-bold" style={{color:PERIOD_STATUS[current.status]?.color,background:PERIOD_STATUS[current.status]?.bg}}>
                {PERIOD_STATUS[current.status]?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* TPS */}
              <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4">
                <div className="text-sm font-black text-purple-700 dark:text-purple-400 mb-3">TPS — 5%</div>
                {[
                  {l:'Base taxable',    v:money(current.gross),              note:'Revenus bruts'},
                  {l:'Calculée (5%)',   v:money2(current.tpsCollected),      note:'= brut × 5%'},
                  {l:'Collectée',       v:money2(current.tpsCollected),      note:'Reçue des clients'},
                  {l:'CTI estimés',     v:`− ${money2(r2(current.tpsCollected*0.15))}`,note:'~15% réclamables'},
                  {l:'Déclarée',        v:current.tpsPaid>0?money2(current.tpsPaid):'En attente',note:'Soumise RQ'},
                  {l:'Payée',           v:current.tpsPaid>0?money2(current.tpsPaid):'—',           note:''},
                  {l:'Remboursable',    v:money2(r2(current.tpsRefund)),     note:'Crédits > collectée'},
                  {l:'SOLDE NET',       v:money2(r2(current.tpsCollected-current.tpsPaid-current.tpsRefund)), note:'',bold:true},
                ].map(r=>(
                  <div key={r.l} className={`flex justify-between py-1 border-b border-purple-100 dark:border-purple-500/15 last:border-0 ${r.bold?'mt-1 pt-2':''}` }>
                    <div>
                      <div className={`text-sm ${r.bold?'font-black text-purple-800 dark:text-purple-300':'text-slate-600 dark:text-slate-400'}`}>{r.l}</div>
                      {r.note&&<div className="text-xs text-slate-400 italic">{r.note}</div>}
                    </div>
                    <span className={`text-sm ${r.bold?'font-black text-purple-700 dark:text-purple-400':'font-semibold text-slate-800 dark:text-slate-200'}`}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* TVQ */}
              <div className="bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4">
                <div className="text-sm font-black text-indigo-700 dark:text-indigo-400 mb-3">TVQ — 9,975%</div>
                {[
                  {l:'Base taxable',     v:money(current.gross),              note:'Revenus bruts'},
                  {l:'Calculée (9.975%)',v:money2(current.tvqCollected),      note:'= brut × 9.975%'},
                  {l:'Collectée',        v:money2(current.tvqCollected),      note:'Reçue des clients'},
                  {l:'CTI estimés',      v:`− ${money2(r2(current.tvqCollected*0.15))}`,note:'~15% réclamables'},
                  {l:'Déclarée',         v:current.tvqPaid>0?money2(current.tvqPaid):'En attente',note:'Soumise RQ'},
                  {l:'Payée',            v:current.tvqPaid>0?money2(current.tvqPaid):'—',           note:''},
                  {l:'Remboursable',     v:money2(r2(current.tvqRefund)),     note:'Crédits > collectée'},
                  {l:'SOLDE NET',        v:money2(r2(current.tvqCollected-current.tvqPaid-current.tvqRefund)), note:'',bold:true},
                ].map(r=>(
                  <div key={r.l} className={`flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-500/15 last:border-0 ${r.bold?'mt-1 pt-2':''}`}>
                    <div>
                      <div className={`text-sm ${r.bold?'font-black text-indigo-800 dark:text-indigo-300':'text-slate-600 dark:text-slate-400'}`}>{r.l}</div>
                      {r.note&&<div className="text-xs text-slate-400 italic">{r.note}</div>}
                    </div>
                    <span className={`text-sm ${r.bold?'font-black text-indigo-700 dark:text-indigo-400':'font-semibold text-slate-800 dark:text-slate-200'}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total à remettre */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Total estimé à remettre — {current.period}</div>
                  <div className="text-sm text-slate-400 mt-0.5">TPS nette + TVQ nette · ESTIMATION PILOTE</div>
                </div>
                <div className="text-xl font-black text-red-600 dark:text-red-400">
                  {money2(r2((current.tpsCollected-current.tpsPaid)+(current.tvqCollected-current.tvqPaid)))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historique des périodes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Historique des périodes</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Période','Revenus','TPS collectée','TVQ collectée','TPS payée','TVQ payée','Statut'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-sm font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TAX_PERIODS.map(tp=>(
                  <tr key={tp.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">{tp.period}</td>
                    <td className="px-4 py-2.5 font-bold text-green-600 dark:text-green-400">{money(tp.gross)}</td>
                    <td className="px-4 py-2.5 text-purple-600 dark:text-purple-400">{money2(tp.tpsCollected)}</td>
                    <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400">{money2(tp.tvqCollected)}</td>
                    <td className="px-4 py-2.5 text-sm">{tp.tpsPaid>0?money2(tp.tpsPaid):<span className="text-amber-500">À payer</span>}</td>
                    <td className="px-4 py-2.5 text-sm">{tp.tvqPaid>0?money2(tp.tvqPaid):<span className="text-amber-500">À payer</span>}</td>
                    <td className="px-4 py-2.5"><span className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${tp.status==='PAID'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':tp.status==='OPEN'?'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10':'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>{tp.status==='PAID'?'Clôturée':tp.status==='OPEN'?'En cours':'En retard'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prochaine obligation */}
        {nextObl&&(
          <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-0.5">📅 Prochaine obligation</div>
              <div className="text-sm font-black text-slate-800 dark:text-white">{nextObl.type} — {nextObl.period} · {money2(nextObl.amount)}</div>
              <div className="text-sm text-slate-400">Échéance: {nextObl.due}</div>
            </div>
            <Link href="/obligations" className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shrink-0">→ Obligations</Link>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="text-sm text-slate-500 leading-relaxed">
            📋 <span className="font-bold">Information importante</span> : Les montants affichés sont des estimations calculées automatiquement à des fins de démonstration pilote. Les taux de remboursement et crédits de taxe sur les intrants (CTI) réels doivent être calculés avec un comptable certifié selon votre situation spécifique. Aucune déclaration n'est transmise via cette interface. Toujours vérifier avec un professionnel avant toute déclaration officielle.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
