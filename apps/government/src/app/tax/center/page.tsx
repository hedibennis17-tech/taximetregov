'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockTaxPeriods, mockDeclarations, taxRuleSets, controlCenterKpis, type TaxPeriodStatus, type DeclarationStatus } from '@/data/compliance.mock'
import { useState } from 'react'
import { Percent, CheckCircle, AlertCircle, Clock, FileText, Scale } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

const periodStatusColors: Record<TaxPeriodStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700', READY: 'bg-indigo-100 text-indigo-700',
  FILED: 'bg-amber-100 text-amber-700', UNDER_REVIEW: 'bg-orange-100 text-orange-700',
  ACCEPTED: 'bg-green-100 text-green-700', ADJUSTED: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}
const declarationColors: Record<DeclarationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600', SUBMITTED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-indigo-100 text-indigo-700', UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
  AMENDED: 'bg-purple-100 text-purple-700',
}

export default function TaxCenterPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'periods' | 'declarations' | 'rules'>('overview')
  const { tps, tvq, taxableRevenue, reportedRevenue } = controlCenterKpis

  const tabs = [
    { key: 'overview', label: 'Aperçu' },
    { key: 'periods', label: 'Périodes fiscales' },
    { key: 'declarations', label: 'Déclarations' },
    { key: 'rules', label: 'Règles fiscales' },
  ] as const

  return (
    <AppShell>
      <PageHeader
        title="Tax Control Center"
        subtitle="TPS 5% · TVQ 9.975% · Règles versionnées · Tax Engine centralisé"
      />

      {/* Important rule */}
      <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200">
        <Scale size={14} className="text-qc-blue mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          <strong>Architecture Tax Engine :</strong> Les taxes ne sont jamais calculées directement dans l'interface. Toutes les règles fiscales sont versionnées et proviennent du Tax Rule Service. Une ancienne transaction utilise les taux en vigueur à sa date.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-white dark:bg-slate-900 text-qc-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <KpiCard label="TPS Perçue (5%)" value={fmt(tps)} icon={<Percent size={16} />} color="blue" sub="Fédérale — Canada" />
            <KpiCard label="TVQ Perçue (9.975%)" value={fmt(tvq)} icon={<Percent size={16} />} color="purple" sub="Provinciale — Québec" />
            <KpiCard label="Total taxes" value={fmt(tps + tvq)} icon={<Percent size={16} />} color="green" sub="14.975% combiné" />
            <KpiCard label="Revenus taxables" value={fmt(taxableRevenue)} icon={<Scale size={16} />} color="blue" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <KpiCard label="Taxes remises" value={fmt(Math.round((tps + tvq) * 0.85))} color="green" sub="85% du total" />
            <KpiCard label="En attente" value={fmt(Math.round((tps + tvq) * 0.15))} color="orange" sub="15% — Q3 2026" />
            <KpiCard label="Remboursements" value={fmt(42300)} color="purple" />
            <KpiCard label="Ajustements" value={fmt(18900)} color="gray" />
          </div>

          {/* Tax reconciliation */}
          <Card className="mb-5 p-4">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Réconciliation revenus enregistrés vs déclarés</div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Revenus enregistrés (Ledger)', val: fmt(reportedRevenue), color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                { label: 'Revenus déclarés', val: fmt(reportedRevenue - 2209), color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                { label: 'Écart fiscal', val: fmt(2209), color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
              ].map(r => (
                <div key={r.label} className={`p-4 rounded-xl ${r.bg} text-center`}>
                  <div className="text-[10px] text-slate-500 mb-1">{r.label}</div>
                  <div className={`text-xl font-bold font-mono ${r.color}`}>{r.val}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle size={13} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Écart de 2 209 $ :</strong> Peut indiquer un délai de déclaration, un ajustement en cours ou un dossier à réviser. Analyse humaine requise avant toute action.
              </p>
            </div>
          </Card>
        </>
      )}

      {/* PERIODS */}
      {activeTab === 'periods' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Périodes fiscales</div>
            <div className="text-[10px] text-slate-400">TaxPeriod · Jurisdiction: QC-CA · TPS 5% + TVQ 9.975%</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Chauffeur','Période','Revenus','Taxables','TPS','TVQ','Perçue','Remise','Solde','Statut'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockTaxPeriods.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{p.driverName}</div>
                      <div className="font-mono text-[10px] text-qc-blue">{p.driverId}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{p.periodLabel}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{fmt(p.revenue)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{fmt(p.taxableRevenue)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-600">{fmt(p.tps)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-purple-600">{fmt(p.tvq)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{fmt(p.taxCollected)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-green-600">{fmt(p.taxRemitted)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-orange-600">{fmt(p.balance)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${periodStatusColors[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* DECLARATIONS */}
      {activeTab === 'declarations' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Déclarations fiscales</div>
            <div className="text-[10px] text-slate-400">DRAFT → SUBMITTED → RECEIVED → UNDER_REVIEW → ACCEPTED / REJECTED / AMENDED</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {mockDeclarations.map(d => (
              <div key={d.id} className="px-4 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-mono text-xs font-bold text-qc-blue">{d.driverId}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{d.driverName}</span>
                    <span className="text-xs text-slate-500">{d.period}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${declarationColors[d.status]}`}>{d.status}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { l: 'Revenus', v: fmt(d.revenue) },
                      { l: 'TPS', v: fmt(d.tps) },
                      { l: 'TVQ', v: fmt(d.tvq) },
                      { l: 'Total taxes', v: fmt(d.totalTax) },
                    ].map(r => (
                      <div key={r.l} className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-[9px] text-slate-400">{r.l}</div>
                        <div className="text-sm font-bold font-mono text-slate-700 dark:text-slate-200">{r.v}</div>
                      </div>
                    ))}
                  </div>
                  {d.notes && (
                    <p className="text-xs text-orange-600 mt-2 flex items-center gap-1.5">
                      <AlertCircle size={11} /> {d.notes}
                    </p>
                  )}
                  {d.reviewedBy && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle size={10} className="text-green-500" /> Révisé par {d.reviewedBy} · {d.reviewedAt ? new Date(d.reviewedAt).toLocaleDateString('fr-CA') : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAX RULES */}
      {activeTab === 'rules' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Règles fiscales versionnées — TaxRuleSet</div>
            <div className="text-[10px] text-slate-400">Les taux sont versionnés. Une ancienne transaction utilise les taux applicables à sa date.</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {taxRuleSets.map(r => (
              <div key={r.id} className="px-4 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-qc-blue">{(r.rate * 100).toFixed(3)}%</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{r.taxType}</span>
                    <span className="text-xs text-slate-500">{r.jurisdiction}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Version: <span className="font-mono">{r.version}</span>
                    {' · '}En vigueur depuis: {r.effectiveFrom}
                    {r.effectiveUntil ? ` · Jusqu'au: ${r.effectiveUntil}` : ' · En cours'}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400">{r.id}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  )
}
