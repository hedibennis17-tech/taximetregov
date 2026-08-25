'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import { mockVehicle } from '@/data/driver.mock'
import { AlertTriangle } from 'lucide-react'

export default function VehiclePage() {
  return (
    <AppShell>
      <PageHeader title="Mon véhicule" subtitle="Plaque · VIN · Assurance · Inspection · Taximètre" />
      <div className="px-4">
        {mockVehicle.inspectionStatus === 'EXPIRING' && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">Inspection expire le <strong>{mockVehicle.inspectionExpiry}</strong>. Renouvelez avant cette date.</p>
          </div>
        )}
        <Card className="mb-4 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="text-4xl text-center mb-3">🚕</div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{mockVehicle.year} {mockVehicle.make} {mockVehicle.model}</div>
            <div className="text-slate-400 text-sm">{mockVehicle.color}</div>
            <div className="font-mono text-2xl text-qc-blue-light font-bold mt-2">{mockVehicle.plate}</div>
          </div>
        </Card>
        <Card className="mb-4">
          <div className="space-y-3">
            {[
              ['VIN',mockVehicle.vin],
              ['ID Véhicule',mockVehicle.vehicleId],
              ['Type',mockVehicle.vehicleType],
            ].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="font-mono text-xs text-slate-300">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">📋 Documents véhicule</div>
          {[
            { label:'Assurance', num:mockVehicle.insuranceNumber, expiry:mockVehicle.insuranceExpiry, status:mockVehicle.insuranceStatus },
            { label:'Inspection', num:'INSP-2026', expiry:mockVehicle.inspectionExpiry, status:mockVehicle.inspectionStatus },
          ].map(d=>(
            <div key={d.label} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
              <div>
                <div className="text-sm font-medium text-white">{d.label}</div>
                <div className="text-[10px] font-mono text-slate-500">{d.num} · Expire: {d.expiry}</div>
              </div>
              <DocBadge status={d.status} />
            </div>
          ))}
        </Card>
        <Card className="mb-6">
          <div className="font-semibold text-white text-sm mb-3">🔢 Taximètre numérique</div>
          <div className="space-y-2">
            {[
              ['ID Instance',mockVehicle.meter.instanceId],
              ['Version',mockVehicle.meter.version],
              ['Certifié',mockVehicle.meter.certified ? '✅ Oui' : '❌ Non'],
              ['Certification expire',mockVehicle.meter.certExpiry],
            ].map(([l,v])=>(
              <div key={l} className="flex justify-between text-xs">
                <span className="text-slate-500">{l}</span>
                <span className="text-slate-200 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
