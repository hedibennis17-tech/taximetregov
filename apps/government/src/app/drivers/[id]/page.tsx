'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card, KpiCard, StatusBadge } from '@/components/ui'
import { useDriverDetail, money, statusConfig } from '@/lib/api'
import { useParams } from 'next/navigation'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { driverDetail, loading, error, refresh } = useDriverDetail(id)

  if (loading) return (
    <AppShell>
      <div className="py-20 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>
    </AppShell>
  )

  if (!driverDetail || error) return (
    <AppShell>
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-red-400 mb-4">{error ?? 'Chauffeur introuvable.'}</p>
        <Link href="/drivers" className="text-xs text-qc-blue hover:underline">← Retour à la liste</Link>
      </div>
    </AppShell>
  )

  const d = driverDetail as {
    profile: { id: string; public_driver_id: string; first_name: string; last_name: string; email: string; verification_status: string; onboarding_status: string; created_at: string }
    revenue: { source_type: string; gross: string; tips: string; net: string; count: string }[]
    trips:   { public_trip_id: string; trip_status: string; distance_meters: number; final_amount: string; started_at: string }[]
    platforms: { provider_code: string; display_name: string; connection_status: string; connected_at: string }[]
    documents: { label: string; status: string; expires_at: string | null }[]
    taxAccount: { tps_status: string; tvq_status: string; filing_frequency: string } | null
  }

  const status = statusConfig[d.profile.verification_status] ?? { label: d.profile.verification_status, color: 'bg-slate-100 text-slate-600' }
  const totalRevenue = d.revenue.reduce((sum, r) => sum + parseFloat(r.gross || '0'), 0)

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <Link href="/drivers" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={14} /> Retour aux chauffeurs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{d.profile.first_name} {d.profile.last_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-400 font-mono">{d.profile.public_driver_id}</span>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${status.color}`}>{status.label}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{d.profile.email}</div>
          </div>
          <button onClick={() => void refresh()} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:border-qc-blue">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-4 pb-8">

        {/* Revenus 3 mois */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Revenus (3 derniers mois)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total brut" value={money(totalRevenue)} color="green" large />
            {d.revenue.slice(0, 3).map(r => (
              <KpiCard key={r.source_type} label={r.source_type} value={money(r.gross)} color="blue" />
            ))}
          </div>
        </div>

        {/* Compte fiscal */}
        {d.taxAccount && (
          <Card className="p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Compte fiscal</div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><div className="text-slate-400">TPS</div><div className="text-white font-semibold">{d.taxAccount.tps_status}</div></div>
              <div><div className="text-slate-400">TVQ</div><div className="text-white font-semibold">{d.taxAccount.tvq_status}</div></div>
              <div><div className="text-slate-400">Fréquence</div><div className="text-white font-semibold">{d.taxAccount.filing_frequency}</div></div>
            </div>
          </Card>
        )}

        {/* Courses récentes */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Courses récentes</div>
          {d.trips.length === 0 ? (
            <Card className="py-8 text-center"><p className="text-sm text-slate-400">Aucune course.</p></Card>
          ) : (
            <div className="space-y-2">
              {d.trips.slice(0, 5).map(trip => (
                <Card key={trip.public_trip_id} className="p-3 flex items-center gap-3">
                  <span className="text-xl">🚕</span>
                  <div className="flex-1">
                    <div className="text-xs font-mono text-white">{trip.public_trip_id}</div>
                    <div className="text-[10px] text-slate-400">{(trip.distance_meters / 1000).toFixed(1)} km · {trip.started_at ? new Date(trip.started_at).toLocaleDateString('fr-CA') : '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400 text-sm">{money(trip.final_amount ?? '0')}</div>
                    <div className="text-[10px] text-slate-400">{trip.trip_status}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Plateformes */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Plateformes</div>
          {d.platforms.length === 0 ? (
            <Card className="py-8 text-center"><p className="text-sm text-slate-400">Aucune plateforme connectée.</p></Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {d.platforms.map((p, i) => (
                <Card key={i} className="p-3">
                  <div className="font-semibold text-white text-sm">{p.display_name}</div>
                  <div className={`text-[10px] mt-1 ${p.connection_status === 'CONNECTED' ? 'text-green-400' : 'text-slate-400'}`}>
                    {p.connection_status}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Documents</div>
          {d.documents.length === 0 ? (
            <Card className="py-8 text-center"><p className="text-sm text-slate-400">Aucun document.</p></Card>
          ) : (
            <div className="space-y-2">
              {d.documents.map((doc, i) => (
                <Card key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">{doc.label}</div>
                    {doc.expires_at && <div className="text-[10px] text-slate-400">Expire: {new Date(doc.expires_at).toLocaleDateString('fr-CA')}</div>}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${doc.status === 'VERIFIED' ? 'text-green-400 bg-green-500/10' : doc.status === 'PENDING' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {doc.status}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
