'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, Clock, XCircle, FileText, Shield, ChevronRight, X, Upload, Camera, Plus, type LucideIcon } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────
interface DocVerif { verification_status:string; verification_method:string; verified_at:string|null; review_notes:string|null; rejection_note:string|null }
interface AuditEv  { action:string; occurred_at:string; actor_role:string|null }
interface Doc {
  id:string; public_document_id:string; label:string; code:string; category:string
  status:string; issued_at:string|null; expires_at:string|null
  doc_number_last4:string|null; notes:string|null
  daysUntilExpiry:number|null; alertLevel:'ok'|'warning'|'expired'|'missing'
  verification:DocVerif|null; auditTrail:AuditEv[]; isPilot:boolean
}
interface DocsData {
  driver:{first_name:string;last_name:string;driver_number:string}
  documents:Doc[]; categories:Record<string,Doc[]>
  stats:{total:number;valid:number;warning:number;expired:number;pending:number}
  compliance:{overall_status:string;completeness_score:number}|null
}
interface DocType { id:string; code:string; label:string; label_fr:string|null; owner_type:string; has_expiry_date:boolean }

// ─── Constantes ───────────────────────────────────────────────
const STATUS_CONF: Record<string,{label:string;color:string;bg:string;bdr:string;Icon:LucideIcon}> = {
  APPROVED:      {label:'Valide',           color:'#059669', bg:'rgba(5,150,105,0.10)',  bdr:'rgba(5,150,105,0.25)',  Icon:CheckCircle  },
  UPLOADED:      {label:'En vérification',  color:'#7C3AED', bg:'rgba(124,58,237,0.10)',bdr:'rgba(124,58,237,0.25)', Icon:Clock        },
  PENDING_REVIEW:{label:'En révision',      color:'#003DA5', bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.25)',   Icon:Clock        },
  UNDER_REVIEW:  {label:'En révision',      color:'#003DA5', bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.25)',   Icon:Clock        },
  DRAFT:         {label:'Brouillon',        color:'#4A6A9A', bg:'rgba(74,106,154,0.10)',bdr:'rgba(74,106,154,0.20)', Icon:Clock        },
  REJECTED:      {label:'Refusé',           color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)',  Icon:XCircle      },
  EXPIRED:       {label:'Expiré',           color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)',  Icon:XCircle      },
  SUSPENDED:     {label:'Suspendu',         color:'#B45309', bg:'rgba(180,83,9,0.10)',  bdr:'rgba(180,83,9,0.25)',   Icon:AlertTriangle},
}
const CAT_ICON:Record<string,string> = {
  'Identité':'🪪','Transport rémunéré':'🚕','Véhicule':'🚗',
  'Taximètre':'📟','Formation':'🎓','Fiscalité':'🧾','Autre':'📄',
}
const REQUIRED_DOCS = [
  {code:'DRIVER_LICENSE',              label:'Permis de conduire',                   cat:'Identité',            required:true},
  {code:'AUTHORIZED_DRIVER_PERMIT',    label:'Permis de chauffeur autorisé',          cat:'Transport rémunéré',  required:true},
  {code:'CRIMINAL_RECORD_CHECK',       label:'Vérification des antécédents',          cat:'Transport rémunéré',  required:true},
  {code:'TRAINING_CERTIFICATE',        label:'Attestation de formation',              cat:'Formation',           required:true},
  {code:'VEHICLE_REGISTRATION',        label:'Immatriculation du véhicule',           cat:'Véhicule',            required:true},
  {code:'VEHICLE_INSURANCE',           label:'Assurance automobile',                  cat:'Véhicule',            required:true},
  {code:'TAXIMETER_CERTIFICATE',       label:'Certificat de conformité du taximètre', cat:'Taximètre',           required:false},
  {code:'TPS_REGISTRATION',            label:'Inscription TPS/TVQ',                   cat:'Fiscalité',           required:false},
]

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'long',day:'numeric'}).format(new Date(d))
}

