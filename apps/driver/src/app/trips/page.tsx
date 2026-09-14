'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useTrips, money, formatDuration, formatDistance } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle, filterBtnStyle } from '@/lib/theme-helpers'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

type Status = 'COMPLETED' | 'CANCELLED' | 'STARTED' | 'DISPUTED'
const STATUSES: { key: Status; label: string; color: string; bg: string }[] = [
  { key:'COMPLETED', label:'Terminées', color:'#059669', bg:'rgba(5,150,105,0.12)'  },
  { key:'STARTED',   label:'En cours',  color:'#003DA5', bg:'rgba(0,61,165,0.12)'   },
  { key:'CANCELLED', label:'Annulées',  color:'#DC2626', bg:'rgba(220,38,38,0.10)'  },
  { key:'DISPUTED',  label:'En litige', color:'#B45309', bg:'rgba(180,83,9,0.10)'   },
]

function fmt(dateValue: string | null) {
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('fr-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(dateValue))
}

export default function TripsPage() {
  const [status, setStatus] = useState<Status>('COMPLETED')
  const { trips, loading, refresh } = useTrips(status)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)
  const conf = STATUSES.find(s => s.key === status)!

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement des courses…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mes courses</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>{trips.length} course(s) · {STATUSES.find(s=>s.key===status)?.label}</p>
        </div>
        <button onClick={refresh} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      {/* Filtre statut */}
      <div style={{ padding:'0 16px 16px', display:'flex', gap:6, overflowX:'auto' }}>
        {STATUSES.map(s => (
          <button key={s.key} onClick={() => setStatus(s.key)} style={{
            padding:'8px 14px', borderRadius:20, fontSize:11, fontWeight:700,
            border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
            background: status === s.key ? s.color : (dark ? '#0F1F38' : '#FFFFFF'),
            color: status === s.key ? '#FFFFFF' : t.text3,
            boxShadow: status === s.key ? `0 4px 12px ${s.bg}` : 'none',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ padding:'0 16px 24px' }}>
        {trips.length === 0 ? (
          <div style={{ ...cardStyle(t), padding:'40px 0', textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:10 }}>🚕</div>
            <div style={{ fontSize:14, color:t.text3 }}>Aucune course {STATUSES.find(s=>s.key===status)?.label.toLowerCase()}</div>
          </div>
        ) : (
          <div style={{ ...cardStyle(t), overflow:'hidden' }}>
            {trips.map((trip, idx) => (
              <div key={trip.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ width:40, height:40, borderRadius:12, background: dark ? 'rgba(0,61,165,0.18)' : 'rgba(0,61,165,0.07)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  🚕
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:t.text }}>{trip.trip_reference}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:conf.bg, color:conf.color }}>
                      {conf.label}
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:t.text3 }}>
                    {fmt(trip.started_at)} · {formatDistance(trip.distance_meters)} · {formatDuration(trip.duration_seconds ?? 0)}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:t.text }}>{money(trip.final_amount ?? '0')}</div>
                  {trip.tip_amount && parseFloat(trip.tip_amount) > 0 && (
                    <div style={{ fontSize:10, color:t.green, marginTop:1 }}>+{money(trip.tip_amount)} tip</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
