'use client'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import Link from 'next/link'
import { Bell, ChevronRight, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useHomeData, money, getToken } from '@/lib/api'
import { useEffect } from 'react'
import { useTheme } from '@/lib/theme'

async function setupDriverProfile() {
  const token = await getToken()
  if (!token) return
  try {
    await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch { /* silencieux */ }
}

function activityIcon(source: string) {
  if (source === 'TAXI') return '🚕'
  if (source === 'UBER' || source === 'LYFT') return '🚗'
  if (source === 'DOORDASH' || source === 'UBEREATS') return '📦'
  return '🚙'
}

function formatTime(dateValue: string | null) {
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateValue))
}

export default function HomePage() {
  useEffect(() => { void setupDriverProfile() }, [])
  const { profile, revenue, trips, loading, error: pError, refresh } = useHomeData('month')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tLoading = false

  if (loading) {
    return (
      <AppShell>
        <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <TaximetreGovLoader message="Chargement de vos données…" />
        </div>
      </AppShell>
    )
  }

  if (!profile) {
    return (
      <AppShell>
        <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
          <div style={{ textAlign:'center', maxWidth:320 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
            <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)', margin:'0 0 8px' }}>Dossier chauffeur indisponible</h1>
            <p style={{ fontSize:13, color:'var(--text-3)', margin:'0 0 20px', lineHeight:1.5 }}>{pError ?? 'Session invalide.'}</p>
            <button onClick={refresh} style={{
              padding:'12px 24px', borderRadius:12, background:'#003DA5',
              color:'white', fontWeight:700, fontSize:14, border:'none', cursor:'pointer',
              boxShadow:'0 4px 16px rgba(0,61,165,0.35)',
            }}>Réessayer</button>
          </div>
        </div>
      </AppShell>
    )
  }

  const walletBalance = parseFloat(revenue?.wallet.balance ?? '0')
  const totalGross    = parseFloat(revenue?.summary.total_gross ?? '0')
  const totalTips     = parseFloat(revenue?.summary.total_tips ?? '0')
  const totalNet      = parseFloat(revenue?.summary.total_net ?? '0')
  const totalActs     = parseInt(revenue?.summary.total_activities ?? '0')

  // ── Couleurs adaptées au thème ──────────────────────────────
  const cardBg     = dark ? '#0F1F38' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(59,130,246,0.18)' : '#C5D4EE'
  const textMain   = dark ? '#F0F4FF' : '#001433'
  const textSub    = dark ? '#8BA3CC' : '#4A6A9A'
  const textMuted  = dark ? '#4A6285' : '#7B9ED9'
  const bgPage     = dark ? '#050E1C' : '#EEF3FC'

  // Hero KPI gradient — toujours bleu royal→pétrole
  const heroBg = 'linear-gradient(135deg, #003DA5 0%, #0B4F71 100%)'

  return (
    <AppShell>

      {/* ── Greeting ──────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:44, height:44, borderRadius:14,
            background:'#003DA5',
            border:'2px solid rgba(0,61,165,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, fontWeight:900, color:'white',
            boxShadow:'0 4px 16px rgba(0,61,165,0.30)',
          }}>
            {profile.first_name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <div>
            <div style={{ fontSize:11, color:textSub, fontWeight:500 }}>Bonjour,</div>
            <div style={{ fontSize:17, fontWeight:800, color:textMain, letterSpacing:'-0.01em' }}>
              {profile.first_name} {profile.last_name}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={refresh} style={{
            width:38, height:38, borderRadius:12,
            background: dark ? '#0F1F38' : '#FFFFFF',
            border:`1.5px solid ${cardBorder}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', boxShadow: dark ? 'none' : '0 1px 6px rgba(0,61,165,0.08)',
          }}>
            <RefreshCw size={16} color={dark ? '#8BA3CC' : '#003DA5'} />
          </button>
          <Link href="/notifications" style={{
            width:38, height:38, borderRadius:12,
            background: dark ? '#0F1F38' : '#FFFFFF',
            border:`1.5px solid ${cardBorder}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            textDecoration:'none', boxShadow: dark ? 'none' : '0 1px 6px rgba(0,61,165,0.08)',
          }}>
            <Bell size={16} color={dark ? '#8BA3CC' : '#003DA5'} />
          </Link>
        </div>
      </div>

      {/* ── Hero KPI — Bleu royal + pétrole ────────────── */}
      <div style={{ padding:'4px 16px 16px' }}>
        <div style={{
          borderRadius:20,
          background: heroBg,
          boxShadow:'0 8px 32px rgba(0,61,165,0.35)',
          overflow:'hidden',
          position:'relative',
        }}>
          {/* Watermark ⚜ */}
          <div style={{
            position:'absolute', top:-10, right:10,
            fontSize:110, color:'rgba(255,255,255,0.05)',
            pointerEvents:'none', userSelect:'none', lineHeight:1,
          }}>⚜</div>

          {/* Header carte */}
          <div style={{
            padding:'14px 18px 10px',
            borderBottom:'1px solid rgba(255,255,255,0.10)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', color:'rgba(255,255,255,0.60)', textTransform:'uppercase' }}>CE MOIS-CI</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.40)', marginTop:1 }}>Données réelles · Supabase</div>
            </div>
            <div style={{
              fontSize:8, fontWeight:800, padding:'3px 8px', borderRadius:20,
              background:'rgba(245,200,66,0.20)', color:'#F5C842',
              border:'1px solid rgba(245,200,66,0.35)', letterSpacing:'0.08em',
            }}>PILOTE</div>
          </div>

          {/* Montant principal */}
          <div style={{ padding:'18px 18px 8px' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:16 }}>
              <span style={{
                fontSize:42, fontWeight:900, color:'#FFFFFF',
                letterSpacing:'-0.03em', lineHeight:1,
                fontVariantNumeric:'tabular-nums',
              }}>
                {new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD', maximumFractionDigits:2 }).format(totalGross)}
              </span>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)', fontWeight:600 }}>brut</span>
            </div>

            {/* 3 KPI inline */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                { label:'Courses', val: String(totalActs), icon:'🛣️' },
                { label:'Pourboires', val: money(totalTips), icon:'💝' },
                { label:'Net', val: money(totalNet), icon:'💰' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background:'rgba(255,255,255,0.10)',
                  borderRadius:12,
                  border:'1px solid rgba(255,255,255,0.12)',
                  padding:'10px 6px',
                  textAlign:'center',
                }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{stat.icon}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#FFFFFF', letterSpacing:'-0.01em' }}>{stat.val}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', fontWeight:600, marginTop:1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown par plateforme */}
          {revenue?.breakdown && revenue.breakdown.length > 0 && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.10)', margin:'8px 0 0' }}>
              {revenue.breakdown.map((src, idx) => (
                <div key={src.source_type} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 18px',
                  borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{
                    width:32, height:32, borderRadius:9,
                    background:'rgba(255,255,255,0.10)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16,
                  }}>
                    {activityIcon(src.source_type)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.90)' }}>
                      {src.source_type}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.45)', marginTop:1 }}>
                      {src.count} activité(s)
                    </div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#FFFFFF', letterSpacing:'-0.01em' }}>
                    {money(parseFloat(src.gross))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Padding bas */}
          <div style={{ height:14 }} />
        </div>
      </div>

      {/* ── Wallet ────────────────────────────────────────── */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{
          borderRadius:16,
          background: cardBg,
          border:`1.5px solid ${cardBorder}`,
          borderLeft:`4px solid #003DA5`,
          boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,61,165,0.10)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px',
        }}>
          <div>
            <div style={{ fontSize:10, color:textSub, fontWeight:600, marginBottom:4, letterSpacing:'0.06em' }}>💳 SOLDE WALLET</div>
            <div style={{ fontSize:24, fontWeight:900, color:'#10B981', letterSpacing:'-0.02em' }}>
              {money(walletBalance)}
            </div>
          </div>
          <Link href="/wallet" style={{
            padding:'10px 18px', borderRadius:12,
            background:'#003DA5', color:'white',
            fontSize:12, fontWeight:700, textDecoration:'none',
            boxShadow:'0 4px 12px rgba(0,61,165,0.30)',
            letterSpacing:'0.02em',
          }}>
            Retirer →
          </Link>
        </div>
      </div>

      {/* ── Actions rapides ───────────────────────────────── */}
      <div style={{ padding:'0 16px 16px' }}>
        {/* Titre section */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          marginBottom:10,
        }}>
          <div style={{ width:3, height:16, borderRadius:2, background:'#003DA5' }} />
          <span style={{
            fontSize:11, fontWeight:800, letterSpacing:'0.10em',
            textTransform:'uppercase', color: dark ? '#8BA3CC' : '#1A3A6B',
          }}>Actions rapides</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { href:'/taximeter', icon:'🚕', label:'Démarrer course taxi',   accent:'#003DA5', bg: dark ? 'rgba(0,61,165,0.20)' : 'rgba(0,61,165,0.07)', bdr: dark ? 'rgba(0,61,165,0.4)' : 'rgba(0,61,165,0.20)' },
            { href:'/revenue',   icon:'💰', label:'Voir mes revenus',        accent:'#10B981', bg: dark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)', bdr: dark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.20)' },
            { href:'/documents', icon:'📄', label:'Mes documents',           accent:'#F59E0B', bg: dark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.07)', bdr: dark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.20)' },
            { href:'/tax',       icon:'📋', label:'Centre fiscal',           accent:'#8B5CF6', bg: dark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.07)', bdr: dark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.20)' },
          ].map(action => (
            <Link key={action.href} href={action.href} style={{
              borderRadius:14,
              background: action.bg,
              border:`1.5px solid ${action.bdr}`,
              padding:'14px 12px',
              display:'flex', flexDirection:'column', gap:8,
              textDecoration:'none',
              transition:'opacity 0.15s',
            }}>
              <span style={{ fontSize:26 }}>{action.icon}</span>
              <span style={{
                fontSize:11, fontWeight:700,
                color: dark ? '#F0F4FF' : '#001433',
                lineHeight:1.3,
              }}>{action.label}</span>
              <ChevronRight size={13} color={action.accent} style={{ alignSelf:'flex-end' }} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Courses récentes ──────────────────────────────── */}
      <div style={{ padding:'0 16px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:3, height:16, borderRadius:2, background:'#003DA5' }} />
          <span style={{
            fontSize:11, fontWeight:800, letterSpacing:'0.10em',
            textTransform:'uppercase', color: dark ? '#8BA3CC' : '#1A3A6B',
            flex:1,
          }}>Courses récentes</span>
          <Link href="/trips" style={{ fontSize:11, fontWeight:700, color:'#003DA5', textDecoration:'none' }}>
            Voir tout →
          </Link>
        </div>
        <div style={{
          borderRadius:16,
          background: cardBg,
          border:`1.5px solid ${cardBorder}`,
          overflow:'hidden',
          boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,61,165,0.08)',
        }}>
          {tLoading ? (
            <div style={{ padding:'20px', textAlign:'center', color:textMuted, fontSize:13 }}>Chargement…</div>
          ) : trips.length === 0 ? (
            <div style={{ padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🚕</div>
              <div style={{ fontSize:13, color:textSub, fontWeight:500 }}>Aucune course enregistrée.</div>
            </div>
          ) : trips.slice(0, 3).map((trip, idx) => (
            <div key={trip.id} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 14px',
              borderTop: idx > 0 ? `1px solid ${cardBorder}` : 'none',
            }}>
              <div style={{
                width:38, height:38, borderRadius:11,
                background: dark ? '#142544' : 'rgba(0,61,165,0.07)',
                border:`1px solid ${cardBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, flexShrink:0,
              }}>🚕</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:textMain }}>{trip.trip_reference}</span>
                  <span style={{ fontSize:10, color:textMuted }}>{formatTime(trip.started_at)}</span>
                </div>
                <div style={{ fontSize:10, color:textSub }}>
                  {(trip.distance_meters / 1000).toFixed(1)} km
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:800, color:textMain }}>{money(trip.final_amount ?? '0')}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'#10B981', marginTop:1 }}>{trip.trip_status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </AppShell>
  )
}
