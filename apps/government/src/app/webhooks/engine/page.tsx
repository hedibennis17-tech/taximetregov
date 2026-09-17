'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { X } from 'lucide-react'
import { DEMO_WEBHOOKS, PILOT_BANNER } from '@/lib/demo-data'

const SRC_ICON:Record<string,string> = {UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',SKIP:'🟠'}
const WH_STATUS:Record<string,{label:string;color:string;bg:string}> = {
  PROCESSED:          {label:'Traité',             color:'#059669',bg:'rgba(5,150,105,0.12)'},
  DUPLICATE_DETECTED: {label:'Doublon détecté',    color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  VALIDATION_PENDING: {label:'Validation en cours',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  REJECTED_DEMO:      {label:'Rejeté (démo)',       color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  RETRYING:           {label:'Nouvelle tentative',  color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
}

const PIPELINE = [
  {step:'Réception',           icon:'📡', desc:'TAXIMETER.GOV reçoit l\'événement HTTP POST du fournisseur'},
  {step:'Authentification',    icon:'🔑', desc:'Vérification de l\'identité du fournisseur via clé API'},
  {step:'Signature',           icon:'✍️',  desc:'Validation HMAC-SHA256 de la signature du payload'},
  {step:'Identification',      icon:'🪪', desc:'Mapping fournisseur → profil TAXIMETER.GOV'},
  {step:'Déduplication',       icon:'🔄', desc:'Vérification si l\'événement a déjà été traité'},
  {step:'Normalisation',       icon:'⚙️',  desc:'Conversion du format fournisseur vers format TAXIMETER.GOV'},
  {step:'Revenue Ledger',      icon:'📊', desc:'Insertion dans le registre des revenus du chauffeur'},
  {step:'Moteur fiscal',       icon:'🧮', desc:'Calcul TPS/TVQ sur base + pourboires'},
  {step:'Réconciliation',      icon:'⚖️',  desc:'Rapprochement avec données chauffeur'},
  {step:'Audit',               icon:'📋', desc:'Enregistrement de l\'événement dans le journal d\'audit'},
]

function WebhookModal({wh,onClose}:{wh:typeof DEMO_WEBHOOKS[0];onClose:()=>void}) {
  const sc = WH_STATUS[wh.status]??WH_STATUS['PROCESSED']!
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-base font-bold text-white font-mono">{wh.id}</div>
            <div className="text-[10px] text-slate-400 mt-1">{SRC_ICON[wh.provider]} {wh.provider} · {wh.eventType}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer"><X size={14} className="text-slate-400"/></button>
        </div>
        <div className="mb-3 p-2 rounded-lg text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        {/* Statut */}
        <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{background:sc.bg}}>
          <div className="text-sm font-bold" style={{color:sc.color}}>{sc.label}</div>
          {wh.dup&&<span className="text-[9px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">DOUBLON DÉTECTÉ</span>}
        </div>

        {/* Infos */}
        <div className="space-y-2 mb-4">
          {[
            {label:'Transaction ID', val:wh.txId??'—'},
            {label:'Signature',      val:wh.sig},
            {label:'Reçu',           val:wh.received?new Date(wh.received).toLocaleString('fr-CA'):'—'},
            {label:'Traité',         val:wh.processed?new Date(wh.processed).toLocaleString('fr-CA'):'En cours…'},
            {label:'Latence',        val:wh.processed&&wh.received?`${new Date(wh.processed).getTime()-new Date(wh.received).getTime()}ms`:'—'},
          ].map(r=>(
            <div key={r.label} className="flex justify-between text-xs py-2 border-b border-slate-800">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white font-semibold font-mono">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pipeline de traitement</div>
        <div className="space-y-2">
          {PIPELINE.map((p,i)=>{
            const done = wh.status==='PROCESSED' || (wh.status==='REJECTED_DEMO'&&i<=2) || (wh.status==='DUPLICATE_DETECTED'&&i<=4) || (wh.status==='VALIDATION_PENDING'&&i<=1)
            return (
              <div key={p.step} className={`flex items-start gap-3 p-2.5 rounded-lg ${done?'bg-green-500/8 border border-green-500/15':'bg-slate-800/50 border border-slate-700'}`}>
                <span className="text-base shrink-0">{p.icon}</span>
                <div>
                  <div className={`text-xs font-semibold ${done?'text-green-400':'text-slate-500'}`}>{p.step}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                </div>
                {done&&<span className="ml-auto text-green-400 text-xs shrink-0">✓</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function WebhookEnginePage() {
  const [selected, setSelected] = useState<typeof DEMO_WEBHOOKS[0]|null>(null)
  const [filter, setFilter]     = useState('')
  const stats = {
    total:     DEMO_WEBHOOKS.length,
    processed: DEMO_WEBHOOKS.filter(w=>w.status==='PROCESSED').length,
    pending:   DEMO_WEBHOOKS.filter(w=>w.status==='VALIDATION_PENDING').length,
    duplicate: DEMO_WEBHOOKS.filter(w=>w.status==='DUPLICATE_DETECTED').length,
    rejected:  DEMO_WEBHOOKS.filter(w=>w.status==='REJECTED_DEMO').length,
  }
  const filtered = filter ? DEMO_WEBHOOKS.filter(w=>w.status===filter||w.provider===filter) : DEMO_WEBHOOKS

  return (
    <AppShell>
      {selected&&<WebhookModal wh={selected} onClose={()=>setSelected(null)}/>}
      <PageHeader title="Webhook Engine" subtitle="Événements fournisseurs · Données synthétiques pilote"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        {/* Pipeline schéma */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Pipeline Webhook → Revenue Ledger</div>
          <div className="flex flex-wrap gap-1 text-[9px]">
            {PIPELINE.map((p,i)=>(
              <span key={p.step} className="flex items-center gap-1">
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 whitespace-nowrap">{p.icon} {p.step}</span>
                {i<PIPELINE.length-1&&<span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            {label:'Total',      val:stats.total,     color:'text-blue-400',  bg:'bg-blue-500/10'},
            {label:'Traités',    val:stats.processed,  color:'text-green-400', bg:'bg-green-500/10'},
            {label:'En attente', val:stats.pending,    color:'text-amber-400', bg:'bg-amber-500/10'},
            {label:'Doublons',   val:stats.duplicate,  color:'text-purple-400',bg:'bg-purple-500/10'},
            {label:'Rejetés',    val:stats.rejected,   color:'text-red-400',   bg:'bg-red-500/10'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center border border-white/5`}>
              <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
              <div className="text-[8px] text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <div className="text-xs font-bold text-white">Événements webhook (pilote)</div>
          </div>
          {filtered.map((wh,idx)=>{
            const sc = WH_STATUS[wh.status]??WH_STATUS['PROCESSED']!
            return (
              <div key={wh.id} onClick={()=>setSelected(wh)} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/50">
                <span className="text-lg shrink-0">{SRC_ICON[wh.provider]??'📡'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{wh.id}</span>
                    <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    {wh.dup&&<span className="text-[8px] text-purple-400 bg-purple-500/10 px-1.5 rounded-full">DOUBLON</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{wh.eventType} · {wh.txId??'—'} · {new Date(wh.received).toLocaleTimeString('fr-CA')}</div>
                </div>
                <div className="text-[10px] text-slate-500 shrink-0">{wh.sig}</div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
