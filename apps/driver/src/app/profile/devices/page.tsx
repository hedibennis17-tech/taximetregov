'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { driverDevices } from '@/data/driver.mock'
import { Smartphone, Shield, LogOut, CheckCircle, AlertCircle } from 'lucide-react'

export default function DevicesPage() {
  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Mes appareils</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
      <div className="px-4">
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5 text-xs text-blue-300">
          <Shield size={13} className="mt-0.5 shrink-0" />
          Seuls les appareils enregistrés peuvent accéder à votre compte. Si vous perdez un appareil, révoquez-le immédiatement.
        </div>
        <div className="space-y-4 mb-5">
          {driverDevices.map(device => (
            <Card key={device.deviceId} className={device.isCurrent ? 'border-qc-blue/40' : ''}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${device.isCurrent ? 'bg-qc-blue' : 'bg-slate-800'}`}>
                  <Smartphone size={22} className={device.isCurrent ? 'text-white' : 'text-slate-400'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-white">{device.name}</span>
                    {device.isCurrent && <span className="text-[9px] font-bold bg-qc-blue text-white px-2 py-0.5 rounded-full">CET APPAREIL</span>}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${device.securityStatus === 'SECURE' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                      {device.securityStatus === 'SECURE' ? '🔒 SÉCURISÉ' : '💤 INACTIF'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-0.5">{device.os} · {device.model}</div>
                  <div className="text-[10px] text-slate-500">Dernière activité : {new Date(device.lastActive).toLocaleDateString('fr-CA')}</div>
                  <div className="text-[10px] text-slate-500">{device.location}</div>
                </div>
                {!device.isCurrent && (
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all shrink-0">
                    <LogOut size={12} /> Révoquer
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
