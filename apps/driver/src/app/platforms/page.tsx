'use client'

import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { CheckCircle, Clock, Lock, RefreshCw, ShieldAlert } from 'lucide-react'
import { useDriverDashboard } from '@/lib/supabase/useDriverDashboard'

function accountStatus(status: string) {
  const values: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Connectée', className: 'text-green-400 bg-green-500/10 border-green-500/20' },
    PENDING: { label: 'En attente', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    REAUTH_REQUIRED: { label: 'Reconnexion requise', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    EXPIRED: { label: 'Expirée', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
    ERROR: { label: 'Erreur technique', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
    DISCONNECTED: { label: 'Déconnectée', className: 'text-slate-400 bg-slate-800 border-slate-700' },
    SUSPENDED: { label: 'Suspendue', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  }
  return values[status] ?? { label: status, className: 'text-slate-400 bg-slate-800 border-slate-700' }
}

function iconForProvider(code: string) {
  const icons: Record<string, string> = { UBER: '⬛', LYFT: '🔵', DOORDASH: '🔴', UBER_EATS: '🟢', INSTACART: '🛒', SKIP: '🟠' }
  return icons[code] ?? '🚗'
}

export default function PlatformsPage() {
  const { dashboard, loading, error, refresh } = useDriverDashboard()
  const activeCount = dashboard?.platforms.filter((platform) => platform.status === 'ACTIVE').length ?? 0

  return (
    <AppShell>
      <PageHeader title="Mes plateformes" subtitle={dashboard ? `${activeCount}/${dashboard.platforms.length} compte(s) actif(s) · Données réelles` : 'Chargement sécurisé'} />
      <div className="px-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-qc-blue/10 border border-qc-blue/30 mb-5">
          <Lock size={14} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-blue-100"><span className="font-bold text-white">Vos identifiants de plateforme ne sont jamais affichés.</span> Seul l’état des comptes approuvés est disponible dans votre dossier chauffeur.</p>
        </div>

        {loading ? <div className="py-12 text-center text-sm text-slate-500">Chargement des comptes connectés…</div> : error ? (
          <div className="py-12 text-center"><p className="text-sm text-red-300 mb-4">{error}</p><button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">Réessayer</button></div>
        ) : dashboard && (
          <>
            <div className="space-y-3 mb-6">
              {dashboard.platforms.map((platform) => {
                const status = accountStatus(platform.status)
                return (
                  <Card key={platform.id} className="border-slate-800">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">{iconForProvider(platform.code)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white">{platform.name}</span>
                          <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{platform.lastSyncAt ? `Dernière synchronisation : ${new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(platform.lastSyncAt))}` : 'Aucune synchronisation enregistrée'}</div>
                      </div>
                      {platform.status === 'ACTIVE' && <CheckCircle size={18} className="text-green-400 shrink-0" />}
                    </div>
                  </Card>
                )
              })}
              {dashboard.platforms.length === 0 && <Card><div className="text-center py-5"><ShieldAlert className="mx-auto mb-2 text-slate-600" size={24} /><p className="text-sm text-slate-400">Aucun compte de plateforme n’est relié à votre dossier.</p></div></Card>}
            </div>

            <Card className="mb-6">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-amber-400 mt-0.5" />
                <div><h2 className="text-sm font-semibold text-white">Ajout de plateforme contrôlé</h2><p className="mt-1 text-xs text-slate-400">Les nouvelles connexions nécessitent l’approbation officielle du partenaire et de l’administration. Aucun connecteur OAuth de démonstration n’est activé.</p></div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
