'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  PROVIDER_DEFINITIONS, mockConnections, getConnectionForProvider,
  getOverallStatus, maskAccountId,
  type Provider
} from '@/lib/engines/provider.engine'
import { TAXIMETER_ENABLED_BY_ACTIVITY } from '@/data/driver.mock'
import { useState } from 'react'
import { ChevronRight, Shield, RefreshCw, AlertCircle, CheckCircle, Gauge, Lock } from 'lucide-react'
import Link from 'next/link'

const PROVIDERS_ORDER: Provider[] = ['taxi', 'uber', 'lyft', 'doordash', 'instacart', 'uber_eats', 'skip']

const availStyle: Record<string, string> = {
  AVAILABLE: 'text-green-400',
  MOCK_ONLY: 'text-amber-400',
  COMING_SOON: 'text-slate-500',
  REQUIRES_APPROVAL: 'text-amber-400',
  TEMPORARILY_UNAVAILABLE: 'text-red-400',
  NOT_SUPPORTED: 'text-slate-600',
}

export default function PlatformsPage() {
  const [activeTab, setActiveTab] = useState<'connections' | 'history' | 'security'>('connections')
  const connected = mockConnections.filter(c => c.connectionStatus === 'CONNECTED').length
  const total = PROVIDERS_ORDER.filter(p => p !== 'taxi').length

  return (
    <AppShell>
      <PageHeader
        title="Mes plateformes"
        subtitle={`${connected}/${total} connectées · Provider Connection Center`}
      />
      <div className="px-4">
        {/* OAuth security notice */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-qc-blue/10 border border-qc-blue/30 mb-5">
          <Lock size={14} className="text-qc-blue-light mt-0.5 shrink-0" />
          <div className="text-xs text-blue-200">
            <span className="font-bold text-white">Connexion sécurisée — jamais votre mot de passe.</span> Taximètre.GOV utilise OAuth officiel. Vous êtes redirigé vers chaque plateforme pour donner votre consentement. Aucun identifiant n'est saisi dans notre application.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['connections','Connexions'],['history','Historique'],['security','Sécurité']].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── CONNECTIONS ─────────────────────────────── */}
        {activeTab === 'connections' && (
          <div className="space-y-3 mb-6">
            {PROVIDERS_ORDER.map(provider => {
              const def = PROVIDER_DEFINITIONS[provider]
              const conn = getConnectionForProvider(provider)
              const status = getOverallStatus(conn)
              const isTaxi = provider === 'taxi'
              const isComingSoon = def.availability === 'COMING_SOON'
              const isMock = def.availability === 'MOCK_ONLY'
              const taximeterOn = provider === 'taxi'

              return (
                <div key={provider}
                  className={`driver-card p-4 border transition-all
                    ${conn?.connectionStatus === 'CONNECTED' ? 'border-green-500/20' :
                      conn?.connectionStatus === 'TOKEN_EXPIRED' || conn?.connectionStatus === 'SYNC_ERROR' ? 'border-amber-500/20' :
                      isTaxi ? 'border-qc-blue/30' : 'border-slate-800'}`}>
                  <div className="flex items-start gap-4">
                    {/* Provider icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isTaxi ? 'bg-qc-blue' : 'bg-slate-800'}`}>
                      {def.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white">{def.name}</span>
                        {/* Mock badge */}
                        {isMock && (
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                            MOCK PILOTE
                          </span>
                        )}
                        {isComingSoon && (
                          <span className="text-[9px] font-bold bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
                            BIENTÔT
                          </span>
                        )}
                        {isTaxi && <span className="text-[9px] font-bold bg-qc-blue/30 text-blue-300 px-1.5 py-0.5 rounded-full">INTERNE</span>}
                      </div>

                      {/* Connection status */}
                      <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${status.color}`}>
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                      </div>

                      {/* Taximeter rule */}
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border
                        ${taximeterOn ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700/50 border-slate-600 text-slate-500'}`}>
                        <Gauge size={9} />
                        {taximeterOn ? 'Taximètre: ACTIF' : 'Taximètre: DÉSACTIVÉ'}
                      </div>

                      {/* Connected info */}
                      {conn && conn.connectionStatus !== 'NOT_CONNECTED' && (
                        <div className="mt-1.5 text-[10px] text-slate-500">
                          {maskAccountId(conn.externalAccountId)} · {conn.totalTransactions} tx · {new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(conn.totalRevenue)}
                        </div>
                      )}

                      {/* Error message */}
                      {conn?.lastSyncError && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-400">
                          <AlertCircle size={10} /> {conn.lastSyncError}
                        </div>
                      )}

                      {/* API approval note */}
                      {!isTaxi && (
                        <div className="mt-1 text-[9px] text-slate-600">{def.oauthNote.substring(0, 70)}…</div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="shrink-0">
                      {isTaxi ? (
                        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                          <CheckCircle size={12} /> Autorisé
                        </div>
                      ) : isComingSoon ? (
                        <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 text-xs font-bold">
                          Bientôt
                        </div>
                      ) : conn?.connectionStatus === 'TOKEN_EXPIRED' || conn?.connectionStatus === 'REAUTH_REQUIRED' ? (
                        <Link href={`/platforms/connect?provider=${provider}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-all">
                          🔑 Reconnecter
                        </Link>
                      ) : conn?.connectionStatus === 'CONNECTED' ? (
                        <Link href={`/platforms/manage?provider=${provider}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
                          Gérer <ChevronRight size={12} />
                        </Link>
                      ) : (
                        <Link href={`/platforms/connect?provider=${provider}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-qc-blue text-white text-xs font-bold hover:bg-qc-blue-dark transition-all shadow-sm shadow-blue-900/40">
                          Connecter
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── HISTORY ─────────────────────────────────── */}
        {activeTab === 'history' && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-3">📋 Historique des connexions</div>
            <div className="space-y-1">
              {[
                { event:'CONNECTED', provider:'Uber', time:'15 sept. 2024', icon:'🟢', color:'text-green-400', detail:'Compte ••••456 lié' },
                { event:'CONNECTED', provider:'DoorDash', time:'15 oct. 2024', icon:'🟢', color:'text-green-400', detail:'Compte ••••123 lié' },
                { event:'CONNECTED', provider:'Lyft', time:'1 oct. 2024', icon:'🟢', color:'text-green-400', detail:'Compte ••••789 lié' },
                { event:'SYNC_ERROR', provider:'Skip', time:'22 août 2026', icon:'🔴', color:'text-red-400', detail:'API timeout — retry programmé' },
                { event:'TOKEN_EXPIRED', provider:'Lyft', time:'23 août 2026', icon:'⚠️', color:'text-amber-400', detail:'Re-autorisation requise' },
                { event:'SYNC_COMPLETED', provider:'Uber', time:'24 août 2026', icon:'✅', color:'text-green-400', detail:'247 transactions synchronisées' },
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <span className="text-base shrink-0">{h.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold ${h.color}`}>{h.event}</span>
                      <span className="text-xs text-white">{h.provider}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{h.detail}</div>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">{h.time}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ─── SECURITY ────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-4 mb-6">
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔐 Sécurité OAuth</div>
              <div className="space-y-3">
                {[
                  { label:'Mot de passe stocké', val:'❌ Jamais', desc:'OAuth uniquement — consentement chez le fournisseur' },
                  { label:'Tokens OAuth', val:'🔒 Coffre chiffré', desc:'Côté serveur uniquement — jamais au frontend' },
                  { label:'Protection anti-CSRF', val:'✅ State OAuth', desc:'Paramètre state vérifié à chaque callback' },
                  { label:'Comptes croisés', val:'🔍 Review requis', desc:'provider + external_account_id = UNIQUE — violation → Review' },
                  { label:'Rotation des tokens', val:'✅ Automatique', desc:'Expiration détectée → re-autorisation sans mot de passe' },
                  { label:'Audit des connexions', val:'✅ Complet', desc:'Chaque connexion/déconnexion enregistrée immutablement' },
                ].map(s => (
                  <div key={s.label} className="flex items-start justify-between gap-3 py-2 border-b border-slate-800 last:border-0">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-300 shrink-0 text-right">{s.val}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="font-semibold text-white text-sm mb-3">📊 Journal d'audit — Connexions</div>
              <div className="space-y-1">
                {[
                  { action:'PROVIDER_CONNECTED', provider:'uber', time:'14:00:00', result:'SUCCESS', color:'text-green-400' },
                  { action:'PROVIDER_CONNECTED', provider:'doordash', time:'10:00:00', result:'SUCCESS', color:'text-green-400' },
                  { action:'TOKEN_EXPIRED', provider:'lyft', time:'18:00:00', result:'WARNING', color:'text-amber-400' },
                  { action:'SYNC_COMPLETED', provider:'uber', time:'14:55:00', result:'SUCCESS', color:'text-green-400' },
                  { action:'SYNC_FAILED', provider:'skip', time:'13:48:00', result:'FAILURE', color:'text-red-400' },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0 text-[10px]">
                    <span className={`font-bold w-40 shrink-0 ${e.color}`}>{e.action}</span>
                    <span className="text-slate-400">{e.provider}</span>
                    <span className={`ml-auto font-bold ${e.color}`}>{e.result}</span>
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
