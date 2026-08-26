'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockConnections, OAUTH_FLOW, PLATFORM_CONFIGS, buildIdempotenceKey } from '@/lib/engines/platform.engine'
import { mockSyncStatus } from '@/lib/engines/platform.engine'
import { useState } from 'react'
import { Shield, Lock, RefreshCw, ChevronRight, ExternalLink, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react'

const statusStyle: Record<string, { color: string; bg: string; icon: string }> = {
  CONNECTED:       { color:'text-green-400', bg:'bg-green-500/10 border-green-500/30', icon:'🟢' },
  DISCONNECTED:    { color:'text-red-400', bg:'bg-red-500/10 border-red-500/30', icon:'🔴' },
  NOT_CONFIGURED:  { color:'text-slate-500', bg:'bg-slate-800 border-slate-700', icon:'⚪' },
  MAINTENANCE:     { color:'text-amber-400', bg:'bg-amber-500/10 border-amber-500/30', icon:'🟡' },
  PENDING_OAUTH:   { color:'text-blue-400', bg:'bg-blue-500/10 border-blue-500/30', icon:'🔵' },
  TOKEN_EXPIRED:   { color:'text-orange-400', bg:'bg-orange-500/10 border-orange-500/30', icon:'🟠' },
  APPROVAL_REQUIRED: { color:'text-slate-400', bg:'bg-slate-800 border-slate-700', icon:'⏳' },
}

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

export default function PlatformsPage() {
  const [tab, setTab] = useState<'connections'|'oauth'|'sync'>('connections')
  const [expanded, setExpanded] = useState<string|null>(null)
  const connected = mockConnections.filter(c => c.status === 'CONNECTED').length

  return (
    <AppShell>
      <PageHeader title="Plateformes" subtitle={`${connected} connectées · OAuth · Sync · Architecture`} />
      <div className="px-4">

        {/* OAuth security notice */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5">
          <Lock size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-300">
            <strong>Connexion sécurisée OAuth uniquement.</strong> Taximètre.GOV ne demande jamais votre mot de passe Uber, Lyft ou autre plateforme. La connexion se fait via le site officiel de chaque plateforme. Vos identifiants ne transitent jamais par nos serveurs.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5">
          {[['connections','Connexions'],['oauth','OAuth Flow'],['sync','Synchronisation']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* CONNECTIONS TAB */}
        {tab === 'connections' && (
          <div className="space-y-3 mb-5">
            {mockConnections.map(conn => {
              const s = statusStyle[conn.status] || statusStyle.NOT_CONFIGURED
              const isExp = expanded === conn.provider
              return (
                <div key={conn.provider} className={`rounded-3xl border-2 overflow-hidden transition-all ${conn.status==='CONNECTED'?'border-green-500/30':conn.status==='MAINTENANCE'?'border-amber-500/30':'border-slate-700'}`}>
                  <button onClick={() => setExpanded(isExp ? null : conn.provider)}
                    className="w-full p-4 text-left hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{conn.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white">{conn.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                            {s.icon} {conn.status.replace('_',' ')}
                          </span>
                        </div>
                        {conn.status === 'CONNECTED' && (
                          <div className="flex gap-3 text-[10px] text-slate-400">
                            <span>{conn.todayTrips} activités</span>
                            <span>·</span>
                            <span className="text-green-400 font-semibold">{fmt(conn.todayRevenue)}</span>
                          </div>
                        )}
                        {conn.status === 'NOT_CONFIGURED' && (
                          <div className="text-[10px] text-slate-500">Non connecté</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {conn.status === 'CONNECTED' && <RefreshCw size={14} className="text-slate-500" />}
                        <ChevronRight size={14} className={`text-slate-500 transition-transform ${isExp?'rotate-90':''}`} />
                      </div>
                    </div>
                  </button>

                  {isExp && (
                    <div className="border-t border-slate-800 p-4 space-y-3">
                      <div className="text-[10px] text-slate-500 leading-relaxed">{conn.note}</div>

                      {/* Scopes granted */}
                      {conn.scopesGranted.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Permissions accordées</div>
                          <div className="flex flex-wrap gap-1.5">
                            {conn.scopesGranted.map(s => (
                              <span key={s} className="text-[10px] font-mono px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Taximeter rule */}
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60">
                        <span className="text-slate-500 text-[10px]">Taximètre</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">⛔ DÉSACTIVÉ — prix fourni par {conn.name}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {conn.status === 'NOT_CONFIGURED' && (
                          <button className="flex-1 py-3 rounded-2xl bg-qc-blue text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-qc-blue-dark transition-all">
                            <ExternalLink size={12} /> Connecter via OAuth
                          </button>
                        )}
                        {conn.status === 'CONNECTED' && (
                          <>
                            <button className="flex-1 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">Rafraîchir</button>
                            <button className="py-2.5 px-4 rounded-2xl border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-all">Déconnecter</button>
                          </>
                        )}
                        {conn.status === 'DISCONNECTED' && (
                          <button className="flex-1 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
                            <ExternalLink size={12} /> Reconnecter via OAuth
                          </button>
                        )}
                        {conn.status === 'MAINTENANCE' && (
                          <div className="flex-1 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold text-center">En maintenance — réessayez plus tard</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* OAUTH FLOW TAB */}
        {tab === 'oauth' && (
          <div className="space-y-3 mb-5">
            <div className="driver-card p-4 mb-4">
              <div className="font-semibold text-white text-sm mb-1">Comment fonctionne la connexion?</div>
              <p className="text-xs text-slate-400 leading-relaxed">Taximètre.GOV utilise OAuth 2.0 — le standard sécurisé. Vous autorisez via le site officiel de la plateforme. Aucun mot de passe ne nous est jamais transmis.</p>
            </div>
            {OAUTH_FLOW.map(step => (
              <div key={step.step} className={`rounded-2xl p-4 flex items-start gap-3 border ${step.userAction ? 'border-qc-blue/30 bg-qc-blue/5' : 'border-slate-800 bg-slate-900/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${step.userAction ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white">{step.action}</span>
                    {step.userAction && <span className="text-[9px] bg-qc-blue/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold">Action chauffeur</span>}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SYNC TAB */}
        {tab === 'sync' && (
          <div className="space-y-3 mb-5">
            <div className="driver-card p-4 mb-4">
              <div className="font-semibold text-white text-sm mb-1">Architecture de synchronisation</div>
              <p className="text-xs text-slate-400 leading-relaxed">Chaque événement reçu est validé, normalisé et enregistré dans le Ledger. La clé d'idempotence <span className="font-mono text-slate-300">provider + provider_trip_id</span> garantit qu'un événement n'est jamais comptabilisé deux fois.</p>
            </div>
            {mockSyncStatus.map(sync => {
              const conn = mockConnections.find(c => c.provider === sync.provider)
              return (
                <Card key={sync.provider} className={`${sync.syncStatus==='FAILED'?'border-red-500/20':sync.syncStatus==='OK'?'border-green-500/20':''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{conn?.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white text-sm">{conn?.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                          ${sync.syncStatus==='OK'?'bg-green-500/20 text-green-400':sync.syncStatus==='FAILED'?'bg-red-500/20 text-red-400':sync.syncStatus==='NEVER'?'bg-slate-700 text-slate-500':'bg-amber-500/20 text-amber-400'}`}>
                          {sync.syncStatus==='OK'?'✅ OK':sync.syncStatus==='FAILED'?'❌ FAILED':sync.syncStatus==='NEVER'?'⚪ JAMAIS':'⚠ PARTIEL'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sync.lastSyncAt ? `Dernière sync: ${new Date(sync.lastSyncAt).toLocaleTimeString('fr-CA')}` : 'Jamais synchronisé'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/50 rounded-xl p-2 text-center">
                      <div className={`font-bold text-sm ${sync.pendingEvents>0?'text-amber-400':'text-green-400'}`}>{sync.pendingEvents}</div>
                      <div className="text-[9px] text-slate-500">En attente</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-2 text-center">
                      <div className={`font-bold text-sm ${sync.failedEvents>0?'text-red-400':'text-green-400'}`}>{sync.failedEvents}</div>
                      <div className="text-[9px] text-slate-500">Échecs</div>
                    </div>
                  </div>
                  {sync.failedEvents > 0 && (
                    <div className="mt-2 text-[10px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={10} /> {sync.failedEvents} événement(s) en dead letter queue — révision requise
                    </div>
                  )}
                </Card>
              )
            })}

            {/* Idempotence key example */}
            <Card className="p-4">
              <div className="font-semibold text-white text-sm mb-3">🔑 Clé d'idempotence</div>
              <div className="space-y-2">
                {[
                  { provider:'UBER', tripId:'UBER-8F72A91', result:'UBER-UBER-8F72A91 → 1 transaction' },
                  { provider:'DOORDASH', tripId:'DD-00345678', result:'DOORDASH-DD-00345678 → 1 transaction' },
                  { provider:'TAXI', tripId:'MSESS-ABC123', result:'TAXI-MSESS-ABC123 → 1 transaction' },
                ].map(ex => (
                  <div key={ex.provider} className="bg-slate-800/50 rounded-xl p-2.5">
                    <code className="text-[10px] text-qc-blue-light">{ex.provider} + {ex.tripId}</code>
                    <div className="text-[10px] text-green-400 mt-0.5">→ {ex.result}</div>
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
