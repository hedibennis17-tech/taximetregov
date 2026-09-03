'use client'

import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { RefreshCw } from 'lucide-react'
import { useTrips, money, formatDuration, formatDistance } from '@/lib/api'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  COMPLETED: 'text-green-400 bg-green-500/10',
  CANCELLED: 'text-red-400 bg-red-500/10',
  STARTED:   'text-blue-400 bg-blue-500/10',
  DISPUTED:  'text-amber-400 bg-amber-500/10',
}

const statusLabels: Record<string, string> = {
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  STARTED:   'En cours',
  DISPUTED:  'En litige',
}

export default function TripsPage() {
  const [filter, setFilter] = useState<string | undefined>('COMPLETED')
  const { trips, total, loading, error, refresh } = useTrips(filter)

  return (
    <AppShell>
      <PageHeader title="Mes courses taxi" subtitle={`${total} course(s) · Source: Taximètre.GOV`} />
      <div className="px-4 pb-8 space-y-4">

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { val: 'COMPLETED', label: 'Terminées' },
            { val: 'CANCELLED', label: 'Annulées' },
            { val: undefined,   label: 'Toutes' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.val)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === f.val ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="mx-auto text-qc-blue animate-spin" size={24} />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-300 mb-4">{error}</p>
            <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs">Réessayer</button>
          </div>
        ) : trips.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="text-3xl mb-3">🚕</div>
            <p className="text-sm text-slate-400">Aucune course trouvée.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <Card key={trip.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Réf. officielle</div>
                    <div className="font-bold text-white text-sm font-mono">{trip.trip_reference}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusColors[trip.trip_status] ?? 'text-slate-400 bg-slate-800'}`}>
                    {statusLabels[trip.trip_status] ?? trip.trip_status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className="font-bold text-white text-sm">{formatDistance(trip.distance_meters)}</div>
                    <div className="text-[10px] text-slate-500">Distance</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className="font-bold text-white text-sm">{formatDuration(trip.elapsed_seconds)}</div>
                    <div className="text-[10px] text-slate-500">Durée</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className="font-bold text-green-400 text-sm">{money(trip.final_amount ?? trip.estimated_amount ?? '0')}</div>
                    <div className="text-[10px] text-slate-500">{trip.final_amount ? 'Final' : 'Estimé'}</div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Tarif: {trip.fare_version ?? '—'}</span>
                  <span>{trip.started_at ? new Date(trip.started_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        <button onClick={() => void refresh()} className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>
    </AppShell>
  )
}
