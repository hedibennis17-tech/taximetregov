'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { revenueByDay, revenueByPlatform, kpiData, PLATFORM_COLORS } from '@/data/mock'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { DollarSign, TrendingUp, Percent } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

export default function RevenueAnalyticsPage() {
  const { revenue, taxes } = kpiData

  const breakdownData = revenueByDay.map(d => ({
    ...d,
    tips: Math.round(d.gross * 0.05),
    fees: Math.round(d.gross * 0.25),
    tax: Math.round(d.gross * 0.14975),
  }))

  return (
    <AppShell>
      <PageHeader title="Analytique des revenus" subtitle="Tableau de bord fiscal — Août 2026 · Pilote Québec" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Revenus bruts" value={fmt(revenue.grossMonthly)} icon={<DollarSign size={16} />} color="blue" large trend="up" trendValue="+6.2%" />
        <KpiCard label="Revenus nets" value={fmt(revenue.netMonthly)} icon={<TrendingUp size={16} />} color="green" large />
        <KpiCard label="TPS perçue" value={fmt(taxes.tpsCollected)} icon={<Percent size={16} />} color="blue" sub="5.0%" />
        <KpiCard label="TVQ perçue" value={fmt(taxes.tvqCollected)} icon={<Percent size={16} />} color="purple" sub="9.975%" />
      </div>

      {/* Area chart */}
      <Card className="p-4 mb-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Revenus quotidiens — Août 2026</div>
        <div className="text-xs text-slate-400 mb-4">Bruts · Nets · Pourboires · Frais plateformes</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={breakdownData}>
            <defs>
              {[['gGross','#003DA5'],['gNet','#22C55E'],['gTip','#A855F7'],['gFee','#F97316']].map(([id, c]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.split(' ')[1]} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}k$`} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="gross" name="Bruts" stroke="#003DA5" fill="url(#gGross)" strokeWidth={2} />
            <Area type="monotone" dataKey="net" name="Nets" stroke="#22C55E" fill="url(#gNet)" strokeWidth={2} />
            <Area type="monotone" dataKey="tips" name="Pourboires" stroke="#A855F7" fill="url(#gTip)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="fees" name="Frais" stroke="#F97316" fill="url(#gFee)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* By Platform */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Revenus par plateforme</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByPlatform} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}k$`} />
              <YAxis type="category" dataKey="platform" tick={{ fontSize: 11, fill: '#64748b' }} width={70} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="gross" radius={[0,4,4,0]}>
                {revenueByPlatform.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tax breakdown */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Réconciliation fiscale</div>
          <div className="space-y-4">
            {[
              { label: 'Revenus enregistrés', value: revenue.grossMonthly, color: 'bg-qc-blue', pct: 100 },
              { label: 'TPS (5%)', value: taxes.tpsCollected, color: 'bg-blue-400', pct: 5 },
              { label: 'TVQ (9.975%)', value: taxes.tvqCollected, color: 'bg-purple-500', pct: 9.975 },
              { label: 'Revenus déclarés', value: taxes.declared, color: 'bg-green-500', pct: Math.round(taxes.declared/revenue.grossMonthly*100) },
              { label: 'Écart fiscal', value: taxes.gap, color: 'bg-orange-400', pct: Math.round(taxes.gap/revenue.grossMonthly*100) },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{fmt(row.value)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-4 p-3 rounded-lg text-center text-xs font-semibold
            ${taxes.gap < 5000 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
            {taxes.gap < 5000 ? '✅ ÉCART DANS LES LIMITES ACCEPTABLES' : '⚠ RÉVISION REQUISE — Écart > 5 000 $'}
          </div>
        </Card>
      </div>

      {/* Tax line chart */}
      <Card className="p-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Taxes collectées — Évolution mensuelle</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.split(' ')[1]} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}$`} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="tax" name="Taxes" stroke="#003DA5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </AppShell>
  )
}
