'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, fmtDt } from '@/lib/enterprise-phase2-data'
import { ALERT_PRIORITY } from '@/lib/enterprise-data'
import { ENT_ALERTS } from '@/lib/enterprise-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'
import { useState } from 'react'
import Link from 'next/link'

export default function Page() {
  const [priorityF, setPriorityF] = useState('ALL')
  const [typeF, setTypeF] = useState('ALL')
  const filtered = ENT_ALERTS.filter(a=>{
    if (priorityF!=='ALL' && a.priority!==priorityF) return false
    if (typeF!=='ALL' && a.type!==typeF) return false
    return true
  })
  const types = [...new Set(ENT_ALERTS.map(a=>a.type))]

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🚨</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Alert Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Documents · Fiscal · Webhook · Sync · Compliance · Réconciliation · PILOTE</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/alerts"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'CRITICAL',v:ENT_ALERTS.filter(a=>a.priority==='CRITICAL').length,c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'HIGH',    v:ENT_ALERTS.filter(a=>a.priority==='HIGH').length,    c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'MEDIUM',  v:ENT_ALERTS.filter(a=>a.priority==='MEDIUM').length,  c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'INFO',    v:ENT_ALERTS.filter(a=>a.priority==='INFO').length,    c:'#64748B',bg:'bg-slate-100 dark:bg-slate-800'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-1.5 flex-wrap">
          {['ALL','CRITICAL','HIGH','MEDIUM','INFO'].map(p=>(
            <button key={p} onClick={()=>setPriorityF(p)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:priorityF===p?'#003DA5':'transparent',color:priorityF===p?'white':'#64748B',borderColor:priorityF===p?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {p==='ALL'?`Toutes (${ENT_ALERTS.length})`:p}
            </button>
          ))}
          {types.map(t=>(
            <button key={t} onClick={()=>setTypeF(t===typeF?'ALL':t)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:typeF===t?'#003DA5':'transparent',color:typeF===t?'white':'#64748B',borderColor:typeF===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t}
            </button>
          ))}
        </div>

        {/* Alertes */}
        <div className="space-y-2">
          {filtered.map(a=>{
            const ent = ENTERPRISES.find(e=>e.id===a.entId)
            const pc = ALERT_PRIORITY[a.priority]!
            return (
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm" style={{borderLeft:`3px solid ${pc.color}`}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.title}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:pc.color,background:pc.bg}}>{a.priority}</span>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{a.type}</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{ent?.tradeName??a.entId} · {fmtDt(a.at)}</div>
                    <div className="text-[9px] text-slate-500 italic mt-0.5">{a.desc}</div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${a.status==='IN_PROGRESS'?'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10':a.status==='INFO'?'text-slate-400 bg-slate-100 dark:bg-slate-800':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{a.status}</span>
                    <Link href={`/admin/enterprises/${a.entId}?tab=alerts`} className="text-[8px] font-bold text-qc-blue hover:underline text-right">→ Fiche</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
