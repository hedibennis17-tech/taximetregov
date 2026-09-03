'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useGovDashboard, money } from '@/lib/api'

export default function Page() {
  const { dashboard, loading, refresh } = useGovDashboard()

  return (
    <AppShell>
      <PageHeader title="Centre de contrôle" subtitle="Données Supabase · Table: system_configs" />
      <div className="px-4 md:px-6 pb-8 space-y-4">

        {/* Statut connexion */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-green-400 font-semibold">
            Base de données connectée · Supabase PostgreSQL · Table: <code>system_configs</code>
          </span>
          <button onClick={() => void refresh()} className="ml-auto">
            <RefreshCw size={12} className={loading ? 'animate-spin text-green-400' : 'text-green-600'} />
          </button>
        </div>

        {/* Icône + description */}
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">🎛️</div>
          <h2 className="text-lg font-bold text-white mb-2">Centre de contrôle</h2>
          <p className="text-sm text-slate-400 mb-6">
            Les données de ce module sont disponibles en base de données Supabase.<br />
            Interface complète en cours de déploiement.
          </p>

          {/* Stats rapides depuis dashboard */}
          {dashboard && (
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="font-bold text-white">{dashboard.drivers.total}</div>
                <div className="text-[10px] text-slate-400">Chauffeurs</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3">
                <div className="font-bold text-green-400">{money(dashboard.revenue.total_gross)}</div>
                <div className="text-[10px] text-slate-400">Revenus ce mois</div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation rapide */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/drivers',      label: 'Chauffeurs',    icon: '👥' },
            { href: '/tax/center',   label: 'Centre fiscal', icon: '🧾' },
            { href: '/audit',        label: 'Audit',         icon: '🔍' },
            { href: '/transactions', label: 'Transactions',  icon: '💰' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-semibold text-white">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
