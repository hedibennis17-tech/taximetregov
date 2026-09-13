'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile, money } from '@/lib/api'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  User, LogOut, RefreshCw, Shield, CheckCircle,
  Clock, AlertCircle, ChevronRight
} from 'lucide-react'

const STATUS_CONF: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  VERIFIED:      { label: 'Vérifié',      color: 'text-green-400',  icon: CheckCircle  },
  PENDING:       { label: 'En attente',   color: 'text-amber-400',  icon: Clock        },
  UNDER_REVIEW:  { label: 'En révision',  color: 'text-blue-400',   icon: Clock        },
  SUSPENDED:     { label: 'Suspendu',     color: 'text-red-400',    icon: AlertCircle  },
  REJECTED:      { label: 'Rejeté',       color: 'text-red-400',    icon: AlertCircle  },
}

export default function ProfilePage() {
  const { profile, loading, error, refresh } = useDriverProfile()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch {
      setSigningOut(false)
    }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-qc-blue" size={24} />
      </div>
    </AppShell>
  )

  const status = profile ? (STATUS_CONF[profile.verification_status] ?? STATUS_CONF['PENDING']!) : null

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
        <p className="text-xs text-slate-400 mt-0.5">TAXIMÈTRE.GOV — Espace chauffeur</p>
      </div>

      <div className="px-4 space-y-4 pb-8">

        {/* Erreur */}
        {error && (
          <Card className="p-4 border-red-500/30 bg-red-500/5">
            <p className="text-sm text-red-400 text-center">{error}</p>
            <button onClick={() => void refresh()}
              className="mt-3 w-full py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">
              Réessayer
            </button>
          </Card>
        )}

        {/* Carte identité */}
        {profile && (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-qc-blue flex items-center justify-center text-white font-bold text-2xl shrink-0">
                  {profile.first_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg leading-tight">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{profile.email}</div>
                  {status && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${status.color}`}>
                      <status.icon size={12} />
                      {status.label}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                {[
                  { label: 'ID Gouvernemental', val: profile.public_driver_id },
                  { label: 'Statut dossier',    val: profile.onboarding_status?.replace(/_/g, ' ') },
                  { label: 'Langue préférée',   val: profile.preferred_language === 'fr' ? 'Français' : 'English' },
                  ...(profile.phone_number_masked ? [{ label: 'Téléphone', val: profile.phone_number_masked }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{row.label}</span>
                    <span className="text-xs font-semibold text-white">{row.val}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Liens rapides */}
            <Card className="p-0 overflow-hidden">
              {[
                { label: 'Mes documents',   href: '/documents',  icon: Shield },
                { label: 'Mon véhicule',    href: '/vehicle',    icon: User   },
                { label: 'Mes plateformes', href: '/platforms',  icon: Shield },
                { label: 'Sécurité',        href: '/security',   icon: Shield },
              ].map((item, i, arr) => (
                <button key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-800 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-800' : ''}`}>
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="text-qc-blue" />
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </Card>
          </>
        )}

        {/* Bouton déconnexion */}
        <button
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm disabled:opacity-50 active:scale-95 transition-all"
        >
          {signingOut
            ? <><RefreshCw size={16} className="animate-spin" /> Déconnexion…</>
            : <><LogOut size={16} /> Se déconnecter</>}
        </button>

        <p className="text-center text-[10px] text-slate-600">
          TAXIMÈTRE.GOV · Mode pilote · Gouvernement du Québec
        </p>
      </div>
    </AppShell>
  )
}
