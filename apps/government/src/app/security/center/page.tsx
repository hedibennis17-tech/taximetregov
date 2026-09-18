'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { PILOT, fmtDt, SECURITY_EVENTS, SEV_CONF, SERVICES_STATUS } from '@/lib/security-data'

const NAV = [
  {href:'/security/center',    l:'🛡️ Security Center', active:true},
  {href:'/security/monitoring',l:'📡 Monitoring',       active:false},
  {href:'/security/sessions',  l:'🔑 Sessions',         active:false},
  {href:'/governance/center',  l:'⚖️ Gouvernance',      active:false},
  {href:'/privacy/center',     l:'🔒 Confidentialité',  active:false},
]

const LAYERS = [
  {icon:'👤',l:'Protection identité',    desc:'Authentification sécurisée + vérification'},
  {icon:'🔐',l:'Contrôle d\'accès',      desc:'Permissions par rôle et organisation'},
  {icon:'🔑',l:'Sécurité sessions',      desc:'Tokens, expiration, révocation'},
  {icon:'🔌',l:'Sécurité API',           desc:'OAuth, credentials, journalisation'},
  {icon:'🛡️',l:'Protection données',     desc:'Chiffrement, isolation, audit'},
  {icon:'📋',l:'Piste d\'audit',         desc:'Traçabilité complète des actions'},
  {icon:'👁️',l:'Surveillance incidents', desc:'Détection, classification, réponse'},
]

export default function SecurityCenterPage() {
  const warnings = SECURITY_EVENTS.filter(e=>e.sev==='WARNING').length
  const allOnline = SERVICES_STATUS.every(s=>s.status==='ONLINE')

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Security Center</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Sécurité · Accès · Surveillance · Protection · TAXIMETER.GOV</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Status global */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #059669',borderColor:'#059669'}}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
              <Shield size={28} className="text-green-600 dark:text-green-400"/>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-green-700 dark:text-green-400">PROTÉGÉ</span>
                <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 px-2 py-0.5 rounded-full">PILOTE DEMO</span>
              </div>
              <div className="text-xs text-slate-500">Tous les services en ligne · {warnings} avertissement(s) actif(s) · 0 incident critique</div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Sessions actives',   v:'18',  c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'🔑'},
            {l:'Utilisateurs auth',  v:'42',  c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'👥'},
            {l:'Événements (24h)',   v:SECURITY_EVENTS.length, c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/10',icon:'📊'},
            {l:'Avertissements',     v:warnings, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⚠️'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Chaîne sécurité */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Architecture de sécurité TAXIMETER.GOV (DÉMO)</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['IDENTITÉ','→','AUTH','→','AUTORISATION','→','ACTIVITÉ','→','TRANSACTION','→','TAXES','→','RÉCONCILIATION','→','CONFORMITÉ','→','AUDIT','→','GOUVERNANCE'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Services status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-white">État des services (DÉMO)</span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-600 dark:text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
              {allOnline?'Tous en ligne':'Vérification requise'}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {SERVICES_STATUS.map((s,i)=>(
              <div key={s.name} className={`p-4 ${i%4!==3?'border-r border-slate-100 dark:border-slate-800':''} ${i<4?'border-b border-slate-100 dark:border-slate-800':''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"/>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                </div>
                <div className="text-xs font-black text-green-600 dark:text-green-400">{s.resp}ms</div>
                <div className="text-[9px] text-slate-400">{s.events.toLocaleString('fr-CA')} événements</div>
                {s.alerts>0&&<div className="text-[8px] font-bold text-amber-500 mt-0.5">⚠ {s.alerts} alerte(s)</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Protection layers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Couches de protection (architecture pilote)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {LAYERS.map(l=>(
              <div key={l.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                <div className="text-xl mb-1">{l.icon}</div>
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{l.l}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{l.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Événements récents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
            Événements de sécurité récents ({SECURITY_EVENTS.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Heure','Utilisateur','Événement','Catégorie','Sévérité','Statut'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {SECURITY_EVENTS.slice(0,10).map(e=>{
                  const sc = SEV_CONF[e.sev]!
                  return (
                    <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 text-[9px] font-mono text-slate-500 whitespace-nowrap">{fmtDt(e.at)}</td>
                      <td className="px-4 py-2.5"><div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{e.user}</div><div className="text-[8px] text-slate-400">{e.org}</div></td>
                      <td className="px-4 py-2.5 text-[10px] text-slate-600 dark:text-slate-300">{e.event}</td>
                      <td className="px-4 py-2.5"><span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{e.cat}</span></td>
                      <td className="px-4 py-2.5"><span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></td>
                      <td className="px-4 py-2.5 text-[9px] text-slate-500">{e.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
