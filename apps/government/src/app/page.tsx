'use client'

import Link from 'next/link'
import {
  Activity, AlertTriangle, Car, Clock,
  DollarSign, FileText, RefreshCw, TrendingUp, Users, XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, KpiCard } from '@/components/ui'
import { useGovDashboard, money } from '@/lib/api'

export default function DashboardPage() {
  const { dashboard, loading, error, refresh } = useGovDashboard()

  const n = (v: string | undefined) => parseFloat(v ?? '0')

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tableau de bord</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-qc-blue text-white font-semibold">
              DONNÉES RÉELLES
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Supervision sécurisée · Supabase ·{' '}
            {dashboard ? new Date(dashboard.generatedAt).toLocaleString('fr-CA') : 'chargement…'}
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-qc-blue dark:border-slate-700 dark:bg-slate-900"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center text-sm text-slate-500">
          <RefreshCw className="mx-auto mb-3 animate-spin text-qc-blue" size={24} />
          Chargement des données Supabase…
        </div>
      )}

      {/* Error */}
      {!loading && (error || !dashboard) && (
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-orange-500" size={26} />
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Données indisponibles</h2>
          <p className="mt-2 text-sm text-slate-500">{error ?? 'Réessayez dans quelques instants.'}</p>
          <button
            onClick={() => void refresh()}
            className="mt-4 px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold"
          >
            Réessayer
          </button>
        </Card>
      )}

      {/* Dashboard data */}
      {!loading && dashboard && (
        <>
          {/* Chauffeurs */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Chauffeurs
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total"      value={dashboard.drivers.total}     icon={<Users size={16} />}    color="blue" />
              <KpiCard label="Vérifiés"   value={dashboard.drivers.verified}  icon={<Users size={16} />}    color="green" />
              <KpiCard label="En attente" value={dashboard.drivers.pending}   icon={<Clock size={16} />}    color="orange" />
              <KpiCard label="Suspendus"  value={dashboard.drivers.suspended} icon={<XCircle size={16} />}  color="red" />
            </div>
          </div>

          {/* Activités ce mois */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Courses ce mois
            </div>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Total"      value={dashboard.trips.total}     icon={<Activity size={16} />} color="green" />
              <KpiCard label="Terminées"  value={dashboard.trips.completed} icon={<Car size={16} />}      color="blue" />
              <KpiCard label="Annulées"   value={dashboard.trips.cancelled} icon={<XCircle size={16} />}  color="red" />
            </div>
          </div>

          {/* Revenus */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Revenus ce mois (CAD)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Bruts"       value={money(n(dashboard.revenue.total_gross))} icon={<DollarSign size={16} />}  color="blue"   large />
              <KpiCard label="Taxi"        value={money(n(dashboard.revenue.taxi))}        icon={<Car size={16} />}         color="green"  large />
              <KpiCard label="Rideshare"   value={money(n(dashboard.revenue.rideshare))}   icon={<TrendingUp size={16} />}  color="purple" />
              <KpiCard label="Livraison"   value={money(n(dashboard.revenue.delivery))}    icon={<DollarSign size={16} />}  color="orange" />
            </div>
          </div>

          {/* Taxes */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Taxes collectées ce mois
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="text-xs text-slate-400 mb-1">TPS (5%)</div>
                <div className="text-2xl font-bold text-white">{money(n(dashboard.tax.tps))}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-400 mb-1">TVQ (9.975%)</div>
                <div className="text-2xl font-bold text-white">{money(n(dashboard.tax.tvq))}</div>
              </Card>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2 p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Navigation rapide</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: '/drivers',       icon: <Users size={16} />,     label: 'Chauffeurs',   desc: 'Voir tous les dossiers' },
                  { href: '/tax',           icon: <DollarSign size={16} />, label: 'Fiscal',      desc: 'TPS/TVQ · Déclarations' },
                  { href: '/reports',       icon: <FileText size={16} />,  label: 'Rapports',     desc: 'Génération · Export' },
                  { href: '/audit',         icon: <Activity size={16} />,  label: 'Audit',        desc: 'Journaux · Traçabilité' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="text-qc-blue">{item.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Chauffeurs actifs</h2>
              <div className="text-4xl font-bold text-qc-blue mb-1">
                {dashboard.revenue.active_drivers}
              </div>
              <p className="text-xs text-slate-500 mb-4">avec revenus ce mois</p>
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Tarif moyen course</span>
                  <span className="font-semibold text-white">{money(n(dashboard.trips.avg_fare))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Juridiction</span>
                  <span className="font-semibold text-white">{dashboard.jurisdiction}</span>
                </div>
              </div>
              <Link
                href="/drivers"
                className="mt-4 block text-center py-2 rounded-lg bg-qc-blue/10 text-qc-blue text-xs font-semibold hover:bg-qc-blue/20 transition-colors"
              >
                Voir tous les chauffeurs →
              </Link>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  )
}
