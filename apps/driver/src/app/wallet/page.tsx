'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useRevenue, useDriverProfile, money } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, cardAccentStyle, SectionTitle } from '@/lib/theme-helpers'
import { ArrowUpRight, ArrowDownLeft, DollarSign, TrendingUp } from 'lucide-react'

export default function WalletPage() {
  const { revenue, loading } = useRevenue('month')
  const { profile } = useDriverProfile()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const net   = parseFloat(revenue?.summary.total_net   ?? '0')
  const gross = parseFloat(revenue?.summary.total_gross ?? '0')
  const tips  = parseFloat(revenue?.summary.total_tips  ?? '0')
  const bal   = parseFloat(revenue?.wallet?.balance     ?? '0')

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement du wallet…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div style={{ padding:'18px 16px 10px' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Wallet & Paiements</h1>
        <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>CAD · Québec · TAXIMÈTRE.GOV</p>
      </div>

      <div style={{ padding:'8px 16px', display:'flex', flexDirection:'column', gap:14, paddingBottom:32 }}>
        {/* Solde principal */}
        <div style={{ borderRadius:20, background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', boxShadow:'0 8px 32px rgba(0,61,165,0.35)', padding:'22px 20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-10, right:8, fontSize:100, color:'rgba(255,255,255,0.05)', pointerEvents:'none' }}>⚜</div>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', color:'rgba(255,255,255,0.60)', textTransform:'uppercase', marginBottom:4 }}>💳 SOLDE DISPONIBLE</div>
          <div style={{ fontSize:44, fontWeight:900, color:'#FFFFFF', letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:8 }}>
            {money(bal)}
          </div>
          {profile && <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>{profile.first_name} {profile.last_name}</div>}
          <button style={{ marginTop:16, padding:'11px 24px', borderRadius:12, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            💸 Demander un retrait
          </button>
        </div>

        {/* Stats mois */}
        <div>
          <SectionTitle title="Ce mois-ci" t={t} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:<TrendingUp size={18} color={t.accent} />, label:'Brut',        val:money(gross), color:t.accent },
              { icon:<DollarSign size={18} color={t.green}  />, label:'Net',         val:money(net),   color:t.green },
              { icon:<ArrowDownLeft size={18} color="#F5C842"/>, label:'Pourboires',  val:money(tips),  color:'#B45309' },
              { icon:<ArrowUpRight size={18} color={t.red}  />, label:'Commissions', val:money(gross-net), color:t.red },
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle(t), padding:'14px 14px' }}>
                <div style={{ marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:17, fontWeight:800, color:s.color, letterSpacing:'-0.01em' }}>{s.val}</div>
                <div style={{ fontSize:10, color:t.text3, fontWeight:600, marginTop:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info paiement */}
        <div style={{ ...cardAccentStyle(t,'#F5C842'), padding:'14px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, color: dark ? '#F5C842' : '#B45309', marginBottom:6 }}>⚠ Mode Pilote</div>
          <div style={{ fontSize:12, color:t.text2, lineHeight:1.5 }}>
            Les retraits sont simulés en mode pilote. Vos données sont réelles mais aucun transfert bancaire ne sera effectué pendant cette phase.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
