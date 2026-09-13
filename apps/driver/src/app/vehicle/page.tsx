'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile } from '@/lib/api'
import { useState, useEffect } from 'react'
import { RefreshCw, Car, CheckCircle } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Vehicle { id:string; make:string; model:string; year:number; color:string; license_plate_masked:string; vehicle_type:string; fuel_type:string; seating_capacity:number; vehicle_status:string; taximeter_status:string; taximeter_serial_masked:string }
interface Inspection { status:string; inspection_date:string; expiry_date:string; passed:boolean; certificate_ref:string }
interface Registration { status:string; valid_from:string; valid_until:string; registration_last4:string }

export default function VehiclePage() {
  const { profile } = useDriverProfile()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    void (async () => {
      try {
        const sb = getSupabaseBrowserClient()
        const { data: v } = await sb.from('vehicles').select('*').eq('driver_id', profile.id).eq('is_active', true).limit(1)
        if (v?.[0]) {
          setVehicle(v[0] as Vehicle)
          const { data: i } = await sb.from('vehicle_inspections').select('*').eq('vehicle_id', v[0].id).order('expiry_date', { ascending: false }).limit(1)
          if (i?.[0]) setInspection(i[0] as Inspection)
          const { data: r } = await sb.from('vehicle_registrations').select('*').eq('vehicle_id', v[0].id).order('valid_until', { ascending: false }).limit(1)
          if (r?.[0]) setRegistration(r[0] as Registration)
        }
      } finally { setLoading(false) }
    })()
  }, [profile?.id])

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Mon véhicule</h1>
        <p className="text-xs text-slate-400 mt-0.5">Dossier véhicule · TAXIMETER.GOV</p>
      </div>
      <div className="px-4 space-y-4 pb-8">
        {loading && <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}
        {!loading && !vehicle && (
          <Card className="p-8 text-center">
            <Car size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucun véhicule enregistré.</p>
          </Card>
        )}
        {vehicle && (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-qc-blue/20 flex items-center justify-center text-2xl">🚗</div>
                <div>
                  <div className="font-bold text-white text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                  <div className="text-xs text-slate-400">{vehicle.color} · {vehicle.vehicle_type} · {vehicle.fuel_type}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Plaque',     val: vehicle.license_plate_masked },
                  { label:'Places',     val: `${vehicle.seating_capacity} passagers` },
                  { label:'Statut',     val: vehicle.vehicle_status },
                  { label:'Taximètre', val: vehicle.taximeter_status },
                ].map(r => (
                  <div key={r.label} className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">{r.label}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{r.val}</div>
                  </div>
                ))}
              </div>
            </Card>

            {inspection && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className={inspection.passed ? 'text-green-400' : 'text-red-400'} />
                  <span className="font-semibold text-white text-sm">Inspection mécanique</span>
                </div>
                <div className="flex justify-between text-xs">
                  <div><span className="text-slate-400">Date: </span><span className="text-white">{new Date(inspection.inspection_date).toLocaleDateString('fr-CA')}</span></div>
                  <div><span className="text-slate-400">Expire: </span><span className="text-white">{new Date(inspection.expiry_date).toLocaleDateString('fr-CA')}</span></div>
                </div>
              </Card>
            )}

            {registration && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-white text-sm">Immatriculation</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${registration.status === 'VALID' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{registration.status}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <div><span className="text-slate-400">Valide jusqu'au: </span><span className="text-white">{new Date(registration.valid_until).toLocaleDateString('fr-CA')}</span></div>
                  <div><span className="text-slate-400">No: </span><span className="text-white">••••{registration.registration_last4}</span></div>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Taximètre numérique</div>
              <div className="flex justify-between text-xs">
                <div><span className="text-slate-400">Statut: </span><span className={vehicle.taximeter_status === 'CERTIFIED' ? 'text-green-400 font-bold' : 'text-amber-400'}>{vehicle.taximeter_status}</span></div>
                <div><span className="text-slate-400">Série: </span><span className="text-white">{vehicle.taximeter_serial_masked}</span></div>
              </div>
              <div className="mt-2 text-[9px] text-slate-600">Mode pilote · Non certifié MEV-WEB selon Revenu Québec</div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
