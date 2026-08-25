'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { devicePermissions } from '@/data/driver.mock'
import { Shield, MapPin, Camera, Mic, Bell, Bluetooth, Database, CheckCircle, XCircle } from 'lucide-react'

const permIcons: Record<string, React.ReactNode> = {
  LOCATION: <MapPin size={18} />, BACKGROUND_LOCATION: <MapPin size={18} />,
  CAMERA: <Camera size={18} />, MICROPHONE: <Mic size={18} />,
  NOTIFICATIONS: <Bell size={18} />, BLUETOOTH: <Bluetooth size={18} />,
  STORAGE: <Database size={18} />,
}
const permLabels: Record<string, string> = {
  LOCATION: 'Localisation', BACKGROUND_LOCATION: 'Localisation en arrière-plan',
  CAMERA: 'Caméra', MICROPHONE: 'Microphone',
  NOTIFICATIONS: 'Notifications', BLUETOOTH: 'Bluetooth', STORAGE: 'Stockage',
}

export default function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="Confidentialité" subtitle="Données · GPS · Permissions · Gouvernement" />
      <div className="px-4">
        {/* Data usage */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-4">📊 Utilisation de vos données</div>
          <div className="space-y-4">
            {[
              { icon:'📍', label:'Localisation GPS', desc:'Utilisée pour les courses taxi, suivi de livraison et navigation. Jamais vendue à des tiers.' },
              { icon:'💰', label:'Données financières', desc:'Transactions synchronisées avec le Ledger gouvernemental. Jamais partagées hors du cadre légal.' },
              { icon:'🏛️', label:'Synchronisation gouvernementale', desc:'Revenus et taxes transmis au Government Dashboard TAXIMÈTRE.GOV pour conformité fiscale.' },
              { icon:'🔗', label:'Plateformes partenaires', desc:'Données synchronisées uniquement avec les plateformes auxquelles vous êtes connecté (Uber, DoorDash, etc.).' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white mb-0.5">{item.label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Device permissions */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-4">📱 Permissions de l'appareil</div>
          <div className="space-y-3">
            {Object.entries(devicePermissions).map(([key, perm]) => (
              <div key={key} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${perm.granted ? 'bg-green-500/10' : 'bg-slate-800'}`}>
                  <span className={perm.granted ? 'text-green-400' : 'text-slate-500'}>{permIcons[key]}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{permLabels[key]}</span>
                    {perm.required && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">REQUIS</span>}
                  </div>
                  <div className="text-xs text-slate-400">{perm.reason}</div>
                </div>
                <span className="shrink-0 mt-1">
                  {perm.granted ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-slate-600" />}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* NAS protection notice */}
        <Card className="mb-6 border-red-500/20">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-white text-sm mb-1">🔒 NAS / Numéro d'assurance sociale</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Votre NAS, si légalement requis, est chiffré, masqué et stocké dans un coffre sécurisé séparé. Il est affiché uniquement sous la forme <span className="font-mono text-slate-300">***-***-XXX</span>. Il n'apparaît jamais dans les logs, URLs, notifications, analytiques ou exports non autorisés.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
