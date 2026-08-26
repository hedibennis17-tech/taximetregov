'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, ActivityBadge, SyncBadge } from '@/components/ui'
import { mockTripHistory, computeTripStats } from '@/lib/engines/trip.engine'
import { formatCAD, formatDuration } from '@/lib/engines/taximeter.engine'
import { useState } from 'react'
import { Receipt, CheckCircle, TrendingUp } from 'lucide-react'

const paymentIcon: Record<string, string> = {
  CARD:'💳', INTERAC:'🏦', CASH:'💵', WALLET:'📱'
}

export default function TripsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const stats = computeTripStats(mockTripHistory)
  const selectedTrip = mockTripHistory.find(t => t.tripId === selected)

  return (
    <AppShell>
      <PageHeader title="Mes courses taxi" subtitle={`${stats.totalTrips} courses · Source: Taximètre.GOV`} />
      <div className="px-4">
        {/* Stats summary */}
        <Card className="mb-5 bg-gradient-to-br from-qc-blue/30 to-slate-900 border-qc-blue/30">
          <div className="font-semibold text-white text-sm mb-3">📊 Résumé — 7 derniers jours</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:'Total courses', val:stats.totalTrips, color:'text-white' },
              { label:'Revenus bruts', val:formatCAD(stats.totalRevenue), color:'text-green-400' },
              { label:'Pourboires', val:formatCAD(stats.totalTips), color:'text-blue-400' },
              { label:'TPS+TVQ', val:formatCAD(stats.totalTax), color:'text-purple-400' },
              { label:'Distance moy.', val:`${stats.avgDistance} km`, color:'text-white' },
              { label:'Durée moy.', val:`${stats.avgDurationMin} min`, color:'text-white' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-500">{s.label}</div>
                <div className={`font-bold text-sm tabular-nums ${s.color}`}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-green-400">
            <CheckCircle size={11} /> {stats.synced}/{stats.totalTrips} courses synchronisées avec le Ledger
          </div>
        </Card>

        {/* Trip list */}
        <div className="space-y-2.5 mb-4">
          {mockTripHistory.map(trip => (
            <button key={trip.tripId} onClick={() => setSelected(selected === trip.tripId ? null : trip.tripId)}
              className={`w-full text-left driver-card p-4 transition-all border
                ${selected === trip.tripId ? 'border-qc-blue/50 bg-qc-blue/10' : 'border-slate-800'}`}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-qc-blue/20 border border-qc-blue/30 flex items-center justify-center text-xl shrink-0">
                  🚕
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-white text-sm">{trip.date} · {trip.startTime}</span>
                    <span className="text-[10px] font-mono text-slate-600">{trip.tripId.slice(-8)}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400 mb-1.5">
                    <span>{trip.distanceKm} km</span>
                    <span>·</span>
                    <span>{formatDuration(trip.durationSec)}</span>
                    <span>·</span>
                    <span>{paymentIcon[trip.paymentMethod]} {trip.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SyncBadge status={trip.ledgerSynced ? 'SYNCED' : 'PENDING'} />
                    <span className="text-[9px] text-slate-600">Taximètre.GOV</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-white tabular-nums">{formatCAD(trip.total)}</div>
                  {trip.tip > 0 && <div className="text-[10px] text-green-400">+{formatCAD(trip.tip)} tip</div>}
                  <div className="text-[10px] text-slate-500">{formatCAD(trip.fare)} + taxes</div>
                </div>
              </div>

              {/* Expanded receipt */}
              {selected === trip.tripId && (
                <div className="mt-4 border-t border-slate-800 pt-3 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <Receipt size={10} className="inline mr-1" />Reçu détaillé
                  </div>
                  {[
                    { label:'Tarif de course', val:formatCAD(trip.fare) },
                    { label:'Pourboire', val:formatCAD(trip.tip) },
                    { label:'TPS+TVQ', val:formatCAD(trip.tax) },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="font-mono text-white">{r.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-1.5">
                    <span className="text-white">Total TTC</span>
                    <span className="font-mono text-green-400">{formatCAD(trip.total)}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    {trip.startTime} → {trip.endTime} · Ledger: {trip.ledgerSynced ? '✅ CONFIRMÉ' : '⏳ PENDING'}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
