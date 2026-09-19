'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDate, COMPLIANCE_OBLIGATIONS, COMPLIANCE_STATUS_CONF, COMP_CATEGORY_CONF, COMPLIANCE_DEPT_SUMMARY, READINESS_CHECKLIST, ENT_DOCS_FULL, ENT_DRIVERS, DEPARTMENTS, DRIVER_DETAIL } from '@/lib/data'

const PRIORITY_CONF: Record<string,{color:string}> = {
  HIGH:{color:'#DC2626'}, MEDIUM:{color:'#B45309'}, LOW:{color:'#64748B'},
}

export default function CompliancePage() {
  const [tab, setTab] = useState<'overview'|'departements'|'obligations'|'readiness'>('overview')

  const completed = COMPLIANCE_OBLIGATIONS.filter(o=>o.status==='COMPLETED').length
  const score = Math.round((completed/COMPLIANCE_OBLIGATIONS.length)*100)
  const openObl = COMPLIANCE_OBLIGATIONS.filter(o=>['OPEN','PENDING','IN_PROGRESS'].includes(o.status)).length
  const expDocs = ENT_DOCS_FULL.filter(d=>d.status==='EXPIRED'||d.status==='EXPIRING').length
  const issuesDrvs = ENT_DRIVERS.filter(d=>d.status!=='ACTIVE'||d.docs!=='OK').length

  const avgScore = (s:{scores:{admin:number,documents:number,vehicles:number,fiscal:number,data:number}}) =>
    Math.round((s.scores.admin+s.scores.documents+s.scores.vehicles+s.scores.fiscal+s.scores.data)/5)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Conformité entreprise</h1>
            <p className="text-sm text-slate-500 mt-1">Documents · Chauffeurs · Véhicules · Fiscalité · Obligations · Gouvernance</p>
          </div>
          <button className="px-3 py-2 rounded-xl text-[9px] font-bold bg-slate-800 text-white cursor-pointer hover:bg-slate-700 shrink-0">↓ Exporter · DEMO</button>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · Scores = indicateurs administratifs de démonstration — aucune valeur légale ou gouvernementale
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([['overview','📊 Vue globale'],['departements','🏬 Par département'],['obligations','📋 Obligations'],['readiness','🏛️ Prêt gov.']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:tab===t?'#000000':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#000000':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Score global + KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 mb-2">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" stroke={score>=90?'#059669':score>=75?'#B45309':'#DC2626'} strokeDasharray={`${score} ${100-score}`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-black" style={{color:score>=90?'#059669':score>=75?'#B45309':'#DC2626'}}>{score}%</div>
                </div>
                <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400 text-center">Score global (DEMO)</div>
                <div className="text-[7px] text-slate-400 text-center">Indicateur interne</div>
              </div>
              {[
                {l:'Obligations actives', v:openObl,    c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',   icon:'📋'},
                {l:'Docs ⚠️',            v:expDocs,    c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',icon:'📄'},
                {l:'Chauffeurs ⚠️',      v:issuesDrvs, c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',   icon:'👤'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[9px] text-slate-500 text-center">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Scores par dimension */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Scores par dimension (indicateurs DEMO)</div>
              {[
                {l:'Administration',   v:98,c:'#059669'},
                {l:'Documents',        v:94,c:'#059669'},
                {l:'Véhicules',        v:97,c:'#059669'},
                {l:'Fiscalité',        v:96,c:'#059669'},
                {l:'Données/Sync',     v:95,c:'#059669'},
              ].map(s=>(
                <div key={s.l} className="mb-2.5">
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{s.l}</span>
                    <span className="font-black" style={{color:s.c}}>{s.v}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${s.v}%`,background:s.c}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Alertes actives */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes actives</div>
              {COMPLIANCE_OBLIGATIONS.filter(o=>o.status==='PENDING'||o.status==='OPEN').slice(0,5).map(o=>{
                const sc = COMPLIANCE_STATUS_CONF[o.status]!
                const cc = COMP_CATEGORY_CONF[o.category]!
                const overdue = new Date(o.due) < new Date('2026-09-19')
                return (
                  <div key={o.id} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-lg shrink-0">{cc.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{o.label}</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        {overdue&&<span className="text-[7px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">EN RETARD</span>}
                      </div>
                      <div className="text-[9px] text-slate-400">{o.desc} · Échéance: {fmtDate(o.due)}</div>
                    </div>
                    <span className="text-[9px] font-bold shrink-0" style={{color:PRIORITY_CONF[o.priority]?.color??'#64748B'}}>{o.priority}</span>
                  </div>
                )
              })}
              <Link href="#" onClick={()=>setTab('obligations')} className="block text-center text-[9px] font-bold text-qc-blue hover:underline mt-2">→ Voir toutes les obligations</Link>
            </div>
          </div>
        )}

        {/* ── PAR DÉPARTEMENT ── */}
        {tab==='departements'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                    {['Département','Admin.','Documents','Véhicules','Fiscal','Données','Score','Alertes','Exceptions'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[8px] font-bold text-white uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {COMPLIANCE_DEPT_SUMMARY.map(d=>{
                      const avg = avgScore(d)
                      const color = avg>=90?'#059669':avg>=80?'#B45309':'#DC2626'
                      return (
                        <tr key={d.deptId} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span>{d.emoji}</span><span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{d.deptName}</span></div></td>
                          {[d.scores.admin,d.scores.documents,d.scores.vehicles,d.scores.fiscal,d.scores.data].map((v,i)=>(
                            <td key={i} className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                <div className="w-10 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{width:`${v}%`,background:v>=90?'#059669':v>=80?'#B45309':'#DC2626'}}/>
                                </div>
                                <span className="text-[9px] font-bold" style={{color:v>=90?'#059669':v>=80?'#B45309':'#DC2626'}}>{v}%</span>
                              </div>
                            </td>
                          ))}
                          <td className="px-3 py-2.5 font-black text-center" style={{color}}>{avg}%</td>
                          <td className="px-3 py-2.5 text-center">{d.alerts>0?<span className="text-[9px] font-bold text-amber-500">⚠️ {d.alerts}</span>:<span className="text-slate-300 dark:text-slate-700">—</span>}</td>
                          <td className="px-3 py-2.5 text-center">{d.exceptions>0?<span className="text-[9px] font-bold text-red-500">❌ {d.exceptions}</span>:<span className="text-slate-300 dark:text-slate-700">—</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-[8px] text-slate-400 italic text-center">Scores = indicateurs administratifs de démonstration · Aucune valeur légale ou gouvernementale · {PILOT}</div>
          </div>
        )}

        {/* ── OBLIGATIONS ── */}
        {tab==='obligations'&&(
          <div className="space-y-2">
            {COMPLIANCE_OBLIGATIONS.map(o=>{
              const sc = COMPLIANCE_STATUS_CONF[o.status]!
              const cc = COMP_CATEGORY_CONF[o.category]!
              const overdue = new Date(o.due) < new Date('2026-09-19') && o.status!=='COMPLETED'
              return (
                <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${overdue?'#DC2626':sc.color}`}}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{background:`${cc.color}15`}}>{cc.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{o.label}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.icon} {sc.label}</span>
                        <span className="text-[7px] font-bold" style={{color:PRIORITY_CONF[o.priority]?.color??'#64748B'}}>{o.priority}</span>
                        {overdue&&<span className="text-[7px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">🚨 EN RETARD</span>}
                      </div>
                      <div className="text-[9px] text-slate-500">{o.desc}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Échéance: {fmtDate(o.due)} · {o.id} · {cc.label}</div>
                      {o.progress>0&&o.progress<100&&(
                        <div className="mt-1.5">
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500" style={{width:`${o.progress}%`}}/>
                          </div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{o.progress}% complété</div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {o.category==='TAX'&&<Link href="/fiscal" className="px-2 py-1 rounded-lg text-[8px] font-bold bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400">🧾</Link>}
                      {o.category==='RECON'&&<Link href="/reconciliation" className="px-2 py-1 rounded-lg text-[8px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">🔄</Link>}
                      {o.category==='DRIVER'&&<Link href="/drivers" className="px-2 py-1 rounded-lg text-[8px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">👤</Link>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── READINESS GOUVERNEMENTALE ── */}
        {tab==='readiness'&&(
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Préparation à la transmission gouvernementale</div>
              <div className="text-[9px] text-amber-600 dark:text-amber-400 mb-4">⚠️ MODE PILOTE · AUCUNE TRANSMISSION OFFICIELLE · Indicateurs administratifs uniquement</div>
              {READINESS_CHECKLIST.map(item=>(
                <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{item.status==='OK'?'✅':item.status==='WARN'?'⚠️':'❌'}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{item.label}</div>
                    <div className="text-[9px] text-slate-400">{item.note}</div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${item.status==='OK'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':item.status==='WARN'?'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10':'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>
                    {item.status==='OK'?'Prêt':'Attention'}
                  </span>
                </div>
              ))}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl text-[10px] font-bold bg-slate-800 text-white cursor-pointer hover:bg-slate-700">📋 Préparer la transmission · DEMO</button>
                <div className="py-2.5 rounded-xl text-[10px] font-bold text-center bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                  ⛔ Transmettre au gouvernement — Non disponible
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="text-[9px] text-slate-500 leading-relaxed">
                Cette vue de préparation montre que TAXIMETER.GOV pourrait structurer et valider les données d'une entreprise avant leur transmission officielle aux autorités compétentes, lorsque les API, autorisations et cadres légaux nécessaires seront en place.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
