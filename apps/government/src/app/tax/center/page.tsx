'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { useTaxCenter, money } from '@/lib/api'
import { useState } from 'react'
import { RefreshCw, DollarSign, TrendingUp } from 'lucide-react'

const periodStatus: Record<string, { label: string; color: string }> = {
  OPEN:          { label: 'Ouverte',       color: 'text-blue-400 bg-blue-500/10' },
  FILED:         { label: 'Déclarée',      color: 'text-green-400 bg-green-500/10' },
  ACCEPTED:      { label: 'Acceptée',      color: 'text-green-400 bg-green-500/10' },
  CLOSED:        { label: 'Fermée',        color: 'text-slate-400 bg-slate-800' },
  CALCULATING:   { label: 'En calcul',     color: 'text-amber-400 bg-amber-500/10' },
  READY_TO_FILE: { label: 'Prête',         color: 'text-purple-400 bg-purple-500/10' },
}

export default function TaxCenterPage() {
  const { taxData, loading, error, refresh } = useTaxCenter()
  const [tab, setTab] = useState<'summary' | 'periods'>('summary')

  if (loading) return (
    <AppShell><PageHeader title="Centre fiscal" subtitle="Chargement…" />
      <div className="py-20 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>
    </AppShell>
  )

  if (!taxData) return (
    <AppShell><PageHeader title="Centre fiscal" subtitle="Erreur" />
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-red-400 mb-4">{error ?? 'Données indisponibles.'}</p>
        <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">Réessayer</button>
      </div>
    </AppShell>
  )

  const s = taxData.summary

  return (
    <AppShell>
      <PageHeader title="Centre fiscal" subtitle={`TPS/TVQ · Données Supabase · ${taxData.periods.length} période(s)`} />
      <div className="px-4 md:px-6 space-y-4 pb-8">

        {/* Tabs */}
        <div className="flex gap-2">
          {(['summary', 'periods'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400'}`}>
              {t === 'summary' ? '📊 Résumé annuel' : '📋 Périodes fiscales'}
            </button>
          ))}
          <button onClick={() => void refresh()} className="ml-auto px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs flex items-center gap-1">
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>

        {tab === 'summary' && (
          <>
            {/* KPIs Taxes */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Taxes collectées (année)</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiCard label="TPS (5%)"       value={money(s.total_tps)}   icon={<DollarSign size={16} />} color="blue"   large />
                <KpiCard label="TVQ (9.975%)"   value={money(s.total_tvq)}   icon={<DollarSign size={16} />} color="purple" large />
                <KpiCard label="Total taxes"    value={money(s.total_tax)}   icon={<TrendingUp size={16} />} color="green"  large />
              </div>
            </div>

            {/* KPIs Revenus */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Revenus imposables (année)</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total brut"    value={money(s.total_gross)}    icon={<DollarSign size={16} />} color="blue" large />
                <KpiCard label="Taxi"          value={money(s.taxi_gross)}     icon={<DollarSign size={16} />} color="green" />
                <KpiCard label="Rideshare"     value={money(s.rideshare_gross)} icon={<DollarSign size={16} />} color="purple" />
                <KpiCard label="Livraison"     value={money(s.delivery_gross)} icon={<DollarSign size={16} />} color="orange" />
              </div>
            </div>

            {/* Enregistrements */}
            <Card className="p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Statuts d'enregistrement TPS/TVQ</div>
              <div className="space-y-2">
                {taxData.registrations.map((r, i) => {
                  const row = r as { tps_status: string; tvq_status: string; count: string }
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                      <div className="text-xs">
                        <span className="text-white">TPS: {row.tps_status}</span>
                        <span className="text-slate-400 mx-2">·</span>
                        <span className="text-white">TVQ: {row.tvq_status}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{row.count} chauffeur(s)</span>
                    </div>
                  )
                })}
                {taxData.registrations.length === 0 && (
                  <p className="text-sm text-slate-500">Aucun compte fiscal enregistré.</p>
                )}
              </div>
            </Card>
          </>
        )}

        {tab === 'periods' && (
          <div className="space-y-3">
            {taxData.periods.length === 0 ? (
              <Card className="py-12 text-center">
                <p className="text-sm text-slate-400">Aucune période fiscale trouvée.</p>
              </Card>
            ) : taxData.periods.map((period) => {
              const st = periodStatus[period.status] ?? { label: period.status, color: 'text-slate-400 bg-slate-800' }
              return (
                <Card key={period.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-white">{period.first_name} {period.last_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{period.public_driver_id}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><div className="text-slate-400">Période</div><div className="text-white font-mono">{period.period_start?.slice(0,7)}</div></div>
                    <div><div className="text-slate-400">TPS</div><div className="text-white">{period.tps_status}</div></div>
                    <div><div className="text-slate-400">TVQ</div><div className="text-white">{period.tvq_status}</div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div><div className="text-slate-400">Taxi</div><div className="text-green-400 font-bold">{money(period.gross_revenue_taxi)}</div></div>
                    <div><div className="text-slate-400">Rideshare</div><div className="text-purple-400 font-bold">{money(period.gross_revenue_rideshare)}</div></div>
                    <div><div className="text-slate-400">Livraison</div><div className="text-orange-400 font-bold">{money(period.gross_revenue_delivery)}</div></div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
