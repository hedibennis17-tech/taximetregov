'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { kpiData, mockDrivers } from '@/data/mock'
import { Percent, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

export default function TaxReportsPage() {
  const { taxes, revenue } = kpiData
  const topDriversByTax = [...mockDrivers].filter(d => d.monthlyTax > 0).sort((a, b) => b.monthlyTax - a.monthlyTax).slice(0, 10)

  const reconciliation = [
    { period: 'Août 2026', recorded: revenue.grossMonthly, declared: taxes.declared, gap: taxes.gap, status: taxes.gap < 5000 ? 'ok' : 'review' },
    { period: 'Juillet 2026', recorded: 261840, declared: 261840, gap: 0, status: 'ok' },
    { period: 'Juin 2026', recorded: 248320, declared: 238900, gap: 9420, status: 'review' },
    { period: 'Mai 2026', recorded: 239100, declared: 239100, gap: 0, status: 'ok' },
  ]

  return (
    <AppShell>
      <PageHeader title="Rapports fiscaux" subtitle="TPS 5% · TVQ 9.975% · Seuil d'inscription : 30 000 $ / an" />

      {/* Tax rates */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-qc-blue mb-1">5%</div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">TPS (Fédérale)</div>
          <div className="text-xs text-slate-400 mt-1">Taxe sur les produits et services</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">9.975%</div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">TVQ (Provinciale)</div>
          <div className="text-xs text-slate-400 mt-1">Taxe de vente du Québec</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">14.975%</div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total combiné</div>
          <div className="text-xs text-slate-400 mt-1">Seuil : 30 000 $ revenus annuels</div>
        </Card>
      </div>

      {/* Current month KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TPS perçue (août)" value={fmt(taxes.tpsCollected)} icon={<Percent size={16} />} color="blue" />
        <KpiCard label="TVQ perçue (août)" value={fmt(taxes.tvqCollected)} icon={<Percent size={16} />} color="purple" />
        <KpiCard label="Total taxes" value={fmt(taxes.tpsCollected + taxes.tvqCollected)} icon={<TrendingUp size={16} />} color="green" />
        <KpiCard label="Écart à analyser" value={fmt(taxes.gap)} icon={<AlertCircle size={16} />} color="orange" />
      </div>

      {/* Reconciliation table */}
      <Card className="mb-6">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Réconciliation revenus enregistrés vs déclarés</div>
          <div className="text-[10px] text-slate-400">
            ⚠ Un écart ne signifie pas automatiquement fraude — peut indiquer une révision, un délai de déclaration ou un ajustement légitime
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Période', 'Revenus enregistrés', 'Revenus déclarés', 'Écart', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reconciliation.map(row => (
                <tr key={row.period} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 font-semibold text-sm text-slate-700 dark:text-slate-200">{row.period}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-200">{fmt(row.recorded)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-200">{fmt(row.declared)}</td>
                  <td className={`px-4 py-3 font-mono text-sm font-semibold ${row.gap > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {row.gap > 0 ? `+ ${fmt(row.gap)}` : '✅ Aucun'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                      ${row.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {row.status === 'ok' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                      {row.status === 'ok' ? 'CONFORME' : 'RÉVISION'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top drivers by tax */}
      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Top 10 — Taxes perçues par chauffeur (août 2026)</div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {topDriversByTax.map((d, i) => (
            <div key={d.id} className="px-4 py-3 flex items-center gap-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: i < 3 ? 'var(--qc-blue)' : '#94a3b8' }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.firstName} {d.lastName}</div>
                <div className="text-[10px] font-mono text-qc-blue">{d.govId}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-sm text-slate-700 dark:text-slate-200">{fmt(d.monthlyTax)}</div>
                <div className="text-[10px] text-slate-400">sur {fmt(d.monthlyRevenue)} bruts</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
