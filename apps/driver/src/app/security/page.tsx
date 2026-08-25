'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockDriver } from '@/data/driver.mock'
import { Shield, Smartphone, Lock, Eye, LogOut, ChevronRight } from 'lucide-react'

export default function SecurityPage() {
  return (
    <AppShell>
      <PageHeader title="Sécurité" subtitle="MFA · Sessions · Appareil · Données" />
      <div className="px-4">
        {/* MFA status */}
        <Card className={`mb-4 ${mockDriver.mfaEnabled ? 'border-green-500/30' : 'border-amber-500/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mockDriver.mfaEnabled ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
              <Shield size={24} className={mockDriver.mfaEnabled ? 'text-green-400' : 'text-amber-400'} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">Authentification MFA</div>
              <div className={`text-xs ${mockDriver.mfaEnabled ? 'text-green-400' : 'text-amber-400'}`}>
                {mockDriver.mfaEnabled ? '✅ Activé — Authenticator App' : '⚠ Recommandé — Non activé'}
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500" />
          </div>
        </Card>

        {/* Device */}
        <Card className="mb-4">
          <div className="font-semibold text-sm text-white mb-3">📱 Appareils autorisés</div>
          <div className="flex items-center gap-3 py-2">
            <Smartphone size={20} className="text-qc-blue-light shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-white">iPhone 15 Pro — CET APPAREIL</div>
              <div className="text-[10px] text-slate-500">Enregistré le 2024-03-15 · Montréal, QC</div>
            </div>
            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">ACTIF</span>
          </div>
        </Card>

        {/* Security options */}
        <div className="driver-card divide-y divide-slate-800 mb-5">
          {[
            { icon:Lock, label:'Changer le mot de passe', color:'text-slate-400' },
            { icon:Eye, label:'Voir l\'historique d\'accès', color:'text-slate-400' },
            { icon:Smartphone, label:'Gérer les appareils', color:'text-slate-400' },
            { icon:LogOut, label:'Déconnecter tous les appareils', color:'text-red-400' },
          ].map(item=>{
            const Icon = item.icon
            return (
              <button key={item.label} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl">
                <Icon size={18} className={item.color} />
                <span className={`flex-1 text-sm font-medium ${item.color}`}>{item.label}</span>
                <ChevronRight size={14} className="text-slate-700" />
              </button>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
