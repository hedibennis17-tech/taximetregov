'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, fmtDate, COMPLIANCE_OBLIGATIONS, COMPLIANCE_STATUS_CONF, COMP_CATEGORY_CONF } from '@/lib/data'

const PRIORITY_CONF: Record<string,{label:string;color:string}> = {
  HIGH:  {label:'Haute',  color:'#DC2626'},
  MEDIUM:{label:'Moyenne',color:'#B45309'},
  LOW:   {label:'Basse',  color:'#64748B'},
}

export default function CompliancePage() {
  const [catF, setCatF] = useState('ALL')
  const [statusF, setStatusF] = useState('ALL')

  const filtered = COMPLIANCE_OBLIGATIONS.filter(o=>{
    if (catF!=='ALL'    && o.category!==catF)  return false
    if (statusF!=='ALL' && o.status!==statusF) return false
    return true
  })

  const score = Math.round(
    (COMPLIANCE_OBLIGATIONS.filter(o=>o.status==='COMPLETED').length / COMPLIANCE_OBLIGATIONS.length) * 100
  )
  const open    = COMPLIANCE_OBLIGATIONS.filter(o=>['OPEN','PENDING','IN_PROGRESS'].includes(o.status)).length
  const upcoming= COMPLIANCE_OBLIGATIONS.filter(o=>o.status==='UPCOMING').length
  const high    = COMPLIANCE_OBLIGATIONS.filter(o=>o.priority==='HIGH' && o.status!=='COMPLETED').length

  const cats = [...new Set(COMPLIANCE_OBLIGATIONS.map(o=>o.category))]

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Conformité</h1>
          <p className="text-sm text-slate-500 mt-1">Fiscal · Documents · Chauffeurs · Véhicules · Connexions · Rapports</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Le score de conformité est un indicateur administratif interne — aucune valeur légale ou gouvernementale
        </div>

        {/* Score + KPI */}
        <div className="grid grid-cols-4 gap-3">
          {/* Donut score */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                  stroke={score>=80?'#059669':score>=60?'#B45309':'#DC2626'}
                  strokeDasharray={`${score} ${100-score}`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{color:score>=80?'#059669':score>=60?'#B45309':'#DC2626'}}>{score}%</div>
            </div>
            <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400 text-center">Score conformité</div>
            <div className="text-[7px] text-slate-400 text-center">Indicateur interne</div>
          </div>
          {[
            {l:'Actions requises', v:open,    c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',   icon:'🔴'},
            {l:'À venir',          v:upcoming,c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',icon:'📅'},
            {l:'Haute priorité',   v:high,    c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',   icon:'🚨'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 text-center mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Cycle de conformité</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['OBLIGATION CRÉÉE','→','NOTIFICATION','→','ACTION ENTREPRISE','→','DOCUMENT/DONNÉE','→','VALIDATION','→','COMPLÉTÉ','→','AUDIT'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={()=>setCatF('ALL')} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:catF==='ALL'?'#003DA5':'transparent',color:catF==='ALL'?'white':'#64748B',borderColor:catF==='ALL'?'#003DA5':'rgba(148,163,184,0.30)'}}>Toutes catégories</button>
            {cats.map(c=>{
              const cc = COMP_CATEGORY_CONF[c]!
              return (
                <button key={c} onClick={()=>setCatF(c)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:catF===c?cc.color:'transparent',color:catF===c?'white':'#64748B',borderColor:catF===c?cc.color:'rgba(148,163,184,0.30)'}}>
                  {cc.icon} {cc.label}
                </button>
              )
            })}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['ALL','OPEN','PENDING','IN_PROGRESS','UPCOMING','COMPLETED'].map(s=>{
              const sc = s==='ALL'?null:COMPLIANCE_STATUS_CONF[s]
              return (
                <button key={s} onClick={()=>setStatusF(s)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:statusF===s?'#7C3AED':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#7C3AED':'rgba(148,163,184,0.30)'}}>
                  {s==='ALL'?`Tous (${COMPLIANCE_OBLIGATIONS.length})`:sc?`${sc.icon} ${sc.label}`:s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Liste obligations */}
        <div className="space-y-2">
          {filtered.map(o=>{
            const sc  = COMPLIANCE_STATUS_CONF[o.status]!
            const cc  = COMP_CATEGORY_CONF[o.category]!
            const pc  = PRIORITY_CONF[o.priority]!
            const overdue = new Date(o.due) < new Date('2026-09-19') && o.status!=='COMPLETED'
            return (
              <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${overdue?'#DC2626':sc.color}`}}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{background:`${cc.color}15`}}>{cc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{o.label}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.icon} {sc.label}</span>
                      <span className="text-[7px] font-bold" style={{color:pc.color}}>{pc.label} priorité</span>
                      {overdue&&<span className="text-[7px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">🚨 EN RETARD</span>}
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">{o.desc}</div>
                    <div className="flex items-center gap-3 text-[9px] flex-wrap">
                      <span className={`font-bold ${overdue?'text-red-500':'text-slate-500'}`}>Échéance: {fmtDate(o.due)}</span>
                      <span className="text-slate-400 font-mono">{o.id}</span>
                      <span style={{color:cc.color}}>{cc.label}</span>
                    </div>
                    {/* Barre progression */}
                    {o.progress>0&&o.progress<100&&(
                      <div className="mt-2">
                        <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                          <span>Progression</span><span>{o.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{width:`${o.progress}%`}}/>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Action rapide */}
                  <div className="shrink-0">
                    {o.category==='TAX'&&<Link href="/obligations" className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 whitespace-nowrap">🧾 Voir</Link>}
                    {o.category==='RECON'&&<Link href="/reconciliation" className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 whitespace-nowrap">🔄 Voir</Link>}
                    {o.category==='DRIVER'&&<Link href="/drivers" className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 whitespace-nowrap">👤 Voir</Link>}
                    {o.category==='VEHICLE'&&<Link href="/vehicles" className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-100 whitespace-nowrap">🚗 Voir</Link>}
                    {o.category==='CONNECTION'&&<Link href="/connections" className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 whitespace-nowrap">🔌 Voir</Link>}
                    {o.category==='REPORTING'&&<Link href="/reports" className="px-2.5 py-1.5 rounded-xl text-[8px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 whitespace-nowrap">📊 Voir</Link>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="text-[9px] text-slate-500 leading-relaxed">
            📋 Le score de conformité affiché est un indicateur administratif généré automatiquement à partir des données du pilote. Il ne constitue pas une évaluation juridique, réglementaire ou gouvernementale. Les obligations réelles d'une entreprise doivent être déterminées avec des conseillers juridiques et comptables compétents.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
