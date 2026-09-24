'use client'
import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PILOT } from '@/lib/data'

type Activity = {
  id:string; public_id:string; activity_type_code:string; status:string
  source_type:string; gross_amount:string; tip_amount:string; fee_amount:string
  tax_amount:string; net_amount:string; reconciliation_status:string
  started_at:string; location_start_reference:string; location_end_reference:string
  driver_profiles?: { driver_number:string; first_name:string; last_name:string }
  vehicles?: { make:string; model:string; license_plate_masked:string }
}

const m2 = (n:string|number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(Number(n))
const TYPE_ICON: Record<string,string> = {
  TAXI_TRIP:'🚕', RIDESHARE_TRIP:'🚗', FOOD_DELIVERY:'🍕',
  GROCERY_DELIVERY:'🛒', PARCEL_DELIVERY:'📦', GREEN_RIDE:'🌱',
}
const RECON_COLOR: Record<string,string> = {
  MATCHED:'bg-green-100 text-green-700', PARTIAL_MATCH:'bg-amber-100 text-amber-700',
  MISMATCH:'bg-red-100 text-red-700', UNDER_REVIEW:'bg-purple-100 text-purple-700',
  PENDING:'bg-slate-100 text-slate-500',
}

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading]       = useState(true)
  const [source, setSource]         = useState('')
  const [filter, setFilter]         = useState('ALL')

  useEffect(() => {
    fetch('/api/activities?limit=50')
      .then(r => r.json())
      .then(data => { setActivities(data.activities ?? []); setSource(data.source ?? ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!user) return null

  const filtered = activities.filter(a => filter === 'ALL' || a.reconciliation_status === filter)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white">Activités</h1>
            <p className="text-xs text-slate-400">
              {source==='SUPABASE'?'✅ Données Supabase':'⚠️ Mode DEMO'} · {PILOT}
            </p>
          </div>
          <div className="text-sm font-bold text-slate-500">{filtered.length} activité{filtered.length!==1?'s':''}</div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          ⚠️ {PILOT}
        </div>

        {/* Filtres réconciliation */}
        <div className="flex gap-2 flex-wrap">
          {['ALL','MATCHED','PARTIAL_MATCH','MISMATCH','UNDER_REVIEW'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all"
              style={{background:filter===f?'#003DA5':'white',color:filter===f?'white':'#64748B',borderColor:filter===f?'#003DA5':'#E2E8F0'}}>
              {f==='ALL'?`Toutes (${activities.length})`:f.replace('_',' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement depuis Supabase...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const drv = a.driver_profiles
              const veh = a.vehicles
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{TYPE_ICON[a.activity_type_code] ?? '📍'}</span>
                      <div>
                        <div className="font-black text-slate-800 dark:text-white text-sm">{a.activity_type_code.replace(/_/g,' ')}</div>
                        <div className="text-xs text-slate-400 font-mono">{a.public_id}</div>
                        {drv && <div className="text-xs text-slate-500 mt-0.5">{drv.first_name} {drv.last_name} · {drv.driver_number}</div>}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${RECON_COLOR[a.reconciliation_status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {a.reconciliation_status?.replace(/_/g,' ')}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[{l:'Gross',v:m2(a.gross_amount)},{l:'Pourboire',v:m2(a.tip_amount)},{l:'Taxes',v:m2(a.tax_amount)},{l:'Net',v:m2(a.net_amount)}].map(k=>(
                      <div key={k.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{k.v}</div>
                        <div className="text-xs text-slate-400">{k.l}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    {a.location_start_reference && <span>📍 {a.location_start_reference} → {a.location_end_reference}</span>}
                    {veh && <span>🚗 {veh.make} {veh.model} · {veh.license_plate_masked}</span>}
                    <span>{a.source_type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
