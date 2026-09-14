'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { CheckCircle, RefreshCw, Clock } from 'lucide-react'

const MODULES = [
  { label:'Identité',              status:'SYNCED',  icon:'🪪' },
  { label:'Véhicule',              status:'SYNCED',  icon:'🚗' },
  { label:'Documents',             status:'SYNCED',  icon:'📄' },
  { label:'Autorisations',         status:'SYNCED',  icon:'🏛️' },
  { label:'Courses',               status:'SYNCED',  icon:'🚕' },
  { label:'Plateformes',           status:'SYNCED',  icon:'🔌' },
  { label:'Fiscal',                status:'SYNCED',  icon:'🧾' },
  { label:'Notifications',         status:'SYNCED',  icon:'🔔' },
]

export default function SyncPage() {
  const { profile } = useDriverProfile()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const synced = MODULES.filter(m => m.status === 'SYNCED').length

  return (
    <AppShell>
      <div style={{ padding:'18px 16px 12px' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Synchronisation</h1>
        <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>{synced}/{MODULES.length} modules synchronisés</p>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>
        {/* Statut global */}
        <div style={{ background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', borderRadius:20, padding:'20px 18px', boxShadow:'0 8px 28px rgba(0,61,165,0.30)', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:8 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:800, color:'white', marginBottom:4 }}>Tout synchronisé</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.60)' }}>
            {profile?.first_name} {profile?.last_name} · Supabase
          </div>
        </div>

        {/* Modules */}
        <div>
          <SectionTitle title="État des modules" t={t} />
          <div style={{ ...cardStyle(t), overflow:'hidden' }}>
            {MODULES.map((m, idx) => (
              <div key={m.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ width:38, height:38, borderRadius:11, background: dark ? 'rgba(0,61,165,0.15)' : 'rgba(0,61,165,0.07)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                  {m.icon}
                </div>
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:t.text }}>{m.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  {m.status === 'SYNCED'
                    ? <CheckCircle size={16} color={t.green} />
                    : <Clock size={16} color={t.amber} />
                  }
                  <span style={{ fontSize:11, fontWeight:700, color: m.status === 'SYNCED' ? t.green : t.amber }}>
                    {m.status === 'SYNCED' ? 'Synchro ✓' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ background: dark ? 'rgba(0,61,165,0.08)' : 'rgba(0,61,165,0.05)', border:`1.5px solid rgba(0,61,165,0.18)`, borderRadius:14, padding:'13px 15px' }}>
          <div style={{ fontSize:11, color:t.text2, lineHeight:1.6 }}>
            🔄 La synchronisation se fait automatiquement avec Supabase. Les données sont mises à jour en temps réel lors de chaque interaction avec la plateforme.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
