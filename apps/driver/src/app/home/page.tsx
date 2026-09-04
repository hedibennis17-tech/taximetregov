'use client'

import Link from 'next/link'
import { Bell, ChevronRight, Clock, MapPin, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Amount, Card, SectionHeader, StatusDot } from '@/components/ui'
import { useDriverProfile, useRevenue, useTrips, money, getToken } from '@/lib/api'
import { useEffect } from 'react'

// Auto-setup: crée le profil driver si nouveau compte Supabase
async function setupDriverProfile() {
  const token = getToken()
  if (!token) return
  try {
    await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch { /* silencieux */ }
}

function activityIcon(source: string) {
  if (source === 'TAXI')      return '🚕'
  if (source === 'UBER' || source === 'LYFT') return '🚗'
  return '📦'
}

function formatTime(dateValue: string | null) {
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateValue))
}

function platformStatus(status: string) {
  const s: Record<string, { label: string; color: string }> = {
    CONNECTED:    { label: 'Connectée',    color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    PENDING:      { label: 'En attente',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    DISCONNECTED: { label: 'Déconnectée', color: 'text-slate-400 bg-slate-800 border-slate-700' },
    ERROR:        { label: 'Erreur',       color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  }
  return s[status] ?? { label: status, color: 'text-slate-400 bg-slate-800 border-slate-700' }
}

export default function HomePage() {
  useEffect(() => { void setupDriverProfile() }, [])
  const { profile, loading: pLoading, error: pError, refresh: pRefresh } = useDriverProfile()
  const { revenue, loading: rLoading, refresh: rRefresh } = useRevenue('month')
  const { trips, loading: tLoading } = useTrips('COMPLETED')
  const loading = pLoading || rLoading

  const refresh = () => { void pRefresh(); void rRefresh() }

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
          <div>
            <RefreshCw className="mx-auto mb-3 text-qc-blue animate-spin" size={28} />
            <p className="text-sm text-slate-400">Chargement de vos données…</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
          <div className="max-w-sm">
            <h1 className="text-xl font-bold text-white mb-2">Dossier chauffeur indisponible</h1>
            <p className="text-sm text-slate-400 mb-5">{pError ?? 'Session invalide.'}</p>
            <button onClick={refresh} className="px-4 py-3 rounded-xl bg-qc-blue text-white text-sm font-semibold">Réessayer</button>
          </div>
        </div>
      </AppShell>
    )
  }

  const walletBalance = parseFloat(revenue?.wallet.balance ?? '0')
  const totalGross    = parseFloat(revenue?.summary.total_gross ?? '0')
  const totalTips     = parseFloat(revenue?.summary.total_tips ?? '0')
  const totalNet      = parseFloat(revenue?.summary.total_net ?? '0')
  const platforms     = profile.connected_platforms ?? []

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-qc-blue flex items-center justify-center text-white font-bold text-lg">
            {profile.first_name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <div>
            <div className="text-xs text-slate-400">Bonjour,</div>
            <div className="font-bold text-white">{profile.first_name} {profile.last_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
            <RefreshCw size={17} />
          </button>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <Bell size={18} className="text-slate-300" />
          </Link>
        </div>
      </div>

      {/* Wallet balance */}
      <div className="px-4 py-4">
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-qc-blue/30 to-qc-blue-dark/10 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Ce mois-ci</span>
              <span className="text-[10px] text-slate-500">Données réelles · Supabase</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2 mb-4">
              <Amount value={totalGross} size="xl" />
              <span className="text-xs text-slate-400 mb-1.5">brut</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Courses', val: revenue?.summary.total_activities ?? '0', icon: '🛣️' },
                { label: 'Pourboires', val: money(totalTips), icon: '💝' },
                { label: 'Net', val: money(totalNet), icon: '💰' },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className="text-lg mb-0.5">{stat.icon}</div>
                  <div className="font-bold text-white text-sm">{stat.val}</div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown par source */}
          {revenue?.breakdown && revenue.breakdown.length > 0 && (
            <div className="border-t border-slate-800 divide-y divide-slate-800/50">
              {revenue.breakdown.map((src) => (
                <div key={src.source_type} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-xl">{activityIcon(src.source_type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{src.source_type}</span>
                      <span className="font-bold text-white text-sm">{money(parseFloat(src.gross))}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{src.count} activité(s)</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Wallet */}
      <div className="px-4 mb-5">
        <Card className="flex items-center justify-between p-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">💳 Solde wallet</div>
            <div className="font-bold text-green-400 text-xl">{money(walletBalance)}</div>
          </div>
          <Link href="/wallet" className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">
            Retirer →
          </Link>
        </Card>
      </div>

      {/* Plateformes connectées */}
      <div className="px-4 mb-5">
        <SectionHeader title="Mes plateformes" actionLabel="Gérer" action={() => {}} />
        {platforms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-5 text-center text-xs text-slate-500">
            Aucune plateforme connectée.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {platforms.slice(0, 4).map((p, i) => {
              const state = platformStatus(p.status)
              return (
                <Link key={i} href="/platforms" className="rounded-2xl p-3 border bg-slate-900 border-slate-800 flex items-start gap-2.5">
                  <span className="text-2xl">{activityIcon(p.provider)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{p.provider}</div>
                    <span className={`inline-flex mt-1 text-[9px] px-1.5 py-0.5 rounded-full border ${state.color}`}>{state.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Courses récentes */}
      <div className="px-4 mb-4">
        <SectionHeader title="Courses récentes" actionLabel="Voir tout" action={() => {}} />
        <div className="space-y-2">
          {tLoading ? (
            <div className="driver-card px-4 py-4 text-sm text-slate-500">Chargement…</div>
          ) : trips.length === 0 ? (
            <div className="driver-card px-4 py-4 text-sm text-slate-500">Aucune course enregistrée.</div>
          ) : trips.slice(0, 3).map((trip) => (
            <div key={trip.id} className="driver-card px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">🚕</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-white">{trip.trip_reference}</span>
                  <span className="text-[10px] text-slate-500">{formatTime(trip.started_at)}</span>
                </div>
                <div className="text-xs text-slate-400">{(trip.distance_meters / 1000).toFixed(1)} km</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-white text-sm">{money(trip.final_amount ?? '0')}</div>
                <div className="text-[10px] text-green-400">{trip.trip_status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-4 mb-6">
        <SectionHeader title="Actions rapides" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/taximeter', icon: '🚕', label: 'Démarrer course taxi', color: 'bg-qc-blue/20 border-qc-blue/30' },
            { href: '/revenue',   icon: '💰', label: 'Voir mes revenus',     color: 'bg-green-500/10 border-green-500/20' },
            { href: '/documents', icon: '📄', label: 'Mes documents',        color: 'bg-amber-500/10 border-amber-500/20' },
            { href: '/tax',       icon: '📋', label: 'Centre fiscal',        color: 'bg-purple-500/10 border-purple-500/20' },
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
