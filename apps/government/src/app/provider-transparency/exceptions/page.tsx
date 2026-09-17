'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Layers, Scale, ShieldAlert, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { DEMO_TRANSACTIONS, DEMO_RECONCILIATION, DEMO_WEBHOOKS, PILOT_BANNER, r2 } from '@/lib/demo-data'

const ICON: Record<string,string> = {TAXI:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',SKIP:'🟠'}
const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))

// Construire les exceptions à partir des données DEMO
const EXCEPTIONS = [
  // Écarts de montants
  ...DEMO_TRANSACTIONS.filter(t=>t.status==='REVIEW_REQUIRED').map(t=>({
    id:`EXC-DEMO-${t.id.slice(-4)}`,
    type:'REVENUE_MISMATCH', severity:'HIGH' as const,
    provider:t.provider, txId:t.id, actId:t.actId,
    desc:`Écart entre montant fournisseur et Revenue Ledger — ${t.provider}`,
    expected:t.clientAmt, actual:r2(t.clientAmt+t.adj), diff:Math.abs(t.adj),
    status:'OPEN', period:t.period, at:t.at,
    note:`Ajustement de ${money(Math.abs(t.adj))} détecté. Révision requise avant clôture de période.`,
  })),
  // Transactions manquantes
  ...DEMO_RECONCILIATION.filter(r=>r.status==='OPEN').map(r=>({
    id:`EXC-DEMO-${r.id.slice(-4)}`,
    type:'MISSING_TRANSACTION', severity:'HIGH' as const,
    provider:r.provider, txId:null, actId:null,
    desc:`Transaction attendue non reçue — ${r.provider} · ${r.period}`,
    expected:r.expected, actual:r.actual, diff:r.diff,
    status:'OPEN', period:r.period, at:'2026-09-15T14:31:00Z',
    note:r.note,
  })),
  // Données tip manquantes
  ...DEMO_TRANSACTIONS.filter(t=>t.status==='MISSING_TIP_DATA').map(t=>({
    id:`EXC-DEMO-TIP-${t.id.slice(-4)}`,
    type:'MISSING_PROVIDER_DATA', severity:'MEDIUM' as const,
    provider:t.provider, txId:t.id, actId:t.actId,
    desc:`Données pourboire absentes dans payload fournisseur — ${t.provider}`,
    expected:0, actual:0, diff:0,
    status:'MONITORING', period:t.period, at:t.at,
    note:`Le champ tip_amount est absent du webhook ${t.provider}. Aucun écart financier confirmé — surveillance active.`,
  })),
  // Doublons détectés
  ...DEMO_WEBHOOKS.filter(w=>w.status==='DUPLICATE_DETECTED').map((w,i)=>({
    id:`EXC-DEMO-DUP-${String(i+1).padStart(3,'0')}`,
    type:'DUPLICATE_ACTIVITY', severity:'LOW' as const,
    provider:w.provider, txId:w.txId, actId:null,
    desc:`Événement webhook en doublon — ${w.provider} · ${w.eventType}`,
    expected:0, actual:0, diff:0,
    status:'RESOLVED', period:'2026-Q3', at:w.received,
    note:`Doublon détecté et bloqué. Transaction originale conservée. Aucun impact financier.`,
  })),
  // Écart TVQ Uber (cas spécial)
  {
    id:'EXC-DEMO-TVQ-001',
    type:'TAX_MISMATCH', severity:'HIGH' as const,
    provider:'UBER', txId:'TX-DEMO-1001', actId:'ACT-DEMO-001',
    desc:'TVQ non perçue dans payload Uber — Q3 2026',
    expected:r2(284750*0.09975), actual:r2(284750*0.05), diff:r2(284750*0.04975),
    status:'REVIEW_REQUIRED', period:'2026-Q3', at:'2026-09-17T08:41:00Z',
    note:`Uber ne transmet que la TPS dans son payload. La TVQ est calculée par le moteur fiscal TAXIMETER.GOV. Écart de ${money(r2(284750*0.04975))} à régulariser.`,
  },
]

