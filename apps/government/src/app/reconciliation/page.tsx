'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard, PlatformBadge } from '@/components/ui'
import { mockReconciliationRecords } from '@/data/compliance.mock'
import { CheckCircle, AlertCircle, RefreshCw, Scale } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

const resultColors = {
  MATCH: 'bg-green-100 text-green-700 border-green-200',
  AMOUNT_MISMATCH: 'bg-orange-100 text-orange-700 border-orange-200',
  MISSING: 'bg-red-100 text-red-700 border-red-200',
  DUPLICATE: 'bg-amber-100 text-amber-700 border-amber-200',
  STATUS_MISMATCH: 'bg-purple-100 text-purple-700 border-purple-200',
  UNRESOLVED: 'bg-red-200 text-red-900 border-red-300',
}

export default function ReconciliationPage() {
  const matched = mockReconciliationRecords.filter(r => r.result === 'MATCH').length
  const issues = mockReconciliationRecords.filter(r => r.result !== 'MATCH').length
  const totalDiff = mockReconciliationRecords.reduce((s, r) => s + r.difference, 0)

  return (
    <AppShell>
      <PageHeader
        title="Centre de réconciliation"
        subtitle="Plateforme vs Ledger vs Tax Engine · Source de vérité : Universal Ledger"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <RefreshCw size={13} /> Lancer réconciliation
          </button>
        }
      />

      {/* Architecture */}
      <Card className="mb-5 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Flux de réconciliation</div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
          {['Provider Report', '→', 'Universal Ledger', '→', 'Tax Engine', '→', 'Reconciliation Engine', '→', 'MATCH / MISMATCH / MISSING'].map((s, i) => (
            <span key={i} className={s === '→' ? 'text-slate-300' : 'px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border text-slate-600 dark:text-slate-400'}>{s}</span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          {[
            { icon: '✅', label: 'MATCH', desc: 'Provider = Ledger = Tax Engine' },
            { icon: '⚠️', label: 'AMOUNT_MISMATCH', desc: 'Montants différents — Révision requise' },
            { icon: '❓', label: 'MISSING', desc: 'Transaction présente chez fournisseur mais absente du Ledger' },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span>{r.icon}</span>
              <div>
                <div className="font-bold text-[10px] text-slate-700 dark:text-slate-200">{r.label}</div>
                <div className="text-[9px] text-slate-500">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Plateformes réconciliées" value={mockReconciliationRecords.length} icon={<Scale size={16} />} color="blue" />
        <KpiCard label="MATCH" value={matched} icon={<CheckCircle size={16} />} color="green" />
        <KpiCard label="Écarts détectés" value={issues} icon={<AlertCircle size={16} />} color="orange" />
        <KpiCard label="Écart total" value={fmt(totalDiff)} icon={<AlertCircle size={16} />} color="red" sub="À analyser" />
      </div>

      {/* Reconciliation table */}
      <Card className="mb-5">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Réconciliation par plateforme — Août 2026</div>
          <div className="text-[10px] text-slate-400">Dernière mise à jour : {new Date().toLocaleString('fr-CA')}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Plateforme','Période','Montant fournisseur','Montant Ledger','Écart','Résultat','Dernière vérification'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockReconciliationRecords.map(r => (
                <tr key={r.id} className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ${r.result !== 'MATCH' ? 'bg-orange-50/20' : ''}`}>
                  <td className="px-4 py-3">
                    <PlatformBadge platform={r.provider as any} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{r.period}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-200">{fmt(r.providerReported)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-200">{fmt(r.ledgerAmount)}</td>
                  <td className="px-4 py-3">
                    {r.difference > 0
                      ? <span className="font-mono text-sm font-bold text-orange-600">+{fmt(r.difference)}</span>
                      : <span className="text-green-600 text-sm font-semibold">✓ 0</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${resultColors[r.result as keyof typeof resultColors] || 'bg-slate-100 text-slate-600'}`}>
                      {r.result === 'MATCH' ? '✅ ' : r.result !== 'MATCH' ? '⚠ ' : ''}{r.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 font-mono">
                    {new Date(r.lastChecked).toLocaleString('fr-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DoorDash mismatch detail */}
      <Card className="border-orange-200 dark:border-orange-900">
        <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-900">
          <div className="font-semibold text-sm text-orange-700">Détail — Écart DoorDash (2 320 $)</div>
          <div className="text-[10px] text-orange-600">Analyse en cours · Dossier CASE-2026-0001 associé</div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">DoorDash signale</div>
            <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200">{fmt(38940)}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">Ledger interne</div>
            <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200">{fmt(36620)}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-xl border border-orange-200">
            <div className="text-xs text-orange-500 mb-1">Écart</div>
            <div className="text-xl font-bold font-mono text-orange-600">{fmt(2320)}</div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <AlertCircle size={13} className="shrink-0" />
            <span>Hypothèses : 5 webhooks DoorDash non reçus (panne 14h32) · Transactions en attente de traitement · Dossier de conformité CASE-2026-0001 en cours d'investigation.</span>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
