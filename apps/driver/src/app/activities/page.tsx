'use client'

import { useState } from 'react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverDashboard } from '@/lib/supabase/useDriverDashboard'

const formatCurrency = (value: number, currency = 'CAD') => new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(value)

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    TAXI_TRIP: 'Taxi',
    RIDESHARE_TRIP: 'Covoiturage',
    FOOD_DELIVERY: 'Livraison de repas',
    GROCERY_DELIVERY: 'Livraison d’épicerie',
    PARCEL_DELIVERY: 'Livraison de colis',
    COURIER: 'Courrier',
  }
  return labels[type] ?? type.replaceAll('_', ' ')
}

function typeIcon(type: string) {
  if (type === 'TAXI_TRIP') return '🚕'
  if (type === 'RIDESHARE_TRIP') return '🚗'
  return '📦'
}

export default function ActivitiesPage() {
  const [filter, setFilter] = useState('ALL')
  const { dashboard, loading, error } = useDriverDashboard()
  const types = ['ALL', 'TAXI_TRIP', 'RIDESHARE_TRIP', 'FOOD_DELIVERY', 'GROCERY_DELIVERY']
  const filtered = (dashboard?.activities ?? []).filter((activity) => filter === 'ALL' || activity.type === filter)

  return (
    <AppShell>
      <PageHeader title="Mes activités" subtitle="Courses et livraisons enregistrées dans votre dossier" />
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {types.map((type) => (
            <button key={type} onClick={() => setFilter(type)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === type ? 'bg-qc-blue text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {type === 'ALL' ? 'Toutes' : `${typeIcon(type)} ${typeLabel(type)}`}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12 text-slate-500 text-sm">Chargement des activités sécurisées…</div> : error ? <div className="text-center py-12 text-red-300 text-sm">{error}</div> : (
          <div className="space-y-3 mb-4">
            {filtered.map((activity) => (
              <Card key={activity.id}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">{typeIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-white">{activity.provider ?? typeLabel(activity.type)}</span>
                      <span className="text-[10px] text-slate-500">{activity.startedAt ? new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.startedAt)) : 'Horaire non disponible'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">{typeLabel(activity.type)} · Donnée synchronisée</div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-600">Statut enregistré</span>
                      <div className="text-right">
                        <div className="font-bold text-white">{formatCurrency(activity.amount, activity.currency)}</div>
                        {activity.tip > 0 && <div className="text-[10px] text-green-400">+{formatCurrency(activity.tip, activity.currency)} pourboire</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">Aucune activité réelle pour ce filtre.</div>}
          </div>
        )}
      </div>
    </AppShell>
  )
}
