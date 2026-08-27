'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockDriverProfile, mockIdentityVerification, mockDriverLicense,
  mockTaxiPermit, mockServiceAuthorizations, mockProviderIdentities,
  mockComplianceSnapshot, VERIFICATION_STATUS_CONF, PROVIDER_ICONS,
  PROVIDER_LABELS, CONN_STATUS_CONF,
} from '@/lib/engines/compliance.engine'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Shield, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
  const snap = mockComplianceSnapshot

  const services = [
    { icon:'🚕', label:'Taxi', check:snap.taxi, href:'/compliance' },
    { icon:'🚗', label:'Rideshare', check:snap.rideshare, href:'/platforms' },
    { icon:'📦', label:'Livraison', check:snap.delivery, href:'/platforms' },
  ]

  return (
    <AppShell>
      <PageHeader title="Mon profil" subtitle="Identité · Services · Permis · Sécurité" />
      <div className="px-4">
        {/* Driver card */}
        <div className="flex items-center gap-4 p-5 driver-card mb-5">
          <div className="w-16 h-16 rounded-full bg-qc-blue/20 border-2 border-qc-blue/40 flex items-center justify-center text-3xl shrink-0">👤</div>
          <div className="flex-1">
            <div className="font-black text-white text-xl">{mockDriverProfile.firstName} {mockDriverProfile.lastName}</div>
            <div className="font-mono text-[10px] text-qc-blue-light">{mockDriverProfile.driverId}</div>
            <div className="text-xs text-slate-400">{mockDriverProfile.email}</div>
          </div>
          <div className="text-right">
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mockDriverProfile.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {mockDriverProfile.status}
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{mockDriverProfile.province} · {mockDriverProfile.language.toUpperCase()}</div>
          </div>
        </div>

        {/* Compliance quick status */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-5 ${snap.overallStatus === 'ALL_CLEAR' ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <span className="text-2xl">{snap.overallStatus === 'ALL_CLEAR' ? '✅' : '⚠️'}</span>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{snap.overallStatus === 'ALL_CLEAR' ? 'Toutes les conformités: OK' : 'Vérifications requises'}</div>
            <div className="text-[10px] text-slate-400">Snapshot: {new Date(snap.timestamp).toLocaleString('fr-CA')}</div>
          </div>
          <Link href="/compliance" className="text-qc-blue-light text-xs font-bold">Détails →</Link>
        </div>

        {/* Service authorization matrix */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">Services autorisés</div>
          <div className="space-y-2.5">
            {services.map(s => (
              <Link href={s.href} key={s.label}>
                <div className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{s.label}</div>
                    {s.check.blockers.length > 0 && <div className="text-[10px] text-red-400">{s.check.blockers[0]}</div>}
                    {s.check.warnings.length > 0 && s.check.blockers.length === 0 && <div className="text-[10px] text-amber-400">{s.check.warnings[0]}</div>}
                    <div className="text-[9px] text-slate-600">Taximètre: {s.check.taximeterEnabled ? '✓ ACTIF' : '✗ OFF'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.check.result === 'PASS' ? 'bg-green-500/20 text-green-400' : s.check.result === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                      {s.check.result}
                    </span>
                    <ChevronRight size={12} className="text-slate-600"/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Key documents quick view */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">Documents clés</div>
          {[
            { icon:'📄', label:'Permis Classe 4', days:mockDriverLicense.daysUntilExpiry, status:mockDriverLicense.status },
            { icon:'🚕', label:'Permis taxi QC', days:mockTaxiPermit.daysUntilExpiry, status:mockTaxiPermit.status },
            { icon:'🛡', label:'Assurance commerciale', days:126, status:'VALID' },
            { icon:'🔧', label:'Inspection mécanique', days:35, status:'EXPIRING_SOON' },
          ].map(d => (
            <div key={d.label} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
              <span>{d.icon}</span>
              <span className="text-xs text-slate-300 flex-1">{d.label}</span>
              <span className={`text-[9px] font-bold ${d.days < 0 ? 'text-red-400' : d.days < 60 ? 'text-amber-400' : 'text-green-400'}`}>
                {d.days < 0 ? `Expiré` : d.days < 60 ? `⚠ ${d.days}j` : `✓ ${d.days}j`}
              </span>
            </div>
          ))}
          <Link href="/compliance" className="block text-center text-xs text-qc-blue-light mt-2 font-bold">Voir tous les documents →</Link>
        </Card>

        {/* Provider connections quick */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">Connexions fournisseurs</div>
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700 mb-3 text-[10px] text-slate-400">
            <Shield size={12} className="mt-0.5 shrink-0"/>
            OAuth uniquement — jamais de mot de passe
          </div>
          <div className="grid grid-cols-3 gap-2">
            {mockProviderIdentities.map(prov => {
              const conf = CONN_STATUS_CONF[prov.connectionStatus]
              return (
                <div key={prov.provider} className="bg-slate-800/50 rounded-xl p-2 text-center">
                  <div className="text-xl">{PROVIDER_ICONS[prov.provider]}</div>
                  <div className="text-[9px] text-slate-400">{PROVIDER_LABELS[prov.provider]}</div>
                  <div className={`text-[8px] font-bold ${conf.color}`}>{conf.icon}</div>
                </div>
              )
            })}
          </div>
          <Link href="/platforms" className="block text-center text-xs text-qc-blue-light mt-2 font-bold">Gérer les connexions →</Link>
        </Card>

        {/* Navigation menu */}
        <div className="space-y-2 mb-6">
          {[
            { href:'/compliance', icon:'🛡', label:'Conformité complète', badge: snap.overallStatus !== 'ALL_CLEAR' ? '⚠' : undefined },
            { href:'/vehicle', icon:'🚘', label:'Mon véhicule' },
            { href:'/documents', icon:'📑', label:'Mes documents' },
            { href:'/platforms', icon:'🔗', label:'Mes plateformes' },
            { href:'/profile/devices', icon:'📱', label:'Mes appareils' },
            { href:'/profile/privacy', icon:'🔒', label:'Confidentialité' },
            { href:'/security', icon:'🛡', label:'Sécurité du compte' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-slate-200 font-medium flex-1">{item.label}</span>
                {item.badge && <span className="text-amber-400 font-bold">{item.badge}</span>}
                <ChevronRight size={14} className="text-slate-600"/>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
