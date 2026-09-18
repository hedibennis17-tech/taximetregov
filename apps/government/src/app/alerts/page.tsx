'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { PILOT, money, fmtDt, ALERTS, PRIORITY_CONF, STATUS_CONF, TYPE_CONF } from '@/lib/compliance-data'

const NAV = [
  {href:'/alerts',           l:`🚨 Alertes`,       active:true},
  {href:'/compliance/cases', l:'📁 Dossiers',       active:false},
  {href:'/audit',            l:'🛡️ Audit',          active:false},
]

export default function AlertsPage() {
  const [filter, setFilter]     = useState('ALL')
  const [priority, setPriority] = useState('ALL')
  const [selected, setSelected] = useState<typeof ALERTS[0]|null>(null)

  const filtered = ALERTS.filter(a => {
    if (filter !== 'ALL' && a.status !== filter) return false
    if (priority !== 'ALL' && a.priority !== priority) return false
    return true
  })

  const stats = {
    total:      ALERTS.length,
    new:        ALERTS.filter(a=>a.status==='NEW').length,
    inAnalysis: ALERTS.filter(a=>a.status==='IN_ANALYSIS').length,
    critical:   ALERTS.filter(a=>a.priority==='CRITICAL').length,
    resolved:   ALERTS.filter(a=>['RESOLVED','FALSE_POSITIVE'].includes(a.status)).length,
  }

  return (
    <AppShell>
      {/* Modal détail alerte */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={()=>setSelected(null)}>
          <div className="w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 rounded bg-slate-200 dark:bg-slate-700 mx-auto mb-4"/>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selected.icon}</span>
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{selected.title}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{selected.id}</div>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"><X size={14} className="text-slate-500"/></button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(() => {
                const pc = PRIORITY_CONF[selected.priority]!
                const sc = STATUS_CONF[selected.status]!
                return <>
                  <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{color:pc.color,background:pc.bg}}>{pc.label}</span>
                  <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  <span className="text-[9px] px-2 py-1 rounded-full font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">DÉMO</span>
                </>
              })()}
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4">
              <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">{selected.desc}</div>
            </div>
            <div className="space-y-0 mb-4">
              {[
                {l:'Date', v:fmtDt(selected.date)},
                {l:'Type', v:TYPE_CONF[selected.type]?.label??selected.type},
                {l:'Source', v:selected.source},
                ...(selected.driver?[{l:'Chauffeur', v:`${selected.driver} · ${selected.driverNum}`}]:[]),
                ...(selected.txId?[{l:'Transaction', v:selected.txId}]:[]),
                ...(selected.amount>0?[{l:'Montant écart', v:money(selected.amount)}]:[]),
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-xl mb-4">
              ⚠️ Cette alerte représente une situation à examiner — elle ne constitue pas automatiquement une infraction. {PILOT}
            </div>
            <div className="flex gap-2 flex-wrap">
              {selected.caseId && <Link href={`/compliance/cases`} onClick={()=>setSelected(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white text-center hover:bg-blue-700">→ Ouvrir dossier {selected.caseId}</Link>}
              {selected.driverId && <Link href={`/drivers/${selected.driverId}`} onClick={()=>setSelected(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200">→ Dossier chauffeur</Link>}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre de conformité</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Alertes · Détection · Analyse · Traçabilité · TAXIMETER.GOV</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total alertes',  v:stats.total,      c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',    icon:'🚨'},
            {l:'Nouvelles',      v:stats.new,        c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',    icon:'🔵'},
            {l:'En analyse',     v:stats.inAnalysis, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10',  icon:'🔍'},
            {l:'Critiques',      v:stats.critical,   c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',      icon:'🔴'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Chaîne de détection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chaîne de traitement</div>
          <div className="flex items-center gap-1 flex-wrap text-[9px] font-bold">
            {['DÉTECTION','→','🚨 ALERTE','→','📁 DOSSIER','→','🔍 ANALYSE','→','📝 JUSTIFICATION','→','✅ RÉSOLUTION','→','🛡️ AUDIT'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg text-[8px]'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {[
            {v:'ALL',label:'Toutes'},
            {v:'NEW',label:'Nouvelles'},
            {v:'IN_ANALYSIS',label:'En analyse'},
            {v:'INFO_REQUESTED',label:'Info demandée'},
            {v:'RESOLVED',label:'Résolues'},
            {v:'FALSE_POSITIVE',label:'Faux positifs'},
          ].map(f=>(
            <button key={f.v} onClick={()=>setFilter(f.v)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:filter===f.v?'#003DA5':'transparent',color:filter===f.v?'white':'#64748B',borderColor:filter===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>{f.label}</button>
          ))}
          <select value={priority} onChange={e=>setPriority(e.target.value)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
            <option value="ALL">Toutes priorités</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(p=><option key={p} value={p}>{PRIORITY_CONF[p]!.label}</option>)}
          </select>
        </div>

        {/* Liste alertes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} alerte(s)</span>
            <span className="text-[9px] text-slate-400">Cliquer pour détail · DÉMO</span>
          </div>
          {filtered.map(a => {
            const pc = PRIORITY_CONF[a.priority]!
            const sc = STATUS_CONF[a.status]!
            const tc = TYPE_CONF[a.type]
            return (
              <div key={a.id} onClick={()=>setSelected(a)}
                className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                style={{borderLeft:`3px solid ${pc.color}`}}>
                <span className="text-2xl shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{a.title}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:pc.color,background:pc.bg}}>{pc.label}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-1">{a.desc.slice(0,80)}…</div>
                  <div className="flex gap-3 text-[9px] text-slate-400 flex-wrap">
                    <span className="font-mono">{a.id}</span>
                    {a.driver&&<span>👤 {a.driver}</span>}
                    <span>📡 {a.source}</span>
                    {a.amount>0&&<span className="font-bold text-red-500">Écart: {money(a.amount)}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-slate-400">{fmtDt(a.date)}</div>
                  {a.caseId&&<div className="text-[8px] font-bold text-blue-600 dark:text-blue-400 mt-1">📁 {a.caseId}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
