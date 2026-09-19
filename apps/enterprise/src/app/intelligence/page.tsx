'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, ANOMALIES, ANOMALY_TYPE_CONF, ANOMALY_LEVEL_CONF, ENT_DRIVERS, DEPARTMENTS } from '@/lib/data'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  'OUVERTE':    {label:'Ouverte',     color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  'À VÉRIFIER': {label:'À vérifier', color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  'RÉSOLUE':    {label:'Résolue',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'FERMÉE':     {label:'Fermée',     color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}

const INSIGHTS = [
  {icon:'📈',type:'TENDANCE',  title:'Pic activité — Septembre',      desc:'Sept 2026 affiche une hausse de +98% vs août (+61 400$ → +121 600$ revenus) — potentiellement lié à rentrée scolaire et congés de travail.',level:'INFO'},
  {icon:'🧾',type:'FISCAL',   title:'TPS/TVQ Q3 à déclarer',         desc:`Estimation TPS/TVQ Q3 : ${money2(412_800*0.05)} TPS + ${money2(412_800*0.09975)} TVQ. Préparation déclaration recommandée avant l'échéance du 2026-10-31.`,level:'IMPORTANT'},
  {icon:'📄',type:'CONFORMITÉ',title:'2 documents expirants',         desc:'DRV-QC-0004 et TXM-004 expirent le 2026-09-30 (12 jours). Renouvellement urgent recommandé pour maintenir la conformité opérationnelle.',level:'IMPORTANT'},
  {icon:'🔄',type:'RECON',    title:'Taux de rapprochement : 97.2%', desc:'13 transactions sur 15 réconciliées. 2 exceptions ouvertes (écart 33.50$, TX manquante 16.50$) — analyse en cours.',level:'INFO'},
  {icon:'🍔',type:'EATS',     title:'Uber Eats — croissance',        desc:'Le département Eats représente 39% du volume total d\'activités et 41% des revenus synthétiques. Note: obligations fiscales distinctes des rides.',level:'INFO'},
  {icon:'🔌',type:'CONNEXION',title:'Token API UBER à renouveler',   desc:'2 webhooks Uber avec tentatives multiples. Vérifier l\'état du token d\'authentification de la connexion UBER DEMO.',level:'ATTENTION'},
]

const LEVEL_COLORS: Record<string,string> = {IMPORTANT:'#DC2626',ATTENTION:'#B45309',INFO:'#003DA5'}
const LEVEL_BGS: Record<string,string>    = {IMPORTANT:'rgba(220,38,38,0.08)',ATTENTION:'rgba(180,83,9,0.08)',INFO:'rgba(0,61,165,0.08)'}

export default function IntelligencePage() {
  const [statusF,setStatusF] = useState('ALL')
  const [levelF, setLevelF]  = useState('ALL')

  const filtered = ANOMALIES.filter(a=>{
    if (statusF!=='ALL' && a.status!==statusF) return false
    if (levelF!=='ALL'  && a.level!==levelF)  return false
    return true
  })

  const open     = ANOMALIES.filter(a=>a.status==='OUVERTE'||a.status==='À VÉRIFIER').length
  const critique = ANOMALIES.filter(a=>a.level==='CRITIQUE').length
  const resolved = ANOMALIES.filter(a=>a.status==='RÉSOLUE').length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Intelligence & Anomalies</h1>
          <p className="text-sm text-slate-500 mt-1">Détection automatique · Insights · Alertes · Priorités</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Anomalies détectées automatiquement par TAXIMETER.GOV · Une anomalie ≠ une irrégularité confirmée
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Anomalies ouvertes',v:open,      c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',    icon:'🔴'},
            {l:'Critiques',         v:critique,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',    icon:'🚨'},
            {l:'Résolues',          v:resolved,  c:'#059669',bg:'bg-green-50 dark:bg-green-500/10',icon:'✅'},
            {l:'Total anomalies',   v:ANOMALIES.length,c:'#64748B',bg:'bg-slate-100 dark:bg-slate-800',icon:'📋'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Insights automatiques */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">💡 Insights automatiques (DEMO)</div>
          <div className="space-y-2">
            {INSIGHTS.map((ins,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{background:LEVEL_BGS[ins.level]??'transparent',borderColor:`rgba(${ins.level==='IMPORTANT'?'220,38,38':ins.level==='ATTENTION'?'180,83,9':'0,61,165'},0.15)`}}>
                <span className="text-xl shrink-0">{ins.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{ins.title}</span>
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:LEVEL_COLORS[ins.level]??'#64748B'}}>{ins.level}</span>
                  </div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed">{ins.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres anomalies */}
        <div className="flex gap-1.5 flex-wrap">
          {['ALL','OUVERTE','À VÉRIFIER','RÉSOLUE'].map(s=>(
            <button key={s} onClick={()=>setStatusF(s)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:statusF===s?'#000':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#000':'rgba(148,163,184,0.30)'}}>
              {s==='ALL'?`Tous (${ANOMALIES.length})`:STATUS_CONF[s]?.label??s}
            </button>
          ))}
          {['ALL','CRITIQUE','IMPORTANT','ATTENTION','INFO'].map(l=>(
            <button key={l} onClick={()=>setLevelF(l)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:levelF===l?ANOMALY_LEVEL_CONF[l]?.color??'#64748B':'transparent',color:levelF===l?'white':'#64748B',borderColor:levelF===l?ANOMALY_LEVEL_CONF[l]?.color??'#64748B':'rgba(148,163,184,0.30)'}}>
              {l==='ALL'?'Tous niveaux':ANOMALY_LEVEL_CONF[l]?.label??l}
            </button>
          ))}
        </div>

        {/* Liste anomalies */}
        <div className="space-y-2">
          {filtered.map(a=>{
            const tc = ANOMALY_TYPE_CONF[a.type]!
            const lc = ANOMALY_LEVEL_CONF[a.level]!
            const sc = STATUS_CONF[a.status]!
            const dept = DEPARTMENTS.find(d=>d.slug===a.dept)
            return (
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${lc.color}`}}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{tc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.id}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:lc.color,background:lc.bg}}>{lc.label}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      {dept&&<span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{color:dept.color,background:`${dept.color}15`}}>{dept.emoji} {dept.name}</span>}
                    </div>
                    <div className="text-[9px] text-slate-700 dark:text-slate-200 mb-1">{a.desc}</div>
                    <div className="flex gap-3 text-[8px] text-slate-400 flex-wrap">
                      <span>{fmtDt(a.at)}</span>
                      <span>Source: {a.src}</span>
                      {a.actId&&<span>Activité: {a.actId}</span>}
                      {a.txId&&<span>TX: {a.txId}</span>}
                      {a.diff!==0&&<span className="font-bold text-red-500">Écart: {money2(a.diff)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {a.actId&&<Link href="/reconciliation" className="px-2 py-1 rounded-lg text-[8px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 whitespace-nowrap">→ Recon</Link>}
                    {(a.type==='DOC_EXPIRÉ'||a.type==='INSPECTION')&&<Link href="/documents" className="px-2 py-1 rounded-lg text-[8px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 whitespace-nowrap">→ Docs</Link>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-[8px] text-slate-400 text-center italic">
          Une anomalie détectée automatiquement n'implique pas une irrégularité — chaque cas fait l'objet d'une analyse individuelle · {PILOT}
        </div>
      </div>
    </AppShell>
  )
}
