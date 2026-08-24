'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, StatusBadge, PlatformBadge } from '@/components/ui'
import { type Platform } from '@/data/mock'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react'

type WebhookStatus = 'received' | 'verified' | 'processed' | 'duplicate' | 'failed' | 'retrying' | 'rejected'

interface WebhookEvent {
  id: string
  provider: Platform
  eventType: string
  txId?: string
  receivedAt: string
  processedAt?: string
  status: WebhookStatus
  retryCount: number
  signatureStatus: 'valid' | 'invalid' | 'missing'
  error?: string
  durationMs?: number
}

const mockWebhooks: WebhookEvent[] = [
  { id: 'wh-001', provider: 'uber', eventType: 'TRIP_COMPLETED', txId: 'UBER-TRIP-10087', receivedAt: '2026-08-24T14:55:01Z', processedAt: '2026-08-24T14:55:02Z', status: 'processed', retryCount: 0, signatureStatus: 'valid', durationMs: 142 },
  { id: 'wh-002', provider: 'uber', eventType: 'TRIP_COMPLETED', txId: 'UBER-TRIP-10087', receivedAt: '2026-08-24T14:55:08Z', status: 'duplicate', retryCount: 0, signatureStatus: 'valid', error: 'UNIQUE constraint: provider_transaction_id already exists', durationMs: 12 },
  { id: 'wh-003', provider: 'doordash', eventType: 'DELIVERY_COMPLETE', txId: 'DD-DEL-20134', receivedAt: '2026-08-24T14:32:00Z', status: 'failed', retryCount: 5, signatureStatus: 'valid', error: 'Connection timeout après 5 tentatives' },
  { id: 'wh-004', provider: 'skip', eventType: 'ORDER_DELIVERED', txId: 'SKIP-ORD-55021', receivedAt: '2026-08-24T13:48:00Z', status: 'retrying', retryCount: 3, signatureStatus: 'valid' },
  { id: 'wh-005', provider: 'lyft', eventType: 'RIDE_COMPLETED', txId: 'LYFT-RIDE-88902', receivedAt: '2026-08-24T13:10:00Z', processedAt: '2026-08-24T13:10:01Z', status: 'processed', retryCount: 0, signatureStatus: 'valid', durationMs: 98 },
  { id: 'wh-006', provider: 'ubereats', eventType: 'PAYMENT_RECEIVED', txId: 'UBE-PAY-77231', receivedAt: '2026-08-24T12:00:00Z', processedAt: '2026-08-24T12:00:01Z', status: 'processed', retryCount: 0, signatureStatus: 'valid', durationMs: 201 },
  { id: 'wh-007', provider: 'instacart', eventType: 'BATCH_PAYMENT', receivedAt: '2026-08-24T10:00:00Z', status: 'rejected', retryCount: 0, signatureStatus: 'invalid', error: 'Signature HMAC-SHA256 invalide — Webhook rejeté' },
  { id: 'wh-008', provider: 'taxi', eventType: 'TRIP_CLOSED', txId: 'TAXI-MTR-33412', receivedAt: '2026-08-24T09:45:00Z', processedAt: '2026-08-24T09:45:01Z', status: 'processed', retryCount: 0, signatureStatus: 'valid', durationMs: 55 },
]

const statusConfig: Record<WebhookStatus, { color: string; icon: React.ReactNode; label: string }> = {
  received: { color: 'bg-blue-100 text-blue-700', icon: <Clock size={11} />, label: 'Reçu' },
  verified: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={11} />, label: 'Vérifié' },
  processed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={11} />, label: 'Traité' },
  duplicate: { color: 'bg-amber-100 text-amber-700', icon: <AlertCircle size={11} />, label: 'Doublon' },
  failed: { color: 'bg-red-100 text-red-700', icon: <XCircle size={11} />, label: 'Échec' },
  retrying: { color: 'bg-orange-100 text-orange-700', icon: <RefreshCw size={11} />, label: 'Nouvelle tentative' },
  rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle size={11} />, label: 'Rejeté' },
}

export default function WebhooksPage() {
  const processed = mockWebhooks.filter(w => w.status === 'processed').length
  const duplicates = mockWebhooks.filter(w => w.status === 'duplicate').length
  const failed = mockWebhooks.filter(w => w.status === 'failed' || w.status === 'retrying').length
  const rejected = mockWebhooks.filter(w => w.status === 'rejected').length

  return (
    <AppShell>
      <PageHeader title="Surveillance des webhooks" subtitle="Événements entrants — Validation HMAC · Idempotence · Anti-doublon" />

      {/* Architecture note */}
      <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Architecture idempotente (pilote — intégrations réelles non actives)</div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-500">
          <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded border">Webhook entrant</span>
          <span>→</span>
          <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded border">Validation HMAC-SHA256</span>
          <span>→</span>
          <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded border">Parse payload</span>
          <span>→</span>
          <span className="px-2 py-1 bg-qc-blue text-white rounded border border-qc-blue">UNIQUE check</span>
          <span>→</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded border">INSERT transaction</span>
        </div>
        <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          ⚠ Les intégrations réelles Uber/Lyft/DoorDash/Instacart/Uber Eats/Skip ne sont pas actives en pilote. Ces événements sont simulés.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Traités', val: processed, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Doublons bloqués', val: duplicates, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Échecs/Retry', val: failed, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
          { label: 'Rejetés (sig. invalide)', val: rejected, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Event log */}
      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Journal des événements webhook</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Event ID', 'Plateforme', 'Type', 'Transaction ID', 'Reçu', 'Statut', 'Signature', 'Retry', 'Durée', 'Erreur'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockWebhooks.map(w => {
                const sc = statusConfig[w.status]
                return (
                  <tr key={w.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{w.id}</td>
                    <td className="px-3 py-2.5"><PlatformBadge platform={w.provider} /></td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600 dark:text-slate-400">{w.eventType}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-qc-blue">{w.txId || '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(w.receivedAt).toLocaleTimeString('fr-CA')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-semibold ${w.signatureStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                        {w.signatureStatus === 'valid' ? '✅ Valide' : w.signatureStatus === 'invalid' ? '❌ Invalide' : '⚠ Absente'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{w.retryCount}</td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{w.durationMs ? `${w.durationMs}ms` : '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-red-500 max-w-48 truncate">{w.error || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
