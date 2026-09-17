'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Layers, Scale, ShieldAlert, ArrowLeft, X, ChevronDown, ChevronUp } from 'lucide-react'
import { DEMO_RECONCILIATION, DEMO_TRANSACTIONS, PILOT_BANNER, r2 } from '@/lib/demo-data'

const ICON: Record<string,string> = {TAXI:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',SKIP:'🟠'}
const REC_STATUS: Record<string,{label:string;color:string;bg:string;bdr:string}> = {
  RECONCILED:      {label:'Réconcilié',      color:'#059669',bg:'rgba(5,150,105,0.12)', bdr:'rgba(5,150,105,0.30)'},
  REVIEW_REQUIRED: {label:'À vérifier',      color:'#B45309',bg:'rgba(180,83,9,0.10)',  bdr:'rgba(180,83,9,0.30)'},
  EXPLAINED:       {label:'Écart expliqué',  color:'#003DA5',bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.30)'},
  OPEN:            {label:'Non résolu',      color:'#DC2626',bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.30)'},
  RESOLVED:        {label:'Résolu',          color:'#7C3AED',bg:'rgba(124,58,237,0.12)',bdr:'rgba(124,58,237,0.30)'},
}
const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)

const PIPELINE = ['Source A (fournisseur)','→','Source B (chauffeur)','→','Normalisation','→','Comparaison','→','Détection écart','→','Explication','→','Résolution','→','Audit']

const NAV = [
  {href:'/provider-transparency', label:'Vue globale', icon:Layers, active:false},
  {href:'/provider-transparency/transactions', label:'Transactions', icon:Layers, active:false},
  {href:'/provider-transparency/reconciliation', label:'Réconciliation', icon:Scale, active:true},
  {href:'/provider-transparency/exceptions', label:'Exceptions', icon:ShieldAlert, active:false},
]

