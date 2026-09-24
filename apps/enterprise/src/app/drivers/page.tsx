'use client'
import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PILOT } from '@/lib/data'

type Driver = {
  id: string; driver_number: string; first_name: string; last_name: string
  status: string; identity_verification_status: string; phone: string
  province: string; language: string; created_at: string
  vehicles?: { make:string; model:string; year:number; license_plate_masked:string; vehicle_type:string; fuel_type:string; vehicle_status:string }[]
  revenue?: { gross:number; tips:number; fees:number; net:number; taxes:number; count:number }
}

const STATUS_COLOR: Record<string,string> = {
  ACTIVE:'bg-green-100 text-green-700', UNDER_REVIEW:'bg-amber-100 text-amber-700',
  SUSPENDED:'bg-red-100 text-red-700', INACTIVE:'bg-slate-100 text-slate-500',
}
const VERIF_COLOR: Record<string,string> = {
  VERIFIED:'bg-green-100 text-green-700', PENDING:'bg-amber-100 text-amber-700',
  REJECTED:'bg-red-100 text-red-700',
}
const m2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)

export default function DriversPage() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource]   = useState<string>('')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<Driver|null>(null)

  useEffect(() => {
    fetch('/api/drivers')
      .then(r => r.json())
      .then(data => {
        setDrivers(data.drivers ?? [])
        setSource(data.source ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (!user) return null

  const filtered = drivers.filter(d =>
    !search ||
    `${d.first_name} ${d.last_name} ${d.driver_number}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white">Chauffeurs</h1>
            <p className="text-xs text-slate-400">
              {source === 'SUPABASE' ? '✅ Données Supabase en direct' : '⚠️ Mode DEMO (Supabase indisponible)'}
              {' · '}{PILOT}
            </p>
          </div>
          <div className="text-sm font-bold text-slate-500">{filtered.length} chauffeur{filtered.length!==1?'s':''}</div>
        </div>

        {/* PILOT banner */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          ⚠️ {PILOT}
        </div>

        {/* Search */}
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400"
          placeholder="Rechercher par nom ou numéro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Liste */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement depuis Supabase...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Aucun chauffeur trouvé</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => {
              const veh = d.vehicles?.[0]
              const rev = d.revenue
              return (
                <div key={d.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 cursor-pointer hover:border-blue-300 transition-all"
                  onClick={() => setSelected(selected?.id===d.id ? null : d)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {d.first_name[0]}{d.last_name[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 dark:text-white">{d.first_name} {d.last_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{d.driver_number}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[d.status] ?? 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${VERIF_COLOR[d.identity_verification_status] ?? 'bg-slate-100 text-slate-500'}`}>{d.identity_verification_status}</span>
                    </div>
                  </div>

                  {/* Véhicule */}
                  {veh && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span>🚗</span>
                      <span>{veh.year} {veh.make} {veh.model}</span>
                      <span className="font-mono">{veh.license_plate_masked}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{veh.fuel_type}</span>
                    </div>
                  )}

                  {/* Revenue (si dispo) */}
                  {rev && rev.count > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[{l:'Gross',v:m2(rev.gross)},{l:'Pourboires',v:m2(rev.tips)},{l:'Taxes',v:m2(rev.taxes)},{l:'Net',v:m2(rev.net)}].map(k=>(
                        <div key={k.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{k.v}</div>
                          <div className="text-xs text-slate-400">{k.l}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Détail expandé */}
                  {selected?.id===d.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      {[
                        {l:'Téléphone',   v:d.phone},
                        {l:'Province',    v:d.province},
                        {l:'Langue',      v:d.language},
                        {l:'Activités',   v:`${rev?.count ?? 0} ce mois`},
                        {l:'Source',      v:source},
                        {l:'ID Supabase', v:d.id?.slice(0,16)+'…'},
                      ].map(({l,v})=>(
                        <div key={l} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                          <div className="text-slate-400 font-bold">{l}</div>
                          <div className="text-slate-700 dark:text-slate-300 font-mono mt-0.5">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
