'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Card, SectionHeader } from '@/components/ui'
import { useDriverProfile, useRevenue, money } from '@/lib/api'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

export default function Page() {
  const { profile, loading, refresh } = useDriverProfile()
  const { revenue } = useRevenue('month')

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Analytiques</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
      <div className="px-4 pb-8 space-y-4">

        {/* Connexion status */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Base de données connectée · Supabase</span>
          <button onClick={() => void refresh()} className="ml-auto">
            <RefreshCw size={12} className={loading ? 'animate-spin text-green-400' : 'text-green-600'} />
          </button>
        </div>

        {/* Contenu */}
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-bold text-white mb-2">Analytiques</h2>
          {profile && (
            <p className="text-sm text-slate-400 mb-4">
              {profile.first_name} {profile.last_name} · {profile.public_driver_id}
            </p>
          )}
          {revenue && (
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mt-4">
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="font-bold text-green-400">{money(revenue.wallet.balance)}</div>
                <div className="text-[10px] text-slate-400">Solde wallet</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="font-bold text-white">{revenue.summary.total_activities}</div>
                <div className="text-[10px] text-slate-400">Activités ce mois</div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/home',    label: 'Accueil',    icon: '🏠' },
            { href: '/revenue', label: 'Revenus',    icon: '💰' },
            { href: '/trips',   label: 'Courses',    icon: '🚕' },
            { href: '/taximeter', label: 'Taximètre', icon: '📟' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
              <span>{item.icon}</span>
              <span className="text-xs font-semibold text-white">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
