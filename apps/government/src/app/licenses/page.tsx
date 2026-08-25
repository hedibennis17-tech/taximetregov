'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockLicenses, type LicenseStatus } from '@/data/operations.mock'
import { useState } from 'react'
import { Search, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'

const statusColors: Record<LicenseStatus, string> = {
  VALID: 'bg-green-100 text-green-700 border-green-200',
  EXPIRING: 'bg-amber-100 text-amber-700 border-amber-200',
  EXPIRED: 'bg-red-100 text-red-700 border-red-200',
  SUSPENDED: 'bg-orange-100 text-orange-700 border-orange-200',
  REVOKED: 'bg-red-200 text-red-800 border-red-300',
  PENDING: 'bg-blue-100 text-blue-700 border-blue-200',
}
const statusIcons: Record<LicenseStatus, React.ReactNode> = {
  VALID: <CheckCircle size={11} />, EXPIRING: <AlertTriangle size={11} />,
  EXPIRED: <XCircle size={11} />, SUSPENDED: <AlertTriangle size={11} />,
  REVOKED: <XCircle size={11} />, PENDING: <Clock size={11} />,
}

export default function LicensesPage() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState<LicenseStatus | 'all'>('all')
  const [typeF, setTypeF] = useState<string>('all')

  const filtered = mockLicenses.filter(l => {
    const q = search.toLowerCase()
    return (!q || l.licenseNumber.toLowerCase().includes(q) || l.driverId.toLowerCase().includes(q) || l.driverName.toLowerCase().includes(q))
      && (statusF === 'all' || l.status === statusF)
      && (typeF === 'all' || l.type === typeF)
  })

  const counts: Record<string, number> = {}
  mockLicenses.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1 })

  return (
    <AppShell>
      <PageHeader
        title="Centre de licences"
        subtitle="Permis chauffeur · Licences taxi · Autorisations · Renouvellements"
        actions={
          <button className="px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            + Nouvelle licence
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {([['VALID','green'],['EXPIRING','amber'],['EXPIRED','red'],['SUSPENDED','orange'],['REVOKED','red'],['PENDING','blue']] as const).map(([s, c]) => (
          <button key={s} onClick={() => setStatusF(statusF === s ? 'all' : s)}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer
              ${statusF === s ? 'bg-qc-blue border-qc-blue' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200'}`}>
            <div className={`text-2xl font-bold ${statusF === s ? 'text-white' : c === 'green' ? 'text-green-600' : c === 'amber' ? 'text-amber-600' : c === 'blue' ? 'text-blue-600' : 'text-red-600'}`}>
              {counts[s] || 0}
            </div>
            <div className={`text-[9px] font-bold uppercase ${statusF === s ? 'text-white/80' : 'text-slate-500'}`}>{s}</div>
          </button>
        ))}
      </div>

      {/* Expiring alert */}
      {(counts['EXPIRING'] || 0) > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={13} className="text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700">
            <strong>{counts['EXPIRING']} licence(s) expirent bientôt.</strong> Action requise avant expiration.
          </span>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Numéro, chauffeur ID, nom..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
          </div>
          <div className="flex gap-1">
            {(['all','Taxi','Rideshare','Delivery']).map(t => (
              <button key={t} onClick={() => setTypeF(t)}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${typeF === t ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {t === 'all' ? 'Tous types' : t}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 self-center">{filtered.length} licences</span>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Numéro','Type','Chauffeur','Émis le','Expire le','Statut','Véhicule','Taximètre','Territoire','Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lic => {
                const expiringSoon = lic.status === 'EXPIRING'
                return (
                  <tr key={lic.id} className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${expiringSoon ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[10px] text-qc-blue font-bold">{lic.licenseNumber}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{lic.type}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{lic.driverName}</div>
                      <div className="font-mono text-[10px] text-qc-blue">{lic.driverId}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-400 font-mono">{lic.issueDate}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-mono text-[10px] font-bold ${lic.status === 'EXPIRED' || lic.status === 'REVOKED' ? 'text-red-600' : expiringSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                        {lic.expiryDate}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColors[lic.status]}`}>
                        {statusIcons[lic.status]} {lic.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{lic.vehicleId || '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{lic.meterInstanceId ? lic.meterInstanceId.split('-').pop() : '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{lic.territory}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        {expiringSoon && <button className="px-2 py-1 text-[9px] font-bold rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Renouveler</button>}
                        <button className="px-2 py-1 text-[9px] font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Voir</button>
                      </div>
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
