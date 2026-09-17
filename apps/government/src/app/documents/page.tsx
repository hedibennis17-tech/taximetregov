'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, FileText, ChevronRight, X } from 'lucide-react'

interface Doc {
  id:string; public_document_id:string; label:string; status:string
  issued_at:string|null; expires_at:string|null; doc_number_last4:string|null
  notes:string|null; created_at:string; daysPending:number; daysUntil:number|null
  alertLevel:'ok'|'warning'|'expired'
  verif:{verification_status:string;review_notes:string|null;rejection_note:string|null}|null
  driver:{id:string;first_name:string;last_name:string;driver_number:string}|null
  document_types:{code:string;label:string;label_fr:string|null}|null
  isPilot:boolean
}
interface Stats { toReview:number; approved:number; rejected:number; expiringSOon:number; expired:number }

const FILTERS = [
  {key:'',              label:'Tous',              color:'#003DA5'},
  {key:'UPLOADED',      label:'À vérifier',        color:'#7C3AED'},
  {key:'UNDER_REVIEW',  label:'En révision',       color:'#003DA5'},
  {key:'APPROVED',      label:'Approuvés',         color:'#059669'},
  {key:'REJECTED',      label:'Refusés',           color:'#DC2626'},
]

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  APPROVED:      {label:'Valide',          color:'#059669',bg:'rgba(5,150,105,0.12)'},
  UPLOADED:      {label:'À vérifier',      color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  PENDING_REVIEW:{label:'En révision',     color:'#003DA5',bg:'rgba(0,61,165,0.12)'},
  UNDER_REVIEW:  {label:'En révision',     color:'#003DA5',bg:'rgba(0,61,165,0.12)'},
  REJECTED:      {label:'Refusé',          color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
  EXPIRED:       {label:'Expiré',          color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
}

const REJECTION_REASONS = [
  'Document illisible','Document expiré','Mauvais type de document',
  'Informations manquantes','Format invalide','Non vérifiable',
  'Informations incohérentes','Document incomplet',
]

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d))
}

