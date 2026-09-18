'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, moneyK, MONTHLY_REVENUE, TOTAL_BRUT, TOTAL_TAXI, TOTAL_RIDESHARE, TOTAL_DELIVERY, TOP_PROVIDERS } from '@/lib/analytics-data'

const NAV = [
  {href:'/analytics/overview',l:'📊 Vue globale',active:false},
  {href:'/analytics/revenue',l:'💰 Revenus',active:true},
  {href:'/analytics/taxes',l:'📋 Taxes',active:false},
  {href:'/analytics/taxi',l:'🚕 Taxi',active:false},
  {href:'/analytics/delivery',l:'📦 Livraisons',active:false},
  {href:'/analytics/compliance',l:'⚖️ Conformité',active:false},
  {href:'/analytics/intelligence',l:'🧠 Intelligence',active:false},
  {href:'/analytics/drivers',l:'🚗 Chauffeurs',active:false},
]

export default function RevenuePage() {
  const maxBrut = Math.max(...MONTHLY_REVENUE.map(m=>m.brut))
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Revenus</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Province QC · Revenue Ledger · Jan–Sep 2026</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Total brut (9M)', v:money(TOTAL_BRUT),     c:'#003DA5', icon:'💰'},
            {l:'Taxi',           v:money(TOTAL_TAXI),      c:'#003DA5', icon:'🚕'},
            {l:'Rideshare',      v:money(TOTAL_RIDESHARE), c:'#7C3AED', icon:'🚗'},
            {l:'Livraison',      v:money(TOTAL_DELIVERY),  c:'#059669', icon:'📦'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tableau mensuel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="text-sm font-bold text-slate-800 dark:text-white">Détail mensuel — Province QC</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Mois','Revenus bruts','Taxi','Rideshare','Livraison','Croissance'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY_REVENUE.map((m,i)=>{
                  const prev = i>0?MONTHLY_REVENUE[i-1]:null
                  const g = prev?((m.brut-prev.brut)/prev.brut*100).toFixed(1):null
                  return (
                    <tr key={m.month} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{m.month} 2026</td>
                      <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{money(m.brut)}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{money(m.taxi)}</td>
                      <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">{money(m.rideshare)}</td>
                      <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{money(m.delivery)}</td>
                      <td className="px-4 py-3">
                        {g&&<span className={`text-[10px] font-bold ${parseFloat(g)>=0?'text-green-600 dark:text-green-400':'text-red-500'}`}>{parseFloat(g)>=0?'+':''}{g}%</span>}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-blue-50 dark:bg-blue-500/10 border-t-2 border-blue-200 dark:border-blue-500/30">
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">TOTAL 9M</td>
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">{money(TOTAL_BRUT)}</td>
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">{money(TOTAL_TAXI)}</td>
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">{money(TOTAL_RIDESHARE)}</td>
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">{money(TOTAL_DELIVERY)}</td>
                  <td className="px-4 py-3 font-black text-green-600 dark:text-green-400">+{((MONTHLY_REVENUE[8]!.brut-MONTHLY_REVENUE[0]!.brut)/MONTHLY_REVENUE[0]!.brut*100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Part par fournisseur */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Revenus par fournisseur (9M)</div>
          {TOP_PROVIDERS.map(p=>(
            <div key={p.name} className="flex items-center gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-xl shrink-0">{p.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{money(p.brut)}</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${p.pct}%`,background:p.color}}/>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">{p.pct}% du marché</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
