'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import { mockDriver, mockLicense, mockVehicle, driverActivities, complianceStatus, driverPermissions, TAXIMETER_ENABLED_BY_ACTIVITY } from '@/data/driver.mock'
import { ChevronRight, Shield, FileText, Car, Gauge, Lock, Bell, Globe, HelpCircle, LogOut, Smartphone, Eye } from 'lucide-react'
import Link from 'next/link'

const docIcon: Record<string,string> = { VALID:'✅', EXPIRING:'⚠️', EXPIRED:'❌', PENDING:'⏳', REJECTED:'🚫', UNDER_REVIEW:'🔍' }

export default function ProfilePage() {
  const menuItems = [
    { icon: FileText, label: 'Documents', href: '/documents', badge: '1 ⚠' },
    { icon: Car, label: 'Mon véhicule', href: '/vehicle' },
    { icon: Gauge, label: 'Mes activités', href: '/activity-switcher' },
    { icon: Eye, label: 'Confidentialité', href: '/profile/privacy' },
    { icon: Smartphone, label: 'Mes appareils', href: '/profile/devices' },
    { icon: Shield, label: 'Sécurité & MFA', href: '/security' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: Globe, label: 'Langue & Accessibilité', href: '#' },
    { icon: HelpCircle, label: 'Support', href: '/support' },
  ]
  return (
    <AppShell>
      <PageHeader title="Mon profil" subtitle={`${mockDriver.driverId} · ${mockDriver.accountStatus}`} />
      <div className="px-4">
        {/* Identity card */}
        <Card className="mb-5 bg-gradient-to-br from-qc-blue/30 to-slate-900 border-qc-blue/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-qc-blue flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {mockDriver.firstName[0]}{mockDriver.lastName[0]}
            </div>
            <div>
              <div className="font-bold text-white text-xl">{mockDriver.firstName} {mockDriver.lastName}</div>
              <div className="text-xs text-slate-400">{mockDriver.email}</div>
              <div className="font-mono text-[10px] text-qc-blue-light mt-0.5">{mockDriver.driverId}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Statut', val: '✅ Compte actif' },
              { label: 'MFA', val: mockDriver.mfaEnabled ? '🔐 Activé' : '⚠ Désactivé' },
              { label: 'Province', val: mockDriver.province },
              { label: 'Membre depuis', val: new Date(mockDriver.createdAt).getFullYear().toString() },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-500 mb-0.5">{s.label}</div>
                <div className="text-xs font-semibold text-white">{s.val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance summary */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">📋 Conformité</div>
          <div className="space-y-2">
            {complianceStatus.items.map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-lg w-7 shrink-0">{item.icon}</span>
                <span className="flex-1 text-xs text-slate-300">{item.label}</span>
                <span className="text-xs">{docIcon[item.status]}</span>
                {item.expiry && <span className="text-[10px] text-slate-500 font-mono">{item.expiry}</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* Authorized activities with taximeter rule */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">⚙️ Activités autorisées</div>
          <div className="space-y-2">
            {driverActivities.filter(a => a.authorizationStatus === 'AUTHORIZED').map(act => (
              <div key={act.activityType} className="flex items-center gap-3 py-1.5">
                <span className="text-xl">{act.icon}</span>
                <span className="flex-1 text-sm text-slate-200 font-medium">{act.label}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border
                  ${act.taximeterEnabled ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
                  <Gauge size={9}/> {act.taximeterEnabled ? 'Taximètre: ON' : 'Taximètre: OFF'}
                </span>
              </div>
            ))}
          </div>
          <Link href="/activity-switcher" className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs text-qc-blue-light hover:text-blue-300 transition-colors">
            <span>Changer d'activité</span>
            <ChevronRight size={14} />
          </Link>
        </Card>

        {/* Menu */}
        <div className="driver-card divide-y divide-slate-800 mb-5">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-slate-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-slate-300">{item.label}</span>
                {item.badge && <span className="text-[10px] font-bold text-amber-400 mr-1">{item.badge}</span>}
                <ChevronRight size={16} className="text-slate-600" />
              </Link>
            )
          })}
        </div>

        <button className="w-full py-4 rounded-2xl border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all mb-6">
          <LogOut size={16} /> Se déconnecter
        </button>

        <div className="text-center text-[10px] text-slate-700 pb-4">
          TAXIMÈTRE.GOV Driver v0.1.0 · Pilote Québec 2026<br/>⚠ SIMULATION
        </div>
      </div>
    </AppShell>
  )
}
