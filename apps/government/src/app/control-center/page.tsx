'use client'

/** STYLE: Centre de contrôle Super Admin — panneaux opérationnels réels, états pilotes explicitement marqués. */
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { PilotScenarioOverview } from '@/components/PilotScenarioOverview'
import { PilotDataBadge } from '@/components/PilotDataBadge'
import Link from 'next/link'

export default function Page() {
  return (
    <AppShell>
      <PageHeader title="Centre de contrôle" subtitle="Super Admin · activité, alertes et flux pilote dans Supabase" />
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs font-semibold text-green-400">Base connectée · Supabase PostgreSQL · lecture sécurisée par rôle gouvernemental</span>
          <PilotDataBadge />
        </div>
        <PilotScenarioOverview compact />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
          { href: '/provider-transparency', label: 'Transactions', icon: '▣' }, { href: '/provider-transparency/reconciliation', label: 'Rapprochement', icon: '⇄' }, { href: '/tax/center', label: 'Fiscalité', icon: '₿' }, { href: '/reports', label: 'Rapports', icon: '▤' },
        ].map(item => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl bg-slate-800 p-3 transition-colors hover:bg-slate-700"><span className="text-xl text-qc-blue">{item.icon}</span><span className="text-xs font-semibold text-white">{item.label}</span></Link>)}</div>
      </div>
    </AppShell>
  )
}
