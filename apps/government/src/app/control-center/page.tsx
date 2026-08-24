'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card, KpiCard, FleurSection } from '@/components/ui'
import { controlCenterKpis, revenueByRegion } from '@/data/compliance.mock'
import { mockComplianceCases, mockReconciliationRecords } from '@/data/compliance.mock'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, Activity, DollarSign, Percent, AlertTriangle, FileText, Wifi, Scale, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
const fmtNum = (n: number) => n.toLocaleString('fr-CA')

export default function ControlCenterPage() {
  const { registeredWorkers, activeToday, transactionsToday, reportedRevenue, taxableRevenue, tps, tvq, openComplianceCases, pendingDocuments, webhookErrors, reconciliationIssues } = controlCenterKpis
  const openCases = mockComplianceCases.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED')
  const reconciliationIssuesData = mockReconciliationRecords.filter(r => r.result !== 'MATCH')

  return (
    <AppShell>
      {/* Header */}
      <FleurSection className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">Government Control Center</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-qc-blue text-white tracking-widest">PILOTE QUÉBEC — SIMULATION</span>
            </div>
            <p className="text-sm text-slate-500">Infrastructure de revenus · Pilote Québec · {new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
              <span>⚜ Gouvernement du Québec</span>
              <span>·</span>
              <span>TPS 5% · TVQ 9.975%</span>
              <span>·</span>
              <span>Toutes les données sont SIMULÉES</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-green-700">TOUS SYSTÈMES OPÉRATIONNELS</span>
            </div>
          </div>
        </div>
      </FleurSection>

      {/* National KPIs */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Indicateurs nationaux — Simulation</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Travailleurs enregistrés" value={fmtNum(registeredWorkers)} large icon={<Users size={16} />} color="blue" trend="up" trendValue="+2.4%" />
        <KpiCard label="Actifs aujourd'hui" value={fmtNum(activeToday)} large icon={<Activity size={16} />} color="green" />
        <KpiCard label="Transactions aujourd'hui" value={fmtNum(transactionsToday)} large icon={<Activity size={16} />} color="purple" trend="up" trendValue="+8.1%" />
        <KpiCard label="Revenus déclarés" value={fmt(reportedRevenue)} large icon={<DollarSign size={16} />} color="blue" trend="up" trendValue="+6.2%" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Revenus taxables" value={fmt(taxableRevenue)} icon={<DollarSign size={16} />} color="green" />
        <KpiCard label="TPS perçue" value={fmt(tps)} icon={<Percent size={16} />} color="blue" sub="5.0% — Fédérale" />
        <KpiCard label="TVQ perçue" value={fmt(tvq)} icon={<Percent size={16} />} color="purple" sub="9.975% — Provinciale" />
        <KpiCard label="Total taxes" value={fmt(tps + tvq)} icon={<Percent size={16} />} color="green" sub="14.975% combiné" />
      </div>

      {/* Alert strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Dossiers ouverts', val: openComplianceCases, href: '/compliance/cases', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: <AlertTriangle size={14} /> },
          { label: 'Documents en attente', val: pendingDocuments, href: '/documents', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <FileText size={14} /> },
          { label: 'Erreurs webhook', val: webhookErrors, href: '/webhooks/engine', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: <Wifi size={14} /> },
          { label: 'Écarts réconciliation', val: reconciliationIssues, href: '/reconciliation', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', icon: <Scale size={14} /> },
        ].map(item => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 p-4 rounded-xl border ${item.bg} hover:opacity-90 transition-opacity`}>
            <div className={item.color}>{item.icon}</div>
            <div className="flex-1">
              <div className={`text-2xl font-bold ${item.color}`}>{item.val}</div>
              <div className="text-[10px] text-slate-500 font-medium">{item.label}</div>
            </div>
            <ArrowRight size={14} className={`${item.color} opacity-50`} />
          </Link>
        ))}
      </div>

      {/* Revenue by region chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Revenus par région — Simulation</div>
              <div className="text-xs text-slate-400">Pilote Québec · Données DEMO</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByRegion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000000).toFixed(1)}M$`} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {revenueByRegion.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#003DA5' : '#1A56C4'} opacity={1 - i * 0.08} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Open compliance cases */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Dossiers de conformité ouverts</div>
            <Link href="/compliance/cases" className="text-xs text-qc-blue hover:underline">Tous les dossiers →</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {openCases.slice(0, 5).map(c => (
              <div key={c.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : c.severity === 'HIGH' ? 'bg-orange-500' : c.severity === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-qc-blue">{c.caseId}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                      ${c.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : c.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{c.reason.substring(0, 70)}...</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                    <span className="font-mono">{c.driverId}</span>
                    <span>{c.driverName}</span>
                    {c.difference && <span className="text-orange-600 font-semibold">Écart: {fmt(c.difference)}</span>}
                  </div>
                </div>
                <Link href={`/compliance/cases`} className="text-xs text-qc-blue hover:underline shrink-0">→</Link>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reconciliation summary */}
      <Card className="mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Réconciliation Plateformes vs Ledger — Août 2026</div>
            <div className="text-[10px] text-slate-400">Source de vérité : Universal Ledger</div>
          </div>
          <Link href="/reconciliation" className="text-xs text-qc-blue hover:underline">Détails →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Plateforme','Montant plateforme','Montant ledger','Écart','Statut'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockReconciliationRecords.map(r => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{r.provider}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-400">{fmt(r.providerReported)}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-400">{fmt(r.ledgerAmount)}</td>
                  <td className="px-4 py-2.5">
                    {r.difference > 0
                      ? <span className="font-mono text-sm font-bold text-orange-600">+{fmt(r.difference)}</span>
                      : <span className="text-sm text-green-600">✓ Aucun</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase
                      ${r.result === 'MATCH' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                      {r.result === 'MATCH' ? '✅ CONFORME' : '⚠ RÉVISION'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tax engine summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: 'TPS — Simulation', rate: '5.0%', collected: fmt(tps), remitted: fmt(Math.round(tps * 0.85)), outstanding: fmt(Math.round(tps * 0.15)), color: 'border-blue-200 bg-blue-50' },
          { title: 'TVQ — Simulation', rate: '9.975%', collected: fmt(tvq), remitted: fmt(Math.round(tvq * 0.85)), outstanding: fmt(Math.round(tvq * 0.15)), color: 'border-purple-200 bg-purple-50' },
          { title: 'Total combiné', rate: '14.975%', collected: fmt(tps + tvq), remitted: fmt(Math.round((tps + tvq) * 0.85)), outstanding: fmt(Math.round((tps + tvq) * 0.15)), color: 'border-green-200 bg-green-50' },
        ].map(t => (
          <Card key={t.title} className={`p-4 border ${t.color} dark:border-slate-700 dark:bg-transparent`}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{t.title}</div>
              <span className="text-xs font-bold text-qc-blue">{t.rate}</span>
            </div>
            <div className="space-y-2">
              {[['Perçue', t.collected],['Remise', t.remitted],['En attente', t.outstanding]].map(([l,v]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
