'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, API_ENDPOINTS, WEBHOOK_EVENTS_FULL, API_SCOPES, UBER_SERVICES_DASHBOARD, money, money2 } from '@/lib/data'

const API_STATUS_CONF: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  CONNECTED:{label:'Connecté', color:'#059669',bg:'rgba(5,150,105,0.12)',dot:'bg-green-500'},
  PLANNED:  {label:'Planifié', color:'#7C3AED',bg:'rgba(124,58,237,0.12)',dot:'bg-purple-400'},
  ERROR:    {label:'Erreur',   color:'#DC2626',bg:'rgba(220,38,38,0.10)',dot:'bg-red-500'},
}
const WH_STATUS_CONF: Record<string,{color:string;bg:string}> = {
  SUCCESS:{color:'#059669',bg:'rgba(5,150,105,0.12)'},
  FAILED: {color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:{color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  RETRY:  {color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
}

const PIPELINE = ['API/WEBHOOK','→','AUTH','→','VALIDATION','→','SIGNATURE','→','DÉDUPLICATION','→','NORMALISATION','→','ACTIVITÉ','→','TRANSACTION','→','LEDGER','→','TAXE','→','RÉCONCILIATION']

export default function IntegrationsPage() {
  const [tab, setTab] = useState<'apis'|'webhooks'|'scopes'|'services'>('apis')

  const totalReqs  = API_ENDPOINTS.filter(a=>a.status==='CONNECTED').reduce((s,a)=>s+a.requests,0)
  const totalErrs  = API_ENDPOINTS.reduce((s,a)=>s+a.errors,0)
  const whSuccess  = WEBHOOK_EVENTS_FULL.filter(w=>w.status==='SUCCESS').length
  const whFailed   = WEBHOOK_EVENTS_FULL.filter(w=>w.status==='FAILED').length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">API & Intégrations</h1>
          <p className="text-sm text-slate-500 mt-1">Endpoints · Webhooks · Scopes · Services Uber · Pipeline · Sécurité</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Métriques synthétiques · Aucune API externe réelle connectée</div>

        {/* Pipeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Pipeline de traitement</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {PIPELINE.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#000',color:'white'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total requêtes',      v:totalReqs.toLocaleString('fr-CA'),c:'#000000',bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'APIs connectées',     v:API_ENDPOINTS.filter(a=>a.status==='CONNECTED').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Webhooks traités',    v:whSuccess,  c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Erreurs totales',     v:totalErrs,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([['apis','⚙️ APIs'],['webhooks','📡 Webhooks'],['scopes','🔑 Scopes'],['services','🚕 Services Uber']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:tab===t?'#000000':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#000000':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── APIs ── */}
        {tab==='apis'&&(
          <div className="space-y-2">
            {API_ENDPOINTS.map(api=>{
              const sc = API_STATUS_CONF[api.status]!
              const successRate = api.requests>0 ? api.success : null
              return (
                <div key={api.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${sc.dot}`}/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{api.name}</span>
                        <span className="text-[7px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{api.version}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="flex gap-4 text-[9px] flex-wrap">
                        {api.requests>0&&<span className="text-slate-600 dark:text-slate-400">{api.requests.toLocaleString('fr-CA')} req.</span>}
                        {successRate&&<span className="text-green-600 dark:text-green-400">✓ {successRate}%</span>}
                        {api.errors>0&&<span className="text-red-500">⚠️ {api.errors} err.</span>}
                        {api.lastSync&&<span className="text-slate-400">Sync: {fmtDt(api.lastSync)}</span>}
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {api.scopes.map(s=><span key={s} className="text-[7px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{s}</span>)}
                      </div>
                    </div>
                    {api.requests>0&&(
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-green-600 dark:text-green-400">{api.success}%</div>
                        <div className="text-[8px] text-slate-400">succès</div>
                      </div>
                    )}
                  </div>
                  {api.requests>0&&(
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{width:`${api.success}%`}}/>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── WEBHOOKS ── */}
        {tab==='webhooks'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {l:'Succès',  v:whSuccess,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'Échoués', v:whFailed, c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'En attente',v:WEBHOOK_EVENTS_FULL.filter(w=>w.status==='PENDING').length,c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {['Événement','Source','Destination','Date','Statut','Tentatives','Trace ID'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {WEBHOOK_EVENTS_FULL.map(w=>{
                      const sc = WH_STATUS_CONF[w.status]!
                      return (
                        <tr key={w.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 font-mono text-[9px] text-blue-600 dark:text-blue-400 whitespace-nowrap">{w.event}</td>
                          <td className="px-3 py-2.5 text-[9px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{w.src}</td>
                          <td className="px-3 py-2.5 text-[9px] text-slate-500 whitespace-nowrap">{w.dst}</td>
                          <td className="px-3 py-2.5 text-[9px] font-mono text-slate-400 whitespace-nowrap">{fmtDt(w.at)}</td>
                          <td className="px-3 py-2.5"><span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{w.status}</span></td>
                          <td className="px-3 py-2.5 text-center text-[9px]">{w.attempts}</td>
                          <td className="px-3 py-2.5 text-[8px] font-mono text-slate-400">{w.traceId}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SCOPES ── */}
        {tab==='scopes'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Scopes OAuth 2.0 ({API_SCOPES.length})</div>
            {API_SCOPES.map(s=>(
              <div key={s.scope} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-black dark:text-white">{s.scope}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{s.desc}</div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end shrink-0">
                  {s.roles.map(r=><span key={r} className="text-[7px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{r}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SERVICES UBER ── */}
        {tab==='services'&&(
          <div className="space-y-2">
            <div className="text-[9px] text-amber-600 dark:text-amber-400 italic px-1">Données DEMO — Répartition synthétique par service Uber</div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                    {['Service','Statut','Chauffeurs','Véhicules','Activités','Transactions','Revenus (DEMO)','Tips','TPS','TVQ','Exceptions'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[8px] font-bold text-white uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {UBER_SERVICES_DASHBOARD.map(s=>(
                      <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{opacity:s.status==='ACTIVE'?1:0.5}}>
                        <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className="text-lg">{s.emoji}</span><span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.name}</span></div></td>
                        <td className="px-3 py-2.5"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${s.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10'}`}>{s.status}</span></td>
                        <td className="px-3 py-2.5 text-[10px] text-center font-bold text-slate-700 dark:text-slate-300">{s.drivers||'—'}</td>
                        <td className="px-3 py-2.5 text-[10px] text-center font-bold text-slate-700 dark:text-slate-300">{s.vehicles||'—'}</td>
                        <td className="px-3 py-2.5 text-[10px] text-center text-slate-600 dark:text-slate-400">{s.activities||'—'}</td>
                        <td className="px-3 py-2.5 text-[10px] text-center text-slate-600 dark:text-slate-400">{s.txCount||'—'}</td>
                        <td className="px-3 py-2.5 font-bold text-green-600 dark:text-green-400 whitespace-nowrap">{s.gross>0?money(s.gross):'—'}</td>
                        <td className="px-3 py-2.5 text-[10px] text-blue-600 dark:text-blue-400">{s.tips>0?money2(s.tips):'—'}</td>
                        <td className="px-3 py-2.5 text-[10px] text-purple-600 dark:text-purple-400">{s.tps>0?money2(s.tps):'—'}</td>
                        <td className="px-3 py-2.5 text-[10px] text-indigo-600 dark:text-indigo-400">{s.tvq>0?money2(s.tvq):'—'}</td>
                        <td className="px-3 py-2.5 text-center">{s.exceptions>0?<span className="text-[9px] font-bold text-red-500">⚠️ {s.exceptions}</span>:<span className="text-slate-300 dark:text-slate-700">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