const TYPE_CONF: Record<string,{label:string;icon:string;color:string;bg:string}> = {
  REVENUE_MISMATCH:      {label:'Écart de revenu',          icon:'💰', color:'text-amber-400', bg:'bg-amber-500/10'},
  MISSING_TRANSACTION:   {label:'Transaction manquante',     icon:'❓', color:'text-red-400',   bg:'bg-red-500/10'},
  MISSING_PROVIDER_DATA: {label:'Données manquantes',        icon:'📭', color:'text-blue-400',  bg:'bg-blue-500/10'},
  DUPLICATE_ACTIVITY:    {label:'Doublon détecté',           icon:'🔄', color:'text-purple-400',bg:'bg-purple-500/10'},
  TAX_MISMATCH:          {label:'Écart fiscal TPS/TVQ',      icon:'🧾', color:'text-red-400',   bg:'bg-red-500/10'},
}
const SEV_CONF: Record<string,{color:string;bg:string}> = {
  HIGH:   {color:'#DC2626', bg:'rgba(220,38,38,0.12)'},
  MEDIUM: {color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  LOW:    {color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
}
const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  OPEN:             {label:'Non résolu',   color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  REVIEW_REQUIRED:  {label:'À réviser',   color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  MONITORING:       {label:'Surveillance',color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  RESOLVED:         {label:'Résolu',      color:'#059669', bg:'rgba(5,150,105,0.12)'},
}

const EXCEPTION_TYPES = ['Tous', 'REVENUE_MISMATCH', 'MISSING_TRANSACTION', 'MISSING_PROVIDER_DATA', 'DUPLICATE_ACTIVITY', 'TAX_MISMATCH']

const NAV = [
  {href:'/provider-transparency', label:'Vue globale', icon:Layers, active:false},
  {href:'/provider-transparency/transactions', label:'Transactions', icon:Layers, active:false},
  {href:'/provider-transparency/reconciliation', label:'Réconciliation', icon:Scale, active:false},
  {href:'/provider-transparency/exceptions', label:'Exceptions', icon:ShieldAlert, active:true},
]

export default function ExceptionsPage() {
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [expanded, setExpanded] = useState<string|null>(null)

  const filtered = typeFilter==='Tous' ? EXCEPTIONS : EXCEPTIONS.filter(e=>e.type===typeFilter)
  const stats = {
    total:   EXCEPTIONS.length,
    high:    EXCEPTIONS.filter(e=>e.severity==='HIGH').length,
    open:    EXCEPTIONS.filter(e=>e.status==='OPEN'||e.status==='REVIEW_REQUIRED').length,
    resolved:EXCEPTIONS.filter(e=>e.status==='RESOLVED').length,
  }
  const totalImpact = r2(EXCEPTIONS.filter(e=>e.diff>0).reduce((s,e)=>s+e.diff,0))

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/provider-transparency" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"><ArrowLeft size={13}/> Vue globale</Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white font-semibold">Centre des exceptions · Pilote Q3 2026</span>
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
          {PILOT_BANNER} · Une exception n'est jamais automatiquement une fraude
        </div>

        {/* Concept */}
        <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <div className="text-xs font-bold text-red-400 mb-1">⚠️ Centre des exceptions</div>
          <div className="text-[10px] text-slate-300 leading-relaxed">
            Les exceptions représentent des situations qui nécessitent une attention administrative : écarts de montants, données manquantes, doublons, divergences fiscales. Chaque exception fait l'objet d'une analyse avant toute conclusion.
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Exceptions',     v:stats.total,              c:'text-red-400',   bg:'bg-red-500/10'},
            {l:'Sévérité haute', v:stats.high,               c:'text-red-400',   bg:'bg-red-500/10'},
            {l:'À traiter',      v:stats.open,               c:'text-amber-400', bg:'bg-amber-500/10'},
            {l:'Résolues',       v:stats.resolved,           c:'text-green-400', bg:'bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Impact total */}
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Impact financier total des exceptions ouvertes</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Montant cumulé des écarts à résoudre · Données pilotes Q3 2026</div>
          </div>
          <div className="text-2xl font-black text-red-400">{money(totalImpact)}</div>
        </div>

        {/* Filtres type */}
        <div className="flex gap-1.5 flex-wrap">
          {EXCEPTION_TYPES.map(tp=>{
            const conf = tp==='Tous' ? null : TYPE_CONF[tp]
            return (
              <button key={tp} onClick={()=>setTypeFilter(tp)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all" style={{
                background:typeFilter===tp?'#003DA5':'rgba(255,255,255,0.04)',
                color:typeFilter===tp?'white':'#94A3B8',
                borderColor:typeFilter===tp?'#003DA5':'rgba(255,255,255,0.08)',
              }}>
                {conf?`${conf.icon} `:'🗂️ '}{tp==='Tous'?`Tous (${EXCEPTIONS.length})`:conf?.label??tp}
              </button>
            )
          })}
        </div>

        {/* Liste exceptions */}
        <div className="space-y-2">
          {filtered.map(exc=>{
            const tc = TYPE_CONF[exc.type]??{label:exc.type,icon:'⚠️',color:'text-slate-400',bg:'bg-slate-800'}
            const sc = SEV_CONF[exc.severity]??SEV_CONF['LOW']!
            const stc = STATUS_CONF[exc.status]??STATUS_CONF['OPEN']!
            const isOpen = expanded===exc.id
            return (
              <div key={exc.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden" style={{borderLeft:`3px solid ${sc.color}`}}>
                <button className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-800/30 cursor-pointer" onClick={()=>setExpanded(isOpen?null:exc.id)}>
                  <span className="text-xl shrink-0">{tc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-white font-mono">{exc.id}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${tc.color} ${tc.bg}`}>{tc.label}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{exc.severity}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:stc.color,background:stc.bg}}>{stc.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{ICON[exc.provider]??'⚠️'} {exc.provider} · {exc.period}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{exc.desc}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {exc.diff>0&&<div className="text-sm font-black text-red-400">{money(exc.diff)}</div>}
                    {isOpen?<ChevronUp size={13} className="text-slate-400"/>:<ChevronDown size={13} className="text-slate-400"/>}
                  </div>
                </button>

                {isOpen&&(
                  <div className="px-4 pb-4 border-t border-slate-800 space-y-3 pt-3">
                    {/* Détail */}
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Analyse</div>
                      <div className="text-[10px] text-slate-300 leading-relaxed">{exc.note}</div>
                    </div>

                    {/* Montants si pertinents */}
                    {exc.diff>0&&(
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {l:'Attendu',  v:money(exc.expected), c:'text-green-400'},
                          {l:'Reçu',     v:money(exc.actual),   c:'text-white'},
                          {l:'Écart',    v:money(exc.diff),     c:'text-red-400'},
                        ].map(r=>(
                          <div key={r.l} className="bg-slate-800 rounded-lg p-2 text-center border border-slate-700">
                            <div className={`text-sm font-bold ${r.c}`}>{r.v}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{r.l}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* IDs associés */}
                    <div className="flex flex-wrap gap-2">
                      {exc.txId&&<a href="/provider-transparency/transactions" className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">🔗 {exc.txId}</a>}
                      {exc.actId&&<span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg">📋 {exc.actId}</span>}
                      <span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg">⚖️ {exc.period}</span>
                      {exc.at&&<span className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg">🕐 {fmtDt(exc.at)}</span>}
                    </div>

                    {/* Note gouvernementale */}
                    <div className="p-2.5 bg-blue-500/8 border border-blue-500/15 rounded-lg">
                      <div className="text-[9px] text-blue-300">💡 Une exception nécessite une analyse avant toute conclusion. TAXIMETER.GOV documente et trace chaque anomalie sans présumer de son origine.</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Résumé types */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Répartition par type (pilote Q3 2026)</div>
          <div className="space-y-2">
            {Object.entries(TYPE_CONF).map(([type,conf])=>{
              const count = EXCEPTIONS.filter(e=>e.type===type).length
              if (count===0) return null
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-base w-6">{conf.icon}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-white">{conf.label}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-slate-800 rounded-full w-24 overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${(count/EXCEPTIONS.length)*100}%`,background:conf.color.replace('text-','').includes('amber')?'#B45309':conf.color.replace('text-','').includes('red')?'#DC2626':conf.color.replace('text-','').includes('purple')?'#7C3AED':conf.color.replace('text-','').includes('blue')?'#003DA5':'#059669'}}/>
                    </div>
                    <span className={`text-xs font-bold ${conf.color}`}>{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
