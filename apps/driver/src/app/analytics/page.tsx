'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockLiveDrivers, mockSystemEvents, mockAlerts, mockIncidents,
  mockServiceHealth, mockWebhookFailures, mockJobs,
  mockOpsNotifications, mockPilot, mockSyncConflicts, mockAnnouncements,
  FEATURE_FLAGS, RETENTION_POLICIES,
  DRIVER_STATUS_CONF, SERVICE_STATUS_CONF, ALERT_SEVERITY_CONF, PRIORITY_CONF,
  type DriverLiveStatus, type AlertSeverity, type ServiceStatus,
} from '@/lib/engines/operations.engine'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Zap, Shield } from 'lucide-react'

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'live' | 'events' | 'alerts' | 'health' | 'ops'>('live')

  const onlineDrivers   = mockLiveDrivers.filter(d => d.status !== 'OFFLINE').length
  const activeTrips     = mockLiveDrivers.filter(d => d.status === 'ON_TRIP').length
  const deliveries      = mockLiveDrivers.filter(d => d.status === 'ON_DELIVERY').length
  const openAlerts      = mockAlerts.filter(a => a.status !== 'CLOSED' && a.status !== 'RESOLVED').length
  const criticalAlerts  = mockAlerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
  const degradedServices = mockServiceHealth.filter(s => s.status === 'DEGRADED' || s.status === 'DOWN').length

  return (
    <AppShell>
      <PageHeader title="Centre opérationnel" subtitle="Live · Events · Alertes · Santé système · Ops" />
      <div className="px-4">
        {/* Pilot banner */}
        {mockAnnouncements.map(ann => (
          <div key={ann.id} className={`flex items-start gap-2 p-3 rounded-2xl border mb-4 ${ann.severity === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-500/10 border-blue-500/20'}`}>
            <AlertCircle size={13} className={ann.severity === 'WARNING' ? 'text-amber-400' : 'text-blue-400'} />
            <div>
              <div className="font-bold text-white text-xs">{ann.title}</div>
              <div className="text-[10px] text-slate-300">{ann.message}</div>
            </div>
          </div>
        ))}

        {/* Live KPIs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:'Chauffeurs en ligne', val:onlineDrivers, total:mockLiveDrivers.length, color:'text-green-400' },
            { label:'Courses actives', val:activeTrips, color:'text-qc-blue-light' },
            { label:'Livraisons', val:deliveries, color:'text-orange-400' },
            { label:'Alertes ouvertes', val:openAlerts, color:openAlerts>0?'text-amber-400':'text-slate-500' },
            { label:'Services dégradés', val:degradedServices, color:degradedServices>0?'text-red-400':'text-slate-500' },
            { label:'Pilote actif', val:mockPilot.status === 'ACTIVE' ? '✓' : '✗', color:mockPilot.status === 'ACTIVE'?'text-green-400':'text-slate-500', str:true },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
              <div className="text-[8px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['live','🔴 Live'],['events','📡 Events'],['alerts','⚠️ Alertes'],['health','💚 Santé'],['ops','⚙️ Ops']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── LIVE ──────────────────────────────────── */}
        {tab === 'live' && (
          <div className="space-y-3 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Taximètre = DISABLED pour DELIVERY toujours · GPS anomaly ≠ fraude automatique</div>
            {mockLiveDrivers.map(driver => {
              const conf = DRIVER_STATUS_CONF[driver.status]
              return (
                <div key={driver.driverId} className={`driver-card p-4 border ${driver.status === 'ON_TRIP' ? 'border-qc-blue/30' : driver.status === 'EMERGENCY' ? 'border-red-500/50' : driver.status === 'SUSPENDED' ? 'border-red-500/20' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${conf.dot}`}/>
                    <span className="text-xl">{conf.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{driver.driverNumber}</span>
                        <span className={`text-[9px] font-bold ${conf.color}`}>{driver.status}</span>
                        {driver.serviceMode && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{driver.serviceMode}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] mt-0.5">
                        <span className={`${driver.taximeterStatus === 'ACTIVE' ? 'text-qc-blue-light' : driver.taximeterStatus === 'DISABLED' ? 'text-slate-600' : 'text-amber-400'}`}>
                          Txm: {driver.taximeterStatus}
                        </span>
                        <span className={`${driver.gpsHealth === 'GOOD' ? 'text-green-400' : driver.gpsHealth === 'LOST' ? 'text-red-400' : 'text-amber-400'}`}>
                          GPS: {driver.gpsHealth}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {driver.currentTripId && <div className="font-mono text-[9px] text-qc-blue-light">{driver.currentTripId}</div>}
                      <div className="text-[9px] text-slate-600">{new Date(driver.lastUpdate).toLocaleTimeString('fr-CA')}</div>
                    </div>
                  </div>
                  {driver.serviceMode === 'DELIVERY' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
                      <Shield size={9}/> DELIVERY → Taximeter: DISABLED (non contournable)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ─── EVENTS ───────────────────────────────── */}
        {tab === 'events' && (
          <div className="mb-6">
            <div className="text-[10px] text-slate-500 mb-3">event_id UNIQUE · Jamais traité deux fois · DUPLICATE = ignoré silencieusement</div>
            <div className="driver-card divide-y divide-slate-800">
              {mockSystemEvents.map(evt => {
                const pConf = PRIORITY_CONF[evt.priority]
                return (
                  <div key={evt.id} className={`p-3.5 flex items-start gap-3 ${evt.status === 'DUPLICATE' ? 'opacity-50' : ''}`}>
                    <div className="shrink-0 mt-0.5">
                      <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${pConf.color} bg-slate-800`}>{pConf.label}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-xs">{evt.eventType}</span>
                        {evt.status === 'DUPLICATE' && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">DUPLICATE IGNORED</span>}
                        {evt.status === 'PROCESSED' && <span className="text-[9px] text-green-400">✅ TRAITÉ</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{evt.sourceService} · {evt.resourceType}{evt.resourceId ? ` · ${evt.resourceId}` : ''}</div>
                      <div className="text-[9px] text-slate-600 font-mono">corr:{evt.correlationId}</div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {Object.entries(evt.metadata).slice(0,3).map(([k,v]) => (
                          <span key={k} className="text-[8px] bg-slate-800 text-slate-500 px-1 py-0.5 rounded font-mono">{k}:{String(v)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-600 shrink-0">{new Date(evt.timestamp).toLocaleTimeString('fr-CA')}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── ALERTS ───────────────────────────────── */}
        {tab === 'alerts' && (
          <div className="space-y-3 mb-6">
            {mockAlerts.map(alert => {
              const conf = ALERT_SEVERITY_CONF[alert.severity]
              return (
                <div key={alert.id} className={`driver-card p-4 border ${alert.severity === 'CRITICAL' ? 'border-red-500/30' : alert.severity === 'HIGH' ? 'border-orange-500/20' : alert.severity === 'WARNING' ? 'border-amber-500/20' : 'border-slate-800'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-xl shrink-0">{conf.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`font-bold text-xs ${conf.color}`}>{alert.severity}</span>
                        <span className="font-semibold text-white text-xs">{alert.type}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-auto ${alert.status === 'RESOLVED' || alert.status === 'CLOSED' ? 'bg-green-500/20 text-green-400' : alert.status === 'INVESTIGATING' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {alert.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mb-1">{alert.message}</div>
                      <div className="text-[9px] text-slate-600">
                        {new Date(alert.createdAt).toLocaleString('fr-CA')}
                        {alert.assignedTo && ` · ${alert.assignedTo}`}
                      </div>
                    </div>
                  </div>
                  {alert.status === 'CREATED' && (
                    <button className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
                      Prendre en charge
                    </button>
                  )}
                </div>
              )
            })}

            {/* Incidents */}
            {mockIncidents.map(inc => (
              <div key={inc.id} className="driver-card p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔥</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">INCIDENT</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">{inc.status}</span>
                    </div>
                    <div className="text-xs text-slate-400">{inc.description}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {inc.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-[9px]">
                      <span className="text-slate-600 shrink-0 tabular-nums">{new Date(t.timestamp).toLocaleTimeString('fr-CA')}</span>
                      <span className="text-qc-blue-light shrink-0 font-bold">{t.action}</span>
                      <span className="text-slate-400">{t.comment}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── HEALTH ───────────────────────────────── */}
        {tab === 'health' && (
          <div className="space-y-4 mb-6">
            {/* Services */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Santé des services</div>
              <div className="space-y-1.5">
                {mockServiceHealth.map(svc => {
                  const conf = SERVICE_STATUS_CONF[svc.status]
                  return (
                    <div key={svc.service} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
                      <span className="text-sm">{conf.icon}</span>
                      <span className="text-xs text-slate-300 flex-1">{svc.service}</span>
                      {svc.latencyMs && <span className="text-[10px] text-slate-500 tabular-nums">{svc.latencyMs}ms</span>}
                      {svc.errorRate !== null && svc.errorRate > 0 && (
                        <span className={`text-[9px] ${svc.errorRate > 0.05 ? 'text-red-400' : 'text-amber-400'}`}>
                          {(svc.errorRate*100).toFixed(1)}% err
                        </span>
                      )}
                      <span className={`text-[9px] font-bold ${conf.color}`}>{svc.status}</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Webhook failures */}
            <Card className="border-amber-500/20">
              <div className="font-semibold text-white text-sm mb-2">File d'attente webhook</div>
              {mockWebhookFailures.map(wf => (
                <div key={wf.id} className={`flex items-start gap-2 p-2.5 rounded-xl mb-2 border ${wf.status === 'DEAD_LETTER' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                  <span className="text-lg">{wf.status === 'DEAD_LETTER' ? '💀' : '🔁'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{wf.provider}</span>
                      <span className={`text-[9px] font-bold ${wf.status === 'DEAD_LETTER' ? 'text-red-400' : 'text-amber-400'}`}>{wf.status}</span>
                    </div>
                    <div className="font-mono text-[9px] text-slate-500">{wf.eventId}</div>
                    <div className="text-[9px] text-slate-500">{wf.errorCode} · {wf.attempts} tentatives</div>
                    {wf.nextRetryAt && <div className="text-[9px] text-blue-400">Prochaine tentative: {new Date(wf.nextRetryAt).toLocaleTimeString('fr-CA')}</div>}
                  </div>
                </div>
              ))}
            </Card>

            {/* Sync conflicts */}
            {mockSyncConflicts.length > 0 && (
              <Card>
                <div className="font-semibold text-white text-sm mb-2">Conflits de synchronisation</div>
                {mockSyncConflicts.map(sc => (
                  <div key={sc.id} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400">⚡ {sc.conflictType}</span>
                      <span className={`text-[9px] ${sc.resolution === 'PENDING' ? 'text-amber-400' : 'text-green-400'}`}>{sc.resolution}</span>
                    </div>
                    <div className="text-[9px] text-slate-500">Données financières: validation serveur requise avant finalisation</div>
                  </div>
                ))}
              </Card>
            )}

            {/* Jobs */}
            <Card>
              <div className="font-semibold text-white text-sm mb-2">Jobs en cours</div>
              {mockJobs.map(job => (
                <div key={job.id} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0 text-xs">
                  <span>{job.status === 'COMPLETED' ? '✅' : job.status === 'RUNNING' ? '🔄' : '⏳'}</span>
                  <span className="text-slate-300 flex-1">{job.jobType}</span>
                  <span className={`text-[9px] font-bold ${job.status === 'COMPLETED' ? 'text-green-400' : job.status === 'RUNNING' ? 'text-blue-400' : 'text-amber-400'}`}>{job.status}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ─── OPS ──────────────────────────────────── */}
        {tab === 'ops' && (
          <div className="space-y-4 mb-6">
            {/* Feature flags */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Feature flags</div>
              <div className="space-y-2">
                {FEATURE_FLAGS.map(ff => (
                  <div key={ff.key} className="flex items-start gap-3 py-1.5 border-b border-slate-800 last:border-0">
                    <div className={`w-8 h-4 rounded-full shrink-0 mt-0.5 transition-all ${ff.enabled ? 'bg-green-500' : 'bg-slate-700'} flex items-center ${ff.enabled ? 'justify-end' : 'justify-start'} px-0.5`}>
                      <div className="w-3 h-3 bg-white rounded-full"/>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-xs">{ff.label}</div>
                      <div className="text-[9px] text-slate-500">{ff.description}</div>
                    </div>
                    <span className={`text-[8px] font-bold ${ff.enabled ? 'text-green-400' : 'text-slate-600'}`}>{ff.enabled ? 'ON' : 'OFF'}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pilot config */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🇨🇦</span>
                <span className="font-semibold text-white text-sm">{mockPilot.name}</span>
                <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mockPilot.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{mockPilot.status}</span>
              </div>
              {[
                { label:'Juridiction', val:mockPilot.jurisdiction },
                { label:'Villes', val:mockPilot.activeCities.join(', ') },
                { label:'Services', val:mockPilot.activeServices.join(' · ') },
                { label:'Chauffeurs', val:`${mockPilot.currentDriverCount} / ${mockPilot.maxDrivers}` },
                { label:'Période', val:`${mockPilot.startDate} → ${mockPilot.endDate ?? 'En cours'}` },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-white">{s.val}</span>
                </div>
              ))}
              <div className="text-[9px] text-amber-400 mt-2">{mockPilot.notes}</div>
            </Card>

            {/* Retention policies */}
            <Card>
              <div className="font-semibold text-white text-sm mb-2">Politiques de rétention</div>
              <div className="text-[9px] text-amber-400 mb-2">Durées configurables selon juridiction · Obligations légales applicables</div>
              <div className="space-y-1.5">
                {RETENTION_POLICIES.slice(0,5).map(rp => (
                  <div key={rp.dataCategory} className="flex items-start gap-2 text-[10px] py-1 border-b border-slate-800 last:border-0">
                    <span className={`shrink-0 font-bold ${rp.canDelete ? 'text-slate-500' : 'text-blue-400'}`}>{rp.canDelete ? '🗑' : '🔒'}</span>
                    <div className="flex-1">
                      <span className="font-semibold text-white">{rp.dataCategory}</span>
                      <div className="text-slate-500">{rp.note}</div>
                    </div>
                    <span className="text-slate-600 shrink-0">{rp.retentionDays ? `${rp.retentionDays}j` : 'configurable'}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notifications log */}
            <Card>
              <div className="font-semibold text-white text-sm mb-2">Notifications récentes</div>
              {mockOpsNotifications.map(n => (
                <div key={n.id} className={`flex items-start gap-2 py-2 border-b border-slate-800 last:border-0 ${n.readAt ? 'opacity-60' : ''}`}>
                  <span className="text-base shrink-0">{n.notifType === 'SECURITY' ? '🚨' : n.notifType === 'PAYMENT' ? '💳' : n.notifType === 'DOCUMENT' ? '📄' : '🔔'}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-xs">{n.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{n.body}</div>
                    <div className="text-[9px] text-slate-600">{n.channel} · {new Date(n.createdAt).toLocaleString('fr-CA')}</div>
                  </div>
                  <span className={`text-[8px] font-bold shrink-0 ${n.status === 'READ' ? 'text-slate-600' : n.status === 'DELIVERED' ? 'text-green-400' : 'text-blue-400'}`}>{n.status}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
