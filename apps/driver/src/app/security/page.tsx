'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { Shield, Lock, Smartphone, Eye, ChevronRight, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SecurityPage() {
  const { profile } = useDriverProfile()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)
  const router = useRouter()

  const items = [
    { icon:Lock,       label:'Changer le mot de passe',    sub:'Recommandé tous les 90 jours',     color:'#003DA5' },
    { icon:Smartphone, label:'Authentification 2 facteurs', sub:'Protégez votre compte',            color:'#059669' },
    { icon:Eye,        label:'Sessions actives',            sub:'Voir les connexions récentes',     color:'#7C3AED' },
    { icon:Shield,     label:'Confidentialité',             sub:'Gérer vos données personnelles',   color:'#0891B2', href:'/profile/privacy' },
  ]

  return (
    <AppShell>
      <div style={{ padding:'18px 16px 12px' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Sécurité</h1>
        <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>Protégez votre compte TAXIMÈTRE.GOV</p>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>
        {/* Statut sécurité */}
        <div style={{ background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', borderRadius:20, padding:'18px 18px', boxShadow:'0 8px 28px rgba(0,61,165,0.28)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.12)', border:'2px solid rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'white' }}>Compte sécurisé</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.60)', marginTop:3 }}>{profile?.email ?? '—'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
              <CheckCircle size={12} color="#34D399" />
              <span style={{ fontSize:11, fontWeight:700, color:'#34D399' }}>Vérifié · TAXIMÈTRE.GOV</span>
            </div>
          </div>
        </div>

        {/* Options sécurité */}
        <div>
          <SectionTitle title="Options de sécurité" t={t} />
          <div style={{ ...cardStyle(t), overflow:'hidden' }}>
            {items.map((item, idx) => {
              const Icon = item.icon
              return (
                <button key={item.label} onClick={() => item.href ? router.push(item.href) : undefined} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:12,
                  padding:'14px 16px',
                  borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
                  background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
                }}>
                  <div style={{ width:38, height:38, borderRadius:11, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={17} color={item.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{item.label}</div>
                    <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={16} color={t.text3} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Info */}
        <div style={{ background: dark ? 'rgba(0,61,165,0.08)' : 'rgba(0,61,165,0.05)', border:`1.5px solid rgba(0,61,165,0.18)`, borderLeft:'4px solid #003DA5', borderRadius:14, padding:'13px 15px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:t.accent, marginBottom:5 }}>🔒 Sécurité gouvernementale</div>
          <div style={{ fontSize:11, color:t.text2, lineHeight:1.6 }}>
            Vos données sont chiffrées selon les normes du gouvernement du Québec. Aucune information sensible n'est partagée sans votre consentement explicite.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