// ─── Modal détail ─────────────────────────────────────────────
function DocModal({doc,t,dark,onClose}:{doc:Doc;t:ReturnType<typeof getThemeTokens>;dark:boolean;onClose:()=>void}) {
  const sc = STATUS_CONF[doc.status] ?? STATUS_CONF['DRAFT']!
  const rejected = doc.status === 'REJECTED'
  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.65)'}} onClick={onClose}>
      <div style={{width:'100%',maxHeight:'88vh',overflowY:'auto',background:dark?'#0F1F38':'#FFFFFF',borderRadius:'20px 20px 0 0',padding:'20px 16px 40px'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:t.border,margin:'0 auto 16px'}}/>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:t.text,marginBottom:4}}>{doc.label}</div>
            <div style={{fontSize:11,color:t.text3}}>{doc.category} · {doc.public_document_id}</div>
          </div>
          <button onClick={onClose} style={{padding:8,borderRadius:10,background:t.card2,border:`1px solid ${t.border}`,cursor:'pointer'}}>
            <X size={16} color={t.text3}/>
          </button>
        </div>
        {/* Statut */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:14,background:sc.bg,border:`1.5px solid ${sc.bdr}`,marginBottom:14}}>
          <sc.Icon size={18} color={sc.color}/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:sc.color}}>{sc.label}</div>
            {doc.daysUntilExpiry!==null&&<div style={{fontSize:10,color:doc.alertLevel==='warning'?'#B45309':t.green,marginTop:2,fontWeight:600}}>
              {doc.daysUntilExpiry<=0?'Expiré':`Expire dans ${doc.daysUntilExpiry} jour(s)`}
            </div>}
          </div>
        </div>
        {/* Motif refus */}
        {rejected && doc.verification?.rejection_note && (
          <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(220,38,38,0.08)',border:'1.5px solid rgba(220,38,38,0.30)',marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#DC2626',marginBottom:4}}>❌ Motif du refus</div>
            <div style={{fontSize:11,color:dark?'#FCA5A5':'#7F1D1D',lineHeight:1.5}}>{doc.verification.rejection_note}</div>
          </div>
        )}
        {/* Infos */}
        <div style={{...cardStyle(t),padding:'14px 16px',marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase',color:t.text3,marginBottom:10}}>Informations</div>
          {[
            {label:'Référence',       val:doc.public_document_id},
            {label:'N° (4 derniers)', val:doc.doc_number_last4?`••••${doc.doc_number_last4}`:'—'},
            {label:'Date d\'émission',val:fmtDate(doc.issued_at)},
            {label:'Expiration',      val:doc.expires_at?fmtDate(doc.expires_at):'Sans expiration'},
            {label:'Statut',          val:sc.label},
          ].map((r,idx)=>(
            <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
              <span style={{fontSize:11,color:t.text3}}>{r.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:t.text}}>{r.val}</span>
            </div>
          ))}
        </div>
        {/* Vérification */}
        {doc.verification&&(
          <div style={{...cardStyle(t),padding:'14px 16px',marginBottom:14,borderLeft:`3px solid ${t.accent}`}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase',color:t.text3,marginBottom:10}}>🏛️ Vérification gouvernementale</div>
            <div style={{fontSize:11,color:t.text2}}>{doc.verification.verification_status} · {fmtDate(doc.verification.verified_at)}</div>
            {doc.verification.review_notes&&<div style={{fontSize:10,color:t.text3,marginTop:6}}>{doc.verification.review_notes}</div>}
          </div>
        )}
        {/* Audit */}
        {doc.auditTrail.length>0&&(
          <div style={{...cardStyle(t),padding:'14px 16px',marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase',color:t.text3,marginBottom:10}}>📋 Journal d'audit</div>
            {doc.auditTrail.map((ev,idx)=>(
              <div key={idx} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:t.accent,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:t.text}}>{ev.action.replace(/_/g,' ')}</div>
                  <div style={{fontSize:9,color:t.text3,marginTop:1}}>{fmtDate(ev.occurred_at)} · {ev.actor_role??'SYSTEM'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {doc.isPilot&&(
          <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(180,83,9,0.07)',border:'1.5px solid rgba(180,83,9,0.25)'}}>
            <div style={{fontSize:10,color:t.amber,lineHeight:1.5}}><strong>⚠ Donnée synthétique — Mode pilote</strong><br/>Ce document est fictif. Aucune transmission officielle n'a été effectuée.</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal upload ─────────────────────────────────────────────
function UploadModal({t,dark,docTypes,onClose,onSubmit}:{t:ReturnType<typeof getThemeTokens>;dark:boolean;docTypes:DocType[];onClose:()=>void;onSubmit:(payload:Record<string,unknown>)=>Promise<void>}) {
  const [step,setStep]       = useState<'type'|'info'|'file'|'confirm'>('type')
  const [selCode,setSelCode] = useState('')
  const [issuedAt,setIssuedAt]   = useState('')
  const [expiresAt,setExpiresAt] = useState('')
  const [last4,setLast4]         = useState('')
  const [fileB64,setFileB64]     = useState<string|null>(null)
  const [fileName,setFileName]   = useState('')
  const [loading,setLoading]     = useState(false)
  const [error,setError]         = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selType = docTypes.find(t => t.code === selCode)

  function handleFile(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => setFileB64(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setLoading(true); setError(null)
    try {
      await onSubmit({
        documentTypeCode: selCode,
        issuedAt:  issuedAt || undefined,
        expiresAt: expiresAt || undefined,
        docNumberLast4: last4 || undefined,
        fileBase64: fileB64 ?? undefined,
        fileName:   fileName || undefined,
      })
      onClose()
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const inp = (placeholder:string, value:string, onChange:(v:string)=>void, type='text') => (
    <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',padding:'11px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box'}}/>
  )

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.70)'}} onClick={onClose}>
      <div style={{width:'100%',maxHeight:'92vh',overflowY:'auto',background:dark?'#0F1F38':'#FFFFFF',borderRadius:'20px 20px 0 0',padding:'20px 16px 48px'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:t.border,margin:'0 auto 16px'}}/>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:t.text}}>+ Ajouter un document</div>
            <div style={{fontSize:11,color:t.text3,marginTop:2}}>Étape {step==='type'?1:step==='info'?2:step==='file'?3:4}/4</div>
          </div>
          <button onClick={onClose} style={{padding:8,borderRadius:10,background:t.card2,border:`1px solid ${t.border}`,cursor:'pointer'}}>
            <X size={16} color={t.text3}/>
          </button>
        </div>

        {/* Étape 1 — Choisir le type */}
        {step==='type'&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:12}}>Choisissez le type de document</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:'55vh',overflowY:'auto'}}>
              {REQUIRED_DOCS.map(rd=>{
                const dt = docTypes.find(t=>t.code===rd.code)
                return (
                  <button key={rd.code} onClick={()=>{setSelCode(rd.code);setStep('info')}} style={{
                    display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:14,
                    background:dark?'rgba(0,61,165,0.10)':'rgba(0,61,165,0.05)',
                    border:`1.5px solid ${selCode===rd.code?t.accent:t.border}`,
                    cursor:'pointer',textAlign:'left',
                  }}>
                    <span style={{fontSize:22}}>{CAT_ICON[rd.cat]??'📄'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:t.text}}>{rd.label}</div>
                      <div style={{fontSize:10,color:t.text3,marginTop:2}}>
                        {rd.cat} · {rd.required?'Requis':'Optionnel'}
                        {!dt&&<span style={{color:'#B45309'}}> · type non disponible</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} color={t.text3}/>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Étape 2 — Infos */}
        {step==='info'&&selType&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{padding:'11px 13px',borderRadius:12,background:'rgba(0,61,165,0.08)',border:`1px solid rgba(0,61,165,0.20)`}}>
              <div style={{fontSize:12,fontWeight:700,color:t.text}}>{selType.label_fr??selType.label}</div>
              <div style={{fontSize:10,color:t.text3,marginTop:2}}>{selType.owner_type} · Juridiction QC</div>
            </div>
            <div>
              <div style={{fontSize:11,color:t.text3,marginBottom:5,fontWeight:600}}>Date d'émission</div>
              {inp('AAAA-MM-JJ',issuedAt,setIssuedAt,'date')}
            </div>
            {selType.has_expiry_date&&(
              <div>
                <div style={{fontSize:11,color:t.text3,marginBottom:5,fontWeight:600}}>Date d'expiration</div>
                {inp('AAAA-MM-JJ',expiresAt,setExpiresAt,'date')}
              </div>
            )}
            <div>
              <div style={{fontSize:11,color:t.text3,marginBottom:5,fontWeight:600}}>Numéro (4 derniers chiffres, optionnel)</div>
              {inp('ex: 4417',last4,setLast4)}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep('type')} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>← Retour</button>
              <button onClick={()=>setStep('file')} style={{flex:2,padding:'12px',borderRadius:12,background:'#003DA5',color:'white',fontWeight:700,cursor:'pointer',fontSize:13,border:'none',boxShadow:'0 4px 12px rgba(0,61,165,0.30)'}}>Suivant →</button>
            </div>
          </div>
        )}

        {/* Étape 3 — Fichier */}
        {step==='file'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:13,fontWeight:700,color:t.text}}>Joindre le document</div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} style={{display:'none'}}/>
            {fileB64?(
              <div style={{padding:'14px',borderRadius:14,background:'rgba(5,150,105,0.08)',border:'1.5px solid rgba(5,150,105,0.25)',textAlign:'center'}}>
                <CheckCircle size={24} color="#059669" style={{margin:'0 auto 8px',display:'block'}}/>
                <div style={{fontSize:12,fontWeight:700,color:'#059669'}}>Fichier prêt</div>
                <div style={{fontSize:10,color:t.text3,marginTop:3}}>{fileName}</div>
                <button onClick={()=>{setFileB64(null);setFileName('')}} style={{marginTop:8,fontSize:10,color:t.text3,background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>Changer</button>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button onClick={()=>fileRef.current?.click()} style={{padding:'20px',borderRadius:14,background:dark?'rgba(0,61,165,0.10)':'rgba(0,61,165,0.05)',border:`2px dashed ${t.border}`,cursor:'pointer',textAlign:'center'}}>
                  <Upload size={28} color={t.accent} style={{margin:'0 auto 8px',display:'block'}}/>
                  <div style={{fontSize:13,fontWeight:700,color:t.text}}>Choisir un fichier</div>
                  <div style={{fontSize:10,color:t.text3,marginTop:3}}>Image ou PDF · Max 10 MB</div>
                </button>
                <button onClick={()=>fileRef.current?.click()} style={{padding:'13px',borderRadius:12,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',border:`1px solid ${t.border}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <Camera size={16} color={t.text3}/><span style={{fontSize:12,color:t.text3,fontWeight:600}}>Prendre une photo</span>
                </button>
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep('info')} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>← Retour</button>
              <button onClick={()=>setStep('confirm')} style={{flex:2,padding:'12px',borderRadius:12,background:'#003DA5',color:'white',fontWeight:700,cursor:'pointer',fontSize:13,border:'none',boxShadow:'0 4px 12px rgba(0,61,165,0.30)'}}>
                {fileB64?'Confirmer →':'Passer sans fichier →'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 4 — Confirmation */}
        {step==='confirm'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:13,fontWeight:700,color:t.text}}>Confirmer et soumettre</div>
            <div style={{...cardStyle(t),padding:'14px 16px'}}>
              {[
                {label:'Type',      val:selType?.label_fr??selType?.label??selCode},
                {label:'Émis le',   val:issuedAt||'—'},
                {label:'Expire le', val:expiresAt||'Sans expiration'},
                {label:'Numéro',    val:last4?`••••${last4}`:'—'},
                {label:'Fichier',   val:fileB64?fileName:'Non fourni'},
              ].map((r,idx)=>(
                <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
                  <span style={{fontSize:11,color:t.text3}}>{r.label}</span>
                  <span style={{fontSize:11,fontWeight:700,color:t.text}}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={{padding:'10px 13px',borderRadius:10,background:'rgba(180,83,9,0.08)',border:'1px solid rgba(180,83,9,0.25)'}}>
              <div style={{fontSize:10,color:t.amber,lineHeight:1.5}}>
                ⚠ Mode pilote — Ces informations seront enregistrées comme données synthétiques de démonstration.
              </div>
            </div>
            {error&&<div style={{fontSize:11,color:t.red,padding:'8px 12px',borderRadius:8,background:'rgba(220,38,38,0.08)',border:`1px solid rgba(220,38,38,0.25)`}}>{error}</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep('file')} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>← Retour</button>
              <button onClick={()=>void handleSubmit()} disabled={loading} style={{flex:2,padding:'12px',borderRadius:12,background:loading?t.border:'#003DA5',color:loading?t.text3:'white',fontWeight:700,cursor:loading?'not-allowed':'pointer',fontSize:13,border:'none',boxShadow:loading?'none':'0 4px 12px rgba(0,61,165,0.30)'}}>
                {loading?'Soumission…':'🏛️ Soumettre le document'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function DocumentsPage() {
  const [data,setData]           = useState<DocsData|null>(null)
  const [docTypes,setDocTypes]   = useState<DocType[]>([])
  const [loading,setLoading]     = useState(true)
  const [seeding,setSeeding]     = useState(false)
  const [selectedDoc,setSelectedDoc] = useState<Doc|null>(null)
  const [showUpload,setShowUpload]   = useState(false)
  const [error,setError]         = useState<string|null>(null)
  const [toast,setToast]         = useState<string|null>(null)
  const { theme } = useTheme()
  const dark = theme==='dark'
  const t = getThemeTokens(dark)

  const getToken = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token ?? null
  }, [])

  const loadDocs = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Non authentifié')
      const [docsRes, typesRes] = await Promise.all([
        fetch('/api/driver/documents', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/driver/documents/types', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const docsJson  = await docsRes.json() as {success:boolean;data:DocsData;error?:string}
      const typesJson = await typesRes.json() as {success:boolean;data:{types:DocType[]};error?:string}
      if (!docsJson.success) throw new Error(docsJson.error)
      setData(docsJson.data)
      if (typesJson.success) setDocTypes(typesJson.data.types)
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [getToken])

  async function runSeed() {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/seed-documents', { method: 'POST' })
      const json = await res.json() as {success:boolean;data:{message:string};error?:string}
      if (!json.success) throw new Error(json.error)
      showToast(json.data.message)
      await loadDocs()
    } catch(e) { setError((e as Error).message) }
    finally { setSeeding(false) }
  }

  async function submitDoc(payload: Record<string,unknown>) {
    const token = await getToken()
    if (!token) throw new Error('Non authentifié')
    const res = await fetch('/api/driver/documents/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json() as {success:boolean;data:{message:string};error?:string}
    if (!json.success) throw new Error(json.error)
    showToast('Document soumis — en attente de vérification')
    await loadDocs()
  }

  function showToast(msg:string) {
    setToast(msg)
    setTimeout(()=>setToast(null), 4000)
  }

  useEffect(()=>{ void loadDocs() }, [loadDocs])

  if (loading) return (
    <AppShell>
      <div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <TaximetreGovLoader message="Chargement du dossier gouvernemental…"/>
      </div>
    </AppShell>
  )

  const approvedCount = data?.documents.filter(d=>d.status==='APPROVED').length??0
  const inReview      = data?.documents.filter(d=>['UPLOADED','PENDING_REVIEW','UNDER_REVIEW'].includes(d.status)).length??0
  const totalRequired = REQUIRED_DOCS.filter(r=>r.required).length
  const completionPct = data ? Math.round((approvedCount/Math.max(totalRequired,1))*100) : 0

  return (
    <AppShell>
      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:400,background:'#003DA5',color:'white',padding:'10px 20px',borderRadius:14,fontSize:12,fontWeight:700,boxShadow:'0 4px 20px rgba(0,61,165,0.40)',maxWidth:'90%',textAlign:'center'}}>
          {toast}
        </div>
      )}

      {selectedDoc&&<DocModal doc={selectedDoc} t={t} dark={dark} onClose={()=>setSelectedDoc(null)}/>}
      {showUpload&&<UploadModal t={t} dark={dark} docTypes={docTypes} onClose={()=>setShowUpload(false)} onSubmit={submitDoc}/>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 16px 10px'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:t.text,margin:0,letterSpacing:'-0.01em'}}>Mes documents</h1>
          <p style={{fontSize:11,color:t.text3,margin:'3px 0 0'}}>Dossier gouvernemental · TAXIMETER.GOV</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setShowUpload(true)} style={{width:38,height:38,borderRadius:12,background:'#003DA5',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,61,165,0.30)'}}>
            <Plus size={18} color="white"/>
          </button>
          <button onClick={()=>void loadDocs()} style={{width:38,height:38,borderRadius:12,background:t.card,border:`1.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:t.shadow}}>
            <RefreshCw size={16} color={t.accent}/>
          </button>
        </div>
      </div>

      {/* Sync banner */}
      <div style={{margin:'0 16px 12px',padding:'7px 12px',borderRadius:10,background:'rgba(180,83,9,0.07)',border:'1px solid rgba(180,83,9,0.20)',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:10}}>🏛️</span>
        <span style={{fontSize:9,color:t.amber,fontWeight:700,letterSpacing:'0.05em'}}>SYNCHRONISATION GOUVERNEMENTALE : MODE PILOTE · Données synthétiques</span>
      </div>

      {/* Stats 4 KPI */}
      {data?.stats&&(
        <div style={{padding:'0 16px 12px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[
              {label:'Total',       val:data.stats.total,   color:t.accent,  bg:'rgba(0,61,165,0.08)'  },
              {label:'Valides',     val:data.stats.valid,   color:t.green,   bg:'rgba(5,150,105,0.08)' },
              {label:'Révision',    val:inReview,            color:'#7C3AED', bg:'rgba(124,58,237,0.08)'},
              {label:'Alertes',     val:data.stats.warning, color:'#B45309', bg:'rgba(180,83,9,0.08)'  },
            ].map(s=>(
              <div key={s.label} style={{borderRadius:14,background:s.bg,border:`1px solid ${t.border}`,padding:'10px 6px',textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:900,color:s.color,letterSpacing:'-0.02em'}}>{s.val}</div>
                <div style={{fontSize:9,color:t.text3,fontWeight:600,marginTop:2,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progression dossier */}
      {data&&data.documents.length>0&&(
        <div style={{margin:'0 16px 14px',padding:'14px 16px',borderRadius:16,background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)',boxShadow:'0 4px 16px rgba(0,61,165,0.25)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div>
              <div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.60)',letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:3}}>Dossier documentaire</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <Shield size={14} color="white"/>
                <span style={{fontSize:11,fontWeight:700,color:'white'}}>{approvedCount}/{totalRequired} docs requis approuvés</span>
              </div>
              {inReview>0&&<div style={{fontSize:10,color:'rgba(255,255,255,0.60)',marginTop:2}}>{inReview} en cours de vérification</div>}
            </div>
            <div style={{fontSize:36,fontWeight:900,color:'#FFFFFF',letterSpacing:'-0.03em'}}>{completionPct}<span style={{fontSize:16,opacity:0.60}}>%</span></div>
          </div>
          {/* Barre progression */}
          <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.15)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${completionPct}%`,background:'#34D399',borderRadius:3,transition:'width 0.6s ease'}}/>
          </div>
        </div>
      )}

      {/* Alerte expiration */}
      {data?.documents.some(d=>d.alertLevel==='warning')&&(
        <div style={{margin:'0 16px 14px',padding:'12px 14px',borderRadius:14,background:'rgba(180,83,9,0.08)',border:'1.5px solid rgba(180,83,9,0.30)',borderLeft:'4px solid #B45309'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#B45309',marginBottom:5}}>⚠ Renouvellement recommandé</div>
          {data!.documents.filter(d=>d.alertLevel==='warning').map(d=>(
            <div key={d.id} style={{fontSize:11,color:dark?'#FCD34D':'#92400E',marginTop:3}}>
              • {d.label} — expire dans {d.daysUntilExpiry}j
            </div>
          ))}
        </div>
      )}

      {/* Alertes refus */}
      {data?.documents.some(d=>d.status==='REJECTED')&&(
        <div style={{margin:'0 16px 14px',padding:'12px 14px',borderRadius:14,background:'rgba(220,38,38,0.08)',border:'1.5px solid rgba(220,38,38,0.30)',borderLeft:'4px solid #DC2626'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#DC2626',marginBottom:5}}>❌ Correction requise</div>
          {data!.documents.filter(d=>d.status==='REJECTED').map(d=>(
            <button key={d.id} onClick={()=>setSelectedDoc(d)} style={{display:'block',width:'100%',textAlign:'left',fontSize:11,color:dark?'#FCA5A5':'#7F1D1D',marginTop:3,background:'none',border:'none',cursor:'pointer'}}>
              • {d.label} — Voir le motif →
            </button>
          ))}
        </div>
      )}

      <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:16,paddingBottom:32}}>

        {/* Empty state */}
        {(!data||data.documents.length===0)&&!error&&(
          <div style={{...cardStyle(t),padding:'40px 20px',textAlign:'center'}}>
            <FileText size={44} color={t.text3} style={{margin:'0 auto 14px',display:'block'}}/>
            <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:6}}>Aucun document trouvé</div>
            <div style={{fontSize:12,color:t.text3,marginBottom:20,lineHeight:1.5}}>Initialisez le dossier pilote ou ajoutez vos documents.</div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>void runSeed()} disabled={seeding} style={{padding:'12px 20px',borderRadius:14,background:'rgba(0,61,165,0.10)',color:t.accent,fontWeight:700,fontSize:12,border:`1px solid rgba(0,61,165,0.25)`,cursor:'pointer'}}>
                {seeding?'⏳ Initialisation…':'🏛️ Initialiser pilote'}
              </button>
              <button onClick={()=>setShowUpload(true)} style={{padding:'12px 20px',borderRadius:14,background:'#003DA5',color:'white',fontWeight:700,fontSize:12,border:'none',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,61,165,0.35)'}}>
                + Ajouter un document
              </button>
            </div>
          </div>
        )}

        {error&&(
          <div style={{...cardStyle(t),padding:'16px',textAlign:'center'}}>
            <div style={{fontSize:12,color:t.red,marginBottom:10}}>{error}</div>
            <button onClick={()=>void loadDocs()} style={{padding:'8px 18px',borderRadius:10,background:'#003DA5',color:'white',fontSize:12,fontWeight:700,border:'none',cursor:'pointer'}}>Réessayer</button>
          </div>
        )}

        {/* Documents par catégorie */}
        {data&&data.documents.length>0&&Object.entries(data.categories).map(([cat,docs])=>(
          <div key={cat}>
            <SectionTitle title={`${CAT_ICON[cat]??'📄'} ${cat}`} t={t}/>
            <div style={{...cardStyle(t),overflow:'hidden'}}>
              {docs.map((doc,idx)=>{
                const sc = STATUS_CONF[doc.status]??STATUS_CONF['DRAFT']!
                const leftBorder = doc.alertLevel==='warning'?'3px solid #B45309':doc.alertLevel==='expired'?'3px solid #DC2626':doc.status==='REJECTED'?'3px solid #DC2626':doc.status==='APPROVED'?`3px solid ${t.accent}`:'3px solid #7C3AED'
                return (
                  <button key={doc.id} onClick={()=>setSelectedDoc(doc)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px 15px',borderTop:idx>0?`1px solid ${t.border}`:'none',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',borderLeft:leftBorder}}>
                    <div style={{width:42,height:42,borderRadius:13,background:dark?'rgba(0,61,165,0.18)':'rgba(0,61,165,0.07)',border:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                      {CAT_ICON[cat]??'📄'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:3}}>{doc.label}</div>
                      <div style={{fontSize:10,color:t.text3}}>
                        {doc.expires_at?`Exp. ${new Date(doc.expires_at).toLocaleDateString('fr-CA',{year:'numeric',month:'short',day:'numeric'})}`:'Sans expiration'}
                        {doc.doc_number_last4&&` · ••••${doc.doc_number_last4}`}
                      </div>
                      {doc.alertLevel==='warning'&&<div style={{fontSize:9,fontWeight:700,color:'#B45309',marginTop:2}}>⚠ Expire dans {doc.daysUntilExpiry}j</div>}
                      {doc.status==='REJECTED'&&<div style={{fontSize:9,fontWeight:700,color:'#DC2626',marginTop:2}}>❌ Correction requise — Appuyer pour voir</div>}
                      {['UPLOADED','UNDER_REVIEW','PENDING_REVIEW'].includes(doc.status)&&<div style={{fontSize:9,fontWeight:700,color:'#7C3AED',marginTop:2}}>🕐 En cours de vérification administrative</div>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:4,background:sc.bg,border:`1px solid ${sc.bdr}`,borderRadius:20,padding:'3px 8px'}}>
                        <sc.Icon size={10} color={sc.color}/>
                        <span style={{fontSize:9,fontWeight:700,color:sc.color}}>{sc.label}</span>
                      </div>
                      <ChevronRight size={13} color={t.text3}/>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Bouton réinitialiser */}
        {data&&data.documents.length>0&&(
          <button onClick={()=>void runSeed()} disabled={seeding} style={{padding:'11px',borderRadius:12,background:'transparent',border:`1.5px solid ${t.border}`,color:t.text3,fontSize:11,fontWeight:600,cursor:'pointer',textAlign:'center'}}>
            {seeding?'⏳ Mise à jour…':'🔄 Compléter le dossier pilote'}
          </button>
        )}
      </div>
    </AppShell>
  )
}
