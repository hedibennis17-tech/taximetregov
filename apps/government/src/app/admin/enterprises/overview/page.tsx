'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, ENTERPRISES, ENT_ALERTS, SECTOR_CONF, CONN_CONF } from '@/lib/enterprise-data'

const NAV = [
  {href:'/admin/enterprises/overview',l:'📊 Vue globale',  active:true},
  {href:'/admin/enterprises',          l:'📋 Registre',     active:false},
  {href:'/admin/users',                l:'👥 Utilisateurs', active:false},
  {href:'/admin/organizations',        l:'🏢 Organisations',active:false},
]

export default function EnterpriseOverviewPage() {
  const stats = {
    total:      ENTERPRISES.length,
    active:     ENTERPRISES.filter(e=>e.status==='ACTIVE').length,
    pending:    ENTERPRISES.filter(e=>e.status==='PENDING').length,
    connected:  ENTERPRISES.filter(e=>e.connection==='CONNECTED').length,
    error:      ENTERPRISES.filter(e=>e.connection==='ERROR').length,
    alerts:     ENTERPRISES.filter(e=>e.alerts>0).length,
    docsExp:    1,
    oblLate:    1,
  }

  const totalGross   = ENTERPRISES.reduce((s,e)=>s+e.grossQ3,0)
  const totalTps     = ENTERPRISES.reduce((s,e)=>s+e.tpsQ3,0)
  const totalTvq     = ENTERPRISES.reduce((s,e)=>s+e.tvqQ3,0)
  const totalDrivers = ENTERPRISES.reduce((s,e)=>s+e.drivers,0)
  const totalActs    = ENTERPRISES.reduce((s,e)=>s+e.activities,0)

  const bySector = Object.entries(
    ENTERPRISES.reduce((acc,e)=>{ acc[e.sector]=(acc[e.sector]??0)+1; return acc },{} as Record<string,number>)
  )
  const maxSector = Math.max(...bySector.map(([,v])=>v))

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🏛️</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Center</h1>
        </div>
        <p className="text-sm text-slate-500 mb-4">Vue globale des entreprises participantes · TAXIMETER.GOV · PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · 8 entreprises synthétiques · Aucune organisation gouvernementale réelle</div>

        {/* KPI principaux */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Entreprises totales',  v:stats.total,     c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',    icon:'🏢'},
            {l:'Actives',              v:stats.active,    c:'#059669', bg:'bg-green-50 dark:bg-green-500/10',  icon:'✅'},
            {l:'En attente',           v:stats.pending,   c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⏳'},
            {l:'Avec alertes',         v:stats.alerts,    c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',     icon:'🚨'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* KPI connexions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Connectées',           v:stats.connected, c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'🔌'},
            {l:'Erreur connexion',     v:stats.error,     c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',    icon:'⚠️'},
            {l:'Docs expirés',         v:stats.docsExp,   c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10',icon:'📄'},
            {l:'Obligations retard',   v:stats.oblLate,   c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',    icon:'🧾'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Revenus / taxes Q3 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Revenus bruts Q3 (pilote)', v:money(totalGross), c:'#059669', bg:'bg-green-50 dark:bg-green-500/8', icon:'💰'},
            {l:'TPS estimée Q3',            v:money(totalTps),   c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/8',icon:'🧾'},
            {l:'TVQ estimée Q3',            v:money(totalTvq),   c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/8',icon:'🧾'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 shadow-sm border border-white dark:border-transparent`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Chaîne gouvernementale */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chaîne de supervision gouvernementale</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['ENTREPRISE','→','CHAUFFEURS','→','VÉHICULES','→','ACTIVITÉS','→','TRANSACTIONS','→','REVENUS','→','TPS/TVQ','→','DÉCLARATIONS','→','RÉCONCILIATION','→','CONFORMITÉ','→','AUDIT','→','GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Par secteur */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Entreprises par secteur</div>
            {bySector.map(([sector,count])=>{
              const sc = SECTOR_CONF[sector]??{label:sector,icon:'🏢',color:'#64748B'}
              return (
                <div key={sector} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{sc.icon}</span>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{sc.label}</span>
                    </div>
                    <span className="text-[10px] font-black" style={{color:sc.color}}>{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${(count/maxSector)*100}%`,background:sc.color}}/>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Alertes récentes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes récentes ({ENT_ALERTS.filter(a=>a.status!=='INFO').length})</div>
            {ENT_ALERTS.filter(a=>a.priority==='CRITICAL'||a.priority==='HIGH').slice(0,6).map(a=>{
              const ent = ENTERPRISES.find(e=>e.id===a.entId)
              return (
                <div key={a.id} className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{background:a.priority==='CRITICAL'?'#DC2626':'#B45309'}}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{a.title}</div>
                    <div className="text-[9px] text-slate-400">{ent?.tradeName} · {a.type}</div>
                  </div>
                  <span className="text-[8px] font-bold shrink-0" style={{color:a.priority==='CRITICAL'?'#DC2626':'#B45309'}}>{a.priority}</span>
                </div>
              )
            })}
            <Link href="/admin/enterprises" className="block mt-3 text-center text-[10px] text-qc-blue hover:underline">→ Voir toutes les entreprises</Link>
          </div>
        </div>

        {/* Volume activités + connexions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Total chauffeurs (pilote)', v:totalDrivers.toLocaleString('fr-CA'), c:'#003DA5', icon:'👥'},
            {l:'Activités Q3 (pilote)',     v:totalActs.toLocaleString('fr-CA'),    c:'#059669', icon:'📍'},
            {l:'Total alertes actives',     v:ENT_ALERTS.filter(a=>a.status!=='INFO').length, c:'#DC2626', icon:'🚨'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste rapide status connexion */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Statut connexions</div>
          <div className="space-y-2">
            {ENTERPRISES.map(e=>{
              const cc = CONN_CONF[e.connection]!
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cc.dot}`}/>
                  <Link href={`/admin/enterprises/${e.id}`} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex-1 truncate">{e.tradeName}</Link>
                  <span className="text-[9px] text-slate-400">{e.sector}</span>
                  <span className="text-[9px] font-bold shrink-0" style={{color:cc.color}}>{cc.label}</span>
                  {e.alerts>0&&<span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 rounded-full">{e.alerts} alerte(s)</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
