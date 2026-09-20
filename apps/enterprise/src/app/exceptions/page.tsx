'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money2, fmtDt, EXCEPTIONS, ENT_DRIVERS, EXC_TYPE_CONF, EXC_STATUS_CONF } from '@/lib/data'

const PRIORITY_CONF: Record<string,{label:string;color:string;bg:string}> = {
  HIGH:  {label:'Haute',   color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  MEDIUM:{label:'Moyenne', color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  LOW:   {label:'Basse',   color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}
const WORKFLOW=['DÉTECTION','→','ANALYSE','→','CLASSIFICATION','→','EXPLICATION','→','CORRECTION','→','VALIDATION','→','AUDIT','→','RÉSOLUTION']

export default function ExceptionsPage() {
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState<string|null>(null)
  const sel = EXCEPTIONS.find(e=>e.id===selected)

  const filtered = EXCEPTIONS.filter(e=>{
    if (filter==='OPEN'   && e.status==='CLOSED') return false
    if (filter==='CLOSED' && e.status!=='CLOSED') return false
    return true
  })

  const open  = EXCEPTIONS.filter(e=>e.status!=='CLOSED').length
  const closed= EXCEPTIONS.filter(e=>e.status==='CLOSED').length
  const high  = EXCEPTIONS.filter(e=>e.priority==='HIGH'&&e.status!=='CLOSED').length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Exceptions</h1>
          <p className="text-sm text-slate-500 mt-1">Variances · TX manquantes · Webhooks · Doublons · Résolution</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Une exception n'est PAS une fraude — c'est un écart nécessitant analyse et justification
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase mb-2">Processus de résolution</div>
          <div className="flex items-center gap-1 flex-wrap text-sm font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Ouvertes',        v:open,   c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'Priorité haute',  v:high,   c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Fermées',         v:closed, c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-1.5">
          {[{v:'ALL',l:'Toutes'},{v:'OPEN',l:'Ouvertes'},{v:'CLOSED',l:'Fermées'}].map(f=>(
            <button key={f.v} onClick={()=>setFilter(f.v)} className="px-3 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:filter===f.v?'#003DA5':'transparent',color:filter===f.v?'white':'#64748B',borderColor:filter===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Liste exceptions */}
        <div className="space-y-2">
          {filtered.map(exc=>{
            const tc = EXC_TYPE_CONF[exc.type]!
            const sc = EXC_STATUS_CONF[exc.status]!
            const pc = PRIORITY_CONF[exc.priority]!
            const drv = ENT_DRIVERS.find(d=>d.id===exc.driverId)
            const isOpen = selected===exc.id
            return (
              <div key={exc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden" style={{borderLeft:`3px solid ${tc.color}`}}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={()=>setSelected(isOpen?null:exc.id)}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{tc.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{tc.label}</span>
                        <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:pc.color,background:pc.bg}}>{pc.label}</span>
                        <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="text-sm font-mono text-slate-400">{exc.id}{exc.txId?` · ${exc.txId}`:''}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{drv?.name??exc.driverId??'—'} · {exc.provider} · {fmtDt(exc.at)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {exc.diff>0&&<div className="text-lg font-black text-red-500">Δ {money2(exc.diff)}</div>}
                    <div className="text-sm text-slate-400 mt-1">{isOpen?'▲ Fermer':'▼ Détails'}</div>
                  </div>
                </div>

                {/* Détail accordéon */}
                {isOpen&&(
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
                    {/* Description */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="text-sm font-bold text-slate-500 uppercase mb-1">Description</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{exc.desc}</div>
                    </div>

                    {/* Montants si variance */}
                    {exc.diff>0&&(
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {l:'Source',  v:money2(exc.sourceAmt), c:'text-slate-800 dark:text-slate-200'},
                          {l:'Ledger',  v:exc.ledgerAmt>0?money2(exc.ledgerAmt):'—', c:'text-blue-600 dark:text-blue-400'},
                          {l:'Δ Diff.', v:money2(exc.diff),       c:'text-red-500'},
                        ].map(r=>(
                          <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                            <div className={`text-sm font-black ${r.c}`}>{r.v}</div>
                            <div className="text-sm text-slate-400 mt-0.5">{r.l}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action requise */}
                    <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3">
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">🔍 Action requise</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{exc.action}</div>
                    </div>

                    {/* Résolution si fermé */}
                    {exc.resolution&&(
                      <div className="bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/20 rounded-xl p-3">
                        <div className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">✅ Résolution</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{exc.resolution}</div>
                      </div>
                    )}

                    {/* Actions */}
                    {exc.status!=='CLOSED'&&(
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-xl text-sm font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer">Ajouter justification · DEMO</button>
                        <button className="px-3 py-1.5 rounded-xl text-sm font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 cursor-pointer">Marquer résolu · DEMO</button>
                        <Link href="/audit" className="px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">🛡️ Audit</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-sm text-slate-400 text-center">
          {PILOT} · <Link href="/reconciliation" className="text-qc-blue hover:underline">← Réconciliation</Link>
        </div>
      </div>
    </AppShell>
  )
}
