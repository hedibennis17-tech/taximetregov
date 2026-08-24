'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, StatusBadge, PlatformBadge, Amount } from '@/components/ui'
import { mockTransactions, type TransactionStatus, type Platform } from '@/data/mock'
import { useState } from 'react'
import { Search, Download, AlertCircle, CheckCircle } from 'lucide-react'

const statusFilters: (TransactionStatus | 'all')[] = ['all','completed','finalized','pending','refunded','disputed','cancelled']
const platformFilters: (Platform | 'all')[] = ['all','uber','lyft','doordash','instacart','ubereats','skip','taxi']

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState<TransactionStatus | 'all'>('all')
  const [platformF, setPlatformF] = useState<Platform | 'all'>('all')

  const filtered = mockTransactions.filter(tx => {
    const q = search.toLowerCase()
    const matchQ = !q || tx.internalId.toLowerCase().includes(q) || tx.providerTransactionId.toLowerCase().includes(q) || tx.driverGovId.toLowerCase().includes(q) || tx.driverName.toLowerCase().includes(q)
    return matchQ && (statusF === 'all' || tx.status === statusF) && (platformF === 'all' || tx.provider === platformF)
  })

  const totalGross = filtered.reduce((s, tx) => s + tx.grossAmount, 0)
  const totalNet = filtered.reduce((s, tx) => s + tx.netAmount, 0)
  const totalTax = filtered.reduce((s, tx) => s + tx.tps + tx.tvq, 0)

  const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  return (
    <AppShell>
      <PageHeader
        title="Registre des transactions"
        subtitle="Ledger universel · Contrainte UNIQUE(provider, provider_transaction_id) active — aucun doublon possible"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download size={14} /> Exporter CSV
          </button>
        }
      />

      {/* Uniqueness notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <CheckCircle size={14} className="shrink-0" />
        <span>Intégrité du ledger : <strong>UNIQUE(provider, provider_transaction_id)</strong> — Chaque transaction externe ne peut être enregistrée qu'une seule fois. Les webhooks dupliqués sont automatiquement rejetés.</span>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Brut ({filtered.length} tx)</div>
          <div className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{fmt(totalGross)}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Net</div>
          <div className="text-lg font-bold font-mono text-green-600">{fmt(totalNet)}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">TPS + TVQ</div>
          <div className="text-lg font-bold font-mono text-blue-600">{fmt(totalTax)}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={14} className="text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher ID interne, provider transaction ID, chauffeur..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusFilters.map(f => (
              <button key={f} onClick={() => setStatusF(f)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-semibold uppercase transition-colors
                  ${statusF === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {platformFilters.map(f => (
              <button key={f} onClick={() => setPlatformF(f)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-semibold uppercase transition-colors
                  ${platformF === f ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['ID Interne', 'Plateforme', 'Provider TX ID', 'Chauffeur', 'Type', 'Brut', 'Frais', 'Pourboire', 'TPS', 'TVQ', 'Net', 'Statut', 'Date'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-qc-blue font-semibold">{tx.internalId}</span>
                  </td>
                  <td className="px-3 py-2.5"><PlatformBadge platform={tx.provider} /></td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[10px] text-slate-500">{tx.providerTransactionId}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{tx.driverName}</div>
                      <div className="text-[10px] font-mono text-qc-blue">{tx.driverGovId}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 capitalize">{tx.activityType}</td>
                  <td className="px-3 py-2.5"><Amount value={tx.grossAmount} size="sm" /></td>
                  <td className="px-3 py-2.5 text-xs font-mono text-red-500">-{fmt(tx.platformFee)}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-green-600">+{fmt(tx.tip)}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{fmt(tx.tps)}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{fmt(tx.tvq)}</td>
                  <td className="px-3 py-2.5"><Amount value={tx.netAmount} size="sm" colored /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={tx.status} /></td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString('fr-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          {filtered.length} transactions affichées · UNIQUE constraint active · Aucune donnée sensible exposée
        </div>
      </Card>
    </AppShell>
  )
}
