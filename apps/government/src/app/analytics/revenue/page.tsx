'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { monthlyRevenue, dailyRevenue, hourlyData, paymentAnalytics, formatCAD, formatNum, PLATFORM_COLORS_7, platformAnalytics } from '@/data/analytics.mock'
import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, DollarSign, RefreshCw } from 'lucide-react'

type Period = '7d' | 'month' | 'quarter' | 'year'

export default function RevenueAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const data = period === '7d' ? dailyRevenue.slice(-7) : period === 'month' ? dailyRevenue : monthlyRevenue
  const xKey = period === 'year' || period === 'quarter' ? 'month' : 'day'

  const totalGross = data.reduce((s: number, d: any) => s + (d.gross || 0), 0)
  const totalNet = data.reduce((s: number, d: any) => s + (d.net || 0), 0)
  const totalTips = data.reduce((s: number, d: any) => s + (d.tips || 0), 0)
  const totalFees = data.reduce((s: number, d: any) => s + (d.fees || 0), 0)

  return (
    <AppShell>
      <PageHeader title="Revenue Analytics" subtitle="Source: Universal Ledger · SIMULATION · Toutes plateformes" />

      <div className="flex gap-1 mb-5 flex-wrap">
        {([['7d','7 jours'],['month','Août 2026'],['quarter','Q3 2026'],['year','2026']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${period === k ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto text-[10px] text-slate-400">
          <RefreshCw size={11} /> {new Date().toLocaleTimeString('fr-CA')}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Revenus bruts" value={formatCAD(totalGross, 0)} large icon={<DollarSign size={16} />} color="blue" trend="up" trendValue="+4.9%" />
        <KpiCard label="Revenus nets" value={formatCAD(totalNet, 0)} large icon={<TrendingUp size={16} />} color="green" />
        <KpiCard label="Pourboires" value={formatCAD(totalTips, 0)} icon={<DollarSign size={16} />} color="purple" />
        <KpiCard label="Frais plateformes" value={formatCAD(totalFees, 0)} color="orange" sub={`${Math.round(totalFees/totalGross*100)}% du brut`} />
      </div>

      <Card className="p-4 mb-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Évolution des revenus</div>
        <div className="text-[10px] text-slate-400 mb-3">Bruts · Nets · Pourboires · Source: Universal Ledger</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#003DA5" stopOpacity={0.15}/><stop offset="95%" stopColor="#003DA5" stopOpacity={0}/></linearGradient>
              <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.12}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={xKey} tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={(v:string)=>v.length>5?v.substring(0,5):v} />
            <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={(v:number)=>`${(v/1000).toFixed(0)}k$`} />
            <Tooltip formatter={(v:number)=>formatCAD(v)} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Area type="monotone" dataKey="gross" name="Bruts" stroke="#003DA5" fill="url(#gG)" strokeWidth={2} />
            <Area type="monotone" dataKey="net" name="Nets" stroke="#22C55E" fill="url(#gN)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="tips" name="Pourboires" stroke="#A855F7" fill="transparent" strokeWidth={1} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Distribution horaire</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize:9, fill:'#94a3b8' }} interval={3} />
              <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickFormatter={(v:number)=>`${(v/1000).toFixed(1)}k$`} />
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
              <Bar dataKey="revenue" fill="#003DA5" radius={[2,2,0,0]} name="Revenus" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Méthodes de paiement</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={paymentAnalytics} dataKey="gross" nameKey="method" cx="50%" cy="50%" outerRadius={50}>
                {paymentAnalytics.map((_,i)=><Cell key={i} fill={['#003DA5','#1A56C4','#3B82F6','#93C5FD'][i]} />)}
              </Pie>
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {paymentAnalytics.map((p,i)=>(
              <div key={p.method} className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:['#003DA5','#1A56C4','#3B82F6','#93C5FD'][i]}} />
                  <span className="text-slate-500">{p.method} ({p.pct}%)</span>
                </div>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatCAD(p.gross, 0)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Comparatif par plateforme — Août 2026</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Plateforme','Chauffeurs','Activités','Brut','Frais','Pourboires','Net','TPS+TVQ'].map(h=>(
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {platformAnalytics.map(p=>(
                <tr key={p.provider} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:PLATFORM_COLORS_7[p.provider]}} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">{p.drivers}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">{formatNum(p.activities)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{formatCAD(p.gross, 0)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-red-500">-{formatCAD(p.fees, 0)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-green-600">+{formatCAD(p.tips, 0)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs font-bold text-green-600">{formatCAD(p.net, 0)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-blue-600">{formatCAD(p.tps + p.tvq, 0)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200" colSpan={3}>TOTAL</td>
                <td className="px-3 py-2.5 font-mono text-xs font-bold text-qc-blue">{formatCAD(platformAnalytics.reduce((s,p)=>s+p.gross,0), 0)}</td>
                <td className="px-3 py-2.5 font-mono text-xs font-bold text-red-600">-{formatCAD(platformAnalytics.reduce((s,p)=>s+p.fees,0), 0)}</td>
                <td className="px-3 py-2.5 font-mono text-xs font-bold text-green-600">+{formatCAD(platformAnalytics.reduce((s,p)=>s+p.tips,0), 0)}</td>
                <td className="px-3 py-2.5 font-mono text-xs font-bold text-green-600">{formatCAD(platformAnalytics.reduce((s,p)=>s+p.net,0), 0)}</td>
                <td className="px-3 py-2.5 font-mono text-xs font-bold text-blue-600">{formatCAD(platformAnalytics.reduce((s,p)=>s+p.tps+p.tvq,0), 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
