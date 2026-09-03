'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { useTransactions, money } from '@/lib/api'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

const sourceIcon: Record<string, string> = {
  TAXI:'🚕', UBER:'⬛', LYFT:'🟣', DOORDASH:'🔴',
  INSTACART:'🟢', UBER_EATS:'🟡', SKIP:'🟠',
}

const SOURCES = ['', 'TAXI', 'UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP']

export default function TransactionsPage() {
  const [source, setSource] = useState('')
  const { transactions, totals, total, loading, error, refresh } = useTransactions({ source: source || undefined })

  return (
    <AppShell>
      <PageHeader title="Transactions" subtitle={`${total} transaction(s) · Revenue ledger · Supabase`} />
      <div className="px-4 md:px-6 space-y-4 pb-8">

        {/* Totaux ce mois */}
        {(totals as { source_type: string; gross: string; tips: string; net: string; count: string }[]).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(totals as { source_type: string; gross: string; tips: string; net: string; count: string }[]).slice(0, 4).map(t => (
              <Card key={t.source_type} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{sourceIcon[t.source_type] ?? '📦'}</span>
                  <span className="text-xs text-slate-400">{t.source_type}</span>
                </div>
                <div className="font-bold text-green-400 text-sm">{money(t.gross)}</div>
                <div className="text-[10px] text-slate-500">{t.count} transaction(s)</div>
              </Card>
            ))}
          </div>
        )}

        {/* Filtres source */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SOURCES.map(s => (
            <button key={s} onClick={() => setSource(s)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${source === s ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400'}`}>
              {s ? `${sourceIcon[s] ?? ''} ${s}` : 'Toutes'}
            </button>
          ))}
          <button onClick={() => void refresh()} className="ml-auto flex-shrink-0 px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs flex items-center gap-1">
            <RefreshCw size={12} />
          </button>
        </div>

        {loading && <div className="py-16 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}

        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs">Réessayer</button>
          </Card>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <Card className="py-12 text-center"><p className="text-sm text-slate-400">Aucune transaction trouvée.</p></Card>
            ) : transactions.map(tx => (
              <Card key={tx.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sourceIcon[tx.source_type] ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white">{tx.first_name} {tx.last_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{tx.public_driver_id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{tx.source_type}</span>
                      {tx.source_reference && <span className="font-mono">{tx.source_reference}</span>}
                      <span>{tx.activity_date}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-green-400 text-sm">{money(tx.gross_amount)}</div>
                    {parseFloat(tx.tip_amount) > 0 && (
                      <div className="text-[10px] text-blue-400">+{money(tx.tip_amount)} tip</div>
                    )}
                    <div className="text-[10px] text-slate-400">net {money(tx.net_amount)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
