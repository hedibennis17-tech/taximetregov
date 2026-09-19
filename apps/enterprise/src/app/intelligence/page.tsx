'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, ANOMALIES, ANOMALY_TYPE_CONF, ANOMALY_LEVEL_CONF, DEPARTMENTS, OPS_ACTIVITIES, ANALYTICS_MONTHLY, ENT_DRIVERS } from '@/lib/data'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  'OUVERTE':    {label:'Ouverte',    color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  'À VÉRIFIER': {label:'À vérifier',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  'RÉSOLUE':    {label:'Résolue',   color:'#059669',bg:'rgba(5,150,105,0.12)'},
}
const INSIGHTS = [
  {icon:'📈',type:'TENDANCE',  level:'INFO',     title:'Pic activité — Septembre 2026',     desc:'Septembre 2026 affiche +98% de revenus vs août. Facteurs potentiels: rentrée scolaire, fin de saison touristique, événements locaux. ANALYSE AUTOMATIQUE DEMO.'},
  {icon:'🧾',type:'FISCAL',   level:'IMPORTANT',title:'Déclaration TPS/TVQ Q3 à préparer', desc:`Estimation Q3: ~${money2(412800*0.05)} TPS + ~${money2(412800*0.09975)} TVQ. Échéance: 2026-10-31. 2 exceptions non résolues pourraient affecter les montants. ESTIMATION PILOTE.`},
  {icon:'📄',type:'CONFORMITÉ',level:'IMPORTANT',title:'2 documents expirants (30 sept.)',   desc:'DRV-QC-0004 (permis) et TXM-004 (inspection) expirent dans 12 jours. Impact opérationnel si non renouvelés. ANALYSE AUTOMATIQUE.'},
  {icon:'🍔',type:'EATS',     level:'INFO',     title:'Uber Eats — volume dominant',        desc:'Uber Eats représente ~39% du volume d\'activités et ~41% des revenus synthétiques estimés. Note: obligations fiscales distinctes des rides (Revenu Québec). ANALYSE DEMO.'},
  {icon:'🔄',type:'RECON',    level:'INFO',     title:'Taux de rapprochement: 97.2%',       desc:'13/15 transactions réconciliées. 2 exceptions ouvertes (écart 33,50$ TX-ENT-005; TX manquante). Révision manuelle recommandée. ANALYSE AUTOMATIQUE.'},
  {icon:'📡',type:'CONNEXION',level:'ATTENTION',title:'Token API expirant dans 7 jours',    desc:'Token connexion UBER DEMO expire 2026-09-25. Renouvellement préventif recommandé pour éviter interruption de sync. ALERTE SYSTÈME.'},
]

