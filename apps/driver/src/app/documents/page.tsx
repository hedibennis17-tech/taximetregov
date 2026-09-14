'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, Clock, XCircle, FileText, Shield, ChevronRight, X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DocVerification {
  verification_status: string
  verification_method: string
  verified_at: string | null
}
interface AuditEvent {
  action: string
  occurred_at: string
  actor_role: string | null
}
interface Doc {
  id: string
  public_document_id: string
  label: string
  code: string
  category: string
  status: string
  issued_at: string | null
  expires_at: string | null
  doc_number_last4: string | null
  notes: string | null
  daysUntilExpiry: number | null
  alertLevel: 'ok' | 'warning' | 'expired' | 'missing'
  verification: DocVerification | null
  auditTrail: AuditEvent[]
  isPilot: boolean
}
interface DocsData {
  driver: {first_name:string;last_name:string;public_driver_id:string}
  documents: Doc[]
  categories: Record<string, Doc[]>
  stats: {total:number;valid:number;warning:number;expired:number;pending:number}
  compliance: {overall_status:string;completeness_score:number} | null
  syncStatus: string
  generatedAt: string
}

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;bdr:string;icon:typeof CheckCircle}> = {
  APPROVED:      { label:'Valide',          color:'#059669', bg:'rgba(5,150,105,0.10)',  bdr:'rgba(5,150,105,0.25)',  icon:CheckCircle  },
  PENDING_REVIEW:{ label:'En révision',     color:'#003DA5', bg:'rgba(0,61,165,0.10)',   bdr:'rgba(0,61,165,0.25)',   icon:Clock        },
  UNDER_REVIEW:  { label:'En révision',     color:'#003DA5', bg:'rgba(0,61,165,0.10)',   bdr:'rgba(0,61,165,0.25)',   icon:Clock        },
  UPLOADED:      { label:'Soumis',          color:'#7C3AED', bg:'rgba(124,58,237,0.10)', bdr:'rgba(124,58,237,0.25)', icon:Clock        },
  DRAFT:         { label:'Brouillon',       color:'#4A6A9A', bg:'rgba(74,106,154,0.10)', bdr:'rgba(74,106,154,0.20)', icon:Clock        },
  REJECTED:      { label:'Rejeté',          color:'#DC2626', bg:'rgba(220,38,38,0.10)',  bdr:'rgba(220,38,38,0.25)',  icon:XCircle      },
  EXPIRED:       { label:'Expiré',          color:'#DC2626', bg:'rgba(220,38,38,0.10)',  bdr:'rgba(220,38,38,0.25)',  icon:XCircle      },
  SUSPENDED:     { label:'Suspendu',        color:'#B45309', bg:'rgba(180,83,9,0.10)',   bdr:'rgba(180,83,9,0.25)',   icon:AlertTriangle},
}

const CAT_ICON: Record<string,string> = {
  'Identité':'🪪', 'Transport rémunéré':'🚕', 'Véhicule':'🚗',
  'Taximètre':'📟', 'Formation':'🎓', 'Fiscalité':'🧾', 'Autre':'📄',
}

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'long',day:'numeric'}).format(new Date(d))
}

