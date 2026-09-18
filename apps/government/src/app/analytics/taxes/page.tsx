'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, moneyK, MONTHLY_TAX, TOTAL_TPS, TOTAL_TVQ, TOTAL_TAX, TOTAL_BRUT, TPS_RATE, TVQ_RATE } from '@/lib/analytics-data'
const NAV=[{href:'/analytics/overview',l:'📊 Vue globale',active:false},{href:'/analytics/revenue',l:'💰 Revenus',active:false},{href:'/analytics/taxes',l:'📋 Taxes',active:true},{href:'/analytics/taxi',l:'🚕 Taxi',active:false},{href:'/analytics/delivery',l:'📦 Livraisons',active:false},{href:'/analytics/compliance',l:'⚖️ Conformité',active:false},{href:'/analytics/intelligence',l:'🧠 Intelligence',active:false},{href:'/analytics/drivers',l:'🚗 Chauffeurs',active:false}]
const maxTax = Math.max(...MONTHLY_TAX.map(m=>m.total))
export default function TaxesPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Taxes TPS/TVQ</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Moteur fiscal provincial · Jan–Sep 2026</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">{NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}</div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'TPS collectée (9M)',    v:money(TOTAL_TPS),  rate:`${(TPS_RATE*100).toFixed(0)}%`, c:'#7C3AED', bg:'#F5F3FF', icon:'🧾'},
            {l:'TVQ collectée (9M)',    v:money(TOTAL_TVQ),  rate:`${(TVQ_RATE*100).toFixed(3)}%`,c:'#7C3AED', bg:'#F5F3FF', icon:'🧾'},
            {l:'Total TPS+TVQ (9M)',    v:money(TOTAL_TAX),  rate:`${((TOTAL_TAX/TOTAL_BRUT)*100).toFixed(2)}% du brut`, c:'#003DA5', bg:'#EEF3FB', icon:'🏛️'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[10px] font-bold mt-1" style={{color:s.c}}>Taux: {s.rate}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Barre mensuelle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">TPS + TVQ par mois</div>
          {MONTHLY_TAX.map(m=>(
            <div key={m.month} className="flex items-center gap-3 mb-2">
              <div className="w-8 text-[10px] font-bold text-slate-500 shrink-0">{m.month}</div>
              <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                <div className="h-full" style={{width:`${(m.tps/m.total)*100}%`,background:'#7C3AED'}}/>
                <div className="h-full" style={{width:`${(m.tvq/m.total)*100}%`,background:'#A855F7'}}/>
              </div>
              <div className="w-24 text-[10px] font-bold text-slate-800 dark:text-white text-right shrink-0">{money(m.total)}</div>
            </div>
          ))}
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[{c:'#7C3AED',l:'TPS (5%)'},{c:'#A855F7',l:'TVQ (9,975%)'}].map(l=>(
              <div key={l.l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{background:l.c}}/><span className="text-[10px] text-slate-400">{l.l}</span></div>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Détail mensuel TPS/TVQ</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">{['Mois','TPS (5%)','TVQ (9,975%)','Total','% du brut'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody>
                {MONTHLY_TAX.map((m,i)=>(
                  <tr key={m.month} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{m.month} 2026</td>
                    <td className="px-4 py-2.5 font-semibold text-purple-600 dark:text-purple-400">{money(m.tps)}</td>
                    <td className="px-4 py-2.5 font-semibold text-purple-700 dark:text-purple-300">{money(m.tvq)}</td>
                    <td className="px-4 py-2.5 font-black text-slate-900 dark:text-white">{money(m.total)}</td>
                    <td className="px-4 py-2.5 text-[10px] font-bold text-slate-400">14,975%</td>
                  </tr>
                ))}
                <tr className="bg-purple-50 dark:bg-purple-500/10 border-t-2 border-purple-200 dark:border-purple-500/30">
                  <td className="px-4 py-3 font-black text-purple-700 dark:text-purple-400">TOTAL 9M</td>
                  <td className="px-4 py-3 font-black text-purple-700 dark:text-purple-400">{money(TOTAL_TPS)}</td>
                  <td className="px-4 py-3 font-black text-purple-700 dark:text-purple-400">{money(TOTAL_TVQ)}</td>
                  <td className="px-4 py-3 font-black text-purple-700 dark:text-purple-400">{money(TOTAL_TAX)}</td>
                  <td className="px-4 py-3 font-black text-purple-500">14,975%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
