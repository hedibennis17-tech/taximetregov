'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Search, Layers, Scale, ShieldAlert, ArrowLeft } from 'lucide-react'
import { getToken } from '@/lib/api'

function money(v: string | number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}

const PROVIDER_ICON: Record<string, string> = {
  TAXI:'🚕', UBER:'⬛', LYFT:'🟣', DOORDASH:'🔴', INSTACART:'🟢', UBER_EATS:'🟡', SKIP:'🟠',
}

interface Transaction {
  id: string; source_type: string; activity_type: string; entry_type: string
  gross_amount: string; fee_amount: string; tip_amount: string; net_amount: string
  currency: string; activity_date: string; is_settled: boolean
  source_reference: string | null; public_driver_id: string
  first_name: string; last_name: string
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(path, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  const json = await res.json() as { success: boolean; data: T; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

export default function TransactionsExplorerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [source, setSource]   = useState('')
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '50' })
      if (source) params.set('source', source)
      const data = await apiFetch<{ transactions: Transaction[]; total: number }>(
        `/api/transactions?${params}`
      )
      setTransactions(data.transactions.filter(t =>
        !search || `${t.first_name} ${t.last_name} ${t.public_driver_id} ${t.source_reference ?? ''}`.toLowerCase().includes(search.toLowerCase())
      ))
      setTotal(data.total)
    } catch { /* silencieux */ } finally { setLoading(false) }
  }, [source, search])

  useEffect(() => { void load() }, [load])

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/provider-transparency" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={13} /> Vue globale
          </Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white font-semibold">Explorateur de transactions</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { href: '/provider-transparency', icon: Layers, label: 'Vue globale', active: false },
            { href: '/provider-transparency/transactions', icon: Layers, label: 'Transactions', active: true },
            { href: '/provider-transparency/reconciliation', icon: Scale, label: 'Réconciliation', active: false },
            { href: '/provider-transparency/exceptions', icon: ShieldAlert, label: 'Exceptions', active: false },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.active ? 'bg-qc-blue text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={12} />{item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Nom chauffeur, ID, référence…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-qc-blue" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'TAXI', 'UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP'].map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${source === s ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {s ? `${PROVIDER_ICON[s] ?? ''} ${s}` : 'Tous'}
              </button>
            ))}
          </div>
          <button onClick={() => void load()} className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 flex items-center gap-1 text-xs">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {total}
          </button>
        </div>

        {loading && <div className="py-16 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}

        {!loading && (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              <span>Chauffeur · Référence</span><span>Source</span><span>Brut client</span>
              <span>Pourboire</span><span>Net chauffeur</span><span>Date</span>
            </div>

            {transactions.length === 0 ? (
              <Card className="py-12 text-center"><p className="text-sm text-slate-400">Aucune transaction trouvée.</p></Card>
            ) : transactions.map(tx => (
              <Card key={tx.id} className="p-0 overflow-hidden hover:border-qc-blue/30 transition-colors">
                <div className="p-3">
                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{PROVIDER_ICON[tx.source_type] ?? '📦'}</span>
                      <span className="font-semibold text-white text-sm">{tx.first_name} {tx.last_name}</span>
                      <span className="ml-auto font-bold text-green-400">{money(tx.gross_amount)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{tx.source_type} · {tx.activity_date}</span>
                      <span>net {money(tx.net_amount)}</span>
                    </div>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                    <div>
                      <div className="font-semibold text-white text-sm">{tx.first_name} {tx.last_name}</div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                        <span className="font-mono">{tx.public_driver_id}</span>
                        {tx.source_reference && <><span className="text-slate-700">·</span><span className="font-mono">{tx.source_reference}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{PROVIDER_ICON[tx.source_type] ?? '📦'}</span>
                      <span className="text-xs text-white">{tx.source_type}</span>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">{money(tx.gross_amount)}</div>
                      <div className="text-[9px] text-slate-500">brut</div>
                    </div>
                    <div className="font-mono text-purple-400">{money(tx.tip_amount)}</div>
                    <div>
                      <div className="font-bold text-blue-400">{money(tx.net_amount)}</div>
                      <div className={`text-[9px] ${tx.is_settled ? 'text-green-500' : 'text-amber-500'}`}>
                        {tx.is_settled ? 'Réglé' : 'En attente'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{new Date(tx.activity_date).toLocaleDateString('fr-CA')}</div>
                  </div>

                  {/* Breakdown bar */}
                  {parseFloat(tx.gross_amount) > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/50">
                      <div className="flex rounded-full overflow-hidden h-1 bg-slate-800">
                        <div className="bg-blue-500" style={{ width: `${Math.min((parseFloat(tx.net_amount)/parseFloat(tx.gross_amount))*100,100)}%` }} />
                        <div className="bg-purple-500" style={{ width: `${Math.min((parseFloat(tx.tip_amount)/parseFloat(tx.gross_amount))*100,100)}%` }} />
                        <div className="bg-slate-600 flex-1" />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
