'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, StatusBadge } from '@/components/ui'
import { useGovDrivers, money, statusConfig } from '@/lib/api'
import { useState, useCallback } from 'react'
import { Search, RefreshCw, Users } from 'lucide-react'
import Link from 'next/link'

const STATUS_FILTERS = [
  { value: '',          label: 'Tous' },
  { value: 'VERIFIED',  label: 'Vérifiés' },
  { value: 'PENDING',   label: 'En attente' },
  { value: 'SUSPENDED', label: 'Suspendus' },
]

export default function DriversPage() {
  const [search, setSearch]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Debounce search
  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    clearTimeout((window as { searchTimer?: ReturnType<typeof setTimeout> }).searchTimer)
    ;(window as { searchTimer?: ReturnType<typeof setTimeout> }).searchTimer = setTimeout(() => {
      setDebouncedSearch(val)
    }, 400)
  }, [])

  const { drivers, total, loading, error, refresh } = useGovDrivers({
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  })

  return (
    <AppShell>
      <PageHeader
        title="Chauffeurs"
        subtitle={`${total} chauffeur(s) enregistré(s) · Données Supabase`}
      />

      <div className="px-4 md:px-6 space-y-4 pb-8">
        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nom, email, ID gouvernemental…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-qc-blue"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === f.value
                    ? 'bg-qc-blue text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="mx-auto text-qc-blue animate-spin" size={24} />
            <p className="text-sm text-slate-400 mt-3">Chargement…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="p-6 text-center">
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">
              Réessayer
            </button>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && drivers.length === 0 && (
          <Card className="py-12 text-center">
            <Users size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucun chauffeur trouvé.</p>
            {debouncedSearch && (
              <button onClick={() => handleSearch('')} className="mt-3 text-xs text-qc-blue hover:underline">
                Effacer la recherche
              </button>
            )}
          </Card>
        )}

        {/* Table chauffeurs */}
        {!loading && !error && drivers.length > 0 && (
          <div className="space-y-2">
            {/* Header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Chauffeur</span>
              <span>Statut</span>
              <span>Revenus mois</span>
              <span>Courses</span>
              <span>Plateformes</span>
            </div>

            {drivers.map((driver) => {
              const status = statusConfig[driver.verification_status]
                ?? { label: driver.verification_status, color: 'bg-slate-100 text-slate-600' }

              return (
                <Card key={driver.id} className="p-0 overflow-hidden hover:border-qc-blue/50 transition-colors">
                  <Link href={`/drivers/${driver.id}`} className="block">
                    {/* Mobile */}
                    <div className="md:hidden p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {driver.first_name} {driver.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{driver.public_driver_id}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>📧 {driver.email}</span>
                        <span className="text-green-400 font-bold">{money(driver.revenue_this_month)}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-500">
                        <span>🛣️ {driver.trips_this_month} course(s)</span>
                        <span>🔌 {driver.connected_platforms} plateforme(s)</span>
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center">
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {driver.first_name} {driver.last_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{driver.email}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{driver.public_driver_id}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold w-fit ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-bold text-green-400 text-sm">
                        {money(driver.revenue_this_month)}
                      </span>
                      <span className="text-sm text-white">{driver.trips_this_month}</span>
                      <span className="text-sm text-white">{driver.connected_platforms}</span>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}

        {/* Refresh */}
        {!loading && (
          <button
            onClick={() => void refresh()}
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Actualiser ({total} chauffeurs)
          </button>
        )}
      </div>
    </AppShell>
  )
}
