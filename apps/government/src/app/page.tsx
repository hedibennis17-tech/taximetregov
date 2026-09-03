 'use client'

/** STYLE: tableau Super Admin — données opérationnelles réelles en priorité, avec une distinction pilote sans ambiguïté. */
import Link from 'next/link'
import { ArrowRight, CircleDollarSign, FileText, Scale, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PilotScenarioOverview } from '@/components/PilotScenarioOverview'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-3"><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Super Admin · tableau de bord</h1><span className="rounded-full bg-qc-blue px-2 py-0.5 text-[10px] font-bold text-white">SUPABASE</span></div>
          <p className="text-sm text-slate-500">Vue de présentation : opérations, revenus, fiscalité et contrôle pilote.</p>
        </div>
      </div>
      <PilotScenarioOverview />
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">{[
        { href: '/control-center', label: 'Centre de contrôle', desc: 'Présences, alertes et activités', Icon: ShieldCheck },
        { href: '/provider-transparency', label: 'Transparence transactionnelle', desc: 'Source, fiscalité et rapprochement', Icon: Scale },
        { href: '/reports', label: 'Rapports pilotes', desc: 'Restitution et documentation', Icon: FileText },
      ].map(({ href, label, desc, Icon }) => <Link key={href} href={href} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-qc-blue dark:border-slate-800 dark:bg-slate-900"><Icon className="mb-3 text-qc-blue" size={17}/><b className="block text-sm text-slate-800 dark:text-white">{label}</b><span className="mt-1 block text-[10px] text-slate-500">{desc}</span><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-qc-blue">Consulter <ArrowRight size={11}/></span></Link>)}</div>
    </AppShell>
  )
}