// ── Modal détail document ─────────────────────────────────────
function DocModal({ doc, t, dark, onClose }: { doc: Doc; t: ReturnType<typeof getThemeTokens>; dark: boolean; onClose: () => void }) {
  const sc = STATUS_CONF[doc.status] ?? STATUS_CONF['DRAFT']!
  const { icon: Icon } = sc

  const alertColor = doc.alertLevel === 'warning' ? '#B45309' : doc.alertLevel === 'expired' ? '#DC2626' : t.green

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', background:'rgba(0,0,0,0.60)' }} onClick={onClose}>
      <div style={{ width:'100%', maxHeight:'88vh', overflowY:'auto', background: dark ? '#0F1F38' : '#FFFFFF', borderRadius:'20px 20px 0 0', padding:'20px 16px 40px', border: dark ? '1px solid rgba(59,130,246,0.20)' : 'none', boxShadow:'0 -8px 40px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ width:40, height:4, borderRadius:2, background:t.border, margin:'0 auto 16px' }} />

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:t.text, marginBottom:4, letterSpacing:'-0.01em' }}>{doc.label}</div>
            <div style={{ fontSize:11, color:t.text3 }}>{doc.category} · {doc.public_document_id}</div>
          </div>
          <button onClick={onClose} style={{ padding:8, borderRadius:10, background:t.card2, border:`1px solid ${t.border}`, cursor:'pointer' }}>
            <X size={16} color={t.text3} />
          </button>
        </div>

        {/* Statut */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:14, background:sc.bg, border:`1.5px solid ${sc.bdr}`, marginBottom:14 }}>
          <Icon size={18} color={sc.color} />
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:sc.color }}>{sc.label}</div>
            {doc.daysUntilExpiry !== null && (
              <div style={{ fontSize:10, color:alertColor, marginTop:2, fontWeight:600 }}>
                {doc.daysUntilExpiry <= 0 ? 'Expiré' : `Expire dans ${doc.daysUntilExpiry} jour(s)`}
              </div>
            )}
          </div>
        </div>

        {/* Infos détaillées */}
        <div style={{ ...cardStyle(t), padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:t.text3, marginBottom:10 }}>Informations</div>
          {[
            { label:'Document',      val:doc.label },
            { label:'Catégorie',     val:doc.category },
            { label:'Référence',     val:doc.public_document_id },
            { label:'N° (4 dern.)',  val:doc.doc_number_last4 ? `••••${doc.doc_number_last4}` : '—' },
            { label:'Date d\'émission', val:fmtDate(doc.issued_at) },
            { label:'Expiration',    val:doc.expires_at ? fmtDate(doc.expires_at) : 'Sans expiration' },
            { label:'Statut',        val:sc.label },
            { label:'Juridiction',   val:'Québec, Canada' },
          ].map((r, idx) => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
              <span style={{ fontSize:11, color:t.text3, fontWeight:500 }}>{r.label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:t.text, textAlign:'right', maxWidth:'55%' }}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* Vérification */}
        {doc.verification && (
          <div style={{ ...cardStyle(t), padding:'14px 16px', marginBottom:14, borderLeft:`3px solid ${t.accent}` }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:t.text3, marginBottom:10 }}>🏛️ Vérification gouvernementale</div>
            {[
              { label:'Statut',   val:doc.verification.verification_status },
              { label:'Méthode',  val:doc.verification.verification_method },
              { label:'Vérifié',  val:fmtDate(doc.verification.verified_at) },
            ].map((r, idx) => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
                <span style={{ fontSize:11, color:t.text3 }}>{r.label}</span>
                <span style={{ fontSize:11, fontWeight:700, color: r.label === 'Statut' ? t.green : t.text }}>{r.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Audit trail */}
        {doc.auditTrail.length > 0 && (
          <div style={{ ...cardStyle(t), padding:'14px 16px', marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:t.text3, marginBottom:10 }}>📋 Journal d'audit</div>
            {doc.auditTrail.map((ev, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:t.accent, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:t.text }}>{ev.action.replace(/_/g,' ')}</div>
                  <div style={{ fontSize:9, color:t.text3, marginTop:1 }}>{fmtDate(ev.occurred_at)} · {ev.actor_role ?? 'SYSTEM'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note pilote */}
        {doc.isPilot && (
          <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(180,83,9,0.07)', border:'1.5px solid rgba(180,83,9,0.25)', display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ fontSize:14 }}>⚠</span>
            <div style={{ fontSize:10, color:t.amber, lineHeight:1.5 }}>
              <strong>Donnée synthétique — Mode pilote</strong><br/>
              Ce document est fictif et généré pour la démonstration gouvernementale TAXIMETER.GOV. Aucune transmission officielle n'a été effectuée.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function DocumentsPage() {
  const [data, setData] = useState<DocsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const loadDocs = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token) throw new Error('Non authentifié')
      const res = await fetch('/api/driver/documents', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json() as {success:boolean;data:DocsData;error?:string}
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  async function runSeed() {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/seed-documents', { method: 'POST' })
      const json = await res.json() as {success:boolean;data:{steps:string[]};error?:string}
      if (!json.success) throw new Error(json.error)
      await loadDocs()
    } catch (e) { setError((e as Error).message) }
    finally { setSeeding(false) }
  }

  useEffect(() => { void loadDocs() }, [loadDocs])

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement du dossier gouvernemental…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {selectedDoc && (
        <DocModal doc={selectedDoc} t={t} dark={dark} onClose={() => setSelectedDoc(null)} />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 10px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mes documents</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>Dossier gouvernemental · TAXIMETER.GOV</p>
        </div>
        <button onClick={() => void loadDocs()} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      {/* Sync status */}
      <div style={{ margin:'0 16px 12px', padding:'7px 12px', borderRadius:10, background:'rgba(180,83,9,0.07)', border:'1px solid rgba(180,83,9,0.20)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:10 }}>🏛️</span>
        <span style={{ fontSize:9, color:t.amber, fontWeight:700, letterSpacing:'0.05em' }}>SYNCHRONISATION GOUVERNEMENTALE : MODE PILOTE · Données synthétiques — aucune transmission officielle</span>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div style={{ padding:'0 16px 14px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[
              { label:'Total',     val:data.stats.total,   color:t.accent,  bg:'rgba(0,61,165,0.08)'  },
              { label:'Valides',   val:data.stats.valid,   color:t.green,   bg:'rgba(5,150,105,0.08)' },
              { label:'Alertes',   val:data.stats.warning, color:'#B45309', bg:'rgba(180,83,9,0.08)'  },
              { label:'Expirés',   val:data.stats.expired, color:t.red,     bg:'rgba(220,38,38,0.08)' },
            ].map(s => (
              <div key={s.label} style={{ borderRadius:14, background:s.bg, border:`1px solid ${t.border}`, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:s.color, letterSpacing:'-0.02em' }}>{s.val}</div>
                <div style={{ fontSize:9, color:t.text3, fontWeight:600, marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance score */}
      {data?.compliance && (
        <div style={{ margin:'0 16px 14px', padding:'12px 14px', borderRadius:14, background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', boxShadow:'0 4px 16px rgba(0,61,165,0.25)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.60)', letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:3 }}>Score de conformité</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Shield size={14} color="white" />
                <span style={{ fontSize:11, fontWeight:700, color:'white' }}>{data.compliance.overall_status.replace('_',' ')}</span>
              </div>
            </div>
            <div style={{ fontSize:36, fontWeight:900, color:'#FFFFFF', letterSpacing:'-0.03em' }}>
              {data.compliance.completeness_score}<span style={{ fontSize:16, opacity:0.60 }}>%</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerte expiration */}
      {data?.documents.some(d => d.alertLevel === 'warning') && (
        <div style={{ margin:'0 16px 14px', padding:'12px 14px', borderRadius:14, background:'rgba(180,83,9,0.08)', border:'1.5px solid rgba(180,83,9,0.30)', borderLeft:'4px solid #B45309' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#B45309', marginBottom:5 }}>⚠ Renouvellement recommandé</div>
          {data.documents.filter(d => d.alertLevel === 'warning').map(d => (
            <div key={d.id} style={{ fontSize:11, color: dark ? '#FCD34D' : '#92400E', marginTop:3 }}>
              • {d.label} — expire dans {d.daysUntilExpiry} jour(s)
            </div>
          ))}
        </div>
      )}

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>

        {/* Empty state avec bouton seed */}
        {(!data || data.documents.length === 0) && !error && (
          <div style={{ ...cardStyle(t), padding:'40px 20px', textAlign:'center' }}>
            <FileText size={44} color={t.text3} style={{ margin:'0 auto 14px', display:'block' }} />
            <div style={{ fontSize:15, fontWeight:700, color:t.text, marginBottom:6 }}>Aucun document trouvé</div>
            <div style={{ fontSize:12, color:t.text3, marginBottom:20, lineHeight:1.5 }}>
              Initialisez le dossier pilote pour voir votre dossier gouvernemental complet.
            </div>
            <button onClick={() => void runSeed()} disabled={seeding} style={{ padding:'12px 24px', borderRadius:14, background:'#003DA5', color:'white', fontWeight:700, fontSize:13, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,61,165,0.35)', display:'flex', alignItems:'center', gap:8, margin:'0 auto' }}>
              {seeding ? <><RefreshCw size={14} style={{animation:'spin 1s linear infinite'}} /> Initialisation…</> : '🏛️ Initialiser le dossier pilote'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle(t), padding:'16px', borderColor:'rgba(220,38,38,0.30)', textAlign:'center' }}>
            <div style={{ fontSize:12, color:t.red, marginBottom:10 }}>{error}</div>
            <button onClick={() => void loadDocs()} style={{ padding:'8px 18px', borderRadius:10, background:'#003DA5', color:'white', fontSize:12, fontWeight:700, border:'none', cursor:'pointer' }}>Réessayer</button>
          </div>
        )}

        {/* Documents par catégorie */}
        {data && data.documents.length > 0 && Object.entries(data.categories).map(([cat, docs]) => (
          <div key={cat}>
            <SectionTitle title={`${CAT_ICON[cat] ?? '📄'} ${cat}`} t={t} />
            <div style={{ ...cardStyle(t), overflow:'hidden' }}>
              {docs.map((doc, idx) => {
                const sc = STATUS_CONF[doc.status] ?? STATUS_CONF['DRAFT']!
                const { icon: Icon } = sc
                const alertLvl = doc.alertLevel
                const leftBorder = alertLvl === 'warning' ? '3px solid #B45309' : alertLvl === 'expired' ? '3px solid #DC2626' : `3px solid ${t.accent}`

                return (
                  <button key={doc.id} onClick={() => setSelectedDoc(doc)} style={{
                    width:'100%', display:'flex', alignItems:'center', gap:12,
                    padding:'14px 15px',
                    borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
                    background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
                    borderLeft: leftBorder,
                  }}>
                    {/* Icône catégorie */}
                    <div style={{ width:42, height:42, borderRadius:13, background: dark ? 'rgba(0,61,165,0.18)' : 'rgba(0,61,165,0.07)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                      {CAT_ICON[cat] ?? '📄'}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:3 }}>{doc.label}</div>
                      <div style={{ fontSize:10, color:t.text3 }}>
                        {doc.expires_at
                          ? `Exp. ${new Date(doc.expires_at).toLocaleDateString('fr-CA', {year:'numeric',month:'short',day:'numeric'})}`
                          : 'Sans expiration'
                        }
                        {doc.doc_number_last4 && ` · ••••${doc.doc_number_last4}`}
                      </div>
                      {alertLvl === 'warning' && (
                        <div style={{ fontSize:9, fontWeight:700, color:'#B45309', marginTop:2 }}>
                          ⚠ Expire dans {doc.daysUntilExpiry}j — Renouvellement recommandé
                        </div>
                      )}
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, background:sc.bg, border:`1px solid ${sc.bdr}`, borderRadius:20, padding:'3px 8px' }}>
                        <Icon size={10} color={sc.color} />
                        <span style={{ fontSize:9, fontWeight:700, color:sc.color }}>{sc.label}</span>
                      </div>
                      <ChevronRight size={13} color={t.text3} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Bouton réinitialiser si données existantes */}
        {data && data.documents.length > 0 && (
          <button onClick={() => void runSeed()} disabled={seeding} style={{ padding:'11px', borderRadius:12, background:'transparent', border:`1.5px solid ${t.border}`, color:t.text3, fontSize:11, fontWeight:600, cursor:'pointer', textAlign:'center' }}>
            {seeding ? '⏳ Mise à jour…' : '🔄 Réinitialiser le dossier pilote'}
          </button>
        )}
      </div>
    </AppShell>
  )
}
