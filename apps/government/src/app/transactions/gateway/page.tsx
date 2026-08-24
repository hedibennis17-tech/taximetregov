'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, StatusBadge, PlatformBadge, Amount } from '@/components/ui'
import { mockGatewayTransactions } from '@/data/gateway.mock'
import { useState } from 'react'
import { Search, Download, CheckCircle } from 'lucide-react'
import type { PlatformCode, FinancialStatus } from '@/data/gateway.mock'

const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

const financialColors: Record<FinancialStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  PROVISIONAL: 'bg-blue-100 text-blue-700',
  FINALIZED: 'bg-green-100 text-green-700',
  ADJUSTED: 'bg-purple-100 text-purple-700',
  REFUNDED: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
}

export default function GatewayLedgerPage() {
  const [search, setSearch] = useState('')
  const [fsFilter, setFsFilter] = useState<FinancialStatus | 'all'>('all')
  const [provFilter, setProvFilter] = useState<PlatformCode | 'all'>('all')

  const filtered = mockGatewayTransactions.filter(tx => {
    const q = search.toLowerCase()
    return (!q || tx.internalTxId.toLowerCase().includes(q) || tx.providerTxId.toLowerCase().includes(q) || tx.governmentUserId.toLowerCase().includes(q))
      && (fsFilter === 'all' || tx.financialStatus === fsFilter)
      && (provFilter === 'all' || tx.provider === provFilter)
  })

  const totalGross = filtered.reduce((s, t) => s + t.gross, 0)
  const totalNet = filtered.reduce((s, t) => s + t.net, 0)
  const totalTax = filtered.reduce((s, t) => s + t.tax, 0)
  const totalTips = filtered.reduce((s, t) => s + t.tip, 0)
  const adjustedCount = filtered.filter(t => t.hasAdjustment).length
  const refundedCount = filtered.filter(t => t.hasRefund).length
  const withTip = filtered.filter(t => t.hasTip).length

  const fsOptions: FinancialStatus[] = ['PENDING','PROVISIONAL','FINALIZED','ADJUSTED','REFUNDED','DISPUTED']
  const providers: PlatformCode[] = ['uber','lyft','doordash','instacart','ubereats','skip','taxi']

  return (
    <AppShell>
      <PageHeader
        title="Ledger universel — Revenue Gateway"
        subtitle="Source de vérité unique · UNIQUE(provider, provider_transaction_id) · Ajustements · Pourboires · Remboursements"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download size={14} /> Exporter
          </button>
        }
      />

      {/* Uniqueness note */}
      <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <CheckCircle size={14} className="shrink-0" />
        <span><strong>UNIQUE(provider, provider_transaction_id)</strong> — Chaque transaction externe ne peut être enregistrée qu'une seule fois. Les doublons sont automatiquement bloqués et tracés. Les ajustements, pourboires et remboursements ne remplacent jamais la transaction originale.</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Brut ({filtered.length})</div>
          <div className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{fmt(totalGross)}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Net chauffeurs</div>
          <div className="text-lg font-bold font-mono text-green-600">{fmt(totalNet)}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">TPS + TVQ total</div>
          <div className="text-lg font-bold font-mono text-qc-blue">{fmt(totalTax)}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Pourboires</div>
          <div className="text-lg font-bold font-mono text-purple-600">{fmt(totalTips)}</div>
        </Card>
      </div>

      {/* Metadata */}
      <div className="flex gap-4 mb-4 text-xs text-slate-500">
        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
          {adjustedCount} ajustements
        </span>
        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
          {withTip} avec pourboire
        </span>
        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
          {refundedCount} remboursements
        </span>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ID interne, provider TX, chauffeur..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFsFilter('all')}
              className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase ${fsFilter === 'all' ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
              Tous
            </button>
            {fsOptions.map(f => (
              <button key={f} onClick={() => setFsFilter(f)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase ${fsFilter === f ? 'bg-qc-blue text-white' : `${financialColors[f]} border border-transparent hover:opacity-80`}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setProvFilter('all')}
              className={`px-2 py-1.5 rounded text-[10px] font-semibold ${provFilter === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
              Toutes
            </button>
            {providers.map(p => (
              <button key={p} onClick={() => setProvFilter(p)}
                className={`px-2 py-1.5 rounded text-[10px] font-semibold uppercase ${provFilter === p ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {p}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 self-center">{filtered.length} tx</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['ID Interne','Plateforme','Provider TX','Chauffeur','Type','Brut','Frais','Pourboire','Ajust.','Tax','Net','Statut financier','Synchro'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id} className={`border-b border-slate-50 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors
                  ${tx.hasRefund ? 'opacity-70' : ''}`}>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[10px] text-qc-blue font-bold">{tx.internalTxId}</span>
                  </td>
                  <td className="px-3 py-2"><PlatformBadge platform={tx.provider as any} /></td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[9px] text-slate-500">{tx.providerTxId}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[10px] text-qc-blue">{tx.governmentUserId}</span>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-slate-500">{tx.activityType}</td>
                  <td className="px-3 py-2"><Amount value={tx.gross} size="sm" /></td>
                  <td className="px-3 py-2 text-[10px] font-mono text-red-500">-{fmt(tx.fee)}</td>
                  <td className="px-3 py-2">
                    {tx.tip > 0 ? <span className="text-[10px] font-mono text-green-600 font-bold">+{fmt(tx.tip)}</span> : <span className="text-[10px] text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {tx.adjustment !== 0
                      ? <span className={`text-[10px] font-mono font-bold ${tx.adjustment > 0 ? 'text-green-600' : 'text-red-500'}`}>{tx.adjustment > 0 ? '+' : ''}{fmt(tx.adjustment)}</span>
                      : <span className="text-[10px] text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[10px] font-mono text-blue-600">{fmt(tx.tax)}</td>
                  <td className="px-3 py-2"><Amount value={tx.net} size="sm" colored /></td>
                  <td className="px-3 py-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${financialColors[tx.financialStatus]}`}>
                      {tx.financialStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-0.5">
                      <span className="text-[8px] px-1 py-0.5 bg-green-50 text-green-600 rounded" title="Driver App">🚗</span>
                      <span className="text-[8px] px-1 py-0.5 bg-blue-50 text-blue-600 rounded" title="Gov Dashboard">🏛️</span>
                      <span className="text-[8px] px-1 py-0.5 bg-purple-50 text-purple-600 rounded" title="Tax Engine">📊</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
          {filtered.length} transactions · Source de vérité unique · Synchronisé Driver App + Gov Dashboard + Tax Engine
        </div>
      </Card>
    </AppShell>
  )
}
