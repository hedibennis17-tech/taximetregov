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
const SRC_ICON: Record<string,string> = { TAXI:'🚕', UBER:'⬛', LYFT:'🟣', DOORDASH:'📦', UBEREATS:'🛵', INSTACAR:'🚘', TAXI_DIAMOND:'💎', DEFAULT:'🚗' }

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

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement des revenus…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mes revenus</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0', fontWeight:500 }}>Données réelles · Supabase</p>
        </div>
        <button onClick={refresh} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      {/* Filtre période */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{ display:'flex', gap:6, background:t.card2, borderRadius:14, padding:5, border:`1px solid ${t.border}` }}>
          {PERIODS.map(p => (
            <button key={p.key} style={filterBtnStyle(period === p.key, dark)} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero KPI */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{ borderRadius:20, background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', boxShadow:'0 8px 32px rgba(0,61,165,0.35)', padding:'20px 18px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-10, right:8, fontSize:100, color:'rgba(255,255,255,0.05)', pointerEvents:'none', userSelect:'none' }}>⚜</div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', marginBottom:6 }}>
            REVENUS BRUTS · {PERIODS.find(p=>p.key===period)?.label.toUpperCase()}
          </div>
          <div style={{ fontSize:42, fontWeight:900, color:'#FFF', letterSpacing:'-0.03em', lineHeight:1, marginBottom:16 }}>
            {money(gross)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { label:'Courses', val:String(acts), icon:'🛣️' },
              { label:'Pourboires', val:money(tips), icon:'💝' },
              { label:'Net', val:money(net), icon:'💰' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'#FFF' }}>{s.val}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', fontWeight:600, marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown par plateforme */}
      {revenue?.breakdown && revenue.breakdown.length > 0 && (
        <div style={{ padding:'0 16px 16px' }}>
          <SectionTitle title="Par plateforme" t={t} />
          <div style={{ ...cardStyle(t), overflow:'hidden' }}>
            {revenue.breakdown.map((src, idx) => (
              <div key={src.source_type} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ width:38, height:38, borderRadius:11, background: dark ? 'rgba(59,130,246,0.12)' : 'rgba(0,61,165,0.07)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                  {SRC_ICON[src.source_type] ?? SRC_ICON.DEFAULT}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{src.source_type}</div>
                  <div style={{ fontSize:10, color:t.text3, marginTop:1 }}>{src.count} activité(s)</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:t.text, letterSpacing:'-0.01em' }}>{money(parseFloat(src.gross))}</div>
                  <div style={{ fontSize:10, color:t.text3, marginTop:1 }}>net: {money(parseFloat(src.net ?? src.gross))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet */}
      {revenue?.wallet && (
        <div style={{ padding:'0 16px 24px' }}>
          <SectionTitle title="Solde wallet" t={t} />
          <div style={{ ...cardAccentStyle(t), padding:'16px' }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.10em', color:t.text3, textTransform:'uppercase', marginBottom:6 }}>💳 DISPONIBLE AU RETRAIT</div>
            <div style={{ fontSize:30, fontWeight:900, color:t.green, letterSpacing:'-0.02em' }}>
              {money(parseFloat(revenue.wallet.balance))}
            </div>
            <div style={{ fontSize:10, color:t.text3, marginTop:6 }}>Mis à jour · {new Intl.DateTimeFormat('fr-CA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(revenue.wallet.last_updated))}</div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