export default function ReconciliationPage() {
  const [expanded, setExpanded] = useState<string|null>(null)

  const stats = {
    total:   DEMO_RECONCILIATION.length,
    ok:      DEMO_RECONCILIATION.filter(r=>r.status==='RECONCILED').length,
    review:  DEMO_RECONCILIATION.filter(r=>r.status==='REVIEW_REQUIRED').length,
    open:    DEMO_RECONCILIATION.filter(r=>r.status==='OPEN').length,
    resolved:DEMO_RECONCILIATION.filter(r=>['EXPLAINED','RESOLVED'].includes(r.status)).length,
  }

  const totalReconciled = r2(DEMO_RECONCILIATION.filter(r=>r.status==='RECONCILED').reduce((s,r)=>s+r.actual,0))
  const totalOpen       = r2(DEMO_RECONCILIATION.filter(r=>r.status==='OPEN').reduce((s,r)=>s+r.diff,0))
  const totalReview     = r2(DEMO_RECONCILIATION.filter(r=>r.status==='REVIEW_REQUIRED').reduce((s,r)=>s+r.diff,0))

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/provider-transparency" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"><ArrowLeft size={13}/> Vue globale</Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white font-semibold">Moteur de réconciliation · Pilote Q3 2026</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {NAV.map(item=>(
            <Link key={item.href} href={item.href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.active?'bg-qc-blue text-white':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={12}/>{item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">
          {PILOT_BANNER} · Un écart n'est pas automatiquement une fraude
        </div>

        {/* Concept */}
        <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-1">📌 Concept clé — Réconciliation</div>
          <div className="text-[10px] text-slate-300 leading-relaxed">
            TAXIMETER.GOV compare les données issues de plusieurs sources (fournisseur, chauffeur, gouvernement) afin de détecter les écarts, les expliquer et les résoudre. Un écart peut avoir une explication légitime : ajustement, remboursement, format de données différent.
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Workflow de réconciliation</div>
          <div className="flex flex-wrap gap-1 text-[9px]">
            {PIPELINE.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-600':'px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 whitespace-nowrap'}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total dossiers', v:stats.total,       c:'text-blue-400',  bg:'bg-blue-500/10'},
            {l:'Réconciliés',   v:stats.ok,            c:'text-green-400', bg:'bg-green-500/10'},
            {l:'À vérifier',    v:stats.review,        c:'text-amber-400', bg:'bg-amber-500/10'},
            {l:'Non résolu',    v:stats.open,          c:'text-red-400',   bg:'bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Montants synthèse */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Montant réconcilié',  v:money(totalReconciled), c:'text-green-400', bg:'bg-green-500/8'},
            {l:'Écarts à réviser',    v:money(totalReview),     c:'text-amber-400', bg:'bg-amber-500/8'},
            {l:'Non résolu',         v:money(totalOpen),        c:'text-red-400',   bg:'bg-red-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 border border-white/5`}>
              <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Dossiers */}
        <div className="space-y-3">
          {DEMO_RECONCILIATION.map(rec=>{
            const sc = REC_STATUS[rec.status]??REC_STATUS['OPEN']!
            const relatedTx = DEMO_TRANSACTIONS.filter(t=>t.rec===rec.id)
            const isOpen = expanded===rec.id
            return (
              <div key={rec.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden" style={{borderLeft:`4px solid ${sc.bdr}`}}>
                <button className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={()=>setExpanded(isOpen?null:rec.id)}>
                  <span className="text-2xl shrink-0">{ICON[rec.provider]??'⚖️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-white font-mono">{rec.id}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{rec.provider} · {rec.type.replace(/_/g,' ')} · {relatedTx.length} transaction(s) · {rec.period}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{rec.note}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-sm font-black" style={{color:rec.diff===0?'#059669':'#DC2626'}}>{money(rec.diff)}</div>
                    <div className="text-[9px] text-slate-500">écart</div>
                    {isOpen?<ChevronUp size={13} className="text-slate-400"/>:<ChevronDown size={13} className="text-slate-400"/>}
                  </div>
                </button>

                {isOpen&&(
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
                    {/* Montants */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        {l:'Attendu',  v:money(rec.expected), c:'text-green-400'},
                        {l:'Reçu',     v:money(rec.actual),   c:'text-white'},
                        {l:'Écart',    v:money(rec.diff),     c:rec.diff===0?'text-green-400':'text-red-400'},
                      ].map(r=>(
                        <div key={r.l} className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                          <div className={`text-sm font-bold ${r.c}`}>{r.v}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{r.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Comparaison sources */}
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Comparaison 3 sources</div>
                      {[
                        {l:'Source fournisseur',  v:rec.expected>0?money(rec.expected):'Non reçu',      s:rec.diff===0?'MATCH':rec.diff>50000?'REVIEW':'PARTIAL'},
                        {l:'Source chauffeur',    v:rec.actual>0?money(rec.actual):'Non disponible',    s:'PARTIAL'},
                        {l:'Source gouvernement', v:rec.expected>0?money(rec.expected):'En attente',    s:rec.status==='RECONCILED'?'MATCH':'REVIEW'},
                      ].map(r=>{
                        const c = r.s==='MATCH'?{cl:'text-green-400',l:'✓ MATCH'}:r.s==='PARTIAL'?{cl:'text-amber-400',l:'~ PARTIEL'}:{cl:'text-red-400',l:'⚠ RÉVISION'}
                        return (
                          <div key={r.l} className="flex items-center justify-between py-1.5 border-b border-slate-700 last:border-0">
                            <span className="text-[10px] text-slate-400">{r.l}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white">{r.v}</span>
                              <span className={`text-[8px] font-bold ${c.cl}`}>{c.l}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Transactions liées */}
                    {relatedTx.length>0&&(
                      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                        <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Transactions associées ({relatedTx.length})</div>
                        {relatedTx.slice(0,3).map(tx=>(
                          <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-slate-700 last:border-0">
                            <span className="text-[10px] font-mono text-blue-400">{tx.id}</span>
                            <span className="text-[10px] text-green-400 font-bold">{money(tx.driverNet)}</span>
                          </div>
                        ))}
                        {relatedTx.length>3&&<div className="text-[9px] text-slate-500 mt-1">+{relatedTx.length-3} autres…</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
