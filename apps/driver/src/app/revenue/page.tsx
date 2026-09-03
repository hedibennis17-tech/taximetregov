'use client'

import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { RefreshCw } from 'lucide-react'
import { useRevenue, money } from '@/lib/api'
import { useState } from 'react'

type Period = 'week' | 'month' | 'year'

const periodLabels: Record<Period, string> = {
  week:  '7 jours',
  month: '30 jours',
  year:  '12 mois',
}

const sourceIcon: Record<string, string> = {
  TAXI:      '🚕',
  UBER:      '⬛',
  LYFT:      '🟣',
  DOORDASH:  '🔴',
  INSTACART: '🟢',
  UBER_EATS: '🟡',
  SKIP:      '🟠',
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('month')
  const { revenue, loading, error, refresh } = useRevenue(period)

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Mes revenus</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto text-qc-blue animate-spin" size={24} />
        </div>
      </AppShell>
    )
  }

  if (!revenue) {
    return (
      <AppShell>
        <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Mes revenus</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-red-300 mb-4">{error ?? 'Données indisponibles.'}</p>
          <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">
            Réessayer
          </button>
        </div>
      </AppShell>
    )
  }

  const s = revenue.summary
  const gross    = parseFloat(s.total_gross    ?? '0')
  const tips     = parseFloat(s.total_tips     ?? '0')
  const net      = parseFloat(s.total_net      ?? '0')
  const taxiG    = parseFloat(s.taxi_gross     ?? '0')
  const rideshareG = parseFloat(s.rideshare_gross ?? '0')
  const deliveryG  = parseFloat(s.delivery_gross  ?? '0')
  const wallet   = parseFloat(revenue.wallet.balance ?? '0')

  return (
    <AppShell>
      <PageHeader title="Mes revenus" subtitle={`Données réelles · ${periodLabels[period]}`} />
      <div className="px-4 space-y-4 pb-8">

        {/* Sélecteur de période */}
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Résumé principal */}
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Revenus bruts</div>
          <div className="text-3xl font-bold text-white mb-4">{money(gross)}</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pourboires',  val: money(tips),   color: 'text-green-400' },
              { label: 'Net chauffeur', val: money(net),   color: 'text-blue-400' },
              { label: 'Solde wallet', val: money(wallet), color: 'text-amber-400' },
              { label: 'Activités',   val: s.total_activities ?? '0', color: 'text-white' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-xl p-3">
                <div className={`font-bold text-sm ${item.color}`}>{item.val}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Breakdown par type */}
        <Card className="p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Par type d'activité</div>
          <div className="space-y-3">
            {[
              { label: 'Taxi (taximètre)', val: taxiG,     icon: '🚕', color: 'bg-qc-blue/20' },
              { label: 'Covoiturage',      val: rideshareG, icon: '🚗', color: 'bg-purple-500/20' },
              { label: 'Livraison',        val: deliveryG,  icon: '📦', color: 'bg-amber-500/20' },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${item.color}`}>
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                    <div
                      className="bg-qc-blue h-1 rounded-full"
                      style={{ width: gross > 0 ? `${Math.min((item.val / gross) * 100, 100)}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="font-bold text-white text-sm">{money(item.val)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Détail par provider */}
        {revenue.breakdown.length > 0 && (
          <Card className="p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Par plateforme</div>
            <div className="space-y-2">
              {revenue.breakdown.map((src) => (
                <div key={src.source_type} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-xl">{sourceIcon[src.source_type] ?? '📦'}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-white">{src.source_type}</div>
                    <div className="text-[10px] text-slate-500">{src.count} activité(s) · {money(parseFloat(src.tips))} pourboires</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-sm">{money(parseFloat(src.gross))}</div>
                    <div className="text-[10px] text-green-400">net {money(parseFloat(src.net))}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <button onClick={() => void refresh()} className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
          <RefreshCw size={14} /> Actualiser les données
        </button>
      </div>
    </AppShell>
  )
}
