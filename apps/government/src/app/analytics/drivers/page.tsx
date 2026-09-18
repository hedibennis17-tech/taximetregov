'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, DRIVERS_MONTHLY } from '@/lib/analytics-data'
const NAV=[{href:'/analytics/overview',l:'📊 Vue globale',active:false},{href:'/analytics/revenue',l:'💰 Revenus',active:false},{href:'/analytics/taxes',l:'📋 Taxes',active:false},{href:'/analytics/taxi',l:'🚕 Taxi',active:false},{href:'/analytics/delivery',l:'📦 Livraisons',active:false},{href:'/analytics/compliance',l:'⚖️ Conformité',active:false},{href:'/analytics/intelligence',l:'🧠 Intelligence',active:false},{href:'/analytics/drivers',l:'🚗 Chauffeurs',active:true}]
const last = DRIVERS_MONTHLY[DRIVERS_MONTHLY.length-1]!
const first = DRIVERS_MONTHLY[0]!
const totalNew = DRIVERS_MONTHLY.reduce((s,m)=>s+m.new,0)
const totalChurn = DRIVERS_MONTHLY.reduce((s,m)=>s+m.churned,0)
export default function DriversAnalyticsPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytique Chauffeurs</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Inscriptions · Activité · Rétention · Province QC</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">{NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}</div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Chauffeurs total (Sep)',v:last.total.toLocaleString('fr-CA'),   icon:'👥', c:'#003DA5'},
            {l:'Actifs (Sep)',          v:last.active.toLocaleString('fr-CA'),  icon:'✅', c:'#059669'},
            {l:'Nouveaux (9M)',         v:totalNew.toLocaleString('fr-CA'),     icon:'🆕', c:'#7C3AED'},
            {l:'Taux rétention',       v:`${((1-totalChurn/(totalNew+first.total))*100).toFixed(1)}%`, icon:'📊', c:'#059669'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Évolution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Évolution du parc de chauffeurs</div>
          {DRIVERS_MONTHLY.map(m=>(
            <div key={m.month} className="flex items-center gap-3 mb-2">
              <div className="w-8 text-[10px] font-bold text-slate-500 shrink-0">{m.month}</div>
              <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                <div className="absolute h-full rounded-lg bg-blue-200 dark:bg-blue-900" style={{width:`${(m.total/last.total)*100}%`}}/>
                <div className="absolute h-full rounded-lg bg-blue-600" style={{width:`${(m.active/last.total)*100}%`}}/>
              </div>
              <div className="w-20 text-[10px] font-bold text-slate-800 dark:text-white text-right shrink-0">{m.total.toLocaleString('fr-CA')}</div>
              <div className="w-24 text-[9px] text-slate-400 shrink-0">
                <span className="text-green-500">+{m.new}</span> / <span className="text-red-400">-{m.churned}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[{c:'#2563EB',l:'Actifs'},{c:'#BFDBFE',l:'Total inscrit'}].map(l=>(
              <div key={l.l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm dark:bg-blue-900" style={{background:l.c}}/><span className="text-[10px] text-slate-400">{l.l}</span></div>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Détail mensuel — Chauffeurs</div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800">{['Mois','Total','Actifs','Nouveaux','Départs','Taux actif'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {DRIVERS_MONTHLY.map(m=>(
                <tr key={m.month} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{m.month} 2026</td>
                  <td className="px-4 py-2.5 font-black text-blue-600 dark:text-blue-400">{m.total.toLocaleString('fr-CA')}</td>
                  <td className="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">{m.active.toLocaleString('fr-CA')}</td>
                  <td className="px-4 py-2.5 font-semibold text-purple-600 dark:text-purple-400">+{m.new}</td>
                  <td className="px-4 py-2.5 font-semibold text-red-500">-{m.churned}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">{((m.active/m.total)*100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
