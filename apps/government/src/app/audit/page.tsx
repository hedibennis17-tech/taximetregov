'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { useAuditLogs } from '@/lib/api'
import { useState } from 'react'
import { Shield, RefreshCw, Search } from 'lucide-react'

const severityColor: Record<string, string> = {
  DEBUG:    'text-slate-400 bg-slate-800',
  INFO:     'text-blue-400 bg-blue-500/10',
  WARNING:  'text-amber-400 bg-amber-500/10',
  HIGH:     'text-orange-400 bg-orange-500/10',
  CRITICAL: 'text-red-400 bg-red-500/10',
}

const resultColor: Record<string, string> = {
  SUCCESS: 'text-green-400',
  FAILURE: 'text-red-400',
  BLOCKED: 'text-orange-400',
  PARTIAL: 'text-amber-400',
}

export default function AuditPage() {
  const [severity, setSeverity] = useState('')
  const [search, setSearch]     = useState('')
  const { logs, total, loading, error, refresh } = useAuditLogs({ severity: severity || undefined, search: search || undefined })

  return (
    <AppShell>
      <PageHeader title="Journal d'audit" subtitle={`${total} entrée(s) · Append-only · Données Supabase`} />
      <div className="px-4 md:px-6 space-y-4 pb-8">

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher action, ressource…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-qc-blue" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'INFO', 'WARNING', 'HIGH', 'CRITICAL'].map(s => (
              <button key={s} onClick={() => setSeverity(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${severity === s ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400'}`}>
                {s || 'Tous'}
              </button>
            ))}
            <button onClick={() => void refresh()} className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs flex items-center gap-1">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && <div className="py-16 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}

        {/* Error */}
        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs">Réessayer</button>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && logs.length === 0 && (
          <Card className="py-12 text-center">
            <Shield size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucun log d'audit trouvé.</p>
          </Card>
        )}

        {/* Logs */}
        {!loading && !error && logs.length > 0 && (
          <div className="space-y-2">
            {logs.map(log => (
              <Card key={log.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${severityColor[log.severity] ?? 'text-slate-400 bg-slate-800'}`}>
                        {log.severity}
                      </span>
                      <span className={`text-[10px] font-bold ${resultColor[log.result] ?? 'text-white'}`}>{log.result}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{log.module}</span>
                    </div>
                    <div className="text-xs font-mono text-white truncate">{log.action}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                      {log.actor_email && <span>👤 {log.actor_email}</span>}
                      {log.resource_id && <span>🔗 {log.resource_id}</span>}
                      {log.subject_driver_public_id && <span>🚕 {log.subject_driver_public_id}</span>}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 shrink-0 text-right">
                    {new Date(log.occurred_at).toLocaleString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
