'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, StatusBadge, PlatformBadge } from '@/components/ui'
import { mockDrivers, PLATFORM_LABELS, PLATFORM_COLORS, type Platform } from '@/data/mock'
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const platforms: Platform[] = ['uber', 'lyft', 'doordash', 'instacart', 'ubereats', 'skip', 'taxi']

export default function PlatformsPage() {
  const platformStats = platforms.map(p => {
    const connections = mockDrivers.flatMap(d => d.platforms.filter(pl => pl.provider === p))
    return {
      provider: p,
      total: connections.length,
      connected: connections.filter(c => c.status === 'connected').length,
      pending: connections.filter(c => c.status === 'pending').length,
      expired: connections.filter(c => c.status === 'expired').length,
      error: connections.filter(c => c.status === 'error').length,
      revoked: connections.filter(c => c.status === 'revoked').length,
    }
  })

  return (
    <AppShell>
      <PageHeader
        title="Connexions aux plateformes"
        subtitle="Gestion des comptes partenaires — OAuth / API / Webhook"
      />

      {/* Architecture note */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-qc-blue mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-qc-blue mb-1">Architecture de liaison — GovernmentUser → PlatformAccount</div>
            <div className="text-xs text-slate-600">
              Chaque chauffeur (ID gouvernemental) est lié à ses comptes de plateformes via la table <code className="bg-blue-100 px-1 rounded font-mono">platform_accounts</code>. 
              Les mots de passe des plateformes ne sont jamais utilisés. La connexion utilise OAuth ou l'API officielle de chaque partenaire.
              Les tokens sont chiffrés AES-256 en base de données.
            </div>
            <div className="mt-2 flex gap-4 text-[10px] font-mono text-slate-500">
              <span>GovernmentUser (TG-XXXXXX)</span>
              <span>→</span>
              <span>PlatformAccount (UBER-XXXXXX)</span>
              <span>→</span>
              <span>Transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {platformStats.map(p => {
          const healthPct = p.total > 0 ? Math.round(p.connected / p.total * 100) : 0
          const color = PLATFORM_COLORS[p.provider]
          return (
            <Card key={p.provider} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: p.provider === 'taxi' ? 'var(--qc-blue)' : color }}>
                    {PLATFORM_LABELS[p.provider][0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{PLATFORM_LABELS[p.provider]}</div>
                    <div className="text-xs text-slate-400">{p.total} comptes liés</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
                  ${healthPct > 80 ? 'bg-green-100 text-green-700' : healthPct > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {healthPct > 80 ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {healthPct}%
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-lg font-bold text-green-600">{p.connected}</div>
                  <div className="text-[9px] text-slate-500">Connectés</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                  <div className="text-lg font-bold text-amber-600">{p.pending + p.expired}</div>
                  <div className="text-[9px] text-slate-500">En attente/Exp.</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="text-lg font-bold text-red-600">{p.revoked + p.error}</div>
                  <div className="text-[9px] text-slate-500">Révoqués/Err.</div>
                </div>
              </div>

              {/* Health bar */}
              <div className="mb-4">
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${healthPct}%`, background: color }} />
                </div>
              </div>

              {/* API Status */}
              <div className="space-y-2 text-xs">
                {[
                  { label: 'OAuth', status: p.provider !== 'skip' ? '✅ Disponible' : '⚠ Webhook uniquement' },
                  { label: 'Webhooks', status: '⚠ Non configuré (pilote)' },
                  { label: 'Sync', status: '🕐 Manuel (pilote)' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-slate-600 dark:text-slate-400">{row.status}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors">
                  Détails
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-qc-blue border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-1">
                  <RefreshCw size={11} /> Sync
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* All connections table */}
      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Toutes les connexions</div>
          <div className="text-xs text-slate-400">Modèle : platform_accounts · Tokens chiffrés AES-256</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Chauffeur', 'ID Gov.', 'Plateforme', 'Account ID', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockDrivers.slice(0, 15).flatMap(d =>
                d.platforms.map(p => (
                  <tr key={`${d.id}-${p.provider}`} className="border-b border-slate-50 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{d.firstName} {d.lastName}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-qc-blue">{d.govId}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <PlatformBadge platform={p.provider} status={p.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] text-slate-500">{p.accountId}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button className="text-xs text-qc-blue hover:underline">Voir</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
