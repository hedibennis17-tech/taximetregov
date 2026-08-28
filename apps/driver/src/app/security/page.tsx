'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockUserIdentity, mockDriverAccount, mockMFAConfig, mockSessions,
  mockDevices, mockUserRole, mockSensitiveId, mockProviderHealth,
  mockSecurityAudit, mockSecurityEvents, mockAPIEndpoints,
  ROLES, RATE_LIMIT_CONCEPTS, SECURITY_HEADERS,
  PROVIDER_HEALTH_CONF, SESSION_STATUS_CONF, SEVERITY_CONF,
  hasPermission,
} from '@/lib/engines/security.engine'
import { useState } from 'react'
import { Shield, Lock, AlertCircle, CheckCircle, Zap } from 'lucide-react'

export default function SecurityPage() {
  const [tab, setTab] = useState<'identity' | 'sessions' | 'providers' | 'audit' | 'rbac'>('identity')
  const activeEvents = mockSecurityEvents.filter(e => !e.resolved).length
  const critEvents = mockSecurityEvents.filter(e => e.severity === 'CRITICAL').length

  return (
    <AppShell>
      <PageHeader title="Sécurité" subtitle="Identité · Sessions · Providers · RBAC · Audit" />
      <div className="px-4">
        {/* Security summary */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Sessions', val:mockSessions.filter(s=>s.status==='ACTIVE').length, color:'text-green-400' },
            { label:'Appareils', val:mockDevices.filter(d=>d.status==='TRUSTED').length, color:'text-blue-400' },
            { label:'Alertes', val:activeEvents, color:activeEvents>0?'text-amber-400':'text-slate-500' },
            { label:'Critiques', val:critEvents, color:critEvents>0?'text-red-400':'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Security principles banner */}
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5 text-xs text-slate-400">
          <Lock size={13} className="text-qc-blue-light mt-0.5 shrink-0"/>
          <span>NAS: ***-***-XXX uniquement · Tokens: jamais loggés · OAuth: jamais mot de passe Uber/Lyft · App→API→Auth→Service→DB</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['identity','Identité'],['sessions','Sessions'],['providers','Providers'],['audit','Audit'],['rbac','RBAC']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── IDENTITY ─────────────────────────────── */}
        {tab === 'identity' && (
          <div className="space-y-4 mb-6">
            {/* User identity */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔐 Identité utilisateur</div>
              {[
                { label:'Public ID', val:mockUserIdentity.publicId, mono:true },
                { label:'Type', val:mockUserIdentity.userType },
                { label:'Statut', val:mockUserIdentity.status, color:'text-green-400' },
                { label:'ID interne', val:'[non exposé dans l\'API]', color:'text-slate-600' },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-medium ${'color' in s ? s.color : ''} ${'mono' in s ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
                </div>
              ))}
            </Card>

            {/* MFA */}
            <Card className={mockMFAConfig.enabled ? 'border-green-500/20' : 'border-amber-500/20'}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{mockMFAConfig.enabled ? '🔒' : '⚠️'}</span>
                <span className="font-semibold text-white text-sm">Authentification multi-facteurs</span>
                <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mockMFAConfig.enabled ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {mockMFAConfig.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                </span>
              </div>
              {[
                { label:'Méthode principale', val:mockMFAConfig.primaryMethod },
                { label:'Méthodes backup', val:mockMFAConfig.backupMethods.join(', ') },
                { label:'Dernière utilisation', val:mockMFAConfig.lastUsedAt ? new Date(mockMFAConfig.lastUsedAt).toLocaleString('fr-CA') : '—' },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1 text-xs border-b border-slate-800 last:border-0">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-white">{s.val}</span>
                </div>
              ))}
            </Card>

            {/* Sensitive ID */}
            <Card className="border-red-500/10">
              <div className="font-semibold text-white text-sm mb-2">🔏 Identifiant gouvernemental sensible</div>
              <div className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-slate-400">NAS/SIN</span>
                <span className="font-mono font-black text-slate-600 text-lg">{mockSensitiveId.maskedDisplay}</span>
              </div>
              <div className="text-[9px] text-slate-600 mt-1">Chiffrement field-level · clé {mockSensitiveId.keyVersion} · Jamais clé primaire · Jamais exposé en clair</div>
            </Card>

            {/* Security events */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Événements de sécurité</div>
              <div className="space-y-2">
                {mockSecurityEvents.map(evt => {
                  const conf = SEVERITY_CONF[evt.severity]
                  return (
                    <div key={evt.eventId} className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${evt.severity === 'CRITICAL' ? 'border-red-500/20' : evt.severity === 'WARNING' ? 'border-amber-500/20' : 'border-slate-800'}`}>
                      <span className="text-base shrink-0">{conf.icon}</span>
                      <div className="flex-1">
                        <div className={`font-bold ${conf.color}`}>{evt.type}</div>
                        <div className="text-slate-400">{evt.description}</div>
                        <div className="text-[9px] text-slate-600">{new Date(evt.timestamp).toLocaleString('fr-CA')} · {evt.resolved ? '✓ Résolu' : '⏳ Ouvert'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ─── SESSIONS ─────────────────────────────── */}
        {tab === 'sessions' && (
          <div className="space-y-4 mb-6">
            {/* Sessions */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Sessions actives</div>
              <div className="space-y-2">
                {mockSessions.map(sess => {
                  const conf = SESSION_STATUS_CONF[sess.status]
                  const dev = mockDevices.find(d => d.id === sess.deviceId)
                  return (
                    <div key={sess.id} className={`flex items-start gap-3 p-3 rounded-2xl border ${sess.status === 'ACTIVE' ? 'border-green-500/20 bg-green-500/5' : 'border-slate-800'}`}>
                      <span className="text-xl shrink-0">{dev?.platform === 'iOS' ? '📱' : '💻'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-white text-xs">{dev?.name ?? sess.deviceId}</span>
                          <span className={`text-[9px] font-bold ${conf.color}`}>{conf.icon} {sess.status}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Créée: {new Date(sess.createdAt).toLocaleString('fr-CA')}</div>
                        <div className="text-[10px] text-slate-500">Activité: {new Date(sess.lastActivity).toLocaleString('fr-CA')}</div>
                        <div className="font-mono text-[9px] text-slate-600">IP: {sess.ipMetadata} (haché)</div>
                      </div>
                      {sess.status === 'ACTIVE' && (
                        <button className="text-[10px] text-red-400 border border-red-500/30 px-2 py-1 rounded-xl hover:bg-red-500/10 transition-all shrink-0">
                          Révoquer
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Devices */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Appareils enregistrés</div>
              {mockDevices.map(dev => (
                <div key={dev.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <span className="text-2xl">{dev.platform === 'iOS' ? '📱' : '💻'}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-xs">{dev.name}</div>
                    <div className="text-[10px] text-slate-500">{dev.platform} · v{dev.appVersion}</div>
                    <div className="font-mono text-[9px] text-slate-600">{dev.deviceIdentifier}</div>
                  </div>
                  <div className={`text-[9px] font-bold ${dev.status === 'TRUSTED' ? 'text-green-400' : dev.status === 'BLOCKED' ? 'text-red-400' : 'text-amber-400'}`}>
                    {dev.status}
                  </div>
                </div>
              ))}
            </Card>

            {/* Rate limits */}
            <Card>
              <div className="font-semibold text-white text-sm mb-2">Rate limiting (conceptuel)</div>
              <div className="text-[9px] text-amber-400 mb-2">Valeurs finales configurables — jamais hardcodées</div>
              <div className="space-y-1.5">
                {RATE_LIMIT_CONCEPTS.slice(0,4).map(rl => (
                  <div key={rl.endpoint} className="flex items-center gap-2 text-[10px]">
                    <span className="font-mono text-qc-blue-light w-28 shrink-0">{rl.endpoint}</span>
                    <span className="text-slate-400 flex-1">{rl.maxRequests} req/{rl.windowSeconds}s</span>
                    <span className="text-slate-600 text-[9px] truncate max-w-[100px]">{rl.note}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── PROVIDERS ─────────────────────────────── */}
        {tab === 'providers' && (
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 mb-3">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              OAuth only · Jamais mot de passe Uber/Lyft · Secrets externalisés · Signature webhook vérifiée
            </div>
            {mockProviderHealth.map(ph => {
              const conf = PROVIDER_HEALTH_CONF[ph.status]
              const failPct = ph.webhooksReceived > 0 ? Math.round(ph.webhooksFailed/ph.webhooksReceived*100) : 0
              return (
                <div key={ph.provider} className={`driver-card p-4 border ${ph.status === 'ERROR' ? 'border-red-500/20' : ph.status === 'DEGRADED' ? 'border-amber-500/20' : ph.status === 'CONNECTED' ? 'border-green-500/20' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{conf.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{ph.provider}</span>
                        <span className={`text-[9px] font-bold ${conf.color}`}>{ph.status}</span>
                        <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded ml-auto">MOCK_ONLY</span>
                      </div>
                      <div className="text-[9px] text-slate-500">Dernier check: {new Date(ph.lastChecked).toLocaleTimeString('fr-CA')}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                    {[
                      { label:'Reçus', val:ph.webhooksReceived, color:'text-white' },
                      { label:'Traités', val:ph.webhooksReceived-ph.webhooksFailed, color:'text-green-400' },
                      { label:'Échoués', val:ph.webhooksFailed, color:ph.webhooksFailed>0?'text-red-400':'text-slate-600' },
                      { label:'Doublons', val:ph.webhooksDuplicate, color:'text-amber-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-800/50 rounded-lg p-1 text-center">
                        <div className={`font-bold ${s.color}`}>{s.val}</div>
                        <div className="text-slate-600">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {ph.lastError && <div className="text-[9px] text-red-400 mt-1.5 flex items-start gap-1"><AlertCircle size={9} className="mt-0.5 shrink-0"/>{ph.lastError}</div>}
                  {failPct > 5 && <div className="text-[9px] text-amber-400 mt-1">⚠ Taux d'échec: {failPct}%</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* ─── AUDIT ─────────────────────────────────── */}
        {tab === 'audit' && (
          <div className="mb-6">
            <div className="text-[10px] text-slate-500 mb-3">Jamais loggé: password · OTP · access_token · refresh_token · NAS/SIN complet</div>
            <div className="driver-card divide-y divide-slate-800">
              {mockSecurityAudit.map(e => (
                <div key={e.id} className="p-3 flex items-start gap-2">
                  <span className={`text-lg shrink-0 ${e.result === 'SUCCESS' ? 'text-green-400' : e.result === 'BLOCKED' ? 'text-red-400' : 'text-amber-400'}`}>
                    {e.result === 'SUCCESS' ? '✅' : e.result === 'BLOCKED' ? '🚫' : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-white text-xs">{e.action}</span>
                      <span className={`text-[9px] font-bold ${e.result === 'SUCCESS' ? 'text-green-400' : e.result === 'BLOCKED' ? 'text-red-400' : 'text-amber-400'}`}>{e.result}</span>
                      <span className="text-[9px] text-slate-500 ml-auto">{e.actorRole}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{e.resourceType}{e.resourceId ? ` · ${e.resourceId}` : ''}</div>
                    <div className="text-[9px] text-slate-600 flex flex-wrap gap-1.5 mt-0.5">
                      {Object.entries(e.metadata).map(([k,v]) => (
                        <span key={k} className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">{k}:{String(v)}</span>
                      ))}
                    </div>
                    <div className="text-[9px] text-slate-600 mt-0.5">{new Date(e.timestamp).toLocaleString('fr-CA')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── RBAC ──────────────────────────────────── */}
        {tab === 'rbac' && (
          <div className="space-y-4 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Permissions non codées dans les écrans — chargées depuis RBAC · Resource-level auth en plus</div>

            {/* Driver role */}
            <Card className="border-qc-blue/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚕</span>
                <div>
                  <div className="font-semibold text-white text-sm">DRIVER — {mockDriverAccount.driverNumber}</div>
                  <div className="text-[10px] text-slate-500">Accès: données propres uniquement · Driver A ≠ Driver B</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-start gap-1.5">
                <AlertCircle size={10} className="mt-0.5 shrink-0"/>
                Règle resource-level: canAccessDriverData() vérifie requestorId === targetDriverId pour role=DRIVER
              </div>
            </Card>

            {/* All roles */}
            {Object.values(ROLES).slice(0,5).map(role => (
              <Card key={role.name}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-qc-blue/20 flex items-center justify-center text-xs font-black text-qc-blue-light shrink-0">
                    {role.name.slice(0,2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-xs">{role.label}</div>
                    <div className="text-[9px] text-slate-500">{role.description}</div>
                  </div>
                  {role.requiresMFA && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold shrink-0">MFA requis</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0,6).map(p => (
                    <span key={p} className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">{p}</span>
                  ))}
                  {role.permissions.length > 6 && <span className="text-[8px] text-slate-600 px-1.5 py-0.5">+{role.permissions.length-6} autres</span>}
                </div>
              </Card>
            ))}

            {/* Security headers */}
            <Card>
              <div className="font-semibold text-white text-sm mb-2">Headers de sécurité (production)</div>
              <div className="space-y-1">
                {Object.entries(SECURITY_HEADERS).slice(0,4).map(([k,v]) => (
                  <div key={k} className="flex gap-2 text-[9px]">
                    <span className="font-mono text-qc-blue-light shrink-0">{k}</span>
                    <span className="text-slate-500 truncate">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
