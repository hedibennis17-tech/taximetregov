'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { PILOT, fmtDt, DATA_QUALITY, DQ_STATUS, PRIORITY_CONF, TYPE_ICONS } from '@/lib/operations-data'

const NAV = [
  {href:'/tasks',                  l:'📋 Tâches',          active:false},
  {href:'/approvals',              l:'🔐 Approbations',    active:false},
  {href:'/operations/calendar',    l:'📅 Calendrier',      active:false},
  {href:'/operations/data-quality',l:'🧹 Qualité données', active:true},
]

export default function DataQualityPage() {
  const [items, setItems] = useState(DATA_QUALITY)
  const resolve = (id: string) => setItems(prev=>prev.map(d=>d.id===id?{...d,status:'RESOLVED'}:d))

  const resolved = items.filter(d=>d.status==='RESOLVED').length
  const total    = items.length
  const score    = Math.round((1 - (total-resolved)/total*0.15) * 100)
  const pending  = items.filter(d=>d.status!=='RESOLVED').length

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Qualité des données</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Contrôles · Anomalies · Intégrité · Complétude · TAXIMETER.GOV</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Indicateur technique des données — pas un score de conformité personnelle</div>

        {/* Score global */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:`3px solid ${score>=95?'#059669':score>=85?'#B45309':'#DC2626'}`}}>
          <div className="flex items-center gap-5">
            {/* Donut SVG */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                  stroke={score>=95?'#059669':score>=85?'#B45309':'#DC2626'}
                  strokeDasharray={`${score} ${100-score}`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black" style={{color:score>=95?'#059669':score>=85?'#B45309':'#DC2626'}}>{score}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Score de qualité global — TAXIMETER.GOV DEMO</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {l:'Complètes',    v:`${score}%`,          c:'#059669'},
                  {l:'À traiter',    v:`${pending} contrôle(s)`, c:'#B45309'},
                  {l:'Résolus',      v:`${resolved}/${total}`,c:'#003DA5'},
                ].map(s=>(
                  <div key={s.l}>
                    <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
                    <div className="text-[9px] text-slate-400">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Répartition par type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Intégrité',     v:items.filter(d=>d.type==='INTEGRITY').length,    c:'#003DA5', icon:'🔗', bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Complétude',    v:items.filter(d=>d.type==='COMPLETENESS').length,  c:'#B45309', icon:'📋', bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Doublons',      v:items.filter(d=>d.type==='DUPLICATE').length,     c:'#7C3AED', icon:'🔄', bg:'bg-purple-50 dark:bg-purple-500/10'},
            {l:'Fiscal',        v:items.filter(d=>d.type==='FISCAL').length,        c:'#059669', icon:'🧾', bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste contrôles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
            Contrôles de qualité — {items.length} vérifications
          </div>
          {items.map(d=>{
            const sc  = DQ_STATUS[d.status]!
            const pc  = PRIORITY_CONF[d.priority]!
            const isDone = d.status==='RESOLVED'
            return (
              <div key={d.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{borderLeft:`3px solid ${isDone?'#059669':pc.color}`}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5" style={{background:isDone?'rgba(5,150,105,0.10)':'rgba(0,61,165,0.08)'}}>
                  {isDone?<CheckCircle size={14} className="text-green-600 dark:text-green-400"/>:<AlertTriangle size={14} className="text-amber-600 dark:text-amber-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.check}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    <span className="text-[8px] font-bold" style={{color:pc.color}}>{pc.label}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mb-1">{d.id} · {d.source} · Type: {d.type}</div>
                  <div className="text-[10px] text-slate-500 mb-1">{d.note}</div>
                  <div className="flex items-center gap-3 text-[9px] text-slate-400 flex-wrap">
                    <span className="font-bold" style={{color:d.count>0?'#DC2626':'#059669'}}>{d.count} occurrence(s)</span>
                    <span>Vérifié: {fmtDt(d.lastCheck)}</span>
                    {d.link && <Link href={d.link} className="text-blue-600 dark:text-blue-400 hover:underline font-bold">→ Module source</Link>}
                  </div>
                </div>
                {!isDone && (
                  <button onClick={()=>resolve(d.id)} className="shrink-0 px-2.5 py-1.5 rounded-xl text-[9px] font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 text-green-700 dark:text-green-400 hover:bg-green-100 cursor-pointer whitespace-nowrap">
                    ✅ Résoudre
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Guide */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">📋 À propos du score de qualité</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Le score de qualité mesure l'intégrité technique des données dans TAXIMETER.GOV (complétude, cohérence, intégrité relationnelle). Il ne constitue pas une mesure de conformité réglementaire d'un chauffeur ou d'une entreprise. Toutes les données sont synthétiques.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
