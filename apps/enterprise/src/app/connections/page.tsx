'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, fmtDt, ENT_CONNECTIONS, WEBHOOK_LOG, CONN_TYPE_ICONS, CONN_HEALTH_COLOR, SYNC_STATUS } from '@/lib/data'

const CONN_STATUS_CONF: Record<string,{label:string;color:string;dot:string}> = {
  CONNECTED:    {label:'Connecté',    color:'#059669',dot:'bg-green-500'},
  SYNCING:      {label:'En sync',     color:'#B45309',dot:'bg-amber-400 animate-pulse'},
  ERROR:        {label:'Erreur',      color:'#DC2626',dot:'bg-red-500'},
  DISCONNECTED: {label:'Déconnecté',  color:'#64748B',dot:'bg-slate-400'},
  PLANNED:      {label:'Planifié',    color:'#7C3AED',dot:'bg-purple-400'},
}
const WH_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  PROCESSED:{label:'Traité',  color:'#059669',bg:'rgba(5,150,105,0.12)'},
  FAILED:   {label:'Échoué', color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:  {label:'En attente',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
}

export default function ConnectionsPage() {
  const [tab, setTab] = useState<'connexions'|'webhooks'>('connexions')

  const active  = ENT_CONNECTIONS.filter(c=>c.status==='CONNECTED').length
  const planned = ENT_CONNECTIONS.filter(c=>c.status==='PLANNED').length
  const errors  = WEBHOOK_LOG.filter(w=>w.status==='FAILED').length
  const avgHealth = Math.round(ENT_CONNECTIONS.filter(c=>c.health>0).reduce((s,c)=>s+c.health,0)/ENT_CONNECTIONS.filter(c=>c.health>0).length)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Connexions & API</h1>
          <p className="text-sm text-slate-500 mt-1">TAXIMETER.GOV · Taximètre · Plateformes · Webhooks · Architecture</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · SIMULATION · Présence dans DEMO ≠ connexion réelle à un tiers</div>

        {/* Architecture visuelle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase mb-3">Architecture de connexion</div>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2 flex-wrap justify-center">
              {['🚕 Taximètre','🔌 UBER DEMO','🔌 LYFT DEMO','🔌 DOORDASH DEMO'].map(p=>(
                <span key={p} className="text-sm font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">{p}</span>
              ))}
            </div>
            <div className="text-slate-300 dark:text-slate-700 text-xs">↓ OAuth / Webhook / WebSocket</div>
            <div className="text-sm font-black text-white bg-qc-blue px-6 py-2.5 rounded-2xl shadow">🏢 TAXIMETER.GOV — Enterprise Gov</div>
            <div className="text-slate-300 dark:text-slate-700 text-xs">↓ Revenue Ledger · TPS/TVQ · Audit</div>
            <div className="flex gap-2 flex-wrap justify-center opacity-50">
              {['🏛️ Revenu Québec (planifié)','🏛️ ARC (planifié)'].map(p=>(
                <span key={p} className="text-sm font-bold px-3 py-1.5 bg-purple-100 dark:bg-purple-800/30 rounded-xl text-purple-700 dark:text-purple-300">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Connexions actives', v:active,      c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Santé moyenne',      v:`${avgHealth}%`,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Webhooks en erreur', v:errors,      c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'Planifiées',         v:planned,     c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {(['connexions','webhooks'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer capitalize" style={{background:tab===t?'#003DA5':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t==='connexions'?'🔌 Connexions':'📡 Webhooks'}
            </button>
          ))}
        </div>

        {/* ── CONNEXIONS ── */}
        {tab==='connexions'&&(
          <div className="space-y-2">
            {ENT_CONNECTIONS.map(c=>{
              const sc = CONN_STATUS_CONF[c.status]!
              const icon = CONN_TYPE_ICONS[c.type]??'🔌'
              const hColor = CONN_HEALTH_COLOR(c.health)
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{c.name}</span>
                        <div className={`flex items-center gap-1`}>
                          <div className={`w-2 h-2 rounded-full ${sc.dot}`}/>
                          <span className="text-sm font-bold" style={{color:sc.color}}>{sc.label}</span>
                        </div>
                        <span className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{c.type}</span>
                      </div>
                      <div className="text-sm text-slate-400">{c.method} · {c.dataRx.toLocaleString('fr-CA')} enreg. reçus · {c.errors} erreur(s)</div>
                      <div className="text-sm text-slate-400 italic">{c.note}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.health>0?(
                        <>
                          <div className="text-lg font-black" style={{color:hColor}}>{c.health}%</div>
                          <div className="text-sm text-slate-400">{c.latency}ms</div>
                        </>
                      ):<div className="text-sm text-slate-400">—</div>}
                    </div>
                  </div>
                  {c.health>0&&(
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${c.health}%`,background:hColor}}/>
                    </div>
                  )}
                  {c.scopes.length>0&&(
                    <div className="flex gap-1 flex-wrap mt-2">
                      {c.scopes.map(s=><span key={s} className="text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{s}</span>)}
                    </div>
                  )}
                  {c.lastSync&&<div className="text-sm font-mono text-slate-400 mt-1.5">Sync: {fmtDt(c.lastSync)}</div>}
                  {c.status==='PLANNED'&&<div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1.5">🔮 Intégration future — accord légal et réglementaire requis</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* ── WEBHOOKS ── */}
        {tab==='webhooks'&&(
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {[
                {l:'Traités',      v:WEBHOOK_LOG.filter(w=>w.status==='PROCESSED').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'Avec retry',   v:WEBHOOK_LOG.filter(w=>w.attempts>1).length,           c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
                {l:'Échoués',     v:WEBHOOK_LOG.filter(w=>w.status==='FAILED').length,    c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {WEBHOOK_LOG.map(w=>{
              const sc = WH_STATUS[w.status]!
              const conn = ENT_CONNECTIONS.find(c=>c.id===w.connId)
              return (
                <div key={w.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{w.event}</span>
                        <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        {w.attempts>1&&<span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">{w.attempts}x tentatives</span>}
                      </div>
                      <div className="text-sm font-mono text-slate-400">{w.id} · {conn?.name??w.connId} · Réf: {w.extRef}</div>
                      <div className="text-sm font-mono text-slate-400">{fmtDt(w.at)} · {w.latency>0?`${w.latency}ms`:'—'}</div>
                      {w.error&&<div className="text-sm text-amber-600 dark:text-amber-400 italic mt-0.5">{w.error}</div>}
                    </div>
                    <div className="text-xs font-mono text-slate-400 shrink-0 max-w-[100px] truncate">{w.payload}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
