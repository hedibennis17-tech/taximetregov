'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockVehicles, type VehicleStatus } from '@/data/operations.mock'
import { useState } from 'react'
import { Search, Car, AlertTriangle } from 'lucide-react'

const statusColors: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
  EXPIRED: 'bg-red-200 text-red-800 border-red-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
}
const today = new Date().toISOString().split('T')[0]

export default function VehiclesPage() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState<VehicleStatus | 'all'>('all')

  const filtered = mockVehicles.filter(v => {
    const q = search.toLowerCase()
    return (!q || v.vehicleId.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q) || v.driverId.toLowerCase().includes(q) || v.driverName.toLowerCase().includes(q) || v.vin.toLowerCase().includes(q))
      && (statusF === 'all' || v.status === statusF)
  })

  const counts: Partial<Record<VehicleStatus, number>> = {}
  mockVehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1 })
  const insExpiring = mockVehicles.filter(v => v.insuranceExpiry < '2027-01-01').length

  return (
    <AppShell>
      <PageHeader
        title="Administration des véhicules"
        subtitle="Flotte · Assurances · Inspections · Taximètres · Statuts"
        actions={
          <button className="px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            + Enregistrer véhicule
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Total" value={mockVehicles.length} icon={<Car size={16} />} color="blue" />
        <KpiCard label="Actifs" value={counts.ACTIVE || 0} color="green" />
        <KpiCard label="Suspendus" value={counts.SUSPENDED || 0} color="red" />
        <KpiCard label="En révision" value={counts.UNDER_REVIEW || 0} color="orange" />
        <KpiCard label="Assurance < 1 an" value={insExpiring} icon={<AlertTriangle size={16} />} color="orange" />
      </div>

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ID véhicule, plaque, VIN, chauffeur..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all','ACTIVE','INACTIVE','SUSPENDED','UNDER_REVIEW'] as const).map(f => (
              <button key={f} onClick={() => setStatusF(f)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${statusF === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Tous' : f}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 self-center">{filtered.length} véhicules</span>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['ID','Plaque','VIN','Marque/Modèle','Année','Type','Chauffeur','Assurance','Inspection','Taximètre','Territoire','Statut','Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const insExpired = v.insuranceExpiry < today
                const inspExpired = v.inspectionExpiry < today
                return (
                  <tr key={v.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[10px] text-qc-blue font-bold">{v.vehicleId}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{v.plate}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[9px] text-slate-400">{v.vin.slice(-8)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{v.make} {v.model}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{v.year}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{v.type}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{v.driverName}</div>
                      <div className="font-mono text-[10px] text-qc-blue">{v.driverId}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-mono font-bold ${insExpired ? 'text-red-600' : 'text-slate-500'}`}>
                        {insExpired ? '❌ ' : '✅ '}{v.insuranceExpiry}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-mono font-bold ${inspExpired ? 'text-red-600' : 'text-slate-500'}`}>
                        {inspExpired ? '❌ ' : '✅ '}{v.inspectionExpiry}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{v.meterInstanceId ? v.meterInstanceId.split('-').pop() : '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{v.territory}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColors[v.status]}`}>{v.status}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="px-2 py-1 text-[9px] font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Voir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
