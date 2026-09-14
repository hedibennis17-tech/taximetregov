'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useRevenue, money } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, cardAccentStyle, SectionTitle, filterBtnStyle } from '@/lib/theme-helpers'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

type Period = 'week' | 'month' | 'year'
const PERIODS: { key: Period; label: string }[] = [
  { key:'week',  label:'7 jours'  },
  { key:'month', label:'30 jours' },
  { key:'year',  label:'12 mois'  },
]

const SRC_ICON: Record<string,string> = {
  TAXI:'🚕', UBER:'⬛', LYFT:'🟣', DOORDASH:'📦',
  UBEREATS:'🛵', INSTACAR:'🚘', TAXI_DIAMOND:'💎',
  RIDESHARE:'🚗', DELIVERY:'📦', DEFAULT:'🚗',
}

const SRC_LABEL: Record<string,string> = {
  TAXI:'Taxi (taximètre)', UBER:'Uber', LYFT:'Lyft',
  DOORDASH:'DoorDash', UBEREATS:'Uber Eats',
  TAXI_DIAMOND:'Taxi Diamond', RIDESHARE:'Covoiturage',
  DELIVERY:'Livraison',
}

const SRC_COLOR: Record<string,{bg:string;bar:string}> = {
  TAXI:     { bg:'rgba(0,61,165,0.07)',   bar:'#003DA5' },
  RIDESHARE:{ bg:'rgba(124,58,237,0.07)', bar:'#7C3AED' },
  UBER:     { bg:'rgba(0,0,0,0.05)',      bar:'#1A1A1A' },
  LYFT:     { bg:'rgba(124,58,237,0.07)', bar:'#7C3AED' },
  DOORDASH: { bg:'rgba(220,38,38,0.06)',  bar:'#DC2626' },
  UBEREATS: { bg:'rgba(180,83,9,0.06)',   bar:'#B45309' },
  DELIVERY: { bg:'rgba(245,158,11,0.07)', bar:'#F59E0B' },
  DEFAULT:  { bg:'rgba(0,61,165,0.05)',   bar:'#003DA5' },
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('month')
  const { revenue, loading, refresh } = useRevenue(period)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const gross = parseFloat(revenue?.summary.total_gross ?? '0')
  const net   = parseFloat(revenue?.summary.total_net   ?? '0')
  const tips  = parseFloat(revenue?.summary.total_tips  ?? '0')
  const acts  = parseInt(revenue?.summary.total_activities ?? '0')
  const fees  = parseFloat(revenue?.summary.total_fees ?? '0')

  const maxGross = revenue?.breakdown
    ? Math.max(...revenue.breakdown.map(s => parseFloat(s.gross)), 1)
    : 1

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement des revenus…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 14px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mes revenus</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0', fontWeight:500 }}>
            Données réelles · Supabase · {PERIODS.find(p=>p.key===period)?.label}
          </p>
        </div>
        <button onClick={refresh} style={{
          width:38, height:38, borderRadius:12,
          background:t.card, border:`1.5px solid ${t.border}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', boxShadow:t.shadow,
        }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      {/* ── Filtre période ── */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{ display:'flex', gap:6, background:t.card2, borderRadius:14, padding:5, border:`1px solid ${t.border}` }}>
          {PERIODS.map(p => (
            <button key={p.key} style={filterBtnStyle(period === p.key, dark)} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero KPI — gradient royal→pétrole ── */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{
          borderRadius:20,
          background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)',
          boxShadow:'0 8px 32px rgba(0,61,165,0.35)',
          padding:'20px 18px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-10, right:8, fontSize:100, color:'rgba(255,255,255,0.05)', pointerEvents:'none', userSelect:'none' }}>⚜</div>

          {/* Label + montant */}
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', marginBottom:4 }}>
            REVENUS BRUTS
          </div>
          <div style={{ fontSize:44, fontWeight:900, color:'#FFFFFF', letterSpacing:'-0.03em', lineHeight:1, marginBottom:16 }}>
            {money(gross)}
          </div>

          {/* 4 stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Pourboires',    val:money(tips), icon:'💝', color:'#F5C842' },
              { label:'Net chauffeur', val:money(net),  icon:'💰', color:'#34D399' },
              { label:'Solde wallet',  val:money(parseFloat(revenue?.wallet.balance ?? '0')), icon:'💳', color:'#60A5FA' },
              { label:'Activités',     val:String(acts), icon:'🛣️', color:'#FFFFFF' },
            ].map(s => (
              <div key={s.label} style={{
                background:'rgba(255,255,255,0.10)',
                border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:14, padding:'12px 12px',
              }}>
                <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:16, fontWeight:800, color:s.color, letterSpacing:'-0.01em' }}>{s.val}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', fontWeight:600, marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Commissions si dispo */}
          {fees > 0 && (
            <div style={{ marginTop:12, padding:'8px 12px', borderRadius:10, background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.25)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.70)', fontWeight:600 }}>💸 Commissions / frais</span>
              <span style={{ fontSize:13, fontWeight:800, color:'#FCA5A5' }}>−{money(fees)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Breakdown par type d'activité ── */}
      {revenue?.breakdown && revenue.breakdown.length > 0 && (
        <div style={{ padding:'0 16px 16px' }}>
          <SectionTitle title="Par type d'activité" t={t} />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {revenue.breakdown.map(src => {
              const pct = Math.round((parseFloat(src.gross) / maxGross) * 100)
              const colorConf = SRC_COLOR[src.source_type] ?? SRC_COLOR.DEFAULT
              const label = SRC_LABEL[src.source_type] ?? src.source_type
              const icon  = SRC_ICON[src.source_type]  ?? SRC_ICON.DEFAULT
              return (
                <div key={src.source_type} style={{
                  ...cardStyle(t),
                  padding:'14px 15px',
                  background: dark ? t.card : colorConf.bg,
                  borderLeft: `4px solid ${colorConf.bar}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <span style={{ fontSize:22 }}>{icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{label}</div>
                      <div style={{ fontSize:10, color:t.text3, marginTop:1 }}>{src.count} activité(s)</div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:t.text, letterSpacing:'-0.01em' }}>
                      {money(parseFloat(src.gross))}
                    </div>
                  </div>
                  {/* Barre de progression */}
                  <div style={{ height:4, borderRadius:2, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:colorConf.bar, borderRadius:2, transition:'width 0.6s ease' }} />
                  </div>
                  {/* Tips + Net */}
                  <div style={{ display:'flex', gap:16, marginTop:8 }}>
                    {parseFloat(src.tips) > 0 && (
                      <div style={{ fontSize:10, color:t.text3 }}>
                        💝 <span style={{ fontWeight:700, color:t.text2 }}>{money(parseFloat(src.tips))}</span> pourboires
                      </div>
                    )}
                    <div style={{ fontSize:10, color:t.text3 }}>
                      Net: <span style={{ fontWeight:700, color:t.green }}>{money(parseFloat(src.net ?? src.gross))}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Wallet ── */}
      {revenue?.wallet && (
        <div style={{ padding:'0 16px 24px' }}>
          <SectionTitle title="Solde wallet" t={t} />
          <div style={{ ...cardAccentStyle(t), padding:'16px' }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.10em', color:t.text3, textTransform:'uppercase', marginBottom:6 }}>
              💳 DISPONIBLE AU RETRAIT
            </div>
            <div style={{ fontSize:32, fontWeight:900, color:t.green, letterSpacing:'-0.02em' }}>
              {money(parseFloat(revenue.wallet.balance))}
            </div>
            <div style={{ fontSize:10, color:t.text3, marginTop:6 }}>
              Statut: {revenue.wallet.status} · {revenue.wallet.currency}
            </div>
          </div>
        </div>
      )}

    </AppShell>
  )
}
