'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockSecurityAlerts, rateLimits, dependencyAudit, type SecurityAlertStatus } from '@/data/security.mock'
import { useState } from 'react'
import { AlertTriangle, CheckCircle, Search, Package } from 'lucide-react'

const severityBg: Record<string,string> = { CRITICAL:'border-red-300', HIGH:'border-orange-200', MEDIUM:'border-amber-200', LOW:'border-slate-200' }
const statusBadge: Record<string,string> = { OPEN:'bg-red-100 text-red-700', INVESTIGATING:'bg-orange-100 text-orange-700', RESOLVED:'bg-green-100 text-green-700', DISMISSED:'bg-slate-100 text-slate-500' }
const alertIcons: Record<string,string> = { MULTIPLE_FAILED_LOGIN:'🔐', WEBHOOK_SIGNATURE_FAILURE:'🔔', UNUSUAL_ACCESS:'👁️', PRIVILEGE_CHANGE:'🔑', MASS_EXPORT:'📤', RATE_LIMIT:'🚦', SUSPICIOUS_ACTIVITY:'⚠️' }

export default function SecurityMonitoringPage() {
  const [filter, setFilter] = useState<SecurityAlertStatus | 'all'>('all')
  const [tab, setTab] = useState<'alerts'|'ratelimit'|'deps'>('alerts')
  const filtered = filter === 'all' ? mockSecurityAlerts : mockSecurityAlerts.filter(a => a.status === filter)

  return (
    <AppShell>
      <PageHeader title="Security Monitoring" subtitle="Alertes · Rate Limiting · Audit dépendances" />

      <div className="flex gap-1 mb-5">
        {[['alerts','Alertes de sécurité'],['ratelimit','Rate Limits'],['deps','Dépendances']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === k ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <KpiCard label="Ouvertes" value={mockSecurityAlerts.filter(a=>a.status==='OPEN').length} icon={<AlertTriangle size={16}/>} color="red" />
            <KpiCard label="Investigation" value={mockSecurityAlerts.filter(a=>a.status==='INVESTIGATING').length} icon={<Search size={16}/>} color="orange" />
            <KpiCard label="Résolues" value={mockSecurityAlerts.filter(a=>a.status==='RESOLVED').length} icon={<CheckCircle size={16}/>} color="green" />
          </div>
          <div className="flex gap-1 mb-4 flex-wrap">
            {(['all','OPEN','INVESTIGATING','RESOLVED','DISMISSED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Toutes' : f}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map(alert => (
              <Card key={alert.id} className={`p-4 border ${severityBg[alert.severity]}`}>
                <div className="flex items-start gap-4">
                  <span className="text-xl shrink-0 mt-0.5">{alertIcons[alert.type]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{alert.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{alert.severity}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge[alert.status]}`}>{alert.status}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 leading-relaxed">{alert.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                      {alert.actor && <span>Acteur : <span className="font-mono text-qc-blue">{alert.actor}</span></span>}
                      {alert.ipAddress && <span>IP : <span className="font-mono">{alert.ipAddress}</span></span>}
                      {alert.affectedResource && <span>Ressource : <code className="text-[9px]">{alert.affectedResource}</code></span>}
                      <span>{new Date(alert.timestamp).toLocaleString('fr-CA')}</span>
                    </div>
                  </div>
                  {alert.status === 'OPEN' && (
                    <div className="flex gap-2 shrink-0">
                      <button className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors">Investiguer</button>
                      <button className="px-3 py-1.5 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Rejeter</button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'ratelimit' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Rate Limiting — Configuration</div>
            <div className="text-[10px] text-slate-400">Protection DDoS · Throttling · Anti-abus</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {rateLimits.map(rl => (
              <div key={rl.endpoint} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-xs font-mono text-qc-blue">{rl.endpoint}</code>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{rl.limit}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Action : {rl.action}</div>
                </div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] text-green-600 font-bold">ACTIF</span></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'deps' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Audit des dépendances</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {dependencyAudit.map(dep => (
              <div key={dep.package} className="px-4 py-3 flex items-center gap-4">
                <Package size={14} className="text-slate-400 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-0.5">
                    <code className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">{dep.package}</code>
                    <code className="text-[10px] font-mono text-slate-400">v{dep.version}</code>
                  </div>
                  <div className="text-[10px] text-slate-500">{dep.note}</div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${dep.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{dep.status === 'OK' ? '✅ OK' : '⚠ WARN'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  )
}
