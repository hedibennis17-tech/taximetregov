'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card, KpiCard, StatusBadge } from '@/components/ui'
import { useDriverDetail, money, statusConfig } from '@/lib/api'
import { useParams } from 'next/navigation'
import { RefreshCw, ArrowLeft, FileText, CheckCircle, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react'
import Link from 'next/link'

const DOC_STATUS: Record<string,{label:string;color:string;cls:string}> = {
  APPROVED:      { label:'Valide',       color:'#059669', cls:'text-green-400 bg-green-500/10 border border-green-500/20'  },
  PENDING_REVIEW:{ label:'En révision',  color:'#003DA5', cls:'text-blue-400 bg-blue-500/10 border border-blue-500/20'    },
  UNDER_REVIEW:  { label:'En révision',  color:'#003DA5', cls:'text-blue-400 bg-blue-500/10 border border-blue-500/20'    },
  UPLOADED:      { label:'Soumis',       color:'#7C3AED', cls:'text-purple-400 bg-purple-500/10 border border-purple-500/20'},
  DRAFT:         { label:'Brouillon',    color:'#4A6A9A', cls:'text-slate-400 bg-slate-500/10 border border-slate-500/20'  },
  REJECTED:      { label:'Rejeté',       color:'#DC2626', cls:'text-red-400 bg-red-500/10 border border-red-500/20'        },
  EXPIRED:       { label:'Expiré',       color:'#DC2626', cls:'text-red-400 bg-red-500/10 border border-red-500/20'        },
}

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d))
}

