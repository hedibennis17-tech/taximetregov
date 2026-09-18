'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { PILOT, fmtDt, SERVICES, DATA_STATS } from '@/lib/admin-data'

const NAV = [
  {href:'/admin/users',         l:'👥 Utilisateurs', active:false},
  {href:'/admin/organizations', l:'🏢 Organisations', active:false},
  {href:'/system/health',       l:'❤️ Santé système', active:true},
  {href:'/system/settings',     l:'⚙️ Paramètres',    active:false},
]

const WORKFLOW = ['SERVICE','→','HEALTH CHECK','→','STATUS','→','MONITORING','→','ALERTE','→','TÂCHE','→','RÉSOLUTION','→','AUDIT']

export default function SystemHealthPage() {
  const online    = SERVICES.filter(s=>s.status==='ONLINE').length
  const degraded  = SERVICES.filter(s=>s.status==='DEGRADED').length
  const warnings  = SERVICES.reduce((s,sv)=>s+sv.warnings,0)
  const avgResp   = Math.round(SERVICES.reduce((s,sv)=>s+sv.resp,0)/SERVICES.length)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Santé du système</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Services · Performances · Infrastructure · TAXIMETER.GOV PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Status global */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #059669'}}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400"/>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-green-700 dark:text-green-400">OPÉRATIONNEL</span>
                <span className="text-[8px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">PILOTE DEMO</span>
              </div>
              <div className="text-xs text-slate-500">{online}/{SERVICES.length} services en ligne · Temps de réponse moyen: {avgResp}ms · {warnings} avertissement(s)</div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Services en ligne',  v:`${online}/${SERVICES.length}`, c:'#059669', bg:'bg-green-50 dark:bg-green-500/10',  icon:'✅'},
            {l:'Dégradés',           v:degraded,                       c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⚠️'},
            {l:'Avertissements',     v:warnings,                       c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'🔔'},
            {l:'Rép. moy.',          v:`${avgResp}ms`,                 c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'⚡'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Cycle santé système</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Services grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Services TAXIMETER.GOV ({SERVICES.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
            {SERVICES.map((s,i)=>{
              const isDeg = s.status==='DEGRADED'
              return (
                <div key={s.name} className={`p-4 border-b border-r border-slate-100 dark:border-slate-800 ${isDeg?'bg-amber-50 dark:bg-amber-500/5':''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isDeg?'bg-amber-400':'bg-green-500'}`}/>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-lg font-black" style={{color:isDeg?'#B45309':'#059669'}}>{s.resp}ms</div>
                      <div className="text-[8px] text-slate-400">Latence</div>
                    </div>
                    <div className="text-right">
                      {s.warnings>0 && <div className="text-[8px] font-bold text-amber-500">⚠ {s.warnings}</div>}
                      <div className="text-[8px] text-slate-400">{fmtDt(s.lastCheck)}</div>
                    </div>
                  </div>
                  {isDeg && (
                    <div className="mt-1.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={9}/> Performances dégradées — DEMO
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Data infrastructure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Infrastructure de données (PILOTE)</div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              {l:'Chauffeurs DEMO',   v:DATA_STATS.drivers.toLocaleString('fr-CA'),       c:'#003DA5'},
              {l:'Véhicules',         v:DATA_STATS.vehicles.toLocaleString('fr-CA'),       c:'#059669'},
              {l:'Organisations',     v:DATA_STATS.organizations,                          c:'#7C3AED'},
              {l:'Activités',         v:DATA_STATS.activities.toLocaleString('fr-CA'),     c:'#003DA5'},
              {l:'Transactions',      v:DATA_STATS.transactions.toLocaleString('fr-CA'),   c:'#059669'},
              {l:'Ledger entries',    v:DATA_STATS.ledgerEntries.toLocaleString('fr-CA'),  c:'#7C3AED'},
              {l:'Tax records',       v:DATA_STATS.taxRecords,                             c:'#B45309'},
              {l:'Documents',         v:DATA_STATS.documents,                              c:'#B45309'},
              {l:'Audit events',      v:DATA_STATS.auditEvents.toLocaleString('fr-CA'),    c:'#DC2626'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                <div className="text-base font-black" style={{color:s.c}}>{s.v}</div>
                <div className="text-[8px] text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
