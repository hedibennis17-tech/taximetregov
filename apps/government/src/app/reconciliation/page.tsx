'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { DEMO_RECONCILIATION, DEMO_TRANSACTIONS, PILOT_BANNER } from '@/lib/demo-data'

const SRC_ICON:Record<string,string> = {TAXI:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡'}
const REC_STATUS:Record<string,{label:string;color:string;bg:string;bdr:string}> = {
  RECONCILED:     {label:'Réconcilié',      color:'#059669',bg:'rgba(5,150,105,0.12)', bdr:'rgba(5,150,105,0.30)'},
  REVIEW_REQUIRED:{label:'À vérifier',      color:'#B45309',bg:'rgba(180,83,9,0.10)',  bdr:'rgba(180,83,9,0.30)'},
  EXPLAINED:      {label:'Écart expliqué',  color:'#003DA5',bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.30)'},
  OPEN:           {label:'Non résolu',      color:'#DC2626',bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.30)'},
  RESOLVED:       {label:'Résolu',          color:'#7C3AED',bg:'rgba(124,58,237,0.12)',bdr:'rgba(124,58,237,0.30)'},
}
const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)

const PIPELINE = ['Source A','→','Source B','→','Normalisation','→','Comparaison','→','Écart','→','Explication','→','Résolution','→','Audit']

export default function ReconciliationPage() {
  const [selected, setSelected] = useState<typeof DEMO_RECONCILIATION[0]|null>(null)

  const stats = {
    total:    DEMO_RECONCILIATION.length,
    ok:       DEMO_RECONCILIATION.filter(r=>r.status==='RECONCILED').length,
    review:   DEMO_RECONCILIATION.filter(r=>r.status==='REVIEW_REQUIRED').length,
    open:     DEMO_RECONCILIATION.filter(r=>r.status==='OPEN').length,
    resolved: DEMO_RECONCILIATION.filter(r=>['EXPLAINED','RESOLVED'].includes(r.status)).length,
  }

  return (
    <AppShell>
      <PageHeader title="Réconciliation" subtitle="Rapprochement transactionnel · Données synthétiques pilote"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">
          {PILOT_BANNER} · Un écart n'est pas automatiquement une fraude
        </div>

        {/* Pipeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Workflow de réconciliation</div>
          <div className="flex flex-wrap gap-1 text-[9px]">
            {PIPELINE.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-600':'px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-300 whitespace-nowrap'}>{s}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {label:'Total',      val:stats.total,    color:'text-blue-400',  bg:'bg-blue-500/10'},
            {label:'Réconcilié', val:stats.ok,        color:'text-green-400', bg:'bg-green-500/10'},
            {label:'À vérifier', val:stats.review,    color:'text-amber-400', bg:'bg-amber-500/10'},
            {label:'Non résolu', val:stats.open,      color:'text-red-400',   bg:'bg-red-500/10'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Note importante */}
        <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
          <div className="text-xs font-bold text-blue-400 mb-1">📌 Concept clé</div>
          <div className="text-[10px] text-slate-300 leading-relaxed">
            TAXIMETER.GOV propose de structurer, relier et rapprocher les sources transactionnelles afin de rendre la chaîne vérifiable, sous réserve du cadre légal, des autorisations et des intégrations disponibles.
          </div>
        </div>

        {/* Cas de réconciliation */}
        <div className="space-y-3">
          {DEMO_RECONCILIATION.map(rec=>{
            const sc = REC_STATUS[rec.status]??REC_STATUS['OPEN']!
            const relatedTx = DEMO_TRANSACTIONS.filter(t=>t.rec===rec.id).length
            return (
              <div key={rec.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-qc-blue transition-colors" style={{borderLeft:`4px solid ${sc.bdr}`}} onClick={()=>setSelected(selected?.id===rec.id?null:rec)}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{SRC_ICON[rec.provider]??'⚖️'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-mono">{rec.id}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-1">{rec.provider} · {rec.type.replace(/_/g,' ')} · {relatedTx} transaction(s)</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-500">{rec.note}</div>

                    {selected?.id===rec.id&&(
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {label:'Attendu',    val:money(rec.expected), color:'text-green-400'},
                            {label:'Reçu',       val:money(rec.actual),   color:'text-white'},
                            {label:'Écart',      val:money(rec.diff),     color:rec.diff===0?'text-green-400':'text-red-400'},
                          ].map(r=>(
                            <div key={r.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center border border-slate-700">
                              <div className={`text-sm font-bold ${r.color}`}>{r.val}</div>
                              <div className="text-[9px] text-slate-400 mt-0.5">{r.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Sources */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-700">
                          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Comparaison des sources</div>
                          {[
                            {label:'Source fournisseur',  val:rec.expected>0?money(rec.expected):'Non reçu', status:rec.diff===0?'MATCH':rec.diff>10?'REVIEW':'PARTIAL_MATCH'},
                            {label:'Source chauffeur',    val:rec.actual>0?money(rec.actual):'Non disponible', status:'PARTIAL_MATCH'},
                            {label:'Source gouvernement', val:rec.expected>0?money(rec.expected):'En attente', status:rec.status==='RECONCILED'?'MATCH':'REVIEW'},
                          ].map(s=>{
                            const statusColor = s.status==='MATCH'?'text-green-400':s.status==='PARTIAL_MATCH'?'text-amber-400':'text-red-400'
                            const statusLabel = s.status==='MATCH'?'✓ MATCH':s.status==='PARTIAL_MATCH'?'~ PARTIEL':'⚠ RÉVISION'
                            return (
                              <div key={s.label} className="flex items-center justify-between text-[10px] py-1.5 border-b border-slate-700 last:border-0">
                                <span className="text-slate-500 dark:text-slate-400">{s.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-900 dark:text-white">{s.val}</span>
                                  <span className={`text-[8px] font-bold ${statusColor}`}>{statusLabel}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Transactions liées */}
                        {relatedTx>0&&(
                          <div className="text-[10px] text-blue-400">
                            🔗 {relatedTx} transaction(s) associée(s) — <a href="/transactions" className="underline">Voir dans Transactions →</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl shrink-0">{rec.diff===0?'✅':rec.status==='OPEN'?'🔴':'🟡'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
