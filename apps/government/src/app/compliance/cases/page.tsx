'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { PILOT, money, fmtDt, CASES, PRIORITY_CONF, STATUS_CONF, TYPE_CONF } from '@/lib/compliance-data'

const NAV = [
  {href:'/alerts',           l:'🚨 Alertes',  active:false},
  {href:'/compliance/cases', l:'📁 Dossiers', active:true},
  {href:'/audit',            l:'🛡️ Audit',    active:false},
]

export default function ComplianceCasesPage() {
  const [expanded, setExpanded] = useState<string|null>('CASE-DEMO-001')
  const [resolving, setResolving] = useState<string|null>(null)
  const [resolved,  setResolved]  = useState<string[]>(['CASE-DEMO-003'])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dossiers de conformité</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Analyse · Sources · Justification · Résolution · Traçabilité</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Dossiers actifs',  v:CASES.filter(c=>!['RESOLVED','CLOSED'].includes(c.status)).length, c:'#003DA5', icon:'📁'},
            {l:'En analyse',       v:CASES.filter(c=>c.status==='IN_ANALYSIS').length, c:'#B45309', icon:'🔍'},
            {l:'Résolus',          v:CASES.filter(c=>c.status==='RESOLVED').length+resolved.length, c:'#059669', icon:'✅'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Dossiers */}
        {CASES.map(c => {
          const pc = PRIORITY_CONF[c.priority]!
          const sc = STATUS_CONF[resolved.includes(c.id)?'RESOLVED':c.status]!
          const tc = TYPE_CONF[c.type]
          const isExpanded = expanded === c.id
          const isResolved = resolved.includes(c.id) || c.status === 'RESOLVED'

          return (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden" style={{borderLeft:`3px solid ${pc.color}`}}>
              {/* Header dossier */}
              <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={()=>toggle(c.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-50 dark:bg-slate-800">{tc?.icon??'📁'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:pc.color,background:pc.bg}}>{pc.label}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mb-1">{c.id} · {tc?.label}</div>
                  <div className="flex gap-3 text-[9px] text-slate-400 flex-wrap">
                    {c.driver&&<span>👤 {c.driver} · {c.driverNum}</span>}
                    {c.txId&&<span>💳 {c.txId}</span>}
                    {c.diff>0&&<span className="font-bold text-red-500">Écart: {money(c.diff)}</span>}
                    <span>Assigné: {c.assignedTo}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="text-[9px] text-slate-400 text-right">
                    <div>Ouvert {fmtDt(c.createdAt)}</div>
                    <div className="mt-0.5">MAJ {fmtDt(c.updatedAt)}</div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </div>
              </div>

              {/* Corps expandé */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
                  {/* Note */}
                  <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3">
                    <div className="text-[9px] font-bold text-blue-700 dark:text-blue-400 mb-1">Notes d'analyse</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">{c.notes}</div>
                  </div>

                  {/* Sources comparées */}
                  {c.sources.length > 0 && (
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Comparaison des sources</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {c.sources.map((s,i)=>(
                          <div key={i} className={`rounded-xl p-3 border ${i===0?'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/8':'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8'}`}>
                            <div className="text-[9px] font-bold mb-1" style={{color:i===0?'#991B1B':'#1E40AF'}}>{s.label}</div>
                            <div className="text-sm font-black" style={{color:i===0?'#DC2626':'#003DA5'}}>{money(s.amount)}</div>
                            <div className="text-[9px] text-slate-400 mt-1">TPS: {money(s.tps)} · Statut: {s.status}</div>
                          </div>
                        ))}
                      </div>
                      {c.diff > 0 && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Écart détecté — à analyser</span>
                          <span className="text-sm font-black text-red-600 dark:text-red-400">{money(c.diff)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Réconciliation */}
                  {c.reconciliation && (
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Statut réconciliation</div>
                      <div className="flex items-center gap-2 p-3 rounded-xl border" style={{
                        background: c.reconciliation.status==='RÉSOLU'?'rgba(5,150,105,0.08)':'rgba(180,83,9,0.08)',
                        borderColor: c.reconciliation.status==='RÉSOLU'?'rgba(5,150,105,0.25)':'rgba(180,83,9,0.25)',
                      }}>
                        {c.reconciliation.status==='RÉSOLU'
                          ? <CheckCircle size={14} className="text-green-600 dark:text-green-400 shrink-0"/>
                          : <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0"/>}
                        <div>
                          <div className="text-xs font-bold" style={{color:c.reconciliation.status==='RÉSOLU'?'#059669':'#B45309'}}>{c.reconciliation.status}</div>
                          {c.reconciliation.explanation && <div className="text-[9px] text-slate-500 mt-0.5">{c.reconciliation.explanation}</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chronologie du dossier</div>
                    <div className="space-y-2">
                      {c.timeline.map((t,i)=>(
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0">{t.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{t.action}</span>
                              <span className="text-[8px] text-slate-400 font-mono">{fmtDt(t.at)}</span>
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{t.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Actions administratives (DÉMO)</div>
                    <div className="flex gap-2 flex-wrap">
                      {c.driverId && <Link href={`/drivers/${c.driverId}`} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 whitespace-nowrap">👤 Voir chauffeur</Link>}
                      <Link href="/alerts" className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 whitespace-nowrap">🚨 Voir alerte</Link>
                      <Link href="/audit" className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 whitespace-nowrap">🛡️ Voir audit</Link>
                      {!isResolved && (
                        resolving === c.id ? (
                          <div className="flex gap-2 items-center">
                            <button onClick={()=>{setResolved(p=>[...p,c.id]);setResolving(null)}}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-green-600 text-white cursor-pointer hover:bg-green-700 whitespace-nowrap">
                              ✅ Confirmer résolution
                            </button>
                            <button onClick={()=>setResolving(null)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap">Annuler</button>
                          </div>
                        ) : (
                          <button onClick={()=>setResolving(c.id)} className="px-3 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-100 whitespace-nowrap">
                            ✅ Marquer résolu
                          </button>
                        )
                      )}
                    </div>
                    {!isResolved && (
                      <div className="mt-2 text-[8px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">DÉMO — Aucune action gouvernementale réelle déclenchée</div>
                    )}
                    {isResolved && (
                      <div className="mt-2 flex items-center gap-2 text-[9px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-2 rounded-lg border border-green-200 dark:border-green-500/25">
                        <CheckCircle size={12}/> Dossier résolu — inscrit dans l'audit
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
