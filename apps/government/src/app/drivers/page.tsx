'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, GovTable, StatusBadge, PlatformBadge, Amount } from '@/components/ui'
import { mockDrivers, type DriverStatus, type ActivityType } from '@/data/mock'
import { useState } from 'react'
import { Search, Filter, Download, UserPlus } from 'lucide-react'
import Link from 'next/link'

const activityLabels: Record<ActivityType, string> = {
  taxi: '🚕 Taxi', rideshare: '🚗 Rideshare', delivery: '📦 Livraison', multi: '🔀 Multi'
}

const statusFilters: { value: DriverStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'pending', label: 'En attente' },
]

export default function DriversPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all')
  const [activityFilter, setActivityFilter] = useState<ActivityType | 'all'>('all')

  const filtered = mockDrivers.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.govId.toLowerCase().includes(q) || d.firstName.toLowerCase().includes(q) || d.lastName.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchActivity = activityFilter === 'all' || d.activityType === activityFilter
    return matchSearch && matchStatus && matchActivity
  })

  return (
    <AppShell>
      <PageHeader
        title="Chauffeurs"
        subtitle={`${mockDrivers.length} chauffeurs enregistrés · ${mockDrivers.filter(d => d.status === 'active').length} actifs`}
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <UserPlus size={14} /> Nouveau chauffeur
          </button>
        }
      />

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher ID, nom, email..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${statusFilter === f.value ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 flex-wrap">
            {(['all', 'taxi', 'rideshare', 'delivery', 'multi'] as const).map(a => (
              <button
                key={a}
                onClick={() => setActivityFilter(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${activityFilter === a ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
              >
                {a === 'all' ? 'Toutes activités' : activityLabels[a]}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 ml-auto">{filtered.length} résultats</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download size={13} /> Export
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <GovTable headers={['ID GOV', 'Chauffeur', 'Statut', 'Activité', 'Permis', 'Plateformes', 'Rev. mensuel', 'Taxes', 'Conformité', 'Dernière activité', '']}>
          {filtered.map(d => (
            <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800">
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-semibold text-qc-blue">{d.govId}</span>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{d.firstName} {d.lastName}</div>
                  <div className="text-xs text-slate-400">{d.email}</div>
                </div>
              </td>
              <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{activityLabels[d.activityType]}</span>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300">{d.licenseNumber}</div>
                  <div className={`text-[10px] ${new Date(d.licenseExpiry) < new Date() ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                    Exp. {d.licenseExpiry}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {d.platforms.slice(0, 3).map(p => (
                    <PlatformBadge key={p.provider} platform={p.provider} status={p.status} />
                  ))}
                  {d.platforms.length > 3 && <span className="text-[10px] text-slate-400">+{d.platforms.length - 3}</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                <Amount value={d.monthlyRevenue} size="sm" />
              </td>
              <td className="px-4 py-3">
                <Amount value={d.monthlyTax} size="sm" />
              </td>
              <td className="px-4 py-3"><StatusBadge status={d.compliance} /></td>
              <td className="px-4 py-3">
                <span className="text-xs text-slate-400">{new Date(d.lastActivity).toLocaleDateString('fr-CA')}</span>
              </td>
              <td className="px-4 py-3">
                <Link href={`/drivers/${d.id}`} className="text-xs text-qc-blue hover:underline font-medium">
                  Voir →
                </Link>
              </td>
            </tr>
          ))}
        </GovTable>
      </Card>
    </AppShell>
  )
}
