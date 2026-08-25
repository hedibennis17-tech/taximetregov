'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockServiceHealth, mockIncidents, mockPlatformAdmin, type ServiceStatus, type IncidentStatus } from '@/data/operations.mock'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Clock, Wifi } from 'lucide-react'

const statusColors: Record<ServiceStatus, string> = {
  HEALTHY: 'bg-green-100 text-green-700 border-green-200',
  DEGRADED: 'bg-amber-100 text-amber-700 border-amber-200',
  DOWN: 'bg-red-100 text-red-700 border-red-200',
}
const statusDots: Record<ServiceStatus, string> = {
  HEALTHY: 'bg-green-500', DEGRADED: 'bg-amber-500 animate-pulse', DOWN: 'bg-red-500 animate-pulse'
}
const statusIcons: Record<ServiceStatus, React.ReactNode> = {
  HEALTHY: <CheckCircle size={14} className="text-green-600" />,
  DEGRADED: <AlertTriangle size={14} className="text-amber-600" />,
  DOWN: <XCircle size={14} className="text-red-600" />,
}
const incidentStatusColors: Record<IncidentStatus, string> = {
  OPEN: 'bg-red-100 text-red-700', INVESTIGATING: 'bg-orange-100 text-orange-700',
  MITIGATED: 'bg-amber-100 text-amber-700', RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-slate-100 text-slate-600'
}
const platformStatusColors: Record<string, string> = {
  ENABLED: 'bg-green-100 text-green-700', DISABLED: 'bg-slate-100 text-slate-600',
  MAINTENANCE: 'bg-amber-100 text-amber-700', NOT_CONFIGURED: 'bg-slate-100 text-slate-400',
}

export default function SystemHealthPage() {
  const healthy = mockServiceHealth.filter(s => s.status === 'HEALTHY').length
  const degraded = mockServiceHealth.filter(s => s.status === 'DEGRADED').length
  const down = mockServiceHealth.filter(s => s.status === 'DOWN').length
  const openIncidents = mockIncidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length

  return (
    <AppShell>
      <PageHeader
        title="System Health Center"
        subtitle="Services · Incidents · Plateformes · Monitoring"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw size={12} /> Actualiser
          </button>
        }
      />

      {/* Overall status */}
      <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border ${degraded > 0 || down > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <div className={`w-3 h-3 rounded-full ${degraded > 0 || down > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
        <div>
          <span className={`text-sm font-bold ${degraded > 0 || down > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            {degraded > 0 || down > 0 ? 'DÉGRADATION PARTIELLE' : 'TOUS SYSTÈMES OPÉRATIONNELS'}
          </span>
          <span className="text-xs text-slate-500 ml-3">
            {healthy} healthy · {degraded} dégradés · {down} indisponibles · {openIncidents} incidents actifs
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Services sains" value={`${healthy}/${mockServiceHealth.length}`} icon={<CheckCircle size={16} />} color="green" />
        <KpiCard label="Dégradés" value={degraded} icon={<AlertTriangle size={16} />} color="orange" />
        <KpiCard label="Indisponibles" value={down} icon={<XCircle size={16} />} color="red" />
        <KpiCard label="Incidents actifs" value={openIncidents} icon={<AlertTriangle size={16} />} color="red" />
      </div>

      {/* Services grid */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Services infrastructure</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {mockServiceHealth.map(svc => (
          <Card key={svc.name} className={`p-4 ${svc.status === 'DEGRADED' ? 'border-amber-200' : svc.status === 'DOWN' ? 'border-red-200' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusDots[svc.status]}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{svc.name}</div>
                  <div className="text-[10px] text-slate-400">{svc.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusIcons[svc.status]}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColors[svc.status]}`}>{svc.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className={`text-sm font-bold ${svc.latencyMs > 500 ? 'text-red-600' : svc.latencyMs > 200 ? 'text-amber-600' : 'text-green-600'}`}>{svc.latencyMs}ms</div>
                <div className="text-[9px] text-slate-400">Latence</div>
              </div>
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className={`text-sm font-bold ${svc.errorRate > 5 ? 'text-red-600' : svc.errorRate > 1 ? 'text-amber-600' : 'text-green-600'}`}>{svc.errorRate}%</div>
                <div className="text-[9px] text-slate-400">Taux erreur</div>
              </div>
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className={`text-sm font-bold ${svc.uptime < 99 ? 'text-amber-600' : 'text-green-600'}`}>{svc.uptime}%</div>
                <div className="text-[9px] text-slate-400">Uptime</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Incidents */}
      {mockIncidents.length > 0 && (
        <>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Incidents actifs</div>
          <div className="space-y-4 mb-6">
            {mockIncidents.map(inc => (
              <Card key={inc.id} className={`p-5 ${inc.status === 'INVESTIGATING' ? 'border-orange-200' : 'border-amber-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px] text-qc-blue">{inc.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${incidentStatusColors[inc.status]}`}>{inc.status}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{inc.severity}</span>
                    </div>
                    <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{inc.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{inc.service} · Assigné: {inc.assignedTo}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{new Date(inc.startedAt).toLocaleString('fr-CA')}</div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{inc.description}</p>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Timeline</div>
                  {inc.updates.map((u, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0" />
                      {u}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Platform admin */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Administration plateformes</div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Plateforme','Statut','Comptes','OAuth','Webhook','Taux erreur','Notes'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockPlatformAdmin.map(p => (
                <tr key={p.provider} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{p.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${platformStatusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{p.connectedAccounts}</td>
                  <td className="px-4 py-2.5 text-[10px] text-slate-500">{p.oauthConfigured ? '✅' : '⚠ Non configuré'}</td>
                  <td className="px-4 py-2.5 text-[10px] text-slate-500">{p.webhookConfigured ? '✅' : '⚠ Non configuré'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold ${p.errorRate > 5 ? 'text-red-600' : p.errorRate > 1 ? 'text-amber-600' : 'text-green-600'}`}>{p.errorRate}%</span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-slate-400 max-w-48 truncate">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
