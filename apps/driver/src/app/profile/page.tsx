'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import { mockDriver, mockLicense, mockVehicle, driverDocuments } from '@/data/driver.mock'
import { ChevronRight, Shield, FileText, Car, CreditCard, Bell, Globe, HelpCircle, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const menuItems = [
    { icon:FileText, label:'Mes documents', href:'/documents', badge:'1 ⚠' },
    { icon:Car, label:'Mon véhicule', href:'/vehicle' },
    { icon:CreditCard, label:'Centre fiscal', href:'/tax' },
    { icon:Shield, label:'Sécurité & MFA', href:'/security' },
    { icon:Bell, label:'Notifications', href:'/notifications' },
    { icon:Globe, label:'Langue & Accessibilité', href:'#' },
    { icon:HelpCircle, label:'Support', href:'/support' },
  ]

  return (
    <AppShell>
      <PageHeader title="Mon profil" subtitle="Chauffeur autorisé — SIMULATION" />
      <div className="px-4">
        {/* Driver card */}
        <Card className="mb-5 bg-gradient-to-br from-qc-blue/30 to-qc-blue-dark/10 border-qc-blue/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl font-bold text-white">
              {mockDriver.firstName[0]}{mockDriver.lastName[0]}
            </div>
            <div>
              <div className="font-bold text-white text-lg">{mockDriver.firstName} {mockDriver.lastName}</div>
              <div className="text-xs text-slate-400">{mockDriver.email}</div>
              <div className="font-mono text-[10px] text-qc-blue-light mt-0.5">{mockDriver.driverId}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:'Statut compte', val:'✅ Approuvé' },
              { label:'MFA', val:mockDriver.mfaEnabled ? '🔐 Activé' : '⚠ Désactivé' },
              { label:'Province', val:mockDriver.province },
              { label:'Membre depuis', val:new Date(mockDriver.createdAt).getFullYear().toString() },
            ].map(s=>(
              <div key={s.label} className="bg-slate-900/50 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-500 mb-0.5">{s.label}</div>
                <div className="text-xs font-semibold text-white">{s.val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* License & Permit */}
        <Card className="mb-4">
          <div className="font-semibold text-sm text-white mb-3">📋 Permis & Licences</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-300">Permis conduire</div>
                <div className="text-[10px] text-slate-500">{mockLicense.number} · {mockLicense.class}</div>
                <div className="text-[10px] text-slate-500">Expire: {mockLicense.expiryDate}</div>
              </div>
              <DocBadge status={mockLicense.status} />
            </div>
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-300">Permis taxi</div>
                <div className="text-[10px] text-slate-500">{mockLicense.taxiPermitNumber}</div>
                <div className="text-[10px] text-slate-500">Expire: {mockLicense.taxiPermitExpiry}</div>
              </div>
              <DocBadge status={mockLicense.taxiPermitStatus} />
            </div>
          </div>
        </Card>

        {/* Authorized activities */}
        <Card className="mb-5">
          <div className="font-semibold text-sm text-white mb-3">⚙️ Activités autorisées</div>
          <div className="flex flex-wrap gap-2">
            {mockDriver.authorizedActivities.map(act => (
              <span key={act} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-400">
                ✅ {act === 'TAXI' ? '🚕 Taxi' : act === 'RIDESHARE' ? '🚗 Rideshare' : '📦 Livraison'}
              </span>
            ))}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-500">
              ⚪ Épicerie (non autorisé)
            </span>
          </div>
        </Card>

        {/* Menu items */}
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
          TAXIMÈTRE.GOV Driver v0.1.0 — Pilote Québec 2026<br/>
          ⚠ SIMULATION — Données de démonstration
        </div>
      </div>
    </AppShell>
  )
}
