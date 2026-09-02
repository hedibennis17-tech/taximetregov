'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, Clock, MapPin, RefreshCw, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Amount, Card, SectionHeader, StatusDot } from '@/components/ui'
import { useDriverDashboard } from '@/lib/supabase/useDriverDashboard'

const currency = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })

function activityIcon(type: string) {
  if (type === 'TAXI_TRIP') return '🚕'
  if (type === 'RIDESHARE_TRIP') return '🚗'
  return '📦'
}

function activityLabel(type: string) {
  return type.replaceAll('_', ' ').toLocaleLowerCase('fr-CA')
}

function formatTime(dateValue: string | null) {
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateValue))
}

function formatPlatformStatus(status: string) {
  const statuses: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Connectée', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    PENDING: { label: 'En attente', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    REAUTH_REQUIRED: { label: 'Reconnexion requise', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    DISCONNECTED: { label: 'Déconnectée', color: 'text-slate-400 bg-slate-800 border-slate-700' },
    ERROR: { label: 'Erreur', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    EXPIRED: { label: 'Expirée', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    SUSPENDED: { label: 'Suspendue', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  }
  return statuses[status] ?? { label: status, color: 'text-slate-400 bg-slate-800 border-slate-700' }
}

export default function HomePage() {
  const { dashboard, loading, error, refresh, setPresence } = useDriverDashboard()
  const [presencePending, setPresencePending] = useState(false)
  const [presenceError, setPresenceError] = useState<string | null>(null)

  const togglePresence = async () => {
    if (!dashboard) return
    setPresencePending(true)
    setPresenceError(null)
    try {
      await setPresence(dashboard.presence.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE')
    } catch (caught) {
      setPresenceError(caught instanceof Error ? caught.message : 'Mise à jour du statut impossible.')
    } finally {
      setPresencePending(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
          <div>
            <RefreshCw className="mx-auto mb-3 text-qc-blue animate-spin" size={28} />
            <p className="text-sm text-slate-400">Chargement de vos données sécurisées…</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!dashboard) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
          <div className="max-w-sm">
            <h1 className="text-xl font-bold text-white mb-2">Dossier chauffeur indisponible</h1>
            <p className="text-sm text-slate-400 mb-5">{error ?? 'Votre session ne donne pas accès à un dossier chauffeur actif.'}</p>
            <button onClick={() => void refresh()} className="px-4 py-3 rounded-xl bg-qc-blue text-white text-sm font-semibold">Réessayer</button>
          </div>
        </div>
      </AppShell>
    )
  }

  const isOnline = dashboard.presence.status === 'ONLINE'
  const platformTotals = dashboard.activities.reduce<Record<string, { amount: number; trips: number }>>((totals, activity) => {
    const key = activity.provider ?? (activity.type === 'TAXI_TRIP' ? 'Taxi' : 'Autre')
    const current = totals[key] ?? { amount: 0, trips: 0 }
    totals[key] = { amount: current.amount + activity.amount, trips: current.trips + 1 }
    return totals
  }, {})

  return (
    <AppShell>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-qc-blue flex items-center justify-center text-white font-bold text-lg">
            {dashboard.profile.firstName[0]?.toUpperCase() ?? 'C'}
          </div>
          <div>
            <div className="text-xs text-slate-400">Bonjour,</div>
            <div className="font-bold text-white">{dashboard.profile.firstName} {dashboard.profile.lastName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void refresh()} aria-label="Actualiser mes données" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
            <RefreshCw size={17} />
          </button>
          <Link href="/notifications" aria-label="Notifications" className="relative w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <Bell size={18} className="text-slate-300" />
          </Link>
        </div>
      </div>

      <div className="px-4 py-4">
        <button
          onClick={() => void togglePresence()}
          disabled={presencePending || dashboard.profile.status !== 'ACTIVE'}
          className={`w-full py-5 rounded-3xl font-bold text-xl transition-all active:scale-98 shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50
            ${isOnline ? 'bg-driver-red/20 border-2 border-driver-red text-driver-red shadow-red-900/30' : 'bg-qc-blue border-2 border-qc-blue text-white shadow-blue-900/40'}`}
        >
          <StatusDot status={isOnline ? 'online' : 'offline'} />
          {presencePending ? 'MISE À JOUR…' : isOnline ? 'PASSER HORS LIGNE' : 'ALLER EN LIGNE'}
        </button>
        {dashboard.profile.status !== 'ACTIVE' && <p className="mt-2 text-center text-xs text-amber-400">Votre dossier doit être activé avant la mise en ligne.</p>}
        {presenceError && <p className="mt-2 text-center text-xs text-red-400">{presenceError}</p>}
      </div>

      <div className="flex items-center gap-3 px-4 mb-4">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isOnline ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-900 border border-slate-800'}`}>
          <MapPin size={14} className={isOnline ? 'text-green-400' : 'text-slate-500'} />
          <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
            {isOnline ? `En ligne${dashboard.presence.locationLabel ? ` · ${dashboard.presence.locationLabel}` : ''}` : 'Hors ligne'}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
          <Clock size={14} className="text-slate-500" />
          <span className="text-xs text-slate-400">Données réelles</span>
        </div>
      </div>

      <div className="px-4 mb-5">
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-qc-blue/30 to-qc-blue-dark/10 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Aujourd’hui</span>
              <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString('fr-CA')}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2 mb-4">
              <Amount value={dashboard.stats.totalRevenue} size="xl" />
              <span className="text-xs text-slate-400 mb-1.5">brut</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Courses', val: dashboard.stats.totalTrips, icon: '🛣️' },
                { label: 'Taxes', val: currency.format(dashboard.stats.totalTax), icon: '📋' },
                { label: 'Net', val: currency.format(dashboard.stats.netRevenue), icon: '💰' },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className="text-lg mb-0.5">{stat.icon}</div>
                  <div className="font-bold text-white text-sm">{stat.val}</div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800 divide-y divide-slate-800/50">
            {Object.entries(platformTotals).length === 0 ? (
              <p className="px-4 py-4 text-xs text-slate-500">Aucune activité enregistrée aujourd’hui.</p>
            ) : Object.entries(platformTotals).map(([provider, total]) => (
              <div key={provider} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xl">{provider === 'Taxi' ? '🚕' : '🚗'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{provider}</span>
                    <span className="font-bold text-white text-sm">{currency.format(total.amount)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{total.trips} course(s)</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="px-4 mb-5">
        <SectionHeader title="Mes plateformes" actionLabel="Voir tout" action={() => {}} />
        {dashboard.platforms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-5 text-center text-xs text-slate-500">Aucune plateforme connectée.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {dashboard.platforms.slice(0, 4).map((platform) => {
              const state = formatPlatformStatus(platform.status)
              return (
                <Link key={platform.id} href="/platforms" className="rounded-2xl p-3 border bg-slate-900 border-slate-800 flex items-start gap-2.5 transition-all">
                  <span className="text-2xl">{platform.code === 'UBER' ? '⬛' : platform.code === 'LYFT' ? '🔵' : '🟢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{platform.name}</div>
                    <span className={`inline-flex mt-1 text-[9px] px-1.5 py-0.5 rounded-full border ${state.color}`}>{state.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        <Link href="/platforms" className="flex items-center justify-center gap-2 mt-3 py-3 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-xs hover:border-slate-600 transition-colors">
          <span>Gérer mes plateformes</span>
        </Link>
      </div>

      <div className="px-4 mb-4">
        <SectionHeader title="Activités récentes" actionLabel="Voir tout" action={() => {}} />
        <div className="space-y-2">
          {dashboard.activities.length === 0 ? (
            <div className="driver-card px-4 py-4 text-sm text-slate-500">Aucune activité enregistrée pour ce compte.</div>
          ) : dashboard.activities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="driver-card px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">{activityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-white capitalize">{activity.provider ?? activityLabel(activity.type)}</span>
                  <span className="text-[10px] text-slate-500">{formatTime(activity.startedAt)}</span>
                </div>
                <div className="text-xs text-slate-400 capitalize">{activityLabel(activity.type)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-white text-sm">{currency.format(activity.amount)}</div>
                {activity.tip > 0 && <div className="text-[10px] text-green-400">+{currency.format(activity.tip)} pourboire</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <SectionHeader title="Actions rapides" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/taximeter', icon: '🚕', label: 'Démarrer course taxi', color: 'bg-qc-blue/20 border-qc-blue/30' },
            { href: '/revenue', icon: '💰', label: 'Voir mes revenus', color: 'bg-green-500/10 border-green-500/20' },
            { href: '/documents', icon: '📄', label: 'Mes documents', color: 'bg-amber-500/10 border-amber-500/20' },
            { href: '/tax', icon: '📋', label: 'Centre fiscal', color: 'bg-purple-500/10 border-purple-500/20' },
          ].map((action) => (
            <Link key={action.href} href={action.href} className={`rounded-2xl p-4 border flex flex-col gap-2 transition-all hover:opacity-80 ${action.color}`}>
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-semibold text-white leading-snug">{action.label}</span>
              <ChevronRight size={14} className="text-slate-400 self-end" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
