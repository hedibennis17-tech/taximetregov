'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { controlCenterKpis } from '@/data/compliance.mock'
import { mockGatewayTransactions } from '@/data/gateway.mock'
import { revenueByDay, revenueByPlatform } from '@/data/mock'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react'
import { useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

const REPORT_TYPES = [
  { id:'daily_revenue', label:'Revenus quotidiens', icon:'📊' },
  { id:'monthly_revenue', label:'Revenus mensuels', icon:'📅' },
  { id:'tax_summary', label:'Sommaire fiscal TPS/TVQ', icon:'💰' },
  { id:'platform_revenue', label:'Revenus par plateforme', icon:'🔌' },
  { id:'compliance_report', label:'Rapport de conformité', icon:'⚖️' },
  { id:'reconciliation', label:'Rapport de réconciliation', icon:'🔄' },
  { id:'webhook_health', label:'Santé des webhooks', icon:'🌐' },
  { id:'driver_activity', label:'Activité des chauffeurs', icon:'🚗' },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('daily_revenue')
  const [period, setPeriod] = useState('monthly')
  const { tps, tvq, taxableRevenue } = controlCenterKpis

  // Simulated monthly data
  const monthlyData = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû'].map((month, i) => ({
    month,
    gross: 18000 + Math.random() * 15000,
    net: 12000 + Math.random() * 10000,
    tps: (18000 + Math.random() * 15000) * 0.05 * 0.75,
    tvq: (18000 + Math.random() * 15000) * 0.09975 * 0.75,
  }))

  return (
    <AppShell>
      <PageHeader
        title="Générateur de rapports"
        subtitle="Rapports officiels · Données du Ledger central · Exports sécurisés par RBAC"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Report type selector */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Type de rapport</div>
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={() => setSelectedReport(r.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all
                ${selectedReport === r.id ? 'bg-qc-blue text-white shadow-sm' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-qc-blue/40'}`}>
              <span className="text-base">{r.icon}</span>
              <span className="font-medium text-xs">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Report viewer */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls */}
          <Card className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-xs text-slate-500">Période :</span>
              </div>
              {['daily','weekly','monthly','quarterly','annual'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                    ${period === p ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                  {p === 'daily' ? 'Journalier' : p === 'weekly' ? 'Hebdo' : p === 'monthly' ? 'Mensuel' : p === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Download size={12} /> CSV
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>
          </Card>

          {/* Revenue report */}
          {(selectedReport === 'daily_revenue' || selectedReport === 'monthly_revenue') && (
            <>
              <Card className="p-4">
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">
                  {selectedReport === 'daily_revenue' ? 'Revenus quotidiens — Août 2026' : 'Revenus mensuels — 2026'}
                </div>
                <div className="text-xs text-slate-400 mb-4">SIMULATION · Données du Universal Ledger</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={selectedReport === 'daily_revenue' ? revenueByDay : monthlyData}>
                    <defs>
                      <linearGradient id="rGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#003DA5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#003DA5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={selectedReport === 'daily_revenue' ? 'day' : 'month'} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: string) => v.split(' ').pop() || v} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k$`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="gross" name="Bruts" stroke="#003DA5" fill="url(#rGross)" strokeWidth={2} />
                    <Area type="monotone" dataKey="net" name="Nets" stroke="#22C55E" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}

          {/* Tax report */}
          {selectedReport === 'tax_summary' && (
            <Card className="p-4">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Sommaire fiscal TPS/TVQ — SIMULATION</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'TPS Perçue (5%)', val: tps, color: 'text-blue-600' },
                  { label: 'TVQ Perçue (9.975%)', val: tvq, color: 'text-purple-600' },
                  { label: 'Total taxes', val: tps + tvq, color: 'text-green-600' },
                  { label: 'Revenus taxables', val: taxableRevenue, color: 'text-slate-700 dark:text-slate-200' },
                ].map(r => (
                  <div key={r.label} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-xs text-slate-500 mb-1">{r.label}</div>
                    <div className={`text-xl font-bold font-mono ${r.color}`}>{fmt(r.val)}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${v.toFixed(0)}$`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tps" name="TPS" fill="#003DA5" radius={[2,2,0,0]} />
                  <Bar dataKey="tvq" name="TVQ" fill="#7C3AED" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Platform report */}
          {selectedReport === 'platform_revenue' && (
            <Card className="p-4">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Revenus par plateforme — SIMULATION</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByPlatform} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k$`} />
                  <YAxis type="category" dataKey="platform" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="gross" name="Revenus bruts" fill="#003DA5" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Generic placeholder for other reports */}
          {!['daily_revenue','monthly_revenue','tax_summary','platform_revenue'].includes(selectedReport) && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Rapport : {REPORT_TYPES.find(r => r.id === selectedReport)?.label}
              </div>
              <div className="text-xs text-slate-400 mt-1">Module en cours de configuration · Architecture prête</div>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-medium cursor-pointer hover:bg-blue-700">
                <Download size={13} /> Générer rapport (simulation)
              </div>
            </Card>
          )}

          {/* Export note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <Filter size={12} />
            <span>Les exports sont filtrés par RBAC. Chaque export génère une entrée dans le journal d'audit.</span>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
