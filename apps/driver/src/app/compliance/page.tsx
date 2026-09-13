'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile } from '@/lib/api'
import { CheckCircle, AlertTriangle, Shield } from 'lucide-react'

export default function CompliancePage() {
  const { profile, loading } = useDriverProfile()

  const items = [
    { label:'Identité vérifiée',      ok: profile?.verification_status === 'VERIFIED', icon:'🪪' },
    { label:'Profil complété',        ok: profile?.status === 'ACTIVE',                         icon:'👤' },
    { label:'Permis de conduire',     ok: true,                                                  icon:'🪪' },
    { label:'Permis taxi',            ok: true,                                                  icon:'🏛️' },
    { label:'Véhicule actif',         ok: true,                                                  icon:'🚗' },
    { label:'Inspection à jour',      ok: true,                                                  icon:'🔧' },
    { label:'Assurance valide',       ok: true,                                                  icon:'🛡️' },
    { label:'Compte fiscal actif',    ok: true,                                                  icon:'🧾' },
    { label:'TPS enregistrée',        ok: true,                                                  icon:'✅' },
    { label:'TVQ enregistrée',        ok: true,                                                  icon:'✅' },
  ]

  const score = items.filter(i => i.ok).length
  const pct   = Math.round((score / items.length) * 100)

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Ma conformité</h1>
        <p className="text-xs text-slate-400 mt-0.5">Dossier réglementaire · TAXIMETER.GOV</p>
      </div>
      <div className="px-4 space-y-4 pb-8">

        {/* Score */}
        <Card className={`p-6 text-center ${pct === 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className={`text-6xl font-black mb-1 ${pct === 100 ? 'text-green-400' : 'text-amber-400'}`}>{pct}%</div>
          <div className="text-sm font-bold text-white">{pct === 100 ? '🟢 Dossier conforme' : '🟠 Action requise'}</div>
          <div className="text-xs text-slate-400 mt-1">{score}/{items.length} éléments conformes</div>
        </Card>

        {/* Checklist */}
        <Card className="p-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Vérification dossier</div>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.label} className="flex items-center gap-3 py-1.5">
                <span className="text-base w-6">{item.icon}</span>
                <span className="flex-1 text-sm text-white">{item.label}</span>
                {item.ok
                  ? <CheckCircle size={16} className="text-green-400 shrink-0" />
                  : <AlertTriangle size={16} className="text-amber-400 shrink-0" />}
              </div>
            ))}
          </div>
        </Card>

        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-slate-400" />
            <p className="text-[10px] text-slate-400">Mode pilote · Données synthétiques · Non certifié par les autorités gouvernementales</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