// ── Modal vérification ────────────────────────────────────────
function ReviewModal({doc,token,onClose,onDone}:{doc:Doc;token:string;onClose:()=>void;onDone:()=>void}) {
  const [decision,setDecision] = useState<'APPROVE'|'REJECT'|'CORRECTION_REQUIRED'|null>(null)
  const [note,setNote]         = useState('')
  const [reason,setReason]     = useState('')
  const [loading,setLoading]   = useState(false)
  const [error,setError]       = useState<string|null>(null)

  async function submit() {
    if ((decision==='REJECT'||decision==='CORRECTION_REQUIRED')&&!note) {
      setError('Motif obligatoire pour refus ou correction'); return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/documents/review', {
        method:'POST',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
        body: JSON.stringify({ documentId:doc.id, decision, note, rejectionReason:reason||undefined }),
      })
      const json = await res.json() as {success:boolean;error?:string}
      if (!json.success) throw new Error(json.error)
      onDone()
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        {/* Header doc */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-base font-bold text-white">{doc.label}</div>
            <div className="text-[10px] text-slate-400 mt-1">{doc.public_document_id} · {doc.driver?.first_name} {doc.driver?.last_name}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer"><X size={14} className="text-slate-400"/></button>
        </div>

        {/* Infos doc */}
        <Card className="p-3 mb-4 space-y-2">
          {[
            {label:'Chauffeur',    val:`${doc.driver?.first_name} ${doc.driver?.last_name} · ${doc.driver?.driver_number}`},
            {label:'Type',         val:doc.document_types?.label_fr??doc.document_types?.label??'—'},
            {label:'Émis le',      val:fmtDate(doc.issued_at)},
            {label:'Expire le',    val:fmtDate(doc.expires_at)},
            {label:'Soumis il y a',val:`${doc.daysPending} jour(s)`},
            {label:'Numéro',       val:doc.doc_number_last4?`••••${doc.doc_number_last4}`:'—'},
          ].map(r=>(
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white font-semibold">{r.val}</span>
            </div>
          ))}
        </Card>

        {/* Notes précédentes */}
        {doc.verif?.review_notes&&(
          <Card className="p-3 mb-4 border-l-2 border-l-blue-500">
            <div className="text-[10px] font-bold text-slate-400 mb-1">NOTES PRÉCÉDENTES</div>
            <div className="text-xs text-slate-300">{doc.verif.review_notes}</div>
          </Card>
        )}

        {doc.isPilot&&(
          <div className="mb-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/25">
            <div className="text-[10px] text-amber-400">⚠ Données synthétiques — Mode pilote TAXIMETER.GOV</div>
          </div>
        )}

        {/* Décision */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Décision</div>
        <div className="flex flex-col gap-2 mb-4">
          {[
            {val:'APPROVE'             as const, label:'✅ Approuver', color:'#059669', bg:'rgba(5,150,105,0.12)',  bdr:'rgba(5,150,105,0.30)'},
            {val:'REJECT'              as const, label:'❌ Rejeter',   color:'#DC2626', bg:'rgba(220,38,38,0.12)',  bdr:'rgba(220,38,38,0.30)'},
            {val:'CORRECTION_REQUIRED' as const, label:'🟠 Demander correction', color:'#B45309', bg:'rgba(180,83,9,0.10)', bdr:'rgba(180,83,9,0.30)'},
          ].map(d=>(
            <button key={d.val} onClick={()=>setDecision(d.val)} style={{
              padding:'12px 16px',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',textAlign:'left',
              background:decision===d.val?d.bg:'transparent',
              border:`1.5px solid ${decision===d.val?d.bdr:'rgba(255,255,255,0.08)'}`,
              color:decision===d.val?d.color:'#94A3B8',
            }}>{d.label}</button>
          ))}
        </div>

        {/* Motif */}
        {decision&&decision!=='APPROVE'&&(
          <>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Motif (obligatoire)</div>
            <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full mb-3 p-2 rounded-lg bg-slate-800 border border-slate-600 text-xs text-white">
              <option value="">Sélectionner un motif…</option>
              {REJECTION_REASONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Précision (obligatoire)…" rows={3}
              className="w-full mb-4 p-3 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white resize-none outline-none"/>
          </>
        )}
        {decision==='APPROVE'&&(
          <>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note (optionnelle)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Commentaire interne…" rows={2}
              className="w-full mb-4 p-3 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white resize-none outline-none"/>
          </>
        )}

        {error&&<div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">{error}</div>}

        <button onClick={()=>void submit()} disabled={!decision||loading} className={`w-full p-3 rounded-xl text-sm font-bold transition-all ${!decision||loading?'bg-slate-700 text-slate-500 cursor-not-allowed':'bg-qc-blue hover:bg-blue-700 text-white cursor-pointer'}`}>
          {loading?'Traitement…':'Confirmer la décision'}
        </button>
      </div>
    </div>
  )
}

// ── Page Admin Documents ──────────────────────────────────────
export default function AdminDocumentsPage() {
  const [docs,setDocs]         = useState<Doc[]>([])
  const [stats,setStats]       = useState<Stats|null>(null)
  const [filter,setFilter]     = useState('')
  const [loading,setLoading]   = useState(true)
  const [error,setError]       = useState<string|null>(null)
  const [selected,setSelected] = useState<Doc|null>(null)
  const [token,setToken]       = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // Récupérer le token gov depuis les cookies (l'auth gov utilise ses propres sessions)
      const qs = filter?`?status=${filter}`:''
      const res = await fetch(`/api/admin/documents${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const json = await res.json() as {success:boolean;data:{documents:Doc[];stats:Stats;total:number};error?:string}
      if (!json.success) throw new Error(json.error)
      setDocs(json.data.documents)
      setStats(json.data.stats)
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [filter, token])

  // Récupérer token depuis le storage (gov app)
  useEffect(()=>{
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem('sb-access-token') ?? sessionStorage.getItem('sb-access-token') ?? '')
      : ''
    setToken(stored)
  }, [])

  useEffect(()=>{ void load() }, [load])

  const toReview = docs.filter(d=>['UPLOADED','PENDING_REVIEW','UNDER_REVIEW'].includes(d.status))

  return (
    <AppShell>
      {selected&&token&&(
        <ReviewModal doc={selected} token={token} onClose={()=>setSelected(null)} onDone={()=>{ setSelected(null); void load() }}/>
      )}

      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">File de vérification</h1>
          <p className="text-xs text-slate-400 mt-1">Dossiers documentaires · TAXIMETER.GOV Admin</p>
        </div>
        <button onClick={()=>void load()} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:border-qc-blue">
          <RefreshCw size={13}/> Actualiser
        </button>
      </div>

      {/* Stats */}
      {stats&&(
        <div className="px-4 mb-4 grid grid-cols-4 gap-2">
          {[
            {label:'À vérifier',   val:stats.toReview,    color:'text-purple-400', bg:'bg-purple-500/10'},
            {label:'Approuvés',    val:stats.approved,    color:'text-green-400',  bg:'bg-green-500/10' },
            {label:'Refusés',      val:stats.rejected,    color:'text-red-400',    bg:'bg-red-500/10'   },
            {label:'Expirent',     val:stats.expiringSOon,color:'text-amber-400',  bg:'bg-amber-500/10' },
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerte urgence */}
      {toReview.length>0&&(
        <div className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 border-l-4 border-l-purple-500">
          <Clock size={16} className="text-purple-400 shrink-0"/>
          <div>
            <div className="text-xs font-bold text-purple-400">{toReview.length} document(s) en attente de vérification</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Cliquez pour ouvrir et traiter</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{
            padding:'7px 14px',borderRadius:20,fontSize:11,fontWeight:700,
            border:'none',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',
            background:filter===f.key?f.color:'rgba(255,255,255,0.06)',
            color:filter===f.key?'#FFFFFF':'#94A3B8',
            boxShadow:filter===f.key?`0 4px 12px ${f.color}40`:'none',
          }}>{f.label} {f.key&&stats?`(${
            f.key==='UPLOADED'?stats.toReview:
            f.key==='APPROVED'?stats.approved:
            f.key==='REJECTED'?stats.rejected:0
          })`:''}</button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 pb-8 space-y-3">
        {loading&&<div className="py-12 text-center"><RefreshCw size={20} className="mx-auto animate-spin text-qc-blue"/></div>}
        {error&&<Card className="p-4 text-center text-sm text-red-400">{error}</Card>}
        {!loading&&docs.length===0&&(
          <Card className="py-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-slate-500"/>
            <p className="text-sm text-slate-400">Aucun document {filter?'avec ce filtre':'trouvé'}</p>
          </Card>
        )}

        {docs.map(doc=>{
          const sc = STATUS_CONF[doc.status]??STATUS_CONF['UPLOADED']!
          const needsAction = ['UPLOADED','PENDING_REVIEW','UNDER_REVIEW'].includes(doc.status)
          return (
            <div key={doc.id} onClick={()=>setSelected(doc)} className={`rounded-xl border border-slate-700 bg-slate-800/50 p-4 cursor-pointer hover:border-qc-blue transition-colors ${needsAction?'border-l-4 border-l-purple-500':doc.status==='APPROVED'?'border-l-4 border-l-green-500':doc.status==='REJECTED'?'border-l-4 border-l-red-500':''}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-lg shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">{doc.label}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:sc.bg,color:sc.color}}>{sc.label}</span>
                    {doc.isPilot&&<span className="text-[8px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">PILOTE</span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    👤 {doc.driver?.first_name} {doc.driver?.last_name} · {doc.driver?.driver_number}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                    <span>📅 Soumis il y a {doc.daysPending}j</span>
                    {doc.expires_at&&<span className={doc.alertLevel==='warning'?'text-amber-400':''}>
                      Exp. {fmtDate(doc.expires_at)}{doc.daysUntil!==null&&doc.daysUntil<=30&&` (${doc.daysUntil}j)`}
                    </span>}
                  </div>
                  {doc.verif?.rejection_note&&<div className="mt-1 text-[10px] text-red-400">Motif: {doc.verif.rejection_note}</div>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {needsAction&&<div className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg"><Clock size={10}/> Vérifier</div>}
                  {doc.status==='APPROVED'&&<CheckCircle size={16} className="text-green-400"/>}
                  {doc.status==='REJECTED'&&<XCircle size={16} className="text-red-400"/>}
                  {doc.alertLevel==='warning'&&<AlertTriangle size={14} className="text-amber-400"/>}
                  <ChevronRight size={14} className="text-slate-500"/>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
