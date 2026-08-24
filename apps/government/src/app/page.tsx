'use client'
import { AppShell } from '@/components/layout/AppShell'
import { KpiCard, Card, FleurSection, Amount, StatusBadge, PageHeader } from '@/components/ui'
import { kpiData, revenueByDay, revenueByPlatform, mockAlerts, mockTransactions, mockDrivers } from '@/data/mock'
import { useI18n } from '@/i18n'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, Car, DollarSign, Percent, AlertTriangle,
  FileText, Wifi, Clock, TrendingUp, Activity,
  CheckCircle, XCircle
} from 'lucide-react'
import Link from 'next/link'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { drivers, activity, revenue, taxes, alerts } = kpiData
  const recentTx = mockTransactions.slice(0, 5)
  const recentAlerts = mockAlerts.filter(a => !a.resolved).slice(0, 4)

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.dashboard.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-qc-blue text-white font-semibold">PILOTE QUÉBEC</span>
        </div>
        <p className="text-sm text-slate-500">{t.dashboard.subtitle} · {new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* ── DRIVERS KPIs ── */}
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Chauffeurs</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label={t.dashboard.totalDrivers} value={drivers.total} icon={<Users size={16} />} color="blue" />
          <KpiCard label={t.dashboard.activeDrivers} value={drivers.active} sub={`${Math.round(drivers.active/drivers.total*100)}% du total`} icon={<Users size={16} />} color="green" trend="up" trendValue="+4%" />
          <KpiCard label={t.dashboard.onlineNow} value={drivers.online} icon={<Activity size={16} />} color="green" />
          <KpiCard label={t.dashboard.suspended} value={drivers.suspended} icon={<XCircle size={16} />} color="red" />
          <KpiCard label={t.dashboard.pending} value={drivers.pending} icon={<Clock size={16} />} color="orange" />
        </div>
      </div>

      {/* ── ACTIVITY KPIs ── */}
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Activité aujourd'hui</div>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label={t.dashboard.tripsToday} value={activity.tripsToday.toLocaleString('fr-CA')} icon={<Car size={16} />} color="blue" trend="up" trendValue="+12%" />
          <KpiCard label={t.dashboard.deliveriesToday} value={activity.deliveriesToday.toLocaleString('fr-CA')} icon={<Car size={16} />} color="purple" trend="up" trendValue="+8%" />
          <KpiCard label={t.dashboard.transactionsToday} value={activity.transactionsToday.toLocaleString('fr-CA')} icon={<Activity size={16} />} color="green" trend="up" trendValue="+9%" />
        </div>
      </div>

      {/* ── REVENUE KPIs ── */}
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Revenus — Août 2026</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label={t.dashboard.grossRevenue} value={fmt(revenue.grossMonthly)} large icon={<DollarSign size={16} />} color="blue" trend="up" trendValue="+6.2%" />
          <KpiCard label={t.dashboard.netRevenue} value={fmt(revenue.netMonthly)} large icon={<TrendingUp size={16} />} color="green" />
          <KpiCard label={t.dashboard.tips} value={fmt(revenue.tipsMonthly)} icon={<DollarSign size={16} />} color="purple" />
          <KpiCard label={t.dashboard.platformFees} value={fmt(revenue.platformFeesMonthly)} icon={<Percent size={16} />} color="orange" />
        </div>
      </div>

      {/* ── TAX KPIs ── */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Taxes — Août 2026</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label={t.dashboard.tpsCollected} value={fmt(taxes.tpsCollected)} icon={<Percent size={16} />} color="blue" sub="5.0%" />
          <KpiCard label={t.dashboard.tvqCollected} value={fmt(taxes.tvqCollected)} icon={<Percent size={16} />} color="blue" sub="9.975%" />
          <KpiCard label={t.dashboard.estimatedTax} value={fmt(taxes.estimated)} icon={<Percent size={16} />} color="gray" />
          <KpiCard label={t.dashboard.taxGap} value={fmt(taxes.gap)} icon={<AlertTriangle size={16} />} color="orange" sub="Écart à analyser" />
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Revenus — Août 2026</div>
              <div className="text-xs text-slate-400">Bruts vs Nets</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueByDay.slice(0, 24)}>
              <defs>
                <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003DA5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#003DA5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.split(' ')[1]} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `${l}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="gross" name="Bruts" stroke="#003DA5" fill="url(#gGross)" strokeWidth={2} />
              <Area type="monotone" dataKey="net" name="Nets" stroke="#22C55E" fill="url(#gNet)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Platform pie */}
        <Card className="p-4">
          <div className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-1">Revenus par plateforme</div>
          <div className="text-xs text-slate-400 mb-4">Août 2026</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={revenueByPlatform} dataKey="gross" nameKey="platform" cx="50%" cy="50%" outerRadius={65} strokeWidth={2}>
                {revenueByPlatform.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {revenueByPlatform.map(p => (
              <div key={p.platform} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{p.platform}</span>
                </div>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{fmt(p.gross)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── ALERTS + RECENT TX ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Alerts */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Alertes actives</div>
            <Link href="/alerts" className="text-xs text-qc-blue hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {recentAlerts.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.priority === 'critical' ? 'bg-red-500 animate-pulse' : a.priority === 'high' ? 'bg-orange-500' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{a.message}</p>
                  {a.driverGovId && <span className="text-[10px] text-qc-blue font-mono">{a.driverGovId}</span>}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0
                  ${a.priority === 'critical' ? 'bg-red-100 text-red-700' : a.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                  {a.priority}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Transactions récentes</div>
            <Link href="/transactions" className="text-xs text-qc-blue hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {recentTx.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-qc-blue">{tx.internalId}</span>
                    <span className="text-[9px] text-slate-400">{tx.provider.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{tx.driverName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">{fmt(tx.grossAmount)}</div>
                  <StatusBadge status={tx.status} dot={false} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── AUDIT TRAIL PREVIEW ── */}
      <Card className="mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Journal d'audit récent</div>
            <div className="text-[10px] text-slate-400">Toutes les actions administratives sont enregistrées de façon immuable</div>
          </div>
          <Link href="/audit" className="text-xs text-qc-blue hover:underline">Journal complet →</Link>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { actor: 'ADMIN-001', role: 'GOVERNMENT_ADMIN', action: 'UPDATE_DRIVER_STATUS', resource: 'TG-000004', detail: 'ACTIVE → SUSPENDED', time: '2026-08-15 10:30', ok: false },
            { actor: 'TAX-003', role: 'TAX_ADMIN', action: 'CREATE_TAX_ADJUSTMENT', resource: 'TG-000002-Q3', detail: '+420.00 $', time: '2026-08-23 14:00', ok: true },
            { actor: 'SYS', role: 'SYSTEM', action: 'REJECT_DUPLICATE_WEBHOOK', resource: 'UBER-TRIP-10034', detail: 'Doublon ignoré', time: '2026-08-24 11:20', ok: true },
            { actor: 'INSP-001', role: 'INSPECTOR', action: 'UPDATE_INSPECTION', resource: 'V001', detail: 'Inspection annuelle ✓', time: '2026-08-22 09:00', ok: true },
          ].map((log, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-4 text-xs">
              <div className="w-32 shrink-0">
                <div className="font-mono text-qc-blue text-[10px]">{log.actor}</div>
                <div className="text-slate-400 text-[9px]">{log.role}</div>
              </div>
              <div className="flex-1">
                <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{log.action}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span className="text-slate-500">{log.resource}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span className={log.ok ? 'text-green-600' : 'text-red-500'}>{log.detail}</span>
              </div>
              <div className="text-slate-400 font-mono text-[10px] shrink-0">{log.time}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Alerts counters footer */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t.dashboard.anomalies, val: alerts.anomalies, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: <AlertTriangle size={14} /> },
          { label: t.dashboard.expiredDocs, val: alerts.expiredDocs, color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: <FileText size={14} /> },
          { label: t.dashboard.apiIssues, val: alerts.apiIssues, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: <Wifi size={14} /> },
          { label: t.dashboard.pendingTx, val: alerts.pendingTransactions, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <Clock size={14} /> },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl border ${item.bg}`}>
            <div className={item.color}>{item.icon}</div>
            <div>
              <div className={`text-xl font-bold ${item.color}`}>{item.val}</div>
              <div className="text-[10px] text-slate-500 font-medium">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
