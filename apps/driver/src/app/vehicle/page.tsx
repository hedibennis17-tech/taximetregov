'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockVehicleProfile, mockVehicleServiceAuth, mockInsurance, mockComplianceDocs,
  VERIFICATION_STATUS_CONF,
} from '@/lib/engines/compliance.engine'
import { Shield, AlertCircle, Lock } from 'lucide-react'

export default function VehiclePage() {
  const v = mockVehicleProfile
  const ins = mockInsurance
  const inspDoc = mockComplianceDocs.find(d => d.docType === 'INSPECTION')

  return (
    <AppShell>
      <PageHeader title="Mon véhicule" subtitle="Profil · Assurance · Inspection · Autorisation" />
      <div className="px-4">
        {/* Security notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Lock size={12} className="text-qc-blue-light mt-0.5 shrink-0"/>
          <p className="text-xs text-slate-400">NIP/VIN: chiffré côté serveur · Plaque masquée · Aucune donnée sensible exposée en clair</p>
        </div>

        {/* Vehicle hero */}
        <div className="bg-gradient-to-br from-qc-blue/20 to-slate-900 rounded-3xl border border-qc-blue/30 p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">🚘</div>
            <div className="flex-1">
              <div className="font-black text-white text-xl">{v.make} {v.model} {v.year}</div>
              <div className="text-sm text-slate-400">{v.color} · {v.vehicleType}</div>
              <div className="font-mono text-[10px] text-qc-blue-light">{v.vehicleId}</div>
            </div>
            <div className={`text-[9px] font-bold px-2 py-1 rounded-full ${v.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
              {v.isActive ? '● ACTIF' : v.status}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 rounded-2xl p-3">
              <div className="text-[9px] text-slate-500 mb-0.5">Plaque</div>
              <div className="font-mono font-bold text-white">{v.licensePlateReference}</div>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-3">
              <div className="text-[9px] text-slate-500 mb-0.5">VIN</div>
              <div className="font-mono font-bold text-slate-600">••••••••••••••</div>
              <div className="text-[8px] text-slate-600">Chiffré serveur</div>
            </div>
          </div>
        </div>

        {/* Service authorizations */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">Autorisations de service</div>
          <div className="space-y-2">
            {[
              { icon:'🚕', label:'Taxi', status:mockVehicleServiceAuth.taxi, note:'Taximètre: ACTIF' },
              { icon:'🚗', label:'Rideshare', status:mockVehicleServiceAuth.rideshare, note:'Prix fournisseur' },
              { icon:'📦', label:'Livraison', status:mockVehicleServiceAuth.delivery, note:'Taximètre: OFF toujours' },
              { icon:'🏠', label:'Personnel', status:mockVehicleServiceAuth.personal, note:'Hors service' },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
                <span>{a.icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-white font-semibold">{a.label}</div>
                  <div className="text-[9px] text-slate-600">{a.note}</div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.status === 'AUTHORIZED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Insurance */}
        <Card className={`mb-4 border ${ins.status === 'VALID' ? 'border-green-500/20' : 'border-red-500/20'}`}>
          <div className="font-semibold text-white text-sm mb-3">🛡 Assurance</div>
          {[
            { label:'Fournisseur', val:ins.provider },
            { label:'Police', val:ins.policyReference, mono:true },
            { label:'Type', val:ins.isCommercial ? '🏢 Commerciale (requis taxi)' : 'Personnelle', color:ins.isCommercial ? 'text-blue-400' : 'text-amber-400' },
            { label:'Effective', val:new Date(ins.effectiveDate).toLocaleDateString('fr-CA') },
            { label:'Expire', val:new Date(ins.expiryDate).toLocaleDateString('fr-CA') },
            { label:'Jours restants', val:`${ins.daysUntilExpiry} j`, color:ins.daysUntilExpiry < 30 ? 'text-red-400' : ins.daysUntilExpiry < 90 ? 'text-amber-400' : 'text-green-400' },
            { label:'Vérification', val:VERIFICATION_STATUS_CONF[ins.verificationStatus].label },
          ].map(s => (
            <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0 text-xs">
              <span className="text-slate-400">{s.label}</span>
              <span className={`font-medium ${'color' in s ? s.color : ''} ${'mono' in s ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
            </div>
          ))}
        </Card>

        {/* Inspection */}
        {inspDoc && (
          <Card className={`mb-4 border ${inspDoc.status === 'EXPIRING_SOON' ? 'border-amber-500/20' : 'border-green-500/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{inspDoc.status === 'EXPIRING_SOON' ? '⚠️' : '✅'}</span>
              <div className="font-semibold text-white text-sm flex-1">{inspDoc.label}</div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${inspDoc.status === 'EXPIRING_SOON' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>{inspDoc.status}</span>
            </div>
            {inspDoc.daysUntilExpiry !== null && inspDoc.daysUntilExpiry < 60 && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <AlertCircle size={12} className="mt-0.5 shrink-0"/>
                Expiration dans {inspDoc.daysUntilExpiry} jours — Planifier le renouvellement
              </div>
            )}
          </Card>
        )}

        {/* Note: cannot switch vehicle during active trip */}
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5 text-xs text-slate-400">
          <Lock size={12} className="mt-0.5 shrink-0"/>
          Changement de véhicule impossible pendant une course active. Terminer la course en cours avant de changer.
        </div>

        <button className="w-full py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-all mb-3">
          + Ajouter un véhicule
        </button>
        <button className="w-full py-3 rounded-2xl border border-slate-800 text-slate-500 text-sm hover:bg-slate-900 transition-all mb-6">
          Modifier les informations
        </button>
      </div>
    </AppShell>
  )
}
