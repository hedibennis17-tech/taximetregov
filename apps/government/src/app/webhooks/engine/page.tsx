'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, PlatformBadge, StatusBadge } from '@/components/ui'
import { mockWebhookEvents, retryQueue, deadLetterQueue, gatewayKpis } from '@/data/gateway.mock'
import { useState } from 'react'
import { CheckCircle, XCircle, Copy, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react'
import type { WebhookStatus, PlatformCode } from '@/data/gateway.mock'

const statusColors: Record<string, string> = {
  PROCESSED: 'bg-green-100 text-green-700', DUPLICATE: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700', REJECTED: 'bg-red-100 text-red-800',
  RETRYING: 'bg-orange-100 text-orange-700', RECEIVED: 'bg-blue-100 text-blue-700',
  VERIFIED: 'bg-blue-100 text-blue-700', DEAD_LETTER: 'bg-red-200 text-red-900',
}

export default function WebhookEnginePage() {
  const [filter, setFilter] = useState<WebhookStatus | 'all'>('all')
  const [provFilter, setProvFilter] = useState<PlatformCode | 'all'>('all')

  const providers: PlatformCode[] = ['uber','lyft','doordash','instacart','ubereats','skip','taxi']
  const statuses: WebhookStatus[] = ['PROCESSED','DUPLICATE','FAILED','REJECTED','RETRYING','DEAD_LETTER']

  const filtered = mockWebhookEvents.filter(e =>
    (filter === 'all' || e.status === filter) &&
    (provFilter === 'all' || e.provider === provFilter)
  )

  return (
    <AppShell>
      <PageHeader title="Webhook Engine" subtitle="Pipeline idempotent · UNIQUE(provider, event_id) · Signature HMAC · Anti-doublon" />

      {/* Pipeline diagram */}
      <Card className="mb-5 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Pipeline de traitement</div>
        <div className="flex items-stretch gap-0 overflow-x-auto">
          {[
            { step: '1', label: 'Receive', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { step: '2', label: 'Validate', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { step: '3', label: 'Verify Sig.', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            { step: '4', label: 'Dedup Check', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { step: '5', label: 'Persist Raw', color: 'bg-slate-100 text-slate-700 border-slate-200' },
            { step: '6', label: 'Normalize', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
            { step: '7', label: 'UNIQUE(tx)', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { step: '8', label: 'Ledger Write', color: 'bg-green-100 text-green-700 border-green-200' },
            { step: '9', label: 'Tax Engine', color: 'bg-green-100 text-green-700 border-green-200' },
            { step: '10', label: 'Audit + Notify', color: 'bg-qc-blue/10 text-qc-blue border-blue-200' },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex items-center">
              <div className={`px-2.5 py-2 rounded-lg border text-[9px] font-bold text-center shrink-0 ${s.color}`}>
                <div className="text-[8px] opacity-60">{s.step}</div>
                <div>{s.label}</div>
              </div>
              {i < arr.length - 1 && <div className="text-slate-300 text-[10px] px-0.5">→</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total aujourd\'hui', val: gatewayKpis.webhookEventsToday, c: 'text-slate-700 dark:text-slate-200', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Traités (PROCESSED)', val: gatewayKpis.successfulEventsToday, c: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Doublons bloqués', val: gatewayKpis.duplicatesBlocked, c: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Échoués/Rejetés', val: gatewayKpis.failedEventsToday, c: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800 ${s.bg}`}>
            <div className={`text-3xl font-bold ${s.c}`}>{s.val.toLocaleString('fr-CA')}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dead Letter Queue */}
      {deadLetterQueue.length > 0 && (
        <Card className="mb-5 border-red-200">
          <div className="px-4 py-3 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-600" />
            <div className="font-semibold text-sm text-red-700">Dead Letter Queue ({deadLetterQueue.length})</div>
            <div className="text-xs text-red-500 ml-1">— Échecs définitifs · Intervention manuelle requise</div>
          </div>
          <div className="divide-y divide-red-50">
            {deadLetterQueue.map(e => (
              <div key={e.id} className="px-4 py-3 flex items-center gap-4">
                <PlatformBadge platform={e.provider as any} />
                <div className="flex-1">
                  <div className="font-mono text-xs text-slate-600">{e.eventType} · {e.providerTxId}</div>
                  <div className="text-xs text-red-500 mt-0.5">{e.error}</div>
                </div>
                <div className="text-[10px] text-slate-400">{e.retryCount} tentatives</div>
                <div className="flex gap-1.5">
                  <button className="px-2 py-1 text-[10px] font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1">
                    <RotateCcw size={10} /> Replay
                  </button>
                  <button className="px-2 py-1 text-[10px] font-medium rounded bg-slate-100 text-slate-600 hover:bg-slate-200">Inspecter</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Retry Queue */}
      {retryQueue.length > 0 && (
        <Card className="mb-5 border-orange-200">
          <div className="px-4 py-3 border-b border-orange-100 flex items-center gap-2">
            <RefreshCw size={14} className="text-orange-600" />
            <div className="font-semibold text-sm text-orange-700">File de retry ({retryQueue.length})</div>
          </div>
          <div className="divide-y divide-orange-50">
            {retryQueue.slice(0, 4).map(e => (
              <div key={e.id} className="px-4 py-3 flex items-center gap-4">
                <PlatformBadge platform={e.provider as any} />
                <div className="flex-1">
                  <div className="font-mono text-xs text-slate-600">{e.eventType}</div>
                  <div className="text-xs text-orange-600 mt-0.5">{e.error}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-orange-600 font-semibold">
                  <RefreshCw size={10} /> {e.retryCount}/5
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            {(['all', ...statuses] as const).map(f => (
              <button key={f} onClick={() => setFilter(f as any)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-colors
                  ${filter === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Tous' : f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setProvFilter('all')}
              className={`px-2 py-1.5 rounded text-[10px] font-semibold transition-colors ${provFilter === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
              Toutes
            </button>
            {providers.map(p => (
              <button key={p} onClick={() => setProvFilter(p as any)}
                className={`px-2 py-1.5 rounded text-[10px] font-semibold uppercase transition-colors
                  ${provFilter === p ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {p}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto self-center">{filtered.length} événements</span>
        </div>
      </Card>

      {/* Event table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['ID Événement','Plateforme','Type','Provider TX ID','Statut','Signature','Reçu','Durée','Retry','Erreur','Chauffeur'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(e => (
                <tr key={e.id} className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                  ${e.status === 'DUPLICATE' ? 'bg-amber-50/30' : e.status === 'FAILED' || e.status === 'REJECTED' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-2 font-mono text-[9px] text-slate-500">{e.id}</td>
                  <td className="px-3 py-2"><PlatformBadge platform={e.provider as any} /></td>
                  <td className="px-3 py-2 font-mono text-[9px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{e.eventType}</td>
                  <td className="px-3 py-2 font-mono text-[9px] text-qc-blue">{e.providerTxId}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColors[e.status] || 'bg-slate-100 text-slate-600'}`}>
                      {e.status === 'PROCESSED' && <CheckCircle size={9} />}
                      {e.status === 'DUPLICATE' && '⚠'}
                      {(e.status === 'FAILED' || e.status === 'REJECTED') && <XCircle size={9} />}
                      {e.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[9px] font-bold ${e.signatureStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                      {e.signatureStatus === 'valid' ? '✅' : '❌'} {e.signatureStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[9px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(e.receivedAt).toLocaleTimeString('fr-CA')}
                  </td>
                  <td className="px-3 py-2 text-[9px] font-mono text-slate-500">{e.durationMs ? `${e.durationMs}ms` : '—'}</td>
                  <td className="px-3 py-2 text-[9px] font-mono text-slate-500">{e.retryCount || 0}</td>
                  <td className="px-3 py-2 text-[9px] text-red-500 max-w-40 truncate">{e.error || '—'}</td>
                  <td className="px-3 py-2 text-[9px] font-mono text-qc-blue">{e.governmentUserId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
          {filtered.length} événements · UNIQUE(provider, event_id) actif · Signatures vérifiées
        </div>
      </Card>
    </AppShell>
  )
}
