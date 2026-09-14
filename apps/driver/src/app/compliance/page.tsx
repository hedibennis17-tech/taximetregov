'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { CheckCircle, XCircle } from 'lucide-react'

export default function CompliancePage() {
  const { profile, loading } = useDriverProfile()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const items = [
    { label:'Identité vérifiée',   ok:profile?.verification_status === 'VERIFIED', icon:'🪪', cat:'identité' },
    { label:'Profil complété',     ok:profile?.status === 'ACTIVE',                 icon:'👤', cat:'identité' },
    { label:'Permis de conduire',  ok:true,  icon:'🪪', cat:'documents' },
    { label:'Permis taxi',         ok:true,  icon:'🏛️', cat:'documents' },
    { label:'Véhicule actif',      ok:true,  icon:'🚗', cat:'véhicule' },
    { label:'Inspection à jour',   ok:true,  icon:'🔧', cat:'véhicule' },
    { label:'Assurance valide',    ok:true,  icon:'🛡️', cat:'véhicule' },
    { label:'Compte fiscal actif', ok:true,  icon:'🧾', cat:'fiscal' },
    { label:'TPS enregistrée',     ok:true,  icon:'✅', cat:'fiscal' },
    { label:'TVQ enregistrée',     ok:true,  icon:'✅', cat:'fiscal' },
  ]
  const score = items.filter(i => i.ok).length
  const pct   = Math.round((score / items.length) * 100)
  const perfect = pct === 100

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement de la conformité…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div style={{ padding:'20px 16px 10px' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Ma conformité</h1>
        <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0', fontWeight:500 }}>Dossier réglementaire · TAXIMÈTRE.GOV</p>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14, paddingBottom:32 }}>

        {/* Score Hero */}
        <div style={{
          background: perfect
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
          borderRadius:20, padding:'24px 20px',
          boxShadow: perfect
            ? '0 8px 28px rgba(5,150,105,0.30)'
            : '0 8px 28px rgba(180,83,9,0.30)',
          textAlign:'center', position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-30, right:-20, fontSize:130, color:'rgba(255,255,255,0.05)', pointerEvents:'none' }}>⚜</div>
          {/* Cercle progress */}
          <div style={{ position:'relative', width:90, height:90, margin:'0 auto 14px' }}>
            <svg width={90} height={90} style={{ transform:'rotate(-90deg)' }}>
              <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
              <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={6}
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct/100)}`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:22, fontWeight:900, color:'#FFFFFF' }}>{pct}%</span>
            </div>
          </div>
          <div style={{ fontSize:15, fontWeight:800, color:'#FFFFFF' }}>
            {perfect ? '🟢 Dossier conforme' : '🟠 Action requise'}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:4 }}>
            {score}/{items.length} éléments conformes
          </div>
        </div>

        {/* Checklist par catégorie */}
        {['identité','documents','véhicule','fiscal'].map(cat => {
          const catItems = items.filter(i => i.cat === cat)
          return (
            <div key={cat}>
              <SectionTitle title={cat.charAt(0).toUpperCase() + cat.slice(1)} t={t} />
              <div style={{ ...cardStyle(t), overflow:'hidden' }}>
                {catItems.map((item, idx) => (
                  <div key={item.label} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                    borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
                  }}>
                    <span style={{ fontSize:20 }}>{item.icon}</span>
                    <span style={{ flex:1, fontSize:13, fontWeight:600, color:t.text }}>{item.label}</span>
                    {item.ok
                      ? <CheckCircle size={18} color={t.green} />
                      : <XCircle size={18} color={t.red} />
                    }
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
