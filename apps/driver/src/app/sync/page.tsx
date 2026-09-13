'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile } from '@/lib/api'
import { CheckCircle, RefreshCw } from 'lucide-react'

export default function SyncPage() {
  const { profile } = useDriverProfile()

  const modules = [
    { label:'Identité',              status:'SYNCED', icon:'🪪' },
    { label:'Véhicule',              status:'SYNCED', icon:'🚗' },
    { label:'Documents',             status:'SYNCED', icon:'📄' },
    { label:'Autorisations',         status:'SYNCED', icon:'🏛️' },
    { label:'Courses',               status:'SYNCED', icon:'🚕' },
    { label:'Revenus',               status:'SYNCED', icon:'💰' },
    { label:'Fiscalité',             status:'SYNCED', icon:'🧾' },
    { label:'Conformité',            status:'SYNCED', icon:'✅' },
    { label:'Notifications',         status:'SYNCED', icon:'🔔' },
  ]

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Synchronisation</h1>
        <p className="text-xs text-slate-400 mt-0.5">État de synchronisation gouvernementale</p>
      </div>
      <div className="px-4 space-y-4 pb-8">

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] text-amber-400">⚠️ Mode pilote — Données synthétiques — Aucune connexion gouvernementale réelle active</p>
        </div>

        <Card className="p-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">État synchronisation TAXIMETER.GOV</div>
          <div className="space-y-2">
            {modules.map(m => (
              <div key={m.label} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-base w-6">{m.icon}</span>
                <span className="flex-1 text-sm text-white">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[10px] text-green-400 font-semibold">Synchronisé</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <RefreshCw size={20} className="mx-auto text-slate-500 mb-2" />
          <div className="text-xs text-slate-400">Dernière synchronisation</div>
          <div className="text-sm font-bold text-white mt-0.5">{new Date().toLocaleString('fr-CA')}</div>
        </Card>
      </div>
    </AppShell>
  )
}
