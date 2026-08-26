'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockFiscalProfile, mockTaxRegistrations, mockTaxPeriods, mockTaxSummary } from '@/lib/engines/tax.engine'
import { ChevronRight, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export default function TaxPage() {
  const p = mockFiscalProfile
  const unverified = mockTaxRegistrations.filter(r => r.verificationStatus === 'UNVERIFIED').length
  const inProgress = mockTaxPeriods.filter(p => p.status === 'IN_PROGRESS').length
  const ready = mockTaxPeriods.filter(p => p.status === 'READY').length

  const menuItems = [
    { href:'/tax/profile', icon:'🏛️', label:'Profil fiscal', desc:'Identité · Inscriptions TPS/TVQ · Juridiction', badge: unverified > 0 ? `${unverified} non vérifiée(s)` : null, badgeColor:'text-amber-400' },
    { href:'/tax/periods', icon:'📅', label:'Périodes fiscales', desc:'TPS · TVQ · Trimestrielle · Statuts', badge: inProgress > 0 ? `${inProgress} en cours` : null, badgeColor:'text-blue-400' },
    { href:'/tax/estimate', icon:'🧮', label:'Estimation fiscale', desc:'Calcul préliminaire · TaxRuleEngine · ESTIMATION', badge: null, badgeColor:'' },
    { href:'/tax/reports', icon:'📊', label:'Rapports fiscaux', desc:'TPS · TVQ · Revenus · PDF · PRÉPARATION', badge: ready > 0 ? `${ready} prêt(s)` : null, badgeColor:'text-green-400' },
    { href:'/tax/documents', icon:'📄', label:'Documents fiscaux', desc:'Attestations · Déclarations · Justificatifs', badge: null, badgeColor:'' },
  ]

  return (
    <AppShell>
      <PageHeader title="Centre fiscal" subtitle="TPS · TVQ · Revenus · Préparation · SIMULATION" />
      <div className="px-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>Taximètre.GOV</strong> organise et prépare vos données fiscales. Il ne remplace pas <strong>Revenu Québec</strong>, <strong>l'ARC</strong> ou un comptable. Les montants affichés sont des estimations préliminaires.
          </p>
        </div>

        {/* Quick status */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label:'Revenu taxable', val:fmt(mockTaxSummary.taxableRevenue), sub:'Est. annuel' },
            { label:'TPS collectée', val:fmt(mockTaxSummary.tpsCollected), sub:'Estimation' },
            { label:'TVQ collectée', val:fmt(mockTaxSummary.tvqCollected), sub:'Estimation' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className="font-black text-white text-sm tabular-nums">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
              <div className="text-[9px] text-amber-500">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Registration status */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">📋 Statut des inscriptions</div>
          <div className="space-y-2">
            {mockTaxRegistrations.map(reg => (
              <div key={reg.registrationId} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${reg.status === 'REGISTERED' ? 'bg-green-500' : reg.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">{reg.taxType}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{mockFiscalProfile.jurisdiction}</span>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${reg.status === 'REGISTERED' ? 'text-green-400' : 'text-amber-400'}`}>{reg.status}</div>
                  <div className={`text-[9px] ${reg.verificationStatus === 'VERIFIED' ? 'text-green-400' : 'text-amber-400'}`}>{reg.verificationStatus}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Nav menu */}
        <div className="driver-card divide-y divide-slate-800 mb-6">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">{item.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold mr-1 ${item.badgeColor}`}>{item.badge}</span>
              )}
              <ChevronRight size={16} className="text-slate-600 shrink-0" />
            </Link>
          ))}
        </div>

        {/* Fiscal architecture note */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6">
          <Shield size={13} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <strong className="text-white">Architecture fiscale:</strong> Transaction → TaxClassification → TaxRuleEngine (versioned) → TaxSnapshot → TaxPeriod → TaxReport. Les taux ne sont jamais hardcodés dans le frontend.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
