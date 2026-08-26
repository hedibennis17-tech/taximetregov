'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import {
  PROVIDER_DEFINITIONS, getConnectionForProvider, getOverallStatus, maskAccountId,
  mockConnectionHistory, type Provider
} from '@/lib/engines/provider.engine'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw, LogOut, Shield, AlertCircle, CheckCircle, Clock, Gauge } from 'lucide-react'
import { TAXIMETER_ENABLED_BY_ACTIVITY } from '@/data/driver.mock'
import { Suspense } from 'react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

function ManageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const provider = (searchParams.get('provider') || 'uber') as Provider
  const def = PROVIDER_DEFINITIONS[provider]
  const conn = getConnectionForProvider(provider)
  const status = getOverallStatus(conn)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const taximeterEnabled = TAXIMETER_ENABLED_BY_ACTIVITY[def.activityType as keyof typeof TAXIMETER_ENABLED_BY_ACTIVITY] ?? false
  const history = mockConnectionHistory.filter(h => h.provider === provider)

  const handleDisconnect = () => {
    setDisconnected(true)
    setShowDisconnect(false)
  }

  if (disconnected) return (
    <AppShell>
      <PageHeader title={def.name} subtitle="Déconnecté" />
      <div className="px-4 text-center py-12">
        <div className="text-5xl mb-4">⚫</div>
        <div className="font-bold text-white text-xl mb-2">{def.name} déconnecté</div>
        <p className="text-xs text-slate-400 mb-6">Les transactions déjà synchronisées au Ledger sont conservées selon la politique de rétention. Aucune donnée financière n'est supprimée.</p>
        <button onClick={() => router.push('/platforms')}
          className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold hover:bg-qc-blue-dark transition-all">
          ← Retour aux plateformes
        </button>
      </div>
    </AppShell>
  )

  if (!conn) return (
    <AppShell>
      <PageHeader title={def.name} subtitle="Non connecté" />
      <div className="px-4 text-center py-12">
        <div className="text-5xl mb-4">{def.icon}</div>
        <div className="font-bold text-white mb-4">Compte non connecté</div>
        <button onClick={() => router.push(`/platforms/connect?provider=${provider}`)}
          className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold hover:bg-qc-blue-dark transition-all">
          Connecter {def.name}
        </button>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <PageHeader title={def.name} subtitle={`Gérer la connexion · ${def.serviceType.replace('_',' ')}`} />
      <div className="px-4">
        {/* Status card */}
        <div className={`flex items-center gap-4 p-4 rounded-3xl mb-5 border ${conn.connectionStatus === 'CONNECTED' ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl shrink-0">{def.icon}</div>
          <div className="flex-1">
            <div className="font-bold text-white mb-0.5">{def.name}</div>
            <div className={`text-sm font-semibold ${status.color}`}>{status.icon} {status.label}</div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1
              ${taximeterEnabled ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
              <Gauge size={9} />{taximeterEnabled ? 'Taximètre: ACTIF' : 'Taximètre: DÉSACTIVÉ'}
            </div>
          </div>
        </div>

        {/* Account details */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">🔗 Compte lié</div>
          <div className="space-y-2.5">
            {[
              { label:'Compte externe', val:maskAccountId(conn.externalAccountId) },
              { label:'Connecté le', val:new Date(conn.connectedAt!).toLocaleDateString('fr-CA') },
              { label:'Token expire', val:conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt).toLocaleDateString('fr-CA') : 'N/A' },
              { label:'Scopes', val:conn.scopes.join(', ') || 'N/A' },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className="text-xs font-medium text-white font-mono">{s.val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sync stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:'Transactions', val:conn.totalTransactions },
            { label:'Revenus', val:fmt(conn.totalRevenue).replace('CA\u00a0','') },
            { label:'En attente', val:conn.pendingTransactions },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className="font-black text-white text-base tabular-nums">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sync info */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">🔄 Synchronisation</div>
          <div className="space-y-2">
            {[
              { label:'Dernière sync', val:conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString('fr-CA') : '—' },
              { label:'Dernière sync réussie', val:conn.lastSuccessfulSyncAt ? new Date(conn.lastSuccessfulSyncAt).toLocaleString('fr-CA') : '—' },
              { label:'Erreurs', val:conn.syncErrorCount > 0 ? `⚠️ ${conn.syncErrorCount} erreur(s)` : '✅ Aucune' },
            ].map(s => (
              <div key={s.label} className="flex justify-between text-xs">
                <span className="text-slate-400">{s.label}</span>
                <span className="text-white">{s.val}</span>
              </div>
            ))}
          </div>
          {conn.lastSyncError && (
            <div className="mt-3 flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-300">{conn.lastSyncError}</span>
            </div>
          )}
          <button className="mt-3 w-full py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
            <RefreshCw size={14} /> Synchroniser maintenant
          </button>
        </Card>

        {/* Connection history */}
        {history.length > 0 && (
          <Card className="mb-5">
            <div className="font-semibold text-white text-sm mb-3">📋 Historique</div>
            <div className="space-y-1">
              {history.map(h => (
                <div key={h.entryId} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0 text-xs">
                  <span>{h.event === 'CONNECTED' ? '🟢' : h.event === 'TOKEN_EXPIRED' ? '⚠️' : h.event === 'SYNC_ERROR' ? '🔴' : '⚫'}</span>
                  <span className="text-slate-400 flex-1">{h.event}</span>
                  <span className="text-slate-500 text-[10px]">{new Date(h.occurredAt).toLocaleDateString('fr-CA')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Token expiry warning */}
        {conn.connectionStatus === 'TOKEN_EXPIRED' && (
          <Card className="mb-4 border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm mb-1">Re-autorisation requise</div>
                <p className="text-xs text-slate-400 mb-3">Votre token {def.name} a expiré. Vous devrez vous reconnecter chez {def.name} pour renouveler l'autorisation sans fournir votre mot de passe à Taximètre.GOV.</p>
                <button className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-all">
                  🔑 Reconnecter {def.name}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Disconnect */}
        <button onClick={() => setShowDisconnect(true)}
          className="w-full py-4 rounded-2xl border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all mb-6">
          <LogOut size={16} /> Déconnecter {def.name}
        </button>
      </div>

      {/* Disconnect confirmation modal */}
      {showDisconnect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end p-4">
          <div className="w-full bg-slate-900 rounded-3xl border border-slate-700 p-6">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="font-bold text-white text-lg mb-2">Déconnecter {def.name}?</h3>
              <p className="text-sm text-slate-400">{def.disconnectWarning}</p>
              <p className="text-xs text-slate-500 mt-2">Les transactions déjà enregistrées au Ledger sont conservées.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDisconnect(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-all">Annuler</button>
              <button onClick={handleDisconnect}
                className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all">Déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default function ManagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>}>
      <ManageContent />
    </Suspense>
  )
}
