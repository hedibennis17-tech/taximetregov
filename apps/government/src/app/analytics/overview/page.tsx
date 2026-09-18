'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { PILOT, money, moneyK, pct, MONTHLY_REVENUE, TOTAL_BRUT, TOTAL_TPS, TOTAL_TVQ, TOTAL_TAX, DRIVERS_MONTHLY, COMPLIANCE_STATS, INTELLIGENCE, TOP_PROVIDERS, TOP_ZONES } from '@/lib/analytics-data'

const NAV = [
  {href:'/analytics/overview',    l:'📊 Vue globale',  active:true},
  {href:'/analytics/revenue',     l:'💰 Revenus',      active:false},
  {href:'/analytics/taxes',       l:'📋 Taxes',        active:false},
  {href:'/analytics/taxi',        l:'🚕 Taxi',         active:false},
  {href:'/analytics/delivery',    l:'📦 Livraisons',   active:false},
  {href:'/analytics/compliance',  l:'⚖️ Conformité',   active:false},
  {href:'/analytics/intelligence',l:'🧠 Intelligence', active:false},
  {href:'/analytics/drivers',     l:'🚗 Chauffeurs',   active:false},
]

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full" style={{ width: `${(value/max)*100}%`, background: color }}/>
    </div>
  )
}

export default function AnalyticsOverviewPage() {
  const maxBrut = Math.max(...MONTHLY_REVENUE.map(m => m.brut))
  const lastMonth = MONTHLY_REVENUE[MONTHLY_REVENUE.length-1]!
  const prevMonth = MONTHLY_REVENUE[MONTHLY_REVENUE.length-2]!
  const growth = ((lastMonth.brut - prevMonth.brut) / prevMonth.brut * 100).toFixed(1)

  return (
    <AppShell>
      {/* Header Analytics */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytics Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Province Québec · Jan–Sep 2026 · ~9 847 chauffeurs</p>
          </div>
          <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full">{PILOT}</div>
        </div>
        {/* Tabs nav */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{
              background: n.active ? '#003DA5' : 'transparent',
              color: n.active ? 'white' : '#64748B',
              borderColor: n.active ? '#003DA5' : 'rgba(148,163,184,0.30)',
            }}>{n.l}</Link>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        {/* KPI principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'Revenus bruts (9M)', v: moneyK(TOTAL_BRUT), sub: `+${growth}% vs mois préc.`, c: '#003DA5', bg: '#EEF3FB', icon: '💰', trend: 'up' },
            { l: 'TPS + TVQ (9M)',     v: moneyK(TOTAL_TAX),  sub: `TPS ${moneyK(TOTAL_TPS)} · TVQ ${moneyK(TOTAL_TVQ)}`, c: '#6B21A8', bg: '#F5F3FF', icon: '🧾', trend: 'up' },
            { l: 'Chauffeurs actifs',  v: '9 847',             sub: '+162 en sept 2026', c: '#059669', bg: '#ECFDF5', icon: '👥', trend: 'up' },
            { l: 'Conformité',         v: `${COMPLIANCE_STATS.complianceRate}%`, sub: `${COMPLIANCE_STATS.fullyCompliant} dossiers conformes`, c: '#059669', bg: '#ECFDF5', icon: '✅', trend: 'up' },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{s.icon}</div>
                {s.trend === 'up'
                  ? <TrendingUp size={14} className="text-green-500"/>
                  : <TrendingDown size={14} className="text-red-500"/>}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{s.l}</div>
              <div className="text-[8px] font-semibold mt-1" style={{color:s.c}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Graphique revenus mensuels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">Revenus bruts mensuels</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Province QC · Jan–Sep 2026</div>
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-white">{moneyK(TOTAL_BRUT)}</div>
          </div>
          <div className="space-y-2">
            {MONTHLY_REVENUE.map((m, i) => {
              const prev = i > 0 ? MONTHLY_REVENUE[i-1]! : null
              const g = prev ? ((m.brut - prev.brut) / prev.brut * 100).toFixed(1) : null
              return (
                <div key={m.month}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">{m.month}</div>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                      {/* Taxi */}
                      <div className="absolute top-0 left-0 h-full rounded-l-lg" style={{width:`${(m.taxi/m.brut)*100}%`,background:'#003DA5'}}/>
                      {/* Rideshare */}
                      <div className="absolute top-0 h-full" style={{left:`${(m.taxi/m.brut)*100}%`,width:`${(m.rideshare/m.brut)*100}%`,background:'#7C3AED'}}/>
                      {/* Delivery */}
                      <div className="absolute top-0 h-full rounded-r-lg" style={{left:`${((m.taxi+m.rideshare)/m.brut)*100}%`,width:`${(m.delivery/m.brut)*100}%`,background:'#059669'}}/>
                    </div>
                    <div className="w-20 text-[10px] font-bold text-slate-800 dark:text-slate-200 text-right shrink-0">{moneyK(m.brut)}</div>
                    {g && <div className={`w-12 text-[9px] font-bold shrink-0 text-right ${parseFloat(g)>=0?'text-green-600 dark:text-green-400':'text-red-500'}`}>{parseFloat(g)>=0?'+':''}{g}%</div>}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Légende */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[{c:'#003DA5',l:'Taxi 🚕'},{c:'#7C3AED',l:'Rideshare 🚗'},{c:'#059669',l:'Livraison 📦'}].map(l=>(
              <div key={l.l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{background:l.c}}/>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{l.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid: fournisseurs + zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fournisseurs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Part de marché par fournisseur</div>
            {TOP_PROVIDERS.map(p => (
              <div key={p.name} className="mb-3">
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{moneyK(p.brut)}</span>
                    <span className="text-[9px] font-bold text-slate-400">{p.pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${p.pct}%`,background:p.color}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Zones */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Top zones géographiques</div>
            {TOP_ZONES.map((z, i) => (
              <div key={z.zone} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{background:'#003DA5'}}>{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{z.zone}</div>
                  <div className="text-[9px] text-slate-400">{z.drivers.toLocaleString('fr-CA')} chauffeurs</div>
                  <MiniBar value={z.pct} max={15} color="#003DA5"/>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">{moneyK(z.brut)}</div>
                  <div className="text-[9px] text-slate-400">{z.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence rapide */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">🧠 Indicateurs clés</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {l:'Rev. moy./chauffeur', v:moneyK(INTELLIGENCE.avgRevenuePerDriver), icon:'👤'},
              {l:'Rev. moy./jour',      v:moneyK(INTELLIGENCE.avgRevenuePerDay),    icon:'📅'},
              {l:'Taux pourboires',     v:`${INTELLIGENCE.tipsRate}%`,              icon:'💝'},
              {l:'Croissance annuelle', v:`+${INTELLIGENCE.growthRate}%`,           icon:'📈'},
              {l:'Heure de pointe',     v:INTELLIGENCE.peakHour,                    icon:'⏰'},
              {l:'Jour de pointe',      v:INTELLIGENCE.peakDay,                     icon:'📆'},
              {l:'Frais plateformes',   v:`${INTELLIGENCE.feeRate}%`,              icon:'💳'},
              {l:'Conformité taxe',     v:`${INTELLIGENCE.taxComplianceRate}%`,    icon:'🧾'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-sm font-black text-slate-800 dark:text-white">{s.v}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
