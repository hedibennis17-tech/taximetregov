'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, fmtDt, GOV_DECISIONS, REG_ACTIONS, GOV_STATUS } from '@/lib/security-data'

const NAV = [
  {href:'/security/center',    l:'🛡️ Security Center', active:false},
  {href:'/security/monitoring',l:'📡 Monitoring',       active:false},
  {href:'/security/sessions',  l:'🔑 Sessions',         active:false},
  {href:'/governance/center',  l:'⚖️ Gouvernance',      active:true},
  {href:'/privacy/center',     l:'🔒 Confidentialité',  active:false},
]

const WORKFLOW = ['PROPOSITION','→','RÉVISION','→','VALIDATION','→','APPROBATION','→','MISE EN ŒUVRE','→','SURVEILLANCE','→','AUDIT']

const REG_TYPE_CONF: Record<string,{label:string;icon:string;color:string}> = {
  REVIEW:      {label:'Révision',       icon:'🔍', color:'#003DA5'},
  CORRECTION:  {label:'Correction',     icon:'✏️',  color:'#B45309'},
  VERIFICATION:{label:'Vérification',  icon:'🔎', color:'#7C3AED'},
  COMPLIANCE:  {label:'Conformité',    icon:'⚖️',  color:'#059669'},
}
const REG_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  IN_PROGRESS:{label:'En cours',   color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  PENDING:    {label:'En attente', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  RESOLVED:   {label:'Résolu',     color:'#059669', bg:'rgba(5,150,105,0.12)'},
}

export default function GovernanceCenterPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gouvernance Center</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Politiques · Décisions · Actions réglementaires · Responsabilité</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Ce module représente une gouvernance proposée — aucune décision réglementaire réelle</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Décisions actives',     v:GOV_DECISIONS.length,                                       c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'⚖️'},
            {l:'Approuvées',            v:GOV_DECISIONS.filter(d=>d.status==='APPROVED').length,       c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'✅'},
            {l:'En attente',            v:GOV_DECISIONS.filter(d=>['PENDING','UNDER_REVIEW'].includes(d.status)).length, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⏳'},
            {l:'Actions réglementaires',v:REG_ACTIONS.length,                                         c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/10',icon:'📋'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Cycle de gouvernance</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Décisions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Décisions de gouvernance ({GOV_DECISIONS.length})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['ID','Sujet','Organisation','Autorité','Statut','Créé','Note'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {GOV_DECISIONS.map(d=>{
                  const sc = GOV_STATUS[d.status]!
                  return (
                    <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-[9px] font-mono text-slate-500 whitespace-nowrap">{d.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 max-w-xs">{d.subject}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{d.org}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 whitespace-nowrap">{d.authority}</td>
                      <td className="px-4 py-3"><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></td>
                      <td className="px-4 py-3 text-[9px] text-slate-400 whitespace-nowrap">{d.createdAt}</td>
                      <td className="px-4 py-3 text-[9px] text-slate-400 max-w-xs truncate">{d.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions réglementaires */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Actions réglementaires (DÉMO)</div>
          <div className="space-y-2">
            {REG_ACTIONS.map(r=>{
              const tc = REG_TYPE_CONF[r.type]!
              const sc = REG_STATUS_CONF[r.status]!
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 bg-slate-50 dark:bg-slate-800">{tc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.subject}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{r.id} · {tc.label} · {r.driver}</div>
                    <div className="text-[9px] text-slate-500 italic">{r.note}</div>
                  </div>
                  {r.driver && (
                    <Link href={`/drivers/${r.driver.toLowerCase().replace('drv-qc-','drv-demo-')}`} className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0">→ Dossier</Link>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">⚠️ Ces actions représentent des situations à examiner — non des décisions réglementaires réelles. PILOTE DÉMO uniquement.</div>
        </div>

        {/* Liens rapides */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {href:'/audit',          l:'🛡️ Journal audit',    desc:'Traçabilité complète'},
            {href:'/compliance/cases',l:'📁 Dossiers',        desc:'Cas de conformité'},
            {href:'/reports/builder', l:'📊 Rapports',        desc:'Générer un rapport'},
          ].map(l=>(
            <Link key={l.href} href={l.href} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-blue-300 dark:hover:border-blue-500 transition-colors text-center shadow-sm">
              <div className="text-lg mb-1">{l.l.split(' ')[0]}</div>
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{l.l.split(' ').slice(1).join(' ')}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{l.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
