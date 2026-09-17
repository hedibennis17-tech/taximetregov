'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { ChevronRight, X, ExternalLink } from 'lucide-react'
import { DEMO_PROVIDERS, DEMO_TRANSACTIONS, PILOT_BANNER } from '@/lib/demo-data'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  CONNECTED_DEMO:{label:'CONNECTÉ — DEMO', color:'#059669', bg:'rgba(5,150,105,0.12)'},
  SIMULATION:    {label:'SIMULATION',       color:'#B45309', bg:'rgba(180,83,9,0.10)'},
}

function ProviderModal({ p, onClose }: { p: typeof DEMO_PROVIDERS[0]; onClose: ()=>void }) {
  const sc = STATUS_CONF[p.status] ?? STATUS_CONF['SIMULATION']!
  const txCount = DEMO_TRANSACTIONS.filter(t => t.provider === p.code).length
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{p.icon}</span>
            <div>
              <div className="text-lg font-bold text-white">{p.name}</div>
              <div className="text-[10px] text-slate-400">{p.id} · {p.type}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer"><X size={14} className="text-slate-400"/></button>
        </div>

        <div className="mb-4 p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            {label:'Connexion',    val:p.status==='CONNECTED_DEMO'?'DEMO':'SIMULATION'},
            {label:'API',          val:p.api},
            {label:'OAuth',        val:p.oauth},
            {label:'Webhook',      val:p.webhook},
            {label:'Transactions', val:`${txCount} (pilote)`},
            {label:'Qualité',      val:p.quality?`${p.quality}%`:'N/A'},
            {label:'Erreurs',      val:String(p.errorCount)},
            {label:'Dernière sync',val:p.lastSync?new Date(p.lastSync).toLocaleTimeString('fr-CA'):'—'},
          ].map(r=>(
            <div key={r.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{r.label}</div>
              <div className="text-xs font-bold text-white">{r.val}</div>
            </div>
          ))}
        </div>

        {/* Liens vers modules */}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modules associés</div>
        <div className="flex flex-wrap gap-2">
          {[
            {label:'Transactions', href:'/transactions'},
            {label:'Webhooks',     href:'/webhooks/engine'},
            {label:'Réconciliation',href:'/reconciliation'},
          ].map(l=>(
            <a key={l.label} href={l.href} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold hover:bg-blue-500/20 transition-colors">
              {l.label} <ExternalLink size={10}/>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlatformsPage() {
  const [selected, setSelected] = useState<typeof DEMO_PROVIDERS[0]|null>(null)
  return (
    <AppShell>
      {selected && <ProviderModal p={selected} onClose={()=>setSelected(null)}/>}
      <PageHeader title="Connexions aux plateformes" subtitle="Fournisseurs · Mode simulation · TAXIMETER.GOV"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER} · SIMULATION — AUCUNE CONNEXION FOURNISSEUR RÉELLE</div>

        {/* Architecture flow */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Flux d'intégration (architecture cible)</div>
          <div className="flex items-center gap-2 text-xs text-slate-300 overflow-x-auto pb-1 flex-nowrap">
            {['FOURNISSEUR','→','API Gateway','→','Authentification','→','Validation','→','Webhook Engine','→','Revenue Ledger','→','Moteur Fiscal','→','Réconciliation','→','Rapport'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-600 shrink-0':`shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold ${s==='FOURNISSEUR'?'bg-blue-500/15 text-blue-400 border border-blue-500/25':'bg-slate-800 border border-slate-700 text-slate-300'}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {label:'Fournisseurs', val:DEMO_PROVIDERS.length,        color:'text-blue-400', bg:'bg-blue-500/10'},
            {label:'Connectés',    val:DEMO_PROVIDERS.filter(p=>p.status==='CONNECTED_DEMO').length, color:'text-green-400', bg:'bg-green-500/10'},
            {label:'Simulation',   val:DEMO_PROVIDERS.filter(p=>p.status==='SIMULATION').length,     color:'text-amber-400', bg:'bg-amber-500/10'},
            {label:'Tx aujourd\'hui', val:DEMO_PROVIDERS.reduce((s,p)=>s+p.txToday,0), color:'text-purple-400', bg:'bg-purple-500/10'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tableau fournisseurs */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="text-xs font-bold text-white">Tableau de connexions</div>
            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full font-bold">MODE SIMULATION</span>
          </div>
          {DEMO_PROVIDERS.map((p,idx)=>{
            const sc = STATUS_CONF[p.status]??STATUS_CONF['SIMULATION']!
            return (
              <div key={p.id} onClick={()=>setSelected(p)} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/50 transition-colors">
                <span className="text-2xl w-8 text-center shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{p.type}</span>
                    <span>API: {p.api}</span>
                    <span>OAuth: {p.oauth}</span>
                    <span>Webhook: {p.webhook}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-white">{p.txToday} tx</div>
                  <div className="text-[9px] text-slate-400">aujourd'hui</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {p.quality&&<div className="text-[10px] font-bold text-green-400">{p.quality}%</div>}
                  <ChevronRight size={13} className="text-slate-500"/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
