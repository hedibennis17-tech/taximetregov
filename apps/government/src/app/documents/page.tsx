'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { CheckCircle, Clock, XCircle, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE'

const DEMO_DOCUMENTS = [
  // Jean Tremblay — DRV-QC-0001 (5 docs)
  { id:'DOC-001', driver:'Jean Tremblay', driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'APPROVED',      issued:'2020-06-15', expires:'2029-06-15', version:1, submittedAt:'2026-01-18', verifiedBy:'Admin GOV-01', verifiedAt:'2026-01-20', note:'Classe 5 — conforme' },
  { id:'DOC-002', driver:'Jean Tremblay', driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'VEHICLE_REGISTRATION', label:'Immatriculation véhicule',status:'APPROVED',      issued:'2022-03-15', expires:'2027-03-15', version:1, submittedAt:'2026-01-18', verifiedBy:'Admin GOV-01', verifiedAt:'2026-01-20', note:null },
  { id:'DOC-003', driver:'Jean Tremblay', driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'INSURANCE',            label:'Assurance automobile',   status:'APPROVED',      issued:'2026-03-15', expires:'2027-03-15', version:2, submittedAt:'2026-03-16', verifiedBy:'Admin GOV-02', verifiedAt:'2026-03-18', note:'Renouvellement mars 2026 — v2' },
  { id:'DOC-004', driver:'Jean Tremblay', driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'VEHICLE_INSPECTION',   label:'Inspection mécanique',   status:'APPROVED',      issued:'2025-09-01', expires:'2027-09-01', version:1, submittedAt:'2025-09-02', verifiedBy:'Admin GOV-01', verifiedAt:'2025-09-05', note:null },
  { id:'DOC-005', driver:'Jean Tremblay', driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'TAXI_AUTHORIZATION',   label:'Autorisation taxi',      status:'APPROVED',      issued:'2024-01-20', expires:'2027-01-20', version:1, submittedAt:'2024-01-21', verifiedBy:'Admin GOV-01', verifiedAt:'2024-01-22', note:null },
  // Marie Gagnon — DRV-QC-0002
  { id:'DOC-006', driver:'Marie Gagnon',  driverNum:'DRV-QC-0002', driverId:'drv-demo-002', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'APPROVED',      issued:'2019-08-10', expires:'2028-08-10', version:1, submittedAt:'2026-02-08', verifiedBy:'Admin GOV-01', verifiedAt:'2026-02-10', note:null },
  { id:'DOC-007', driver:'Marie Gagnon',  driverNum:'DRV-QC-0002', driverId:'drv-demo-002', type:'INSURANCE',            label:'Assurance automobile',   status:'APPROVED',      issued:'2026-01-15', expires:'2027-01-15', version:1, submittedAt:'2026-01-16', verifiedBy:'Admin GOV-02', verifiedAt:'2026-01-18', note:null },
  { id:'DOC-008', driver:'Marie Gagnon',  driverNum:'DRV-QC-0002', driverId:'drv-demo-002', type:'VTC_AUTHORIZATION',    label:'Autorisation VTC',       status:'APPROVED',      issued:'2024-03-01', expires:'2027-03-01', version:1, submittedAt:'2024-03-02', verifiedBy:'Admin GOV-01', verifiedAt:'2024-03-05', note:null },
  // Karim Hassan — DRV-QC-0003
  { id:'DOC-009', driver:'Karim Hassan',  driverNum:'DRV-QC-0003', driverId:'drv-demo-003', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'APPROVED',      issued:'2021-04-20', expires:'2030-04-20', version:1, submittedAt:'2026-03-03', verifiedBy:'Admin GOV-01', verifiedAt:'2026-03-06', note:null },
  { id:'DOC-010', driver:'Karim Hassan',  driverNum:'DRV-QC-0003', driverId:'drv-demo-003', type:'INSURANCE',            label:'Assurance automobile',   status:'APPROVED',      issued:'2026-02-01', expires:'2027-02-01', version:1, submittedAt:'2026-02-02', verifiedBy:'Admin GOV-02', verifiedAt:'2026-02-04', note:null },
  // Sophie Martin — DRV-QC-0004 (en attente)
  { id:'DOC-011', driver:'Sophie Martin', driverNum:'DRV-QC-0004', driverId:'drv-demo-004', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'PENDING_REVIEW',issued:'2018-11-05', expires:'2027-11-05', version:1, submittedAt:'2026-08-22', verifiedBy:null,            verifiedAt:null,          note:'En attente de vérification' },
  { id:'DOC-012', driver:'Sophie Martin', driverNum:'DRV-QC-0004', driverId:'drv-demo-004', type:'INSURANCE',            label:'Assurance automobile',   status:'PENDING_REVIEW',issued:'2026-08-01', expires:'2027-08-01', version:1, submittedAt:'2026-08-22', verifiedBy:null,            verifiedAt:null,          note:null },
  // Marc Leblanc — DRV-QC-0007 (suspendu)
  { id:'DOC-013', driver:'Marc Leblanc',  driverNum:'DRV-QC-0007', driverId:'drv-demo-007', type:'INSURANCE',            label:'Assurance automobile',   status:'EXPIRED',       issued:'2025-03-01', expires:'2026-03-01', version:1, submittedAt:'2025-03-02', verifiedBy:'Admin GOV-01', verifiedAt:'2025-03-05', note:'EXPIRÉE — suspension du compte' },
  // Nadia Patel — DRV-QC-0006 (expiration prochaine)
  { id:'DOC-014', driver:'Nadia Patel',   driverNum:'DRV-QC-0006', driverId:'drv-demo-006', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'APPROVED',      issued:'2019-10-15', expires:'2026-10-15', version:1, submittedAt:'2025-12-01', verifiedBy:'Admin GOV-01', verifiedAt:'2025-12-03', note:'⚠ Expire dans 28 jours' },
  { id:'DOC-015', driver:'Nadia Patel',   driverNum:'DRV-QC-0006', driverId:'drv-demo-006', type:'INSURANCE',            label:'Assurance automobile',   status:'APPROVED',      issued:'2026-04-01', expires:'2027-04-01', version:1, submittedAt:'2026-04-02', verifiedBy:'Admin GOV-02', verifiedAt:'2026-04-04', note:null },
  // Amira Tremblay — DRV-QC-0008 (en révision)
  { id:'DOC-016', driver:'Amira Tremblay',driverNum:'DRV-QC-0008', driverId:'drv-demo-008', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'UNDER_REVIEW',  issued:'2022-07-10', expires:'2031-07-10', version:1, submittedAt:'2026-05-07', verifiedBy:null,            verifiedAt:null,          note:'Révision administrative en cours' },
]

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;bdr:string}> = {
  APPROVED:      {label:'Approuvé',    color:'#059669',bg:'rgba(5,150,105,0.12)', bdr:'rgba(5,150,105,0.30)'},
  PENDING_REVIEW:{label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.30)'},
  UNDER_REVIEW:  {label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.30)'},
  UPLOADED:      {label:'Soumis',      color:'#7C3AED', bg:'rgba(124,58,237,0.12)',bdr:'rgba(124,58,237,0.30)'},
  REJECTED:      {label:'Rejeté',      color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)'},
  EXPIRED:       {label:'Expiré',      color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)'},
}
const TYPE_ICONS: Record<string,string> = {
  DRIVER_LICENSE:'🪪', VEHICLE_REGISTRATION:'🚗', INSURANCE:'🛡️',
  VEHICLE_INSPECTION:'🔧', TAXI_AUTHORIZATION:'🚕', VTC_AUTHORIZATION:'🚙',
  DELIVERY_PERMIT:'📦', IDENTITY_VERIFICATION:'👤', OTHER:'📄',
}
const fmtDate = (s:string|null) => s ? new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s)) : '—'

