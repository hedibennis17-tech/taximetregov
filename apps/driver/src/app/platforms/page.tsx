'use client'

// ================================================================
// TAXIMÈTRE.GOV — PAGE PLATEFORMES
// Phase 6 — Providers réels · OAuth Architecture · MOCK_ONLY dev
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { Card, SectionHeader } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, Lock, RefreshCw, AlertCircle, Unplug } from 'lucide-react'
import { getToken } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────

interface Provider {
  id:                        string
  provider_code:             string
  display_name:              string
  provider_type:             string
  provider_status:           string
  connector_status:          string
  account_id:                string | null
  connection_status:         string | null
  provider_driver_id_masked: string | null
  connected_at:              string | null
  last_sync_at:              string | null
  sync_error_count:          number
  partner_approval_reference: string | null
  isMockOnly:                boolean
  revenue: {
    gross: string; tips: string; count: string; last_activity: string
  } | null
}

// ─── Helpers ─────────────────────────────────────────────────

const PROVIDER_ICON: Record<string, string> = {
  UBER: '⬛', LYFT: '🟣', DOORDASH: '🔴',
  UBER_EATS: '🟡', INSTACART: '🟢', SKIP: '🟠',
}

const PROVIDER_TYPE_LABEL: Record<string, string> = {
  RIDESHARE: 'Covoiturage', MULTI_SERVICE: 'Multi-service',
  FOOD_DELIVERY: 'Livraison repas', GROCERY_DELIVERY: 'Livraison épicerie',
}

function money(v: string | number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}

function connectionStatusConf(status: string | null, isMockOnly: boolean) {
  if (status === 'CONNECTED' && isMockOnly)
    return { label: 'Connectée (DEV)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  if (status === 'CONNECTED')
    return { label: 'Connectée', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
  if (status === 'PENDING')
    return { label: 'En attente', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  if (status === 'ERROR')
    return { label: 'Erreur', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
  if (status === 'DISCONNECTED')
    return { label: 'Déconnectée', color: 'text-slate-400 bg-slate-800 border-slate-700' }
  return { label: 'Non connectée', color: 'text-slate-500 bg-slate-900 border-slate-800' }
}

async function apiFetch(path: string, body?: unknown) {
  const token = getToken()
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json() as { success: boolean; data: unknown; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────

export default function PlatformsPage() {
  const [providers, setProviders]   = useState<Provider[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected]   = useState<string | null>(null)

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await apiFetch('/api/providers/list') as {
        providers: Provider[]; connectedCount: number
      }
      setProviders(data.providers)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadProviders() }, [loadProviders])

  async function handleConnect(providerCode: string) {
    setConnecting(providerCode)
    setError(null)
    try {
      await apiFetch('/api/providers/connect', { providerCode })
      setConnected(providerCode)
      await loadProviders()
      setTimeout(() => setConnected(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setConnecting(null)
    }
  }

  async function handleDisconnect(providerCode: string) {
    if (!confirm(`Déconnecter ${providerCode} ?`)) return
    try {
      await apiFetch('/api/providers/disconnect', { providerCode })
      await loadProviders()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const connectedProviders    = providers.filter(p => p.connection_status === 'CONNECTED')
  const notConnectedProviders = providers.filter(p => p.connection_status !== 'CONNECTED')

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Mes plateformes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {connectedProviders.length} connectée(s) · {providers.length} disponibles
          </p>
        </div>
        <button onClick={() => void loadProviders()}
          className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
          <RefreshCw size={15} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">

        {/* MOCK_ONLY banner */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-amber-400">Mode développement</div>
              <div className="text-[10px] text-amber-300/70 mt-0.5">
                Toutes les connexions sont simulées. L'intégration réelle nécessite l'approbation officielle du programme partenaire de chaque plateforme.
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle size={14} /> {error}
            </div>
          </div>
        )}

        {/* Plateformes connectées */}
        {connectedProviders.length > 0 && (
          <div>
            <SectionHeader title="Connectées" />
            <div className="space-y-3">
              {connectedProviders.map(p => {
                const stConf = connectionStatusConf(p.connection_status, p.isMockOnly)
                return (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{PROVIDER_ICON[p.provider_code] ?? '🚗'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.display_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${stConf.color}`}>
                            {stConf.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {PROVIDER_TYPE_LABEL[p.provider_type] ?? p.provider_type}
                          {p.provider_driver_id_masked && ` · ID: ${p.provider_driver_id_masked}`}
                        </div>
                      </div>
                    </div>

                    {/* Revenus */}
                    {p.revenue && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                          <div className="font-bold text-green-400 text-xs">{money(p.revenue.gross)}</div>
                          <div className="text-[9px] text-slate-500">Brut 30j</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                          <div className="font-bold text-blue-400 text-xs">{money(p.revenue.tips)}</div>
                          <div className="text-[9px] text-slate-500">Pourboires</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                          <div className="font-bold text-white text-xs">{p.revenue.count}</div>
                          <div className="text-[9px] text-slate-500">Activités</div>
                        </div>
                      </div>
                    )}

                    {/* Sync info */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        {p.last_sync_at
                          ? `Sync: ${new Date(p.last_sync_at).toLocaleDateString('fr-CA')}`
                          : 'Jamais synchronisé'}
                      </span>
                      <button
                        onClick={() => void handleDisconnect(p.provider_code)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Unplug size={11} /> Déconnecter
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Plateformes disponibles */}
        {notConnectedProviders.length > 0 && (
          <div>
            <SectionHeader title="Disponibles" />
            <div className="space-y-3">
              {notConnectedProviders.map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{PROVIDER_ICON[p.provider_code] ?? '🚗'}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white">{p.display_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {PROVIDER_TYPE_LABEL[p.provider_type] ?? p.provider_type}
                      </div>
                    </div>

                    {/* Connect button */}
                    {connected === p.provider_code ? (
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <CheckCircle size={14} /> Connecté!
                      </div>
                    ) : connecting === p.provider_code ? (
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        <RefreshCw size={12} className="animate-spin" /> Connexion…
                      </div>
                    ) : (
                      <button
                        onClick={() => void handleConnect(p.provider_code)}
                        className="px-3 py-1.5 rounded-xl bg-qc-blue text-white text-xs font-semibold hover:bg-qc-blue/90 transition-colors"
                      >
                        Connecter
                      </button>
                    )}
                  </div>

                  {/* MOCK badge */}
                  {p.isMockOnly && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400/70">
                      <Lock size={9} />
                      Connexion simulée · Approbation partenaire requise pour production
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} />
            <p className="text-sm text-slate-400 mt-3">Chargement des plateformes…</p>
          </div>
        )}

        {/* Architecture info */}
        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Architecture de connexion
          </div>
          <div className="space-y-2 text-[10px] text-slate-400">
            {[
              { step: '1', label: 'Tu cliques "Connecter"' },
              { step: '2', label: 'Taximètre.gov → OAuth provider' },
              { step: '3', label: 'Tu autorises sur la plateforme' },
              { step: '4', label: 'Token sécurisé — jamais ton mot de passe' },
              { step: '5', label: 'Activités synchronisées automatiquement' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  {item.step}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
