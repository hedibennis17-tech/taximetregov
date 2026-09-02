'use client'

import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { RefreshCw, WalletCards } from 'lucide-react'
import { useDriverDashboard } from '@/lib/supabase/useDriverDashboard'

const money = (value: number, currency = 'CAD') => new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(value)

function monthKey(value: string | null) {
  if (!value) return 'Sans date'
  return new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function RevenuePage() {
  const { dashboard, loading, error, refresh } = useDriverDashboard()

  if (loading) {
    return <AppShell><PageHeader title="Mes revenus" subtitle="Chargement sécurisé" /><div className="py-16 text-center text-sm text-slate-500">Chargement des revenus réels…</div></AppShell>
  }

  if (!dashboard) {
    return <AppShell><PageHeader title="Mes revenus" subtitle="Données sécurisées" /><div className="px-4 py-16 text-center"><p className="text-sm text-red-300 mb-4">{error ?? 'Aucune donnée disponible.'}</p><button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">Réessayer</button></div></AppShell>
  }

  const totals = dashboard.activities.reduce((sum, activity) => ({
    gross: sum.gross + activity.amount,
    tax: sum.tax + activity.tax,
    net: sum.net + (activity.net || activity.amount - activity.tax),
    tips: sum.tips + activity.tip,
  }), { gross: 0, tax: 0, net: 0, tips: 0 })

  const byMonth = dashboard.activities.reduce<Record<string, number>>((result, activity) => {
    const key = monthKey(activity.startedAt)
    result[key] = (result[key] ?? 0) + activity.amount
    return result
  }, {})

  return (
    <AppShell>
      <PageHeader title="Mes revenus" subtitle="Montants enregistrés dans votre dossier chauffeur" action={<button onClick={() => void refresh()} aria-label="Actualiser"><RefreshCw size={18} className="text-slate-400" /></button>} />
      <div className="px-4 space-y-4 pb-6">
        <Card className="bg-gradient-to-br from-qc-blue/25 to-slate-900 border-qc-blue/30">
          <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Revenus enregistrés</div>
          <div className="text-3xl font-black text-white mt-2">{money(totals.gross)}</div>
          <p className="mt-2 text-xs text-slate-400">Calculé à partir des {dashboard.activities.length} activité(s) auxquelles votre compte a accès.</p>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Net', value: totals.net, color: 'text-green-300' },
            { label: 'Taxes', value: totals.tax, color: 'text-amber-300' },
            { label: 'Pourboires', value: totals.tips, color: 'text-purple-300' },
          ].map((item) => <Card key={item.label} className="p-3"><div className={`font-bold text-sm ${item.color}`}>{money(item.value)}</div><div className="text-[10px] text-slate-500 mt-1">{item.label}</div></Card>)}
        </div>

        <Card>
          <div className="flex items-center gap-2 mb-3"><WalletCards size={17} className="text-qc-blue-light" /><h2 className="font-semibold text-white text-sm">Historique récent</h2></div>
          <div className="space-y-2">
            {dashboard.activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">{activity.type === 'TAXI_TRIP' ? '🚕' : activity.type === 'RIDESHARE_TRIP' ? '🚗' : '📦'}</div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{activity.provider ?? activity.type.replaceAll('_', ' ')}</p><p className="text-[10px] text-slate-500">{activity.startedAt ? new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.startedAt)) : 'Date non disponible'}</p></div>
                <div className="text-right"><p className="text-xs font-bold text-white">{money(activity.amount, activity.currency)}</p>{activity.tax > 0 && <p className="text-[10px] text-amber-400">Taxes {money(activity.tax, activity.currency)}</p>}</div>
              </div>
            ))}
            {dashboard.activities.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Aucun revenu réel n’a encore été synchronisé.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-white text-sm mb-3">Répartition par période</h2>
          <div className="space-y-2">{Object.entries(byMonth).map(([month, value]) => <div key={month} className="flex justify-between text-xs"><span className="text-slate-400 capitalize">{month}</span><span className="font-semibold text-white">{money(value)}</span></div>)}{Object.keys(byMonth).length === 0 && <p className="text-xs text-slate-500">Aucune période disponible.</p>}</div>
        </Card>
      </div>
    </AppShell>
  )
}
