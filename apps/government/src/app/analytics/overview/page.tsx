'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card, KpiCard } from '@/components/ui'
import {
  monthlyRevenue, dailyRevenue, platformAnalytics, taxAnalytics,
  complianceAnalytics, webhookAnalytics, reconciliationAnalytics,
  intelligenceInsights, formatCAD, formatNum, PLATFORM_COLORS_7
} from '@/data/analytics.mock'
import { controlCenterKpis } from '@/data/compliance.mock'
import { kpiData } from '@/data/mock'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { BarChart2, TrendingUp, Activity, AlertTriangle, Wifi, Scale, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const lastUpdated = new Date().toLocaleTimeString('fr-CA')

export default function AnalyticsOverviewPage() {
  const { tps, tvq, taxableRevenue } = controlCenterKpis
  const totalRevenue = monthlyRevenue[7].gross
  const totalPlatformRevenue = platformAnalytics.reduce((s, p) => s + p.gross, 0)

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analytics Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-qc-blue text-white">SIMULATION</span>
          </div>
          <p className="text-sm text-slate-500">Intelligence gouvernementale · Source : Universal Ledger · Agrégations temps réel</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <RefreshCw size={11} />
          <span>Mise à jour : {lastUpdated}</span>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[
          { href:'/analytics/revenue', label:'💰 Revenus' },
          { href:'/analytics/taxes', label:'📊 Taxes' },
          { href:'/analytics/platforms', label:'🔌 Plateformes' },
          { href:'/analytics/drivers', label:'🚗 Chauffeurs' },
          { href:'/analytics/taxi', label:'🚕 Taxi' },
          { href:'/analytics/delivery', label:'📦 Livraisons' },
          { href:'/analytics/compliance', label:'⚖️ Conformité' },
          { href:'/analytics/webhooks', label:'🌐 Webhooks' },
          { href:'/analytics/intelligence', label:'🧠 Intelligence' },
        ].map(n => (
          <Link key={n.href} href={n.href}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-qc-blue hover:text-qc-blue transition-all">
            {n.label}
          </Link>
        ))}
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Revenus bruts (Août)" value={formatCAD(totalRevenue, 0)} large icon={<TrendingUp size={16} />} color="blue" trend="up" trendValue="+4.9%" />
        <KpiCard label="Transactions (Août)" value={formatNum(2050)} icon={<Activity size={16} />} color="green" trend="up" trendValue="+8.1%" />
        <KpiCard label="TPS + TVQ perçues" value={formatCAD(tps + tvq, 0)} icon={<BarChart2 size={16} />} color="purple" sub="14.975%" />
        <KpiCard label="Taux réconciliation" value={`${reconciliationAnalytics.rate}%`} icon={<Scale size={16} />} color={reconciliationAnalytics.rate >= 95 ? 'green' : 'orange'} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Chauffeurs actifs" value={kpiData.drivers.active} color="blue" />
        <KpiCard label="Plateformes actives" value={7} color="green" />
        <KpiCard label="Dossiers ouverts" value={complianceAnalytics.openCases} icon={<AlertTriangle size={16} />} color="orange" />
        <KpiCard label="Erreurs webhook" value={webhookAnalytics.failed} icon={<Wifi size={16} />} color={webhookAnalytics.failed > 10 ? 'red' : 'orange'} />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Monthly revenue */}
        <Card className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Revenus mensuels 2026</div>
            <div className="text-[10px] text-slate-400">Source: Universal Ledger · Simulation</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#003DA5" stopOpacity={0.15}/><stop offset="95%" stopColor="#003DA5" stopOpacity={0}/></linearGradient>
                <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.12}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={v=>`${(v/1000).toFixed(0)}k$`} />
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Area type="monotone" dataKey="gross" name="Bruts" stroke="#003DA5" fill="url(#gG)" strokeWidth={2} />
              <Area type="monotone" dataKey="net" name="Nets" stroke="#22C55E" fill="url(#gN)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Platform revenue bar */}
        <Card className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Revenus par plateforme — Août 2026</div>
            <div className="text-[10px] text-slate-400">Source: Universal Ledger · SIMULATION</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformAnalytics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={v=>`${(v/1000).toFixed(0)}k$`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} width={70} />
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
              <Bar dataKey="gross" name="Revenus bruts" radius={[0,4,4,0]}>
                {platformAnalytics.map((p,i) => <Cell key={i} fill={PLATFORM_COLORS_7[p.provider]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tax + Webhook row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Tax monthly */}
        <Card className="lg:col-span-2 p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Taxes perçues — TPS + TVQ</div>
          <div className="text-[10px] text-slate-400 mb-3">Source: Tax Engine · SIMULATION</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={taxAnalytics.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={v=>`${v.toFixed(0)}$`} />
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="tps" name="TPS (5%)" fill="#003DA5" radius={[2,2,0,0]} stackId="tax" />
              <Bar dataKey="tvq" name="TVQ (9.975%)" fill="#7C3AED" radius={[2,2,0,0]} stackId="tax" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Webhook health pie */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Webhooks — Santé</div>
          <div className="text-[10px] text-slate-400 mb-2">Aujourd'hui · SIMULATION</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={[
                { name:'Traités', value:webhookAnalytics.processed, fill:'#22C55E' },
                { name:'Doublons', value:webhookAnalytics.duplicates, fill:'#F59E0B' },
                { name:'Échecs', value:webhookAnalytics.failed, fill:'#EF4444' },
              ]} dataKey="value" cx="50%" cy="50%" outerRadius={50} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {[['Traités','#22C55E',webhookAnalytics.processed],['Doublons','#F59E0B',webhookAnalytics.duplicates],['Échecs','#EF4444',webhookAnalytics.failed]].map(([l,c,v])=>(
              <div key={l as string} className="flex justify-between text-[10px]">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:c as string}}/><span className="text-slate-500">{l}</span></div>
                <span className="font-bold text-slate-700 dark:text-slate-200">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Intelligence insights preview */}
      <Card>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Government Intelligence — Insights</div>
            <div className="text-[10px] text-slate-400">Analytique explicable · Aucune décision automatique</div>
          </div>
          <Link href="/analytics/intelligence" className="text-xs text-qc-blue hover:underline">Tous les insights →</Link>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {intelligenceInsights.slice(0, 4).map(ins => (
            <div key={ins.id} className="px-4 py-3 flex items-start gap-4">
              <span className="text-xl shrink-0 mt-0.5">{ins.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{ins.title}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ins.sentiment==='positive'?'bg-green-100 text-green-700':ins.sentiment==='negative'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-600'}`}>
                    {ins.sentiment==='positive'?'✅':ins.sentiment==='negative'?'⚠':'ℹ'} {ins.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">{ins.description}</p>
                <div className="text-[10px] text-slate-400 mt-1">Source: {ins.source} · {ins.period}</div>
              </div>
              {ins.action !== 'Aucune action requise' && (
                <div className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg shrink-0 max-w-40 text-center">{ins.action}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
