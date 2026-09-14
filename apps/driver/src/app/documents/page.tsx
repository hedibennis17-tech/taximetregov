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
  // 🚗 Véhicule — en premier
  {code:'VEHICLE_REGISTRATION',        label:'Immatriculation du véhicule',           cat:'Véhicule',            required:true},
  {code:'VEHICLE_INSURANCE',           label:'Assurance automobile',                  cat:'Véhicule',            required:true},
  {code:'TAXIMETER_CERTIFICATE',       label:'Certificat de conformité du taximètre', cat:'Taximètre',           required:false},
  // 🪪 Identité / Chauffeur
  {code:'DRIVER_LICENSE',              label:'Permis de conduire',                    cat:'Identité',            required:true},
  {code:'AUTHORIZED_DRIVER_PERMIT',    label:'Permis de chauffeur autorisé',          cat:'Transport rémunéré',  required:true},
  {code:'CRIMINAL_RECORD_CHECK',       label:'Vérification des antécédents',          cat:'Transport rémunéré',  required:true},
  {code:'TRAINING_CERTIFICATE',        label:'Attestation de formation',              cat:'Formation',           required:true},
  // 🧾 Fiscalité
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
// ─── Interface fichier local ─────────────────────────────────
interface DocFile { file: File|null; preview: string; url: string; uploading: boolean; uploaded: boolean }
const emptyDocFile = (): DocFile => ({ file: null, preview: '', url: '', uploading: false, uploaded: false })