export default function IntelligencePage() {
  const [tab, setTab] = useState<'overview'|'revenue'|'services'|'anomalies'|'trends'>('overview')
  const [statusF, setStatusF] = useState('ALL')
  const [levelF,  setLevelF]  = useState('ALL')

  const filteredAnom = ANOMALIES.filter(a=>{
    if (statusF!=='ALL' && a.status!==statusF) return false
    if (levelF!=='ALL'  && a.level!==levelF)   return false
    return true
  })

  const active  = DEPARTMENTS.filter(d=>d.status==='ACTIVE')
  const totalGross   = active.reduce((s,d)=>s+d.gross,0)
  const totalTPS     = active.reduce((s,d)=>s+d.tps,0)
  const totalTVQ     = active.reduce((s,d)=>s+d.tvq,0)
  const totalTips    = active.reduce((s,d)=>s+d.tips,0)
  const totalDrivers = active.reduce((s,d)=>s+d.drivers,0)
  const totalActs    = active.reduce((s,d)=>s+d.activities,0)
  const open         = ANOMALIES.filter(a=>a.status!=='RÉSOLUE').length
  const critique     = ANOMALIES.filter(a=>a.level==='CRITIQUE').length

  const maxGross = Math.max(...active.map(d=>d.gross))
  const maxMonth = Math.max(...ANALYTICS_MONTHLY.map(m=>m.gross))

  const FLUX = ['CLIENT','↓','SERVICE','↓','PLATEFORME','↓','TRANSACTION','↓','FRAIS+TIP','↓','TPS/TVQ','↓','CHAUFFEUR','↓','ENTREPRISE','↓','LEDGER']

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Intelligence & Analyses</h1>
          <p className="text-sm text-slate-500 mt-1">Revenus · Services · Tendances · Anomalies · Insights</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · ANALYSE AUTOMATIQUE DEMO · Une anomalie détectée ≠ une irrégularité confirmée · Aucune décision gouvernementale automatique
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([['overview','📊 Vue globale'],['revenue','💰 Revenus'],['services','🏬 Services'],['anomalies','🔍 Anomalies'],['trends','📈 Tendances']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:tab===t?'#000':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#000':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {l:'Revenus bruts (DEMO)',  v:money(totalGross),      c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
                {l:'TPS+TVQ estimées',      v:money(totalTPS+totalTVQ),c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
                {l:'Pourboires (DEMO)',     v:money(totalTips),        c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
                {l:'Chauffeurs (SYNTH.)',   v:totalDrivers.toLocaleString('fr-CA'),c:'#000',bg:'bg-slate-100 dark:bg-slate-800'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-2xl p-4`}>
                  <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                {l:'Activités (DEMO)',    v:(totalActs/1000).toFixed(0)+'k',c:'#000',   bg:'bg-slate-100 dark:bg-slate-800'},
                {l:'Anomalies ouvertes',  v:open,                            c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'Critiques',           v:critique,                        c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'Taux rapprochement',  v:'97.2%',                         c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">💡 Insights automatiques (DEMO)</div>
              <div className="space-y-2">
                {INSIGHTS.map((ins,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background:ins.level==='IMPORTANT'?'rgba(180,83,9,0.06)':ins.level==='ATTENTION'?'rgba(124,58,237,0.06)':'rgba(0,61,165,0.04)'}}>
                    <span className="text-xl shrink-0">{ins.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{ins.title}</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:ins.level==='IMPORTANT'?'#B45309':ins.level==='ATTENTION'?'#7C3AED':'#003DA5'}}>{ins.level}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">{ins.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flux transaction */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Flux transactionnel</div>
              <div className="flex flex-wrap gap-1 items-center">
                {FLUX.map((s,i)=>(
                  <span key={i} className={s==='↓'?'text-slate-300 dark:text-slate-700 font-bold':'text-[8px] font-bold px-2 py-1 rounded-lg'} style={s!=='↓'?{background:'#000',color:'white'}:{}}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REVENUS ── */}
        {tab==='revenue'&&(
          <div className="space-y-4">
            <div className="text-[9px] text-amber-600 dark:text-amber-400 italic">Données synthétiques DEMO — non représentatives des revenus réels d'Uber</div>
            {/* Décomposition financière */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Décomposition financière (DEMO)</div>
              <div className="space-y-3">
                {[
                  {l:'Revenus bruts',        v:totalGross,   pct:100, c:'#059669'},
                  {l:'Part chauffeurs (~75%)',v:totalGross*0.75,pct:75,c:'#003DA5'},
                  {l:'Part entreprise (~25%)',v:totalGross*0.25,pct:25,c:'#000000'},
                  {l:'TPS collectée (5%)',    v:totalTPS,     pct:5,   c:'#7C3AED'},
                  {l:'TVQ collectée (9.975%)',v:totalTVQ,     pct:9.975,c:'#4F46E5'},
                  {l:'Pourboires (DEMO)',     v:totalTips,    pct:Math.round(totalTips/totalGross*100),c:'#003DA5'},
                ].map(r=>(
                  <div key={r.l}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="text-slate-600 dark:text-slate-400">{r.l}</span>
                      <span className="font-black" style={{color:r.c}}>{money(r.v)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${Math.min(r.pct,100)}%`,background:r.c}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Revenus par dept */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Par département (DEMO)</div>
              {active.map(d=>(
                <div key={d.id} className="mb-2.5">
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{d.emoji} {d.name}</span>
                    <div className="flex gap-3">
                      <span className="font-black" style={{color:d.color}}>{money(d.gross)}</span>
                      <span className="text-purple-500">{Math.round(d.gross/totalGross*100)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${(d.gross/maxGross)*100}%`,background:d.color}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab==='services'&&(
          <div className="space-y-3">
            <div className="text-[9px] text-amber-600 dark:text-amber-400 italic">Données synthétiques DEMO · Nb chauffeurs par dept = non publié officiellement</div>
            {active.map(d=>(
              <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${d.color}`}}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{d.emoji}</span>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{d.name}</div>
                    <div className="text-[8px] text-amber-600 dark:text-amber-400 italic">{d.fiscalNote}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black" style={{color:d.color}}>{money(d.gross)}</div>
                    <div className="text-[8px] text-slate-400">{Math.round(d.gross/totalGross*100)}% du total</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {l:'Chauffeurs*', v:d.drivers.toLocaleString('fr-CA')},
                    {l:'Activités',   v:(d.activities/1000).toFixed(0)+'k'},
                    {l:'TPS (DEMO)',  v:money2(d.tps)},
                    {l:'Exceptions',  v:d.exceptions||'—'},
                  ].map(s=>(
                    <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
                      <div className="text-[10px] font-black text-slate-700 dark:text-slate-300">{s.v}</div>
                      <div className="text-[7px] text-slate-400">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-[7px] text-slate-400">* Nb chauffeurs par département: données synthétiques DEMO · Non publiées officiellement par Uber</div>
          </div>
        )}

        {/* ── ANOMALIES ── */}
        {tab==='anomalies'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {l:'Ouvertes',  v:open,    c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'Critiques', v:critique,c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'Résolues',  v:ANOMALIES.filter(a=>a.status==='RÉSOLUE').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['ALL','OUVERTE','À VÉRIFIER','RÉSOLUE'].map(s=>(
                <button key={s} onClick={()=>setStatusF(s)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border cursor-pointer transition-all" style={{background:statusF===s?'#000':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#000':'rgba(148,163,184,0.30)'}}>
                  {s==='ALL'?`Tous (${ANOMALIES.length})`:STATUS_CONF[s]?.label??s}
                </button>
              ))}
              {['ALL','CRITIQUE','IMPORTANT','ATTENTION','INFO'].map(l=>(
                <button key={l} onClick={()=>setLevelF(l)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border cursor-pointer transition-all" style={{background:levelF===l?ANOMALY_LEVEL_CONF[l]?.color??'#64748B':'transparent',color:levelF===l?'white':'#64748B',borderColor:levelF===l?ANOMALY_LEVEL_CONF[l]?.color??'#64748B':'rgba(148,163,184,0.30)'}}>
                  {l==='ALL'?'Tous niveaux':ANOMALY_LEVEL_CONF[l]?.label??l}
                </button>
              ))}
            </div>
            {filteredAnom.map(a=>{
              const tc = ANOMALY_TYPE_CONF[a.type]!
              const lc = ANOMALY_LEVEL_CONF[a.level]!
              const sc = STATUS_CONF[a.status]!
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${lc.color}`}}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{tc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.id}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:lc.color,background:lc.bg}}>{lc.label}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="text-[9px] text-slate-700 dark:text-slate-200">{a.desc}</div>
                      <div className="flex gap-3 text-[8px] text-slate-400 mt-1 flex-wrap">
                        <span>{fmtDt(a.at)}</span>
                        {a.diff!==0&&<span className="font-bold text-red-500">Écart: {money2(a.diff)}</span>}
                      </div>
                    </div>
                    {a.actId&&<Link href="/reconciliation" className="px-2 py-1 rounded-lg text-[8px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">→ Recon</Link>}
                  </div>
                </div>
              )
            })}
            <div className="text-[8px] text-slate-400 text-center italic">Une anomalie ≠ une irrégularité confirmée · Chaque cas nécessite une analyse individuelle · {PILOT}</div>
          </div>
        )}

        {/* ── TENDANCES ── */}
        {tab==='trends'&&(
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Évolution 12 mois — Revenus + Activités (DEMO)</div>
              <div className="text-[9px] text-slate-400 mb-3">Oct 2025 → Sep 2026 · Synthétique</div>
              <div className="flex items-end gap-0.5 h-28 mb-2">
                {ANALYTICS_MONTHLY.map(m=>(
                  <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">{(m.gross/1000).toFixed(0)}k$</div>
                    <div className="w-full rounded-t-sm" style={{height:`${(m.gross/maxMonth)*100}%`,background:'#000'}}/>
                    <div className="text-[6px] text-slate-400 rotate-45 origin-left">{m.m.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-0.5 h-12">
                {ANALYTICS_MONTHLY.map(m=>{
                  const maxA = Math.max(...ANALYTICS_MONTHLY.map(x=>x.acts))
                  return (
                    <div key={m.m} className="flex-1">
                      <div className="w-full rounded-t-sm" style={{height:`${(m.acts/maxA)*100}%`,background:'#06B029'}}/>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 text-[8px] mt-2">
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-black"/><span className="text-slate-500">Revenus</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded" style={{background:'#06B029'}}/><span className="text-slate-500">Activités</span></div>
              </div>
            </div>

            {/* Indicateurs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Indicateurs (DEMO · Non officiels)</div>
              {[
                {l:'Croissance revenus Q3 vs Q2', v:'+38%',  c:'#059669',note:'ANALYSE DEMO'},
                {l:'Croissance activités Q3 vs Q2',v:'+42%', c:'#059669',note:'ANALYSE DEMO'},
                {l:'Taux de conformité indicatif', v:'94%',   c:'#059669',note:'Indicateur administratif'},
                {l:'Taux de rapprochement',        v:'97.2%', c:'#059669',note:'13/15 transactions'},
                {l:'Qualité données',              v:'96%',   c:'#059669',note:'Indicateur technique DEMO'},
                {l:'Anomalies ouvertes',           v:`${open}/7`,c:open>3?'#DC2626':'#B45309',note:'Révision manuelle recommandée'},
              ].map(r=>(
                <div key={r.l} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r.l}</div>
                    <div className="text-[8px] text-slate-400">{r.note}</div>
                  </div>
                  <div className="text-lg font-black" style={{color:r.c}}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
