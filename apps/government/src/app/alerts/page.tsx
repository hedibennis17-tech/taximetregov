'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, AlertBadge } from '@/components/ui'
import { mockAlerts, type AlertPriority } from '@/data/mock'
import { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'

const priorityFilters: (AlertPriority | 'all')[] = ['all', 'critical', 'high', 'medium', 'low']
const typeIcons: Record<string, string> = {
  document_expired: '📄', api_disconnected: '🔌', revenue_anomaly: '📊',
  tax_mismatch: '💰', duplicate_attempt: '⚠️', document_expiring: '📋',
  webhook_failure: '🔔', suspended_driver: '🚫',
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertPriority | 'all'>('all')
  const [showResolved, setShowResolved] = useState(false)

  const filtered = mockAlerts.filter(a => {
    return (filter === 'all' || a.priority === filter) && (showResolved || !a.resolved)
  })

  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  mockAlerts.filter(a => !a.resolved).forEach(a => counts[a.priority]++)

  return (
    <AppShell>
      <PageHeader title="Centre d'alertes" subtitle="Alertes de conformité, système et fiscales" />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {([['critical','🔴','Critiques','red'],['high','🟠','Élevées','orange'],['medium','🟡','Moyennes','amber'],['low','🔵','Faibles','slate']] as const).map(([p, icon, label, color]) => (
          <button key={p} onClick={() => setFilter(f => f === p ? 'all' : p)}
            className={`p-4 rounded-xl border text-left transition-all
              ${filter === p ? `bg-${color}-100 border-${color}-300 dark:bg-${color}-950` : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}
              hover:border-${color}-300`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-2xl font-bold ${filter === p ? `text-${color}-600` : 'text-slate-700 dark:text-slate-200'}`}>{counts[p]}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {priorityFilters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${filter === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>
              {f === 'all' ? 'Toutes' : f.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setShowResolved(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto
            ${showResolved ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          <CheckCircle size={13} />
          {showResolved ? 'Masquer résolues' : 'Afficher résolues'}
        </button>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map(a => (
          <Card key={a.id} className={`p-4 ${a.resolved ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4">
              <span className="text-2xl shrink-0">{typeIcons[a.type] || '⚠️'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <AlertBadge priority={a.priority} />
                  {a.resolved && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
                      <CheckCircle size={11} /> Résolue
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{a.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{a.message}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400">
                  {a.driverGovId && <span className="font-mono text-qc-blue">{a.driverGovId} — {a.driverName}</span>}
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(a.createdAt).toLocaleString('fr-CA')}</span>
                </div>
              </div>
              {!a.resolved && (
                <div className="flex gap-2 shrink-0">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors">
                    Enquêter
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                    Résoudre
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-sm font-medium text-slate-600">Aucune alerte active</div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