// ─── Composant upload fichier (style DepXpreS) ───────────────
function FileUploadZone({
  label, description, docFile, onChange, onClear, inputRef, dark, t, accept = 'image/*,application/pdf'
}: {
  label: string; description: string
  docFile: DocFile
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  inputRef: React.RefObject<HTMLInputElement|null>
  dark: boolean
  t: ReturnType<typeof getThemeTokens>
  accept?: string
}) {
  return (
    <div>
      <div style={{ fontSize:11, color:t.text3, marginBottom:6, fontWeight:600 }}>{label}</div>
      <input ref={inputRef} type="file" accept={accept} capture="environment" onChange={onChange} style={{ display:'none' }}/>
      {docFile.preview ? (
        <div style={{ position:'relative', borderRadius:14, overflow:'hidden', border:`1.5px solid ${t.border}` }}>
          {docFile.file?.type === 'application/pdf' ? (
            <div style={{ padding:'20px', background:dark?'rgba(0,61,165,0.12)':'rgba(0,61,165,0.06)', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:6 }}>📄</div>
              <div style={{ fontSize:12, fontWeight:700, color:t.text }}>{docFile.file.name}</div>
              <div style={{ fontSize:10, color:t.text3, marginTop:3 }}>{(docFile.file.size/1024).toFixed(0)} Ko</div>
            </div>
          ) : (
            <img src={docFile.preview} alt="" style={{ width:'100%', height:120, objectFit:'cover', display:'block' }}/>
          )}
          {/* Overlay upload en cours */}
          {docFile.uploading && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.3)', borderTop:'3px solid white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <span style={{ fontSize:11, color:'white', fontWeight:700 }}>Envoi en cours…</span>
            </div>
          )}
          {/* Badge succès */}
          {docFile.uploaded && !docFile.uploading && (
            <div style={{ position:'absolute', bottom:8, right:8, background:'#059669', borderRadius:'50%', padding:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
          {/* Bouton supprimer */}
          <button onClick={onClear} style={{ position:'absolute', top:8, right:8, width:26, height:26, borderRadius:'50%', background:'rgba(0,0,0,0.60)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:8 }}>
          {/* Prendre en photo */}
          <button onClick={() => { if (inputRef.current) { inputRef.current.accept = 'image/*'; inputRef.current.capture = 'environment'; inputRef.current.click() } }}
            style={{ flex:1, padding:'14px 10px', borderRadius:14, border:`2px dashed ${dark?'rgba(255,255,255,0.15)':'rgba(0,61,165,0.25)'}`, background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <Camera size={22} color={t.accent}/>
            <span style={{ fontSize:10, fontWeight:700, color:t.text3 }}>Caméra</span>
          </button>
          {/* Choisir fichier */}
          <button onClick={() => { if (inputRef.current) { inputRef.current.accept = 'image/*,application/pdf'; inputRef.current.removeAttribute('capture'); inputRef.current.click() } }}
            style={{ flex:2, padding:'14px 10px', borderRadius:14, border:`2px dashed ${dark?'rgba(255,255,255,0.15)':'rgba(0,61,165,0.25)'}`, background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <Upload size={22} color={t.accent}/>
            <span style={{ fontSize:11, fontWeight:700, color:t.text }}>Choisir un fichier</span>
            <span style={{ fontSize:9, color:t.text3 }}>JPG · PNG · PDF · Max 10 Mo</span>
          </button>
        </div>
      )}
      <div style={{ fontSize:9, color:t.text3, marginTop:5, textAlign:'center' }}>{description}</div>
    </div>
  )
}

// ─── Modal upload complet ─────────────────────────────────────
function UploadModal({ t, dark, docTypes, onClose, token }: {
  t: ReturnType<typeof getThemeTokens>; dark: boolean
  docTypes: DocType[]; onClose: () => void; token: string
}) {
  const [step, setStep]           = useState<'type'|'form'>('type')
  const [selCode, setSelCode]     = useState('')
  const [issuedAt, setIssuedAt]   = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [last4, setLast4]         = useState('')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string|null>(null)
  const [success, setSuccess]     = useState(false)

  // Fichiers uploadés — un par document (recto, verso optionnel)
  const [mainFile, setMainFile]   = useState<DocFile>(emptyDocFile())
  const [backFile, setBackFile]   = useState<DocFile>(emptyDocFile())

  const mainRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  const selType = docTypes.find(t => t.code === selCode)
  const requiresBack = ['DRIVER_LICENSE','IDENTITY_DOCUMENT'].includes(selCode) // recto/verso

  async function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: DocFile) => void,
    ref: React.RefObject<HTMLInputElement|null>
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = file.type !== 'application/pdf' ? URL.createObjectURL(file) : 'pdf'
    setter({ file, preview, url: '', uploading: true, uploaded: false })

    // Upload immédiat vers l'API
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/driver/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json() as { ok: boolean; url?: string; error?: string; isMock?: boolean }
      if (data.ok && data.url) {
        setter({ file, preview: file.type !== 'application/pdf' ? URL.createObjectURL(file) : 'pdf', url: data.url, uploading: false, uploaded: true })
      } else {
        setter({ file, preview, url: '', uploading: false, uploaded: false })
        setError(data.error ?? 'Erreur upload')
      }
    } catch {
      setter({ file, preview, url: '', uploading: false, uploaded: false })
      setError("Erreur réseau lors de l'upload")
    }
    // Reset input pour permettre re-sélection du même fichier
    if (ref.current) ref.current.value = ''
  }

  async function handleSubmit() {
    if (!selCode) { setError('Choisissez un type de document'); return }
    setLoading(true); setError(null)
    try {
      const payload: Record<string, unknown> = {
        documentTypeCode: selCode,
        issuedAt:         issuedAt   || undefined,
        expiresAt:        expiresAt  || undefined,
        docNumberLast4:   last4      || undefined,
        notes:            notes      || undefined,
        storageUrl:       mainFile.url || undefined,
        storageUrlBack:   backFile.url || undefined,
        fileName:         mainFile.file?.name || undefined,
      }
      const res = await fetch('/api/driver/documents/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error)
      setSuccess(true)
      setTimeout(() => { onClose() }, 2200)
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const cardS = { borderRadius:16, background:dark?'rgba(255,255,255,0.04)':'rgba(0,61,165,0.04)', border:`1.5px solid ${t.border}`, padding:'16px' }
  const inp = (placeholder: string, value: string, onChange: (v: string) => void, type = 'text') => (
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', padding:'11px 13px', borderRadius:10, border:`1.5px solid ${t.border}`, fontSize:13, color:t.text, background:dark?'rgba(5,14,28,0.8)':'#FFFFFF', outline:'none', boxSizing:'border-box' as const }}/>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'flex-end', background:'rgba(0,0,0,0.72)' }} onClick={onClose}>
      <div style={{ width:'100%', maxHeight:'94vh', overflowY:'auto', background:dark?'#0F1F38':'#FFFFFF', borderRadius:'20px 20px 0 0', padding:'0 0 48px' }} onClick={e => e.stopPropagation()}>

        {/* Handle + Header */}
        <div style={{ padding:'16px 16px 0', position:'sticky', top:0, background:dark?'#0F1F38':'#FFFFFF', zIndex:10, borderBottom:`1px solid ${t.border}`, paddingBottom:12 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:t.border, margin:'0 auto 14px' }}/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:t.text }}>
                {step === 'type' ? '📂 Choisir le type' : `📄 ${selType?.label_fr ?? selType?.label ?? selCode}`}
              </div>
              <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>
                {step === 'type' ? 'Sélectionnez la catégorie' : 'Remplissez et joignez le document'}
              </div>
            </div>
            <button onClick={onClose} style={{ padding:8, borderRadius:10, background:t.card2, border:`1px solid ${t.border}`, cursor:'pointer' }}>
              <X size={16} color={t.text3}/>
            </button>
          </div>
        </div>

        {/* Success state */}
        {success && (
          <div style={{ padding:'48px 24px', textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(5,150,105,0.15)', border:'2px solid rgba(5,150,105,0.40)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:t.text, marginBottom:6 }}>Document soumis !</div>
            <div style={{ fontSize:13, color:t.text3 }}>En attente de vérification administrative</div>
          </div>
        )}

        {!success && (
          <div style={{ padding:'16px' }}>

            {/* ── ÉTAPE 1 : TYPE ── */}
            {step === 'type' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {REQUIRED_DOCS.map(rd => {
                  const dt = docTypes.find(t => t.code === rd.code)
                  const sel = selCode === rd.code
                  return (
                    <button key={rd.code} onClick={() => { setSelCode(rd.code); setStep('form') }}
                      style={{
                        display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:16, cursor:'pointer', textAlign:'left',
                        background: sel ? (dark?'rgba(0,61,165,0.25)':'rgba(0,61,165,0.08)') : (dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)'),
                        border: `1.5px solid ${sel ? t.accent : t.border}`,
                        boxShadow: sel ? `0 0 0 1px ${t.accent}40` : 'none',
                      }}>
                      <span style={{ fontSize:24, width:32, textAlign:'center', flexShrink:0 }}>{CAT_ICON[rd.cat] ?? '📄'}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{rd.label}</div>
                        <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>
                          {rd.cat}
                          <span style={{ marginLeft:6, padding:'1px 6px', borderRadius:20, fontSize:9, fontWeight:700,
                            background:rd.required?(dark?'rgba(0,61,165,0.20)':'rgba(0,61,165,0.10)'):(dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'),
                            color:rd.required?t.accent:t.text3 }}>
                            {rd.required ? 'Requis' : 'Optionnel'}
                          </span>
                          {!dt && <span style={{ marginLeft:6, color:'#B45309', fontSize:9 }}>⚠ type indispo</span>}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text3} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── ÉTAPE 2 : FORMULAIRE + UPLOAD ── */}
            {step === 'form' && selType && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Retour */}
                <button onClick={() => { setStep('type'); setMainFile(emptyDocFile()); setBackFile(emptyDocFile()) }}
                  style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6, fontSize:12, color:t.text3, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Retour
                </button>

                {/* Infos du document */}
                <div style={cardS}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase' as const, color:t.text3, marginBottom:12 }}>📋 Informations</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:t.text3, marginBottom:5, fontWeight:600 }}>Date d'émission</div>
                      {inp('AAAA-MM-JJ', issuedAt, setIssuedAt, 'date')}
                    </div>
                    {selType.has_expiry_date && (
                      <div>
                        <div style={{ fontSize:11, color:t.text3, marginBottom:5, fontWeight:600 }}>Date d'expiration *</div>
                        {inp('AAAA-MM-JJ', expiresAt, setExpiresAt, 'date')}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize:11, color:t.text3, marginBottom:5, fontWeight:600 }}>
                        {selCode === 'DRIVER_LICENSE' ? 'N° permis (4 derniers chiffres)' :
                         selCode === 'VEHICLE_INSURANCE' ? 'N° police (4 derniers chiffres)' :
                         'Numéro de référence (optionnel)'}
                      </div>
                      {inp('ex: 4417', last4, setLast4)}
                    </div>
                  </div>
                </div>

                {/* Upload recto */}
                <div style={cardS}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase' as const, color:t.text3, marginBottom:12 }}>
                    📸 {requiresBack ? 'Photo — Recto' : 'Photo du document'}
                  </div>
                  <FileUploadZone
                    label={requiresBack ? 'Face avant' : 'Document ou photo'}
                    description={requiresBack ? 'Photo claire du recto, tous les chiffres lisibles' : 'Image ou PDF · Recto · Bien éclairé et net'}
                    docFile={mainFile}
                    onChange={e => void handleFileSelect(e, setMainFile, mainRef)}
                    onClear={() => setMainFile(emptyDocFile())}
                    inputRef={mainRef}
                    dark={dark} t={t}
                  />
                </div>

                {/* Upload verso (permis, carte identité) */}
                {requiresBack && (
                  <div style={cardS}>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase' as const, color:t.text3, marginBottom:12 }}>📸 Photo — Verso (optionnel)</div>
                    <FileUploadZone
                      label="Face arrière"
                      description="Photo du verso si requis"
                      docFile={backFile}
                      onChange={e => void handleFileSelect(e, setBackFile, backRef)}
                      onClear={() => setBackFile(emptyDocFile())}
                      inputRef={backRef}
                      dark={dark} t={t}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <div style={{ fontSize:11, color:t.text3, marginBottom:5, fontWeight:600 }}>Note (optionnelle)</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Renouvellement, numéro de dossier…" rows={2}
                    style={{ width:'100%', padding:'11px 13px', borderRadius:10, border:`1.5px solid ${t.border}`, fontSize:12, color:t.text, background:dark?'rgba(5,14,28,0.8)':'#FFFFFF', outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
                </div>

                {/* Alerte pilote */}
                <div style={{ padding:'10px 13px', borderRadius:10, background:'rgba(180,83,9,0.08)', border:'1px solid rgba(180,83,9,0.25)' }}>
                  <div style={{ fontSize:10, color:t.amber, lineHeight:1.5 }}>⚠ Mode pilote · Données synthétiques de démonstration</div>
                </div>

                {error && <div style={{ fontSize:11, color:t.red, padding:'8px 12px', borderRadius:8, background:'rgba(220,38,38,0.08)', border:`1px solid rgba(220,38,38,0.25)` }}>{error}</div>}

                {/* Bouton soumettre */}
                <button onClick={() => void handleSubmit()} disabled={loading || mainFile.uploading}
                  style={{ padding:'15px', borderRadius:14, border:'none', cursor:loading||mainFile.uploading?'not-allowed':'pointer', fontWeight:800, fontSize:14,
                    background:loading||mainFile.uploading?t.border:'#003DA5', color:loading||mainFile.uploading?t.text3:'white',
                    boxShadow:loading||mainFile.uploading?'none':'0 4px 16px rgba(0,61,165,0.35)',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  {loading ? (
                    <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Soumission…</>
                  ) : mainFile.uploading ? (
                    <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Upload en cours…</>
                  ) : (
                    <>🏛️ Soumettre pour vérification</>
                  )}
                </button>
              </div>
            )}

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
  const [authToken,setAuthToken]     = useState('')
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
      setAuthToken(token)
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
      {showUpload&&<UploadModal t={t} dark={dark} docTypes={docTypes} token={authToken} onClose={()=>{ setShowUpload(false); void loadDocs() }}/>}

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
