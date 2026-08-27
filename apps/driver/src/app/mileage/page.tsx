'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockMileageAggregation, mockActivitySegments, mockActivityTimeline,
  mockOdometer, resolveDistance, ACTIVITY_ICONS_EXPENSE, formatCAD,
  type ExpenseActivity
} from '@/lib/engines/expenses.engine'
import { useState } from 'react'
import { AlertCircle, Shield, AlertTriangle } from 'lucide-react'

const actColors: Record<ExpenseActivity, string> = {
  TAXI: 'text-qc-blue-light', RIDESHARE: 'text-slate-300',
  DELIVERY: 'text-red-400', MULTI_ACTIVITY: 'text-amber-400',
  PERSONAL: 'text-slate-500', UNKNOWN: 'text-slate-600',
}

export default function MileagePage() {
  const [tab, setTab] = useState<'daily' | 'monthly' | 'timeline' | 'odometer'>('daily')
  const todaySegs = mockActivitySegments

  // Today summary
  const taxiKm = todaySegs.filter(s => s.activity === 'TAXI').reduce((a, s) => a + (s.distanceKm ?? 0), 0)
  const rideshareKm = todaySegs.filter(s => s.activity === 'RIDESHARE').reduce((a, s) => a + (s.distanceKm ?? 0), 0)
  const deliveryKm = todaySegs.filter(s => s.activity === 'DELIVERY').reduce((a, s) => a + (s.distanceKm ?? 0), 0)
  const personalKm = todaySegs.filter(s => s.activity === 'PERSONAL').reduce((a, s) => a + (s.distanceKm ?? 0), 0)
  const businessKm = taxiKm + rideshareKm + deliveryKm
  const totalKm = businessKm + personalKm

  const monthly = mockMileageAggregation[0]

  return (
    <AppShell>
      <PageHeader title="Kilométrage" subtitle="Professionnel · Personnel · Par activité" />
      <div className="px-4">
        {/* Privacy notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Shield size={12} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">GPS: données agrégées par activité · Coordonnées brutes non conservées indéfiniment · Mode personnel disponible · Privacy-first</p>
        </div>

        {/* Today summary */}
        <div className="bg-gradient-to-br from-qc-blue/20 to-slate-900 rounded-3xl border border-qc-blue/30 p-5 mb-5">
          <div className="text-xs text-slate-400 mb-1">Aujourd'hui — kilométrage</div>
          <div className="text-4xl font-black text-white tabular-nums mb-3">{totalKm.toFixed(1)} km</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon:'🚕', label:'Taxi', km:taxiKm, enabled:true },
              { icon:'🚗', label:'Rideshare', km:rideshareKm, enabled:false },
              { icon:'📦', label:'Livraison', km:deliveryKm, enabled:false },
              { icon:'🏠', label:'Personnel', km:personalKm, enabled:false },
            ].map(a => (
              <div key={a.label} className="bg-slate-900/60 rounded-2xl p-2.5 text-center">
                <div className="text-lg">{a.icon}</div>
                <div className="font-black text-white text-sm tabular-nums">{a.km.toFixed(1)}</div>
                <div className="text-[8px] text-slate-500">{a.enabled ? '⚙ Txm' : '—'}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-[10px]">
            <span className="text-blue-400">Professionnel: <strong>{businessKm.toFixed(1)} km</strong></span>
            <span className="text-slate-500">Personnel: <strong>{personalKm.toFixed(1)} km</strong></span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['daily','Journée'],['monthly','Mensuel'],['timeline','Activité'],['odometer','Odomètre']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── DAILY ───────────────────────────────────────── */}
        {tab === 'daily' && (
          <div className="space-y-3 mb-6">
            {mockActivitySegments.map(seg => {
              const distRes = resolveDistance(seg.providerDistanceKm, seg.activity==='TAXI' ? seg.distanceKm : null, seg.deviceGpsDistanceKm, seg.activity as any)
              return (
                <Card key={seg.id} className={seg.status === 'GPS_GAP' ? 'border-red-500/20' : ''}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl shrink-0">{ACTIVITY_ICONS_EXPENSE[seg.activity]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`font-bold text-sm ${actColors[seg.activity]}`}>{seg.activity.replace('_',' ')}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${seg.taximeterEnabled ? 'bg-qc-blue/20 text-blue-300' : 'bg-slate-700 text-slate-500'}`}>
                          Taximeter: {seg.taximeterEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className="text-[9px] text-slate-500">{distRes.source}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(seg.startTime).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'})}
                        {seg.endTime && ' → ' + new Date(seg.endTime).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'})}
                        {seg.durationMin && ` · ${seg.durationMin} min`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white tabular-nums">{seg.distanceKm?.toFixed(1) ?? '—'} km</div>
                      {seg.syncStatus === 'SYNCED' && <div className="text-[9px] text-green-400">✅ SYNCED</div>}
                    </div>
                  </div>
                  {seg.distanceDifference !== null && seg.distanceDifference > 0.5 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                      <AlertCircle size={10} />
                      Écart fournisseur vs GPS: {seg.distanceDifference.toFixed(1)} km — INFO · données fournisseur conservées
                    </div>
                  )}
                  {seg.notes && <div className="text-[9px] text-slate-500 mt-1 italic">{seg.notes}</div>}
                </Card>
              )
            })}
          </div>
        )}

        {/* ─── MONTHLY ─────────────────────────────────────── */}
        {tab === 'monthly' && (
          <div className="space-y-4 mb-6">
            {mockMileageAggregation.map(m => (
              <Card key={m.period}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white">{m.period}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.dataQuality === 'COMPLETE' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{m.dataQuality}</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon:'🚕', label:'Taxi', km:m.taxiKm, color:'text-blue-400', enabled:true },
                    { icon:'🚗', label:'Rideshare', km:m.rideshareKm, color:'text-slate-300', enabled:false },
                    { icon:'📦', label:'Livraison', km:m.deliveryKm, color:'text-red-400', enabled:false },
                    { icon:'🏠', label:'Personnel', km:m.personalKm, color:'text-slate-500', enabled:false },
                  ].map(a => (
                    <div key={a.label} className="flex items-center gap-3">
                      <span className="w-6 text-center">{a.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs text-slate-300">{a.label}{a.enabled ? ' (Taximeter ✓)' : ''}</span>
                          <span className={`font-bold text-xs tabular-nums ${a.color}`}>{a.km.toLocaleString()} km</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${a.label==='Personnel' ? 'bg-slate-600' : 'bg-qc-blue'}`}
                            style={{width:`${Math.round(a.km/m.totalVehicleKm*100)}%`}} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label:'Total affaires', val:`${m.totalBusinessKm.toLocaleString()} km`, color:'text-blue-400' },
                    { label:'Total véhicule', val:`${m.totalVehicleKm.toLocaleString()} km`, color:'text-white' },
                    { label:'Usage pro', val:`${m.businessUsePercent.toFixed(1)}%`, color:'text-green-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/50 rounded-xl p-2 text-center">
                      <div className={`font-bold text-xs tabular-nums ${s.color}`}>{s.val}</div>
                      <div className="text-[9px] text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-amber-400 mt-2">Usage pro ≠ déductibilité — le Tax Engine détermine le traitement fiscal</div>
              </Card>
            ))}
          </div>
        )}

        {/* ─── TIMELINE ────────────────────────────────────── */}
        {tab === 'timeline' && (
          <div className="mb-6">
            <div className="driver-card divide-y divide-slate-800">
              {mockActivityTimeline.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5">
                  <div className="text-xs text-slate-500 w-12 shrink-0 font-mono mt-0.5">{entry.time}</div>
                  <div className="w-6 flex flex-col items-center shrink-0">
                    <span className="text-base">{ACTIVITY_ICONS_EXPENSE[entry.activity]}</span>
                    {i < mockActivityTimeline.length - 1 && <div className="w-0.5 h-4 bg-slate-700 mt-1" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${actColors[entry.activity]}`}>{entry.label}</div>
                    <div className="text-[10px] text-slate-500">
                      {entry.distanceKm ? entry.distanceKm.toFixed(1) + ' km · ' : ''}
                      {entry.source.replace(/_/g,' ')}
                      {entry.taximeterEnabled ? ' · Taximeter ON' : ''}
                    </div>
                  </div>
                  {entry.distanceKm && (
                    <div className="text-xs font-bold text-white tabular-nums shrink-0">{entry.distanceKm} km</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ODOMETER ────────────────────────────────────── */}
        {tab === 'odometer' && (
          <div className="space-y-4 mb-6">
            <Card>
              <div className="font-semibold text-white text-sm mb-3">📏 Lectures odomètre</div>
              <div className="space-y-3">
                {mockOdometer.map(odo => (
                  <div key={odo.id} className={`p-3 rounded-xl bg-slate-800/50 border ${odo.isValid ? 'border-slate-700' : 'border-red-500/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white tabular-nums">{odo.reading.toLocaleString()} km</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${odo.isValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {odo.isValid ? '✅ VALIDE' : '⚠ RÉVISION'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{odo.date} · {odo.source}</div>
                    {odo.previousReading && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Précédent: {odo.previousReading.toLocaleString()} km · Delta: +{(odo.reading - odo.previousReading).toLocaleString()} km
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-1.5 mt-3 text-[10px] text-amber-400">
                <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                Si lecture odomètre inférieure à la précédente → RÉVISION requise, jamais suppression automatique
              </div>
            </Card>

            {/* Add manual odometer */}
            <button className="w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-sm font-semibold hover:border-slate-600 transition-colors">
              + Ajouter lecture odomètre
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
