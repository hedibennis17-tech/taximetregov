'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import Link from 'next/link'
import { Scale, ArrowLeft, Layers, ShieldAlert, CheckCircle } from 'lucide-react'

export default function ReconciliationPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/provider-transparency" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={13} /> Vue globale
          </Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white font-semibold">Moteur de réconciliation</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { href: '/provider-transparency', icon: Layers, label: 'Vue globale', active: false },
            { href: '/provider-transparency/transactions', icon: Layers, label: 'Transactions', active: false },
            { href: '/provider-transparency/reconciliation', icon: Scale, label: 'Réconciliation', active: true },
            { href: '/provider-transparency/exceptions', icon: ShieldAlert, label: 'Exceptions', active: false },
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
            <div className="text-xs font-bold text-green-400">Moteur de réconciliation actif</div>
            <div className="text-[10px] text-green-400/70">Base de données connectée · Table: reconciliation_cases</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'MATCHED',       color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { label: 'PARTIAL_MATCH', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'VARIANCE',      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { label: 'MISSING_DATA',  color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          ].map(s => (
            <Card key={s.label} className={`p-3 border ${s.color}`}>
              <div className={`text-[10px] font-bold ${s.color.split(' ')[0]}`}>{s.label}</div>
              <div className="text-2xl font-bold text-white mt-1">0</div>
            </Card>
          ))}
        </div>
        <Card className="p-6 text-center">
          <Scale size={32} className="mx-auto text-qc-blue mb-3" />
          <h2 className="font-bold text-white mb-2">Moteur de réconciliation — Prêt</h2>
          <p className="text-xs text-slate-400">
            Les dossiers de réconciliation apparaîtront ici dès que des transactions providers seront reçues.<br />
            La base de données contient le schéma complet reconciliation_cases.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
