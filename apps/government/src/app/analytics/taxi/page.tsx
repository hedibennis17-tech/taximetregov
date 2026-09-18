'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, TAXI_MONTHLY } from '@/lib/analytics-data'
const NAV=[{href:'/analytics/overview',l:'📊 Vue globale',active:false},{href:'/analytics/revenue',l:'💰 Revenus',active:false},{href:'/analytics/taxes',l:'📋 Taxes',active:false},{href:'/analytics/taxi',l:'🚕 Taxi',active:true},{href:'/analytics/delivery',l:'📦 Livraisons',active:false},{href:'/analytics/compliance',l:'⚖️ Conformité',active:false},{href:'/analytics/intelligence',l:'🧠 Intelligence',active:false},{href:'/analytics/drivers',l:'🚗 Chauffeurs',active:false}]
const totalCourses = TAXI_MONTHLY.reduce((s,m)=>s+m.courses,0)
const totalBrut = TAXI_MONTHLY.reduce((s,m)=>s+m.brut,0)
const totalKm = TAXI_MONTHLY.reduce((s,m)=>s+m.km,0)
const maxCourses = Math.max(...TAXI_MONTHLY.map(m=>m.courses))
export default function TaxiPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytique Taxi</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Courses taxi QC · SAAQ/CTQ (simulation) · Jan–Sep 2026</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">{NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}</div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Courses (9M)',       v:totalCourses.toLocaleString('fr-CA'), icon:'🚕', c:'#003DA5'},
            {l:'Revenus bruts (9M)', v:money(totalBrut),                    icon:'💰', c:'#059669'},
            {l:'Km parcourus (9M)', v:`${(totalKm/1000000).toFixed(1)}M km`, icon:'🛣️', c:'#7C3AED'},
            {l:'Rev. moy./course',  v:`${(totalBrut/totalCourses).toFixed(2)}$`, icon:'📊', c:'#003DA5'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Volume de courses par mois</div>
          {TAXI_MONTHLY.map((m,i)=>{
            const prev = i>0?TAXI_MONTHLY[i-1]:null
            const g = prev?((m.courses-prev.courses)/prev.courses*100).toFixed(1):null
            return (
              <div key={m.month} className="flex items-center gap-3 mb-2">
                <div className="w-8 text-[10px] font-bold text-slate-500 shrink-0">{m.month}</div>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div className="h-full rounded-lg" style={{width:`${(m.courses/maxCourses)*100}%`,background:'#003DA5'}}/>
                </div>
                <div className="w-24 text-[10px] font-bold text-slate-800 dark:text-white text-right shrink-0">{m.courses.toLocaleString('fr-CA')}</div>
                {g&&<div className={`w-10 text-[9px] font-bold shrink-0 ${parseFloat(g)>=0?'text-green-600 dark:text-green-400':'text-red-500'}`}>{parseFloat(g)>=0?'+':''}{g}%</div>}
              </div>
            )
          })}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Tableau mensuel — Taxi QC</div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800">{['Mois','Courses','Revenus bruts','Moy./course','Km totaux'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {TAXI_MONTHLY.map(m=>(
                <tr key={m.month} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{m.month} 2026</td>
                  <td className="px-4 py-2.5 font-black text-blue-600 dark:text-blue-400">{m.courses.toLocaleString('fr-CA')}</td>
                  <td className="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">{money(m.brut)}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.moy}$</td>
                  <td className="px-4 py-2.5 text-slate-500">{(m.km/1000).toFixed(0)}k km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
