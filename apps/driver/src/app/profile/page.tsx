'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, cardAccentStyle, SectionTitle } from '@/lib/theme-helpers'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, RefreshCw, Shield, User, FileText, Settings, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const STATUS_CONF: Record<string, { label:string; color:string; icon: typeof CheckCircle }> = {
  VERIFIED:     { label:'Vérifié ✓',   color:'#059669', icon:CheckCircle },
  PENDING:      { label:'En attente',  color:'#B45309', icon:Clock },
  UNDER_REVIEW: { label:'En révision', color:'#003DA5', icon:Clock },
  SUSPENDED:    { label:'Suspendu',    color:'#DC2626', icon:AlertCircle },
  REJECTED:     { label:'Rejeté',      color:'#DC2626', icon:AlertCircle },
}

export default function ProfilePage() {
  const { profile, loading, error, refresh } = useDriverProfile()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await getSupabaseBrowserClient().auth.signOut()
      router.replace('/auth/login')
    } catch { setSigningOut(false) }
  }

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement du profil…" />
      </div>
    </AppShell>
  )

  const status = profile ? (STATUS_CONF[profile.verification_status] ?? STATUS_CONF['PENDING']!) : null

  const links = [
    { label:'Mes documents',   href:'/documents',  icon:FileText, color:'#003DA5' },
    { label:'Mon véhicule',    href:'/vehicle',     icon:User,     color:'#059669' },
    { label:'Mes plateformes', href:'/platforms',   icon:Shield,   color:'#7C3AED' },
    { label:'Sécurité',        href:'/security',    icon:Settings, color:'#B45309' },
    { label:'Confidentialité', href:'/profile/privacy', icon:Shield, color:'#0891B2' },
  ]

  return (
    <AppShell>
      <div style={{ padding:'20px 16px 10px' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mon profil</h1>
        <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0', fontWeight:500 }}>TAXIMÈTRE.GOV — Espace chauffeur</p>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14, paddingBottom:32 }}>

        {error && (
          <div style={{ ...cardStyle(t), padding:'14px 16px', background: dark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.05)', border:`1.5px solid rgba(220,38,38,0.25)` }}>
            <p style={{ fontSize:13, color:t.red, margin:'0 0 10px' }}>{error}</p>
            <button onClick={() => void refresh()} style={{ padding:'8px 16px', borderRadius:10, background:'#DC2626', color:'white', fontWeight:700, border:'none', cursor:'pointer', fontSize:12 }}>
              Réessayer
            </button>
          </div>
        )}

        {profile && (
          <>
            {/* Carte identité */}
            <div style={{ background:'linear-gradient(135deg, #003DA5 0%, #0B4F71 100%)', borderRadius:20, padding:'20px 18px', boxShadow:'0 8px 28px rgba(0,61,165,0.30)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-20, right:-10, fontSize:100, color:'rgba(255,255,255,0.04)', pointerEvents:'none' }}>⚜</div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{
                  width:56, height:56, borderRadius:16,
                  background:'rgba(255,255,255,0.15)',
                  border:'2px solid rgba(255,255,255,0.30)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:22, fontWeight:900, color:'white',
                }}>
                  {profile.first_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#FFFFFF', lineHeight:1.2 }}>
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.60)', marginTop:2 }}>{profile.email}</div>
                  {status && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
                      <status.icon size={12} color={status.color} />
                      <span style={{ fontSize:11, fontWeight:700, color:status.color }}>{status.label}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'ID Gov.', val:profile.public_driver_id?.slice(0,12)+'…' },
                  { label:'Statut',  val:profile.onboarding_status?.replace(/_/g,' ') },
                  { label:'Langue',  val:profile.preferred_language === 'fr' ? 'Français' : 'English' },
                  ...(profile.phone_number_masked ? [{ label:'Téléphone', val:profile.phone_number_masked }] : []),
                ].map(row => (
                  <div key={row.label} style={{ background:'rgba(255,255,255,0.09)', borderRadius:10, padding:'9px 10px', border:'1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.50)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{row.label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#FFFFFF' }}>{row.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <SectionTitle title="Mon dossier" t={t} />
              <div style={{ ...cardStyle(t), overflow:'hidden' }}>
                {links.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button key={item.href} onClick={() => router.push(item.href)} style={{
                      width:'100%', display:'flex', alignItems:'center', gap:12,
                      padding:'14px 16px',
                      borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
                      background:'transparent', border:'none', cursor:'pointer',
                      textAlign:'left',
                    }}>
                      <div style={{ width:36, height:36, borderRadius:10, background: dark ? 'rgba(255,255,255,0.05)' : `rgba(0,0,0,0.04)`, border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon size={16} color={item.color} />
                      </div>
                      <span style={{ flex:1, fontSize:13, fontWeight:600, color:t.text }}>{item.label}</span>
                      <ChevronRight size={16} color={t.text3} />
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Déconnexion */}
        <button onClick={() => void handleSignOut()} disabled={signingOut} style={{
          width:'100%', padding:'14px', borderRadius:14, fontSize:13, fontWeight:700,
          background: dark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.05)',
          border:'1.5px solid rgba(220,38,38,0.25)',
          color:'#DC2626', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          opacity: signingOut ? 0.6 : 1,
        }}>
          {signingOut
            ? <><RefreshCw size={15} style={{ animation:'spin 1s linear infinite' }} /> Déconnexion…</>
            : <><LogOut size={15} /> Se déconnecter</>
          }
        </button>

        <p style={{ textAlign:'center', fontSize:10, color:t.text3, margin:0 }}>
          TAXIMÈTRE.GOV · Mode pilote · Gouvernement du Québec
        </p>
      </div>
    </AppShell>
  )
}
