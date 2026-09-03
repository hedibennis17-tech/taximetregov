'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Layers, Scale, CheckCircle } from 'lucide-react'

export default function ExceptionsPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/provider-transparency" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={13} /> Vue globale
          </Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white font-semibold">Centre des exceptions</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { href: '/provider-transparency', icon: Layers, label: 'Vue globale', active: false },
            { href: '/provider-transparency/transactions', icon: Layers, label: 'Transactions', active: false },
            { href: '/provider-transparency/reconciliation', icon: Scale, label: 'Réconciliation', active: false },
            { href: '/provider-transparency/exceptions', icon: ShieldAlert, label: 'Exceptions', active: true },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.active ? 'bg-qc-blue text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={12} />{item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
          <CheckCircle size={16} className="text-green-400" />
          <div>
            <div className="text-xs font-bold text-green-400">Centre des exceptions — Aucune exception active</div>
            <div className="text-[10px] text-green-400/70">Base de données connectée · Une différence n'est jamais automatiquement une fraude</div>
          </div>
        </div>
        {[
          { label: 'MISSING_ACTIVITY', desc: 'Activité attendue mais non reçue du provider' },
          { label: 'REVENUE_MISMATCH', desc: 'Écart entre montant provider et ledger' },
          { label: 'TAX_MISMATCH', desc: 'Écart entre taxes provider et moteur fiscal' },
          { label: 'DUPLICATE_ACTIVITY', desc: 'Transaction soumise en double' },
          { label: 'MISSING_PROVIDER_DATA', desc: 'Données manquantes du provider' },
        ].map(ex => (
          <Card key={ex.label} className="p-3 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{ex.label}</div>
                <div className="text-[10px] text-slate-400">{ex.desc}</div>
              </div>
              <span className="text-xs font-bold text-slate-500">0</span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
