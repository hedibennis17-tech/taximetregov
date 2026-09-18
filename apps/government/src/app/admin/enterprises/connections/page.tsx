'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, fmtDt, PLATFORM_CONNECTIONS, CONN_STATUS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

export default function Page() {
  const active   = PLATFORM_CONNECTIONS.filter(c=>c.status==='CONNECTED'&&c.entId)
  const issues   = PLATFORM_CONNECTIONS.filter(c=>['ERROR','SYNCING'].includes(c.status))
  const planned  = PLATFORM_CONNECTIONS.filter(c=>c.status==='PLANNED')

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🔌</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Platform Connection Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Enterprise ↔ API/OAuth ↔ TAXIMETER.GOV · Architecture plateforme</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/connections"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · SIMULATION · Présence dans DEMO ≠ connexion réelle</div>

        {/* Architecture */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Architecture de connexion (modèle pilote)</div>
          <div className="flex flex-col gap-2">
            {[
              {l:'🏢 ENTREPRISE',c:'#003DA5'},
              {l:'↕ API / OAuth / Webhook / Import',c:'#64748B'},
              {l:'🏛️ TAXIMETER.GOV',c:'#003DA5'},
              {l:'↕ Connecteurs certifiés (planifiés)',c:'#64748B'},
              {l:'UBER · LYFT · DOORDASH · DHL · UPS · GLS · …',c:'#7C3AED'},
            ].map((r,i)=>(
              <div key={i} className="text-center text-[9px] font-bold py-1.5 rounded-lg" style={i%2===0?{background:'#EEF3FB',color:r.c}:{color:r.c}}>{r.l}</div>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Actives',   v:active.length,  c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Problèmes', v:issues.length,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'Planifiées',v:planned.length, c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Connexions actives */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Connexions opérationnelles + en cours</div>
          {PLATFORM_CONNECTIONS.filter(c=>c.entId).map(c=>{
            const ent = ENTERPRISES.find(e=>e.id===c.entId)
            const cs = CONN_STATUS[c.status]!
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot}`}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{c.provider}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:cs.color,background:'rgba(0,0,0,0.05)'}}>{cs.label}</span>
                    <span className="text-[8px] text-slate-400">{c.method}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{ent?.tradeName??c.entId} · {c.dataRx.toLocaleString('fr-CA')} données reçues · {c.errors} erreur(s) · Santé: {c.health}%</div>
                  {c.note&&<div className="text-[8px] text-slate-400 italic">{c.note}</div>}
                </div>
                {c.lastSync&&<div className="text-[8px] font-mono text-slate-400 shrink-0">{fmtDt(c.lastSync)}</div>}
              </div>
            )
          })}
        </div>

        {/* Planifiées */}
        <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-2">🔮 Architecture future — Intégrations planifiées</div>
          <div className="flex gap-1.5 flex-wrap">
            {planned.map(c=>(
              <span key={c.id} className="text-[9px] font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg">{c.provider}</span>
            ))}
          </div>
          <div className="text-[9px] text-slate-500 mt-2 italic">Ces intégrations nécessitent des ententes légales et des autorisations réglementaires avant toute connexion réelle.</div>
        </div>
      </div>
    </AppShell>
  )
}