function daysUntil(d:string|null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime()-Date.now())/86400000)
}

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
    profile: { id: string; driver_number: string; first_name: string; last_name: string; email: string; status: string; identity_verification_status: string; created_at: string }
    revenue: { source_type: string; gross: string; tips: string; net: string; count: string }[]
    trips:   { public_trip_id: string; trip_status: string; distance_meters: number; final_amount: string; started_at: string }[]
    platforms: { provider_code: string; display_name: string; connection_status: string; connected_at: string }[]
    documents: { label: string; status: string; expires_at: string | null; issued_at?: string | null; doc_number_last4?: string | null; public_document_id?: string }[]
    taxAccount: { tps_status: string; tvq_status: string; filing_frequency: string } | null
  }

  const status = statusConfig[d.profile.status] ?? { label: d.profile.status, color: 'bg-slate-100 text-slate-600' }
  const totalRevenue = d.revenue.reduce((sum, r) => sum + parseFloat(r.gross || '0'), 0)

  const docStats = {
    total:   d.documents.length,
    valid:   d.documents.filter(doc => doc.status === 'APPROVED').length,
    warning: d.documents.filter(doc => { const days = daysUntil(doc.expires_at); return days !== null && days <= 30 && days > 0 }).length,
    expired: d.documents.filter(doc => doc.status === 'EXPIRED' || (daysUntil(doc.expires_at) ?? 1) <= 0).length,
  }

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
              <span className="text-sm text-slate-400 font-mono">{d.profile.driver_number}</span>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${status.color}`}>{status.label}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{d.profile.email}</div>
          </div>
          <button onClick={() => void refresh()} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:border-qc-blue">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-5 pb-8">

        {/* Revenus */}
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
              <div><div className="text-slate-400">Déclaration</div><div className="text-white font-semibold">{d.taxAccount.filing_frequency}</div></div>
            </div>
          </Card>
        )}

        {/* ── DOSSIER DOCUMENTAIRE — section enrichie ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded bg-qc-blue" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Dossier gouvernemental</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              🏛️ MODE PILOTE
            </div>
          </div>

          {/* Stats docs */}
          {d.documents.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label:'Total',   val:docStats.total,   color:'text-blue-400',  bg:'bg-blue-500/10'  },
                { label:'Valides', val:docStats.valid,   color:'text-green-400', bg:'bg-green-500/10' },
                { label:'Alertes', val:docStats.warning, color:'text-amber-400', bg:'bg-amber-500/10' },
                { label:'Expirés', val:docStats.expired, color:'text-red-400',   bg:'bg-red-500/10'   },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
                  <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                  <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Alerte expiration */}
          {docStats.warning > 0 && (
            <div className="mb-3 flex items-start gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/25 border-l-4 border-l-amber-500">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-400 mb-1">Renouvellement requis</div>
                {d.documents.filter(doc => { const days = daysUntil(doc.expires_at); return days !== null && days <= 30 && days > 0 }).map((doc, i) => (
                  <div key={i} className="text-[11px] text-amber-300/80">• {doc.label} — expire dans {daysUntil(doc.expires_at)}j</div>
                ))}
              </div>
            </div>
          )}

          {/* Liste documents */}
          {d.documents.length === 0 ? (
            <Card className="py-8 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-500" />
              <p className="text-sm text-slate-400">Aucun document dans le dossier.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {d.documents.map((doc, i) => {
                const sc = DOC_STATUS[doc.status] ?? DOC_STATUS['DRAFT']!
                const days = daysUntil(doc.expires_at)
                const isWarning = days !== null && days <= 30 && days > 0
                const isExpired = days !== null && days <= 0

                return (
                  <Card key={i} className={`p-3 flex items-center gap-3 border-l-2 ${isExpired ? 'border-l-red-500' : isWarning ? 'border-l-amber-500' : 'border-l-blue-600'}`}>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-lg shrink-0">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white truncate">{doc.label}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-3">
                        {doc.expires_at
                          ? <span className={isExpired ? 'text-red-400' : isWarning ? 'text-amber-400' : ''}>
                              Exp. {fmtDate(doc.expires_at)}{days !== null && days > 0 && days <= 60 && ` (${days}j)`}
                            </span>
                          : <span>Sans expiration</span>
                        }
                        {doc.doc_number_last4 && <span className="font-mono">••••{doc.doc_number_last4}</span>}
                        {doc.public_document_id && <span className="text-slate-500 truncate">{doc.public_document_id}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {doc.status === 'APPROVED' && <CheckCircle size={14} className="text-green-400" />}
                      {isWarning && <AlertTriangle size={14} className="text-amber-400" />}
                      {isExpired && <XCircle size={14} className="text-red-400" />}
                      {['PENDING_REVIEW','UNDER_REVIEW','UPLOADED'].includes(doc.status) && <Clock size={14} className="text-blue-400" />}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Note pilote */}
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <span className="text-sm">⚠</span>
            <p className="text-[10px] text-amber-400/80 leading-relaxed">
              Données synthétiques — Mode pilote TAXIMETER.GOV. Aucune transmission officielle réelle. Documents de démonstration uniquement.
            </p>
          </div>
        </div>

        {/* Plateformes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded bg-qc-blue" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Plateformes connectées</span>
          </div>
          {d.platforms.length === 0 ? (
            <Card className="py-6 text-center"><p className="text-sm text-slate-400">Aucune plateforme connectée.</p></Card>
          ) : (
            <div className="space-y-2">
              {d.platforms.map((p, i) => (
                <Card key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">{p.display_name}</div>
                    {p.connected_at && <div className="text-[10px] text-slate-400">Connectée: {fmtDate(p.connected_at)}</div>}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${p.connection_status === 'CONNECTED' ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                    {p.connection_status}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Courses récentes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded bg-qc-blue" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Courses récentes</span>
          </div>
          {d.trips.length === 0 ? (
            <Card className="py-6 text-center"><p className="text-sm text-slate-400">Aucune course.</p></Card>
          ) : (
            <div className="space-y-2">
              {d.trips.slice(0,5).map((trip, i) => (
                <Card key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white font-mono">{trip.public_trip_id}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {(trip.distance_meters/1000).toFixed(1)} km · {fmtDate(trip.started_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{money(trip.final_amount)}</div>
                    <div className={`text-[9px] font-bold mt-0.5 ${trip.trip_status==='COMPLETED'?'text-green-400':'text-slate-400'}`}>{trip.trip_status}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
