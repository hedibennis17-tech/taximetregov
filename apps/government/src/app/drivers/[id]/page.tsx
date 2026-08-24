'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card, StatusBadge, PlatformBadge, Amount, KpiCard, FleurSection } from '@/components/ui'
import { mockDrivers, mockTransactions, PLATFORM_LABELS, PLATFORM_COLORS } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Car, FileText, DollarSign, Shield, Bell, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DriverProfilePage() {
  const { id } = useParams()
  const driver = mockDrivers.find(d => d.id === id) || mockDrivers[0]
  const driverTx = mockTransactions.filter(tx => tx.driverGovId === driver.govId).slice(0, 8)

  const weeklyData = [
    { day: 'Lun', rev: 180 }, { day: 'Mar', rev: 240 },
    { day: 'Mer', rev: 195 }, { day: 'Jeu', rev: 310 },
    { day: 'Ven', rev: 420 }, { day: 'Sam', rev: 380 }, { day: 'Dim', rev: 210 },
  ]

  const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

  return (
    <AppShell>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/drivers" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-qc-blue mb-3 transition-colors">
          <ArrowLeft size={14} /> Retour aux chauffeurs
        </Link>
        <FleurSection className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: 'var(--qc-blue)' }}>
              {driver.firstName[0]}{driver.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{driver.firstName} {driver.lastName}</h1>
                <StatusBadge status={driver.status} />
                <StatusBadge status={driver.compliance} />
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="text-sm font-mono font-semibold text-qc-blue">{driver.govId}</span>
                <span className="text-sm text-slate-500">{driver.email}</span>
                <span className="text-sm text-slate-500">{driver.phone}</span>
                <span className="text-xs text-slate-400">{driver.city}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                Modifier
              </button>
              {driver.status === 'active' && (
                <button className="px-3 py-1.5 rounded-lg bg-red-100 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors">
                  Suspendre
                </button>
              )}
            </div>
          </div>
        </FleurSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Identity */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-qc-blue" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Identité</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['ID Gouvernemental', driver.govId],
                ['Prénom', driver.firstName],
                ['Nom', driver.lastName],
                ['Courriel', driver.email],
                ['Téléphone', driver.phone],
                ['Ville', driver.city],
                ['Inscrit le', new Date(driver.joinedAt).toLocaleDateString('fr-CA')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* License */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-qc-blue" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Permis</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Numéro', driver.licenseNumber],
                ['Type', driver.activityType.toUpperCase()],
                ['Expiration', driver.licenseExpiry],
                ['Statut', new Date(driver.licenseExpiry) > new Date() ? '✅ Valide' : '❌ Expiré'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Vehicle */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car size={14} className="text-qc-blue" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Véhicule</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['ID Véhicule', driver.vehicleId],
                ['Plaque', `ABC-${driver.id.toUpperCase()}`],
                ['Statut', '✅ Valide'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Platforms */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-qc-blue" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Plateformes</span>
            </div>
            <div className="space-y-2">
              {(['uber','lyft','doordash','instacart','ubereats','skip','taxi'] as const).map(p => {
                const conn = driver.platforms.find(pl => pl.provider === p)
                return (
                  <div key={p} className="flex items-center justify-between">
                    <PlatformBadge platform={p} status={conn?.status} />
                    <div className="text-right">
                      {conn ? (
                        <div>
                          <StatusBadge status={conn.status} dot={false} />
                          {conn.accountId && <div className="text-[9px] font-mono text-slate-400 mt-0.5">{conn.accountId}</div>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Non connecté</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT 2 COLUMNS */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Aujourd'hui" value={fmt(driver.monthlyRevenue / 24)} icon={<DollarSign size={14} />} color="blue" />
            <KpiCard label="Cette semaine" value={fmt(driver.monthlyRevenue / 4)} icon={<DollarSign size={14} />} color="green" />
            <KpiCard label="Ce mois" value={fmt(driver.monthlyRevenue)} icon={<DollarSign size={14} />} color="blue" />
            <KpiCard label="Taxes (mois)" value={fmt(driver.monthlyTax)} icon={<DollarSign size={14} />} color="orange" />
          </div>

          {/* Weekly chart */}
          <Card className="p-4">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Revenus — 7 derniers jours</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}$`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="rev" fill="#003DA5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tax reconciliation */}
          <Card className="p-4">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Réconciliation fiscale — Août 2026</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Revenus enregistrés</div>
                <div className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{fmt(driver.monthlyRevenue)}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Revenus déclarés</div>
                <div className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{fmt(driver.monthlyRevenue)}</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${driver.compliance === 'ok' ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
                <div className="text-xs text-slate-500 mb-1">Statut</div>
                <div className={`text-sm font-bold ${driver.compliance === 'ok' ? 'text-green-600' : 'text-orange-600'}`}>
                  {driver.compliance === 'ok' ? '✅ CONFORME' : '⚠ RÉVISION'}
                </div>
              </div>
            </div>
          </Card>

          {/* Transactions */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Transactions récentes</div>
              <div className="text-[10px] text-slate-400">Contrainte UNIQUE(provider, provider_transaction_id) active</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['ID Interne', 'Plateforme', 'Type', 'Brut', 'Net', 'TPS+TVQ', 'Statut'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverTx.length > 0 ? driverTx.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-2.5 text-xs font-mono text-qc-blue">{tx.internalId}</td>
                      <td className="px-4 py-2.5">
                        <PlatformBadge platform={tx.provider} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{tx.activityType}</td>
                      <td className="px-4 py-2.5"><Amount value={tx.grossAmount} size="sm" /></td>
                      <td className="px-4 py-2.5"><Amount value={tx.netAmount} size="sm" colored /></td>
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{fmt(tx.tps + tx.tvq)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={tx.status} /></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">Aucune transaction</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Audit timeline */}
          <Card className="p-4">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Journal d'audit</div>
            <div className="space-y-3">
              {[
                { date: '2026-08-15', actor: 'ADMIN-001', action: 'Statut modifié : ACTIVE → SUSPENDED', icon: '🔴' },
                { date: '2026-08-10', actor: 'INSP-001', action: 'Inspection véhicule validée', icon: '✅' },
                { date: '2026-08-01', actor: 'SYS', action: 'Période fiscale août 2026 ouverte', icon: '📋' },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{e.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{e.action}</p>
                    <p className="text-[10px] text-slate-400">{e.actor} · {e.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