const FILTER_STATUS = ['Tous','APPROVED','PENDING_REVIEW','UNDER_REVIEW','EXPIRED']
const FILTER_TYPES  = ['Tous types','DRIVER_LICENSE','VEHICLE_REGISTRATION','INSURANCE','VEHICLE_INSPECTION','TAXI_AUTHORIZATION','VTC_AUTHORIZATION']

export default function DocumentsPage() {
  const [filterStatus, setFilterStatus] = useState('Tous')
  const [filterType,   setFilterType]   = useState('Tous types')
  const [search,       setSearch]       = useState('')
  const [selectedDoc,  setSelectedDoc]  = useState<typeof DEMO_DOCUMENTS[0]|null>(null)

  const filtered = DEMO_DOCUMENTS.filter(d => {
    if (filterStatus !== 'Tous' && d.status !== filterStatus) return false
    if (filterType !== 'Tous types' && d.type !== filterType) return false
    if (search && !`${d.driver} ${d.driverNum} ${d.label}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total:    DEMO_DOCUMENTS.length,
    approved: DEMO_DOCUMENTS.filter(d=>d.status==='APPROVED').length,
    pending:  DEMO_DOCUMENTS.filter(d=>['PENDING_REVIEW','UNDER_REVIEW','UPLOADED'].includes(d.status)).length,
    alerts:   DEMO_DOCUMENTS.filter(d=>['REJECTED','EXPIRED'].includes(d.status)).length,
    expiring: DEMO_DOCUMENTS.filter(d=>d.expires && Math.ceil((new Date(d.expires).getTime()-Date.now())/86400000)<60 && d.status==='APPROVED').length,
  }

  return (
    <AppShell>
      {/* Modal détail document */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={()=>setSelectedDoc(null)}>
          <div className="w-full max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 rounded bg-slate-300 dark:bg-slate-600 mx-auto mb-4"/>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-base font-bold text-slate-800 dark:text-white">{selectedDoc.label}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedDoc.id} · v{selectedDoc.version}</div>
              </div>
              <button onClick={()=>setSelectedDoc(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer">
                <X size={14} className="text-slate-500"/>
              </button>
            </div>
            <div className="mb-3 p-2 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20">{PILOT}</div>
            {(() => {
              const sc = STATUS_CONF[selectedDoc.status]??STATUS_CONF['UPLOADED']!
              return <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4" style={{background:sc.bg}}>
                <span className="text-xs font-bold" style={{color:sc.color}}>{sc.label}</span>
              </div>
            })()}
            <div className="space-y-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4">
              {[
                {l:'Chauffeur',       v:selectedDoc.driver},
                {l:'No. chauffeur',   v:selectedDoc.driverNum},
                {l:'Type document',   v:selectedDoc.type},
                {l:'Date d\'émission',v:fmtDate(selectedDoc.issued)},
                {l:'Date d\'expiration',v:fmtDate(selectedDoc.expires)},
                {l:'Soumis le',       v:fmtDate(selectedDoc.submittedAt)},
                {l:'Vérifié par',     v:selectedDoc.verifiedBy??'En attente'},
                {l:'Vérifié le',      v:fmtDate(selectedDoc.verifiedAt)},
                {l:'Version',         v:`v${selectedDoc.version}`},
                {l:'Note',            v:selectedDoc.note??'—'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{r.v}</span>
                </div>
              ))}
            </div>
            {/* Actions admin */}
            {['PENDING_REVIEW','UNDER_REVIEW','UPLOADED'].includes(selectedDoc.status) && (
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Actions administratives (DEMO)</div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 cursor-pointer">✅ Approuver</button>
                  <button className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer">❌ Refuser</button>
                  <button className="flex-1 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 cursor-pointer">📝 Correction</button>
                </div>
                <div className="p-2 text-[9px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-lg">Actions en mode démo — aucune modification réelle</div>
              </div>
            )}
            <Link href={`/drivers/${selectedDoc.driverId}`} className="block mt-3 text-center text-[10px] text-qc-blue hover:underline">→ Voir dossier complet du chauffeur</Link>
          </div>
        </div>
      )}

      <PageHeader title="Centre de documents" subtitle="Dossiers documentaires · Approbation · Vérification · TAXIMETER.GOV"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total docs',     v:stats.total,    c:'text-blue-600 dark:text-blue-400',  bg:'bg-blue-50 dark:bg-blue-500/10',   e:'📄'},
            {l:'Approuvés',      v:stats.approved, c:'text-green-600 dark:text-green-400',bg:'bg-green-50 dark:bg-green-500/10', e:'✅'},
            {l:'En révision',    v:stats.pending,  c:'text-amber-600 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-500/10', e:'⏳'},
            {l:'Alertes',        v:stats.alerts+stats.expiring, c:'text-red-600 dark:text-red-400', bg:'bg-red-50 dark:bg-red-500/10', e:'🚨'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl mb-1">{s.e}</div>
              <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Workflow de validation documentaire</div>
          <div className="flex flex-wrap gap-1 text-[9px]">
            {['Chauffeur soumet','→','SOUMIS','→','Contrôle auto','→','EN VÉRIFICATION','→','Admin GOV','→','APPROUVÉ / REFUSÉ','→','Conformité mise à jour','→','Audit créé'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-400':'px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap'}>{s}</span>
            ))}
          </div>
        </div>

        {/* File révision */}
        {stats.pending > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">📋 File de vérification ({stats.pending} document(s))</div>
            {DEMO_DOCUMENTS.filter(d=>['PENDING_REVIEW','UNDER_REVIEW','UPLOADED'].includes(d.status)).map(d=>(
              <button key={d.id} onClick={()=>setSelectedDoc(d)} className="w-full flex items-center justify-between py-1.5 border-b border-blue-100 dark:border-blue-500/10 last:border-0 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded px-1 transition-colors cursor-pointer">
                <span className="text-[10px] text-blue-700 dark:text-blue-300">{d.driver} — {d.label}</span>
                <span className="text-[9px] text-blue-500 dark:text-blue-400">Soumis {fmtDate(d.submittedAt)} →</span>
              </button>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="space-y-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chauffeur, type de document…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-qc-blue text-slate-800 dark:text-white"/>
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_STATUS.map(f=>(
              <button key={f} onClick={()=>setFilterStatus(f)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all" style={{
                background:filterStatus===f?'#003DA5':'transparent', color:filterStatus===f?'white':'#64748B',
                borderColor:filterStatus===f?'#003DA5':'rgba(148,163,184,0.30)',
              }}>{f==='Tous'?`Tous (${DEMO_DOCUMENTS.length})`:STATUS_CONF[f]?.label??f}</button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} document(s)</span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400">Cliquer → détail + actions admin</span>
          </div>
          {filtered.map(doc=>{
            const sc = STATUS_CONF[doc.status]??STATUS_CONF['UPLOADED']!
            const daysLeft = doc.expires ? Math.ceil((new Date(doc.expires).getTime()-Date.now())/86400000) : null
            return (
              <div key={doc.id} onClick={()=>setSelectedDoc(doc)}
                className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                style={{borderLeft:`3px solid ${sc.bdr}`}}>
                <span className="text-xl shrink-0">{TYPE_ICONS[doc.type]??'📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{doc.label}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    {daysLeft!==null && daysLeft<60 && daysLeft>0 && <span className="text-[8px] text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 rounded-full font-bold">⏳ {daysLeft}j</span>}
                    <span className="text-[8px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full">v{doc.version}</span>
                  </div>
                  <Link href={`/drivers/${doc.driverId}`} onClick={e=>e.stopPropagation()} className="text-[9px] text-qc-blue hover:underline font-semibold">{doc.driver} · {doc.driverNum}</Link>
                  {doc.note && <div className="text-[9px] text-slate-400 italic mt-0.5">{doc.note}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-500">Expire:</div>
                  <div className={`text-[10px] font-bold ${daysLeft!==null&&daysLeft<0?'text-red-600 dark:text-red-400':daysLeft!==null&&daysLeft<60?'text-orange-500':'text-slate-600 dark:text-slate-400'}`}>{fmtDate(doc.expires)}</div>
                  {doc.verifiedBy && <div className="text-[8px] text-slate-400 mt-0.5">✓ {doc.verifiedBy}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
