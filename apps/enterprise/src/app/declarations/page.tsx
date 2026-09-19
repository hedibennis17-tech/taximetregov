'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDate, ALL_DECLARATIONS, DECL_STATUS_CONF } from '@/lib/data'

const WORKFLOW_STEPS = [
  {key:'DRAFT',     label:'Brouillon',   icon:'📝', desc:'Données collectées automatiquement depuis Revenue Ledger'},
  {key:'PREPARED',  label:'Préparée',    icon:'📋', desc:'Vérification et validation des montants'},
  {key:'SUBMITTED', label:'Soumise',     icon:'📤', desc:'Envoi à Revenu Québec / ARC'},
  {key:'RECEIVED',  label:'Reçue',       icon:'📥', desc:'Confirmation de réception gouvernementale'},
  {key:'ACCEPTED',  label:'Acceptée',    icon:'✅', desc:'Déclaration traitée et acceptée'},
]

export default function DeclarationsPage() {
  const [selected, setSelected] = useState<string|null>(null)
  const sel = ALL_DECLARATIONS.find(d=>d.id===selected)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Déclarations</h1>
          <p className="text-sm text-slate-500 mt-1">DRAFT → PREPARED → SUBMITTED → RECEIVED → ACCEPTED · TPS/TVQ</p>
        </div>
        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · SIMULATION · AUCUNE DÉCLARATION RÉELLE SOUMISE À REVENU QUÉBEC
        </div>

        {/* Workflow visuel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Workflow de déclaration</div>
          <div className="flex gap-0">
            {WORKFLOW_STEPS.map((step,i)=>(
              <div key={step.key} className="flex-1 text-center">
                <div className="flex items-center">
                  <div className="flex-1 text-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-base mx-auto">{step.icon}</div>
                    <div className="text-[8px] font-bold text-slate-700 dark:text-slate-300 mt-1">{step.label}</div>
                    <div className="text-[7px] text-slate-400 mt-0.5 px-1 leading-tight hidden md:block">{step.desc}</div>
                  </div>
                  {i<WORKFLOW_STEPS.length-1&&<div className="w-4 h-px bg-slate-200 dark:bg-slate-700 shrink-0"/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Acceptées',  v:ALL_DECLARATIONS.filter(d=>d.status==='ACCEPTED').length, c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'En cours',   v:ALL_DECLARATIONS.filter(d=>d.status==='DRAFT').length,    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Total',      v:ALL_DECLARATIONS.length,                                  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste déclarations */}
        <div className="space-y-3">
          {ALL_DECLARATIONS.map(d=>{
            const sc = DECL_STATUS_CONF[d.status]!
            const isOpen = selected===d.id
            return (
              <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden" style={{borderLeft:`3px solid ${sc.color}`}}>
                {/* Header cliquable */}
                <div className="flex items-start justify-between gap-3 p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={()=>setSelected(isOpen?null:d.id)}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sc.icon}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{d.type} — {d.period}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">{d.id}{d.ref?` · ${d.ref}`:''}</div>
                    {d.govRef&&<div className="text-[9px] font-mono text-green-600 dark:text-green-400">Réf. GOV: {d.govRef}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-slate-800 dark:text-white">{money(d.total)}</div>
                    <div className="text-[9px] text-slate-400">TPS: {money2(d.tps)} · TVQ: {money2(d.tvq)}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">{isOpen?'▲ Masquer':'▼ Détails'}</div>
                  </div>
                </div>

                {/* Détail accordéon */}
                {isOpen&&(
                  <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
                    {/* Timeline */}
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Progression</div>
                      <div className="relative pl-5">
                        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"/>
                        {[
                          {label:'Brouillon créé',  date:d.draftAt,      done:!!d.draftAt},
                          {label:'Déclaration préparée',date:d.preparedAt, done:!!d.preparedAt},
                          {label:'Soumise à RQ',    date:d.submittedAt,  done:!!d.submittedAt},
                          {label:'Reçue par RQ',    date:d.receivedAt,   done:!!d.receivedAt},
                          {label:'Acceptée',         date:d.acceptedAt,   done:!!d.acceptedAt},
                          {label:'Paiement effectué',date:d.paidAt,      done:!!d.paidAt},
                        ].map((step,i)=>(
                          <div key={i} className="relative mb-2 last:mb-0">
                            <div className={`absolute -left-3.5 top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${step.done?'bg-green-500':'bg-slate-200 dark:bg-slate-700'}`}/>
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold ${step.done?'text-slate-800 dark:text-slate-200':'text-slate-400'}`}>{step.label}</span>
                              <span className="text-[8px] font-mono text-slate-400">{step.date?fmtDate(step.date):'—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Montants */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {l:'Revenus bruts', v:money(d.gross),   c:'text-green-600 dark:text-green-400'},
                        {l:'TPS',           v:money2(d.tps),    c:'text-purple-600 dark:text-purple-400'},
                        {l:'TVQ',           v:money2(d.tvq),    c:'text-indigo-600 dark:text-indigo-400'},
                      ].map(r=>(
                        <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                          <div className={`text-sm font-black ${r.c}`}>{r.v}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{r.l}</div>
                        </div>
                      ))}
                    </div>

                    {d.notes&&<div className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl italic">{d.notes}</div>}

                    {/* Actions selon statut */}
                    <div className="flex gap-2">
                      {d.status==='DRAFT'&&(
                        <button className="px-3 py-2 rounded-xl text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-100">
                          📋 Préparer → DEMO
                        </button>
                      )}
                      {d.status==='PREPARED'&&(
                        <button className="px-3 py-2 rounded-xl text-[9px] font-bold bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 cursor-pointer hover:bg-purple-100">
                          📤 Soumettre → DEMO
                        </button>
                      )}
                      {d.status==='ACCEPTED'&&(
                        <Link href="/payments" className="px-3 py-2 rounded-xl text-[9px] font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-100">
                          ✅ Voir paiement
                        </Link>
                      )}
                      <Link href="/audit" className="px-3 py-2 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-[9px] text-slate-400 text-center">{PILOT} · Déclarations simulées uniquement · Aucune transmission à Revenu Québec</div>
      </div>
    </AppShell>
  )
}
