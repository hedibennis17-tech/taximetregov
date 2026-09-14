'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, Clock, AlertTriangle, FileText, Upload } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Doc { id:string; status:string; issued_at:string; expires_at:string; document_types:{label:string;code:string} }

const STATUS_CONF = {
  APPROVED:   { label:'Vérifié',    color:'#059669', bg:'rgba(5,150,105,0.12)',   border:'rgba(5,150,105,0.25)',  Icon:CheckCircle  },
  PENDING:    { label:'En attente', color:'#B45309', bg:'rgba(180,83,9,0.10)',    border:'rgba(180,83,9,0.25)',   Icon:Clock        },
  SUBMITTED:  { label:'Soumis',     color:'#003DA5', bg:'rgba(0,61,165,0.10)',    border:'rgba(0,61,165,0.25)',   Icon:Clock        },
  REJECTED:   { label:'Refusé',     color:'#DC2626', bg:'rgba(220,38,38,0.10)',   border:'rgba(220,38,38,0.25)',  Icon:AlertTriangle},
  EXPIRED:    { label:'Expiré',     color:'#DC2626', bg:'rgba(220,38,38,0.10)',   border:'rgba(220,38,38,0.25)',  Icon:AlertTriangle},
} as const

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d))
}

export default function DocumentsPage() {
  const { profile, loading: pLoading } = useDriverProfile()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)
  const router = useRouter()

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data } = await getSupabaseBrowserClient()
        .from('driver_documents').select('*, document_types(label,code)')
        .eq('driver_id', profile.id).order('created_at', { ascending:false })
      setDocs(data ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [profile?.id])

  if (pLoading || loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement des documents…" />
      </div>
    </AppShell>
  )

  const byStatus = (s: string) => docs.filter(d => d.status === s)
  const alerts = [...byStatus('REJECTED'), ...byStatus('EXPIRED')]

  return (
    <AppShell>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mes documents</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>{docs.length} document(s)</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => router.push('/documents/upload')} style={{ width:38, height:38, borderRadius:12, background:'#003DA5', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,61,165,0.30)' }}>
            <Upload size={16} color="white" />
          </button>
          <button onClick={load} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
            <RefreshCw size={16} color={t.accent} />
          </button>
        </div>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>
        {/* Alertes */}
        {alerts.length > 0 && (
          <div style={{ background:'rgba(220,38,38,0.07)', border:'1.5px solid rgba(220,38,38,0.25)', borderLeft:'4px solid #DC2626', borderRadius:14, padding:'13px 15px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#DC2626', marginBottom:5 }}>⚠ Action requise</div>
            {alerts.map(d => (
              <div key={d.id} style={{ fontSize:11, color: dark ? '#FCA5A5' : '#7F1D1D', marginTop:3 }}>
                • {d.document_types?.label ?? d.id} — {STATUS_CONF[d.status as keyof typeof STATUS_CONF]?.label ?? d.status}
              </div>
            ))}
          </div>
        )}

        {/* Liste */}
        {docs.length === 0 ? (
          <div style={{ ...cardStyle(t), padding:'48px 0', textAlign:'center' }}>
            <FileText size={40} color={t.text3} style={{ margin:'0 auto 12px', display:'block' }} />
            <div style={{ fontSize:14, color:t.text3, fontWeight:500 }}>Aucun document trouvé</div>
            <button onClick={() => router.push('/documents/upload')} style={{ marginTop:16, padding:'10px 20px', borderRadius:12, background:'#003DA5', color:'white', fontWeight:700, border:'none', cursor:'pointer', fontSize:13 }}>
              + Ajouter un document
            </button>
          </div>
        ) : (
          <div>
            <SectionTitle title="Tous les documents" t={t} />
            <div style={{ ...cardStyle(t), overflow:'hidden' }}>
              {docs.map((doc, idx) => {
                const sc = STATUS_CONF[doc.status as keyof typeof STATUS_CONF] ?? STATUS_CONF.PENDING
                const { Icon } = sc
                return (
                  <div key={doc.id} onClick={() => router.push(`/documents/detail?id=${doc.id}`)} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'13px 15px',
                    borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
                    cursor:'pointer',
                  }}>
                    <div style={{ width:40, height:40, borderRadius:12, background: dark ? 'rgba(0,61,165,0.15)' : 'rgba(0,61,165,0.07)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FileText size={18} color={t.accent} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:3 }}>
                        {doc.document_types?.label ?? 'Document'}
                      </div>
                      <div style={{ fontSize:10, color:t.text3 }}>
                        Exp. {fmtDate(doc.expires_at)}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:20, padding:'4px 10px' }}>
                      <Icon size={11} color={sc.color} />
                      <span style={{ fontSize:10, fontWeight:700, color:sc.color }}>{sc.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
