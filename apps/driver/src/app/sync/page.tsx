'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockSystemEvents, mockSyncConflicts, mockJobs, mockServiceHealth,
  mockWebhookFailures,
  SERVICE_STATUS_CONF, PRIORITY_CONF,
} from '@/lib/engines/operations.engine'
import { CheckCircle, AlertCircle, Zap, Shield } from 'lucide-react'

export default function SyncPage() {
  const synced = mockSystemEvents.filter(e => e.status === 'PROCESSED').length
  const duplicates = mockSystemEvents.filter(e => e.status === 'DUPLICATE').length
  const deadLetters = mockWebhookFailures.filter(f => f.status === 'DEAD_LETTER').length
  const healthyServices = mockServiceHealth.filter(s => s.status === 'HEALTHY').length

  return (
    <AppShell>
      <PageHeader title="Sync & Webhooks" subtitle="EventBus · Idempotency · Reconciliation · Offline" />
      <div className="px-4">
        {/* Core principles */}
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Shield size={13} className="text-qc-blue-light mt-0.5 shrink-0"/>
          <p className="text-xs text-slate-400">event_id UNIQUE · DUPLICATE ignoré · Données financières: jamais supprimées · App→API→Auth→Service→DB</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Traités', val:synced, color:'text-green-400' },
            { label:'Doublons', val:duplicates, color:duplicates>0?'text-amber-400':'text-slate-500' },
            { label:'Dead Letter', val:deadLetters, color:deadLetters>0?'text-red-400':'text-slate-500' },
            { label:'Services OK', val:healthyServices, color:'text-green-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
              <div className="text-[8px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Event flow diagram */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">Flux de synchronisation</div>
          <div className="space-y-1 text-[10px]">
            {[
              { step:'Driver App', note:'Événement local', color:'text-qc-blue-light' },
              { step:'Offline Queue', note:'Si réseau indisponible', color:'text-amber-400' },
              { step:'API Gateway', note:'Auth · Rate limit · Validation', color:'text-blue-400' },
              { step:'Idempotency Check', note:'event_id UNIQUE — doublon = ignoré', color:'text-purple-400' },
              { step:'Backend Service', note:'Trip · Payment · Taximeter', color:'text-white' },
              { step:'Ledger / Revenue / Tax', note:'Données financières immuables', color:'text-green-400' },
              { step:'Government Dashboard', note:'Vue temps réel selon RBAC', color:'text-slate-300' },
            ].map((f, i) => (
              <div key={f.step} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-400 shrink-0`}>{i+1}</div>
                <div className="flex-1 flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <span className={`font-semibold ${f.color}`}>{f.step}</span>
                  <span className="text-slate-600 text-[9px]">{f.note}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent events with idempotency */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-2">Événements récents</div>
          <div className="space-y-1.5">
            {mockSystemEvents.map(evt => {
              const pConf = PRIORITY_CONF[evt.priority]
              return (
                <div key={evt.id} className={`flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0 text-[10px] ${evt.status === 'DUPLICATE' ? 'opacity-40' : ''}`}>
                  <span className={evt.status === 'PROCESSED' ? 'text-green-400' : evt.status === 'DUPLICATE' ? 'text-amber-400' : 'text-red-400'}>
                    {evt.status === 'PROCESSED' ? '✅' : evt.status === 'DUPLICATE' ? '⚠' : '❌'}
                  </span>
                  <span className="text-slate-400 flex-1 truncate">{evt.eventType}</span>
                  <span className={`text-[8px] font-bold ${pConf.color} shrink-0`}>{evt.priority}</span>
                  {evt.status === 'DUPLICATE' && <span className="text-[8px] text-amber-400 shrink-0">IGNORED</span>}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Sync conflicts */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-2">Conflits de sync</div>
          {mockSyncConflicts.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle size={14}/> Aucun conflit
            </div>
          ) : mockSyncConflicts.map(sc => (
            <div key={sc.id} className="border border-amber-500/20 rounded-xl p-2.5">
              <div className="flex items-center gap-2 mb-1 text-xs">
                <span className="text-amber-400 font-bold">{sc.conflictType}</span>
                <span className={`text-[9px] ${sc.resolution === 'SERVER_WINS' ? 'text-green-400' : 'text-amber-400'}`}>{sc.resolution}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="bg-slate-800/50 rounded-lg p-1.5">
                  <div className="text-slate-500">Local</div>
                  <div className="font-mono text-slate-400">{JSON.stringify(sc.localData)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-1.5">
                  <div className="text-slate-500">Serveur</div>
                  <div className="font-mono text-green-400">{JSON.stringify(sc.serverData)}</div>
                </div>
              </div>
              <div className="text-[9px] text-slate-600 mt-1">Opérations financières: validation serveur requise avant finalisation</div>
            </div>
          ))}
        </Card>

        {/* Jobs */}
        <Card className="mb-6">
          <div className="font-semibold text-white text-sm mb-2">Background jobs</div>
          <div className="text-[9px] text-slate-500 mb-2">Tâches lourdes en queue — API principale non bloquée</div>
          {mockJobs.map(job => (
            <div key={job.id} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
              <span className="text-lg">{job.status === 'COMPLETED' ? '✅' : job.status === 'RUNNING' ? '🔄' : '⏳'}</span>
              <div className="flex-1">
                <div className="font-semibold text-white text-xs">{job.jobType}</div>
                <div className="text-[9px] text-slate-500">{Object.entries(job.metadata).map(([k,v])=>`${k}:${v}`).join(' · ')}</div>
              </div>
              <div className="text-right">
                <div className={`text-[9px] font-bold ${job.status === 'COMPLETED' ? 'text-green-400' : job.status === 'RUNNING' ? 'text-blue-400' : 'text-amber-400'}`}>{job.status}</div>
                <div className="text-[8px] text-slate-600">{PRIORITY_CONF[job.priority].label}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  )
}
