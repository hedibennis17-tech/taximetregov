'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, moneyK, INTELLIGENCE, TOP_ZONES, TOP_PROVIDERS, MONTHLY_REVENUE } from '@/lib/analytics-data'
const NAV=[{href:'/analytics/overview',l:'📊 Vue globale',active:false},{href:'/analytics/revenue',l:'💰 Revenus',active:false},{href:'/analytics/taxes',l:'📋 Taxes',active:false},{href:'/analytics/taxi',l:'🚕 Taxi',active:false},{href:'/analytics/delivery',l:'📦 Livraisons',active:false},{href:'/analytics/compliance',l:'⚖️ Conformité',active:false},{href:'/analytics/intelligence',l:'🧠 Intelligence',active:true},{href:'/analytics/drivers',l:'🚗 Chauffeurs',active:false}]
export default function IntelligencePage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Intelligence analytique</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Indicateurs avancés · Tendances · Insights gouvernementaux</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">{NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}</div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Insights principaux */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {icon:'💰',l:'Rev. moy. par chauffeur (9M)', v:money(INTELLIGENCE.avgRevenuePerDriver),  c:'#003DA5'},
            {icon:'📅',l:'Rev. moy. par jour/chauffeur', v:`${INTELLIGENCE.avgRevenuePerDay.toFixed(0)}$`,c:'#003DA5'},
            {icon:'📈',l:'Croissance annuelle estimée',   v:`+${INTELLIGENCE.growthRate}%`,           c:'#059669'},
            {icon:'💝',l:'Taux de pourboires',            v:`${INTELLIGENCE.tipsRate}%`,              c:'#B45309'},
            {icon:'🛣️',l:'Revenu par km (Taxi)',          v:`${INTELLIGENCE.revenuePerKm}$`,          c:'#7C3AED'},
            {icon:'💳',l:'Frais plateforme moyen',        v:`${INTELLIGENCE.feeRate}%`,               c:'#DC2626'},
            {icon:'⏰',l:'Heure de pointe',               v:INTELLIGENCE.peakHour,                    c:'#059669'},
            {icon:'📆',l:'Jour de pointe',                v:INTELLIGENCE.peakDay,                     c:'#059669'},
            {icon:'📍',l:'Zone principale',               v:INTELLIGENCE.topZone,                     c:'#003DA5'},
            {icon:'🧾',l:'Conformité taxe',               v:`${INTELLIGENCE.taxComplianceRate}%`,     c:'#059669'},
            {icon:'⚠️',l:'Taux anomalies',                v:`${INTELLIGENCE.anomalyRate}%`,           c:'#B45309'},
            {icon:'🔄',l:'Taux doublons bloqués',         v:`${INTELLIGENCE.duplicateRate}%`,         c:'#7C3AED'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0 bg-slate-50 dark:bg-slate-800">{s.icon}</div>
              <div>
                <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{s.l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top zones */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">📍 Top zones de revenus — Province QC</div>
          {TOP_ZONES.map((z,i)=>(
            <div key={z.zone} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{background:'#003DA5'}}>{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{z.zone}</div>
                <div className="text-[9px] text-slate-400">{z.drivers.toLocaleString('fr-CA')} chauffeurs · {z.pct}% du marché</div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${z.pct*5}%`,background:'#003DA5'}}/>
                </div>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white shrink-0">{moneyK(z.brut)}</div>
            </div>
          ))}
        </div>

        {/* Tendance croissance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">📈 Tendance revenus — croissance mensuelle</div>
          <div className="flex items-end gap-2 h-28">
            {MONTHLY_REVENUE.map((m,i)=>{
              const max = Math.max(...MONTHLY_REVENUE.map(x=>x.brut))
              const h = (m.brut/max)*100
              const prev = i>0?MONTHLY_REVENUE[i-1]:null
              const g = prev?((m.brut-prev.brut)/prev.brut*100):0
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[8px] font-bold" style={{color:g>=0?'#059669':'#DC2626'}}>{i>0?(g>=0?'+':'')+g.toFixed(0)+'%':''}</div>
                  <div className="w-full rounded-t-lg" style={{height:`${h}%`,background:'#003DA5',minHeight:4}}/>
                  <div className="text-[8px] text-slate-400">{m.month}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Note gouvernementale */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">🏛️ Note analytique gouvernementale</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Ces indicateurs d'intelligence sont générés à partir des données synthétiques du pilote TAXIMETER.GOV. Ils démontrent la capacité du système à produire des analyses provinciales consolidées sur les revenus, la conformité fiscale et la dynamique du marché du transport et de la livraison au Québec. Aucune donnée réelle de contribuable n'est impliquée dans cette démonstration.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
