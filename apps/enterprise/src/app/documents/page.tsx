'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { Search, Upload } from 'lucide-react'
import { PILOT, fmtDt, fmtDate, ENT_DOCS_FULL, ENT_DRIVERS, ENT_VEHICLES, SYNC_STATUS, DOC_STATUS } from '@/lib/data'

const DOC_TYPE_ICONS: Record<string,string> = {
  NEQ:'🏢', LICENSE:'📋', INSURANCE:'🛡️', DRIVER_LIC:'🪪', DRIVER_PRO:'📜',
  VEH_INSPECTION:'🔧', VEH_INSURANCE:'🛡️', VEH_REG:'📄',
}
const OWNER_TYPE_LABELS: Record<string,string> = {
  ENTERPRISE:'Entreprise', DRIVER:'Chauffeur', VEHICLE:'Véhicule',
}
const WORKFLOW = ['UPLOAD','→','EN ATTENTE','→','EN RÉVISION','→','APPROUVÉ','↕','REFUSÉ','→','RENOUVELLEMENT']

export default function DocumentsPage() {
  const [filter, setFilter]   = useState('ALL')
  const [typeF,  setTypeF]    = useState('ALL')
  const [search, setSearch]   = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const filtered = ENT_DOCS_FULL.filter(d=>{
    if (filter!=='ALL' && d.status!==filter) return false
    if (typeF!=='ALL'  && d.ownerType!==typeF) return false
    if (search && !`${d.label} ${d.id} ${d.number} ${d.ownerId}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total:    ENT_DOCS_FULL.length,
    approved: ENT_DOCS_FULL.filter(d=>d.status==='APPROVED').length,
    expiring: ENT_DOCS_FULL.filter(d=>d.status==='EXPIRING').length,
    expired:  ENT_DOCS_FULL.filter(d=>d.status==='EXPIRED').length,
    pending:  ENT_DOCS_FULL.filter(d=>d.status==='PENDING').length,
  }

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Documents</h1>
            <p className="text-sm text-slate-500 mt-1">Coffre documentaire · Validation · Expiration · Synchronisation</p>
          </div>
          <button onClick={()=>setShowUpload(!showUpload)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700 shrink-0">
            <Upload size={12}/> Soumettre
          </button>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Upload DEMO */}
        {showUpload&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Soumettre un document (DEMO)</div>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center mb-3 hover:border-blue-300 transition-colors cursor-pointer">
              <Upload size={24} className="mx-auto text-slate-400 mb-2"/>
              <div className="text-[10px] font-bold text-slate-500">Glisser-déposer ou cliquer pour sélectionner</div>
              <div className="text-[9px] text-slate-400 mt-1">PDF, JPG, PNG · Max 10 MB · DEMO</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['Type de document','Numéro document','Date émission','Date expiration'].map(f=>(
                <input key={f} placeholder={f} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"/>
              ))}
            </div>
            <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none mb-3">
              <option>Entreprise</option>
              {ENT_DRIVERS.map(d=><option key={d.id}>{d.name} ({d.id})</option>)}
              {ENT_VEHICLES.map(v=><option key={v.id}>{v.make} {v.model} {v.plate} ({v.id})</option>)}
            </select>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700">Soumettre · DEMO</button>
              <button onClick={()=>setShowUpload(false)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">Annuler</button>
            </div>
            <div className="text-[8px] text-amber-600 dark:text-amber-400 text-center mt-2">PILOTE — Aucun document réel soumis</div>
          </div>
        )}

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow documentaire</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={['→','↕'].includes(s)?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={!['→','↕'].includes(s)?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-5 gap-2">
          {[
            {l:'Total',      v:stats.total,    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Valides',    v:stats.approved, c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Expirants',  v:stats.expiring, c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Expirés',    v:stats.expired,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'En attente', v:stats.pending,  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Nom, numéro, propriétaire…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{v:'ALL',l:'Tous'},{v:'APPROVED',l:'Valides'},{v:'EXPIRING',l:'Expirants'},{v:'EXPIRED',l:'Expirés'},{v:'PENDING',l:'En attente'}].map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:filter===f.v?'#003DA5':'transparent',color:filter===f.v?'white':'#64748B',borderColor:filter===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {f.l}
              </button>
            ))}
            {['ALL','ENTERPRISE','DRIVER','VEHICLE'].map(t=>(
              <button key={t} onClick={()=>setTypeF(t)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:typeF===t?'#7C3AED':'transparent',color:typeF===t?'white':'#64748B',borderColor:typeF===t?'#7C3AED':'rgba(148,163,184,0.30)'}}>
                {t==='ALL'?'Tous types':OWNER_TYPE_LABELS[t]??t}
              </button>
            ))}
          </div>
        </div>

        {/* Liste documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} document(s)</span>
            <span className="text-[9px] text-slate-400">Versioning · Historique préservé</span>
          </div>
          {filtered.map(doc=>{
            const dsc = DOC_STATUS[doc.status]!
            const ss  = SYNC_STATUS[doc.syncStatus]!
            const owner = doc.ownerType==='DRIVER'?ENT_DRIVERS.find(d=>d.id===doc.ownerId)?.name:
                          doc.ownerType==='VEHICLE'?ENT_VEHICLES.find(v=>v.id===doc.ownerId)?.id:
                          'Entreprise'
            return (
              <div key={doc.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                style={{borderLeft:`3px solid ${dsc.color}`}}>
                <span className="text-xl shrink-0">{DOC_TYPE_ICONS[doc.type]??'📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{doc.label}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:dsc.color,background:`${dsc.color}18`}}>{dsc.label}</span>
                    <span className="text-[7px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">{OWNER_TYPE_LABELS[doc.ownerType]}</span>
                    {doc.version>1&&<span className="text-[7px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">V{doc.version}</span>}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 mb-0.5">{doc.id} · {doc.number} · {owner}</div>
                  <div className="text-[9px] text-slate-400">
                    Émis: {fmtDate(doc.issued)}{doc.expires?` · Expire: ${fmtDate(doc.expires)}`:' · Pas d\'expiration'}
                  </div>
                  {doc.note&&<div className="text-[9px] text-amber-600 dark:text-amber-400 italic mt-0.5">{doc.note}</div>}
                  {doc.rejectionReason&&<div className="text-[9px] text-red-500 mt-0.5">Motif refus: {doc.rejectionReason}</div>}
                  {doc.verifiedAt&&<div className="text-[9px] text-slate-400 mt-0.5">Vérifié: {fmtDt(doc.verifiedAt)} par {doc.verifiedBy}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/>
                  <span className="text-[8px]" style={{color:ss.color}}>{ss.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Alertes expiration */}
        {(stats.expiring+stats.expired)>0&&(
          <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">⚠️ Documents nécessitant attention immédiate</div>
            {ENT_DOCS_FULL.filter(d=>d.status==='EXPIRING'||d.status==='EXPIRED').map(d=>{
              const dsc = DOC_STATUS[d.status]!
              const owner = d.ownerType==='DRIVER'?ENT_DRIVERS.find(dr=>dr.id===d.ownerId)?.name:
                            d.ownerType==='VEHICLE'?ENT_VEHICLES.find(v=>v.id===d.ownerId)?.id:
                            'Entreprise'
              return (
                <div key={d.id} className="py-1.5 border-b border-red-100 dark:border-red-500/10 last:border-0 text-[10px]">
                  <span className="font-bold" style={{color:dsc.color}}>{dsc.label}</span> · <span className="text-slate-700 dark:text-slate-200">{d.label}</span> · <span className="text-slate-400">{owner}</span>
                  {d.expires&&<span className="text-red-500 ml-2">Expire: {fmtDate(d.expires)}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
