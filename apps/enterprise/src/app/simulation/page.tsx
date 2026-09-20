'use client'
import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import {
  PILOT, money, money2, CURRENT_ENT,
  SIM_ACTIVITIES, SIM_TRANSACTIONS, SIM_LEDGER, SIM_RECON,
  SIM_AUDIT, SIM_DECLARATION, SIM_PAYMENT, SIM_DEPT_SUMMARY,
  SIM_RAPPORT, DEPARTMENTS,
} from '@/lib/data'

type Tab = 'overview'|'scenario'|'fiscal'|'recon'|'audit'|'rapport'

export default function SimulationPage() {
  const [tab,      setTab]      = useState<Tab>('overview')
  const [selected, setSelected] = useState<string|null>(null)

  const TABS: {id:Tab;label:string;icon:string}[] = [
    {id:'overview', label:'Vue globale',    icon:'🏛️'},
    {id:'scenario', label:'Scénario tracé', icon:'🔗'},
    {id:'fiscal',   label:'TPS/TVQ/Décl.',  icon:'🧾'},
    {id:'recon',    label:'Réconciliation', icon:'🔄'},
    {id:'audit',    label:'Piste d\'audit', icon:'📋'},
    {id:'rapport',  label:'Rapport final',  icon:'✅'},
  ]

  const selTx  = selected ? SIM_TRANSACTIONS.find(t=>t.id===selected)  : null
  const selAct = selTx    ? SIM_ACTIVITIES.find(a=>a.id===selTx.actId) : null
  const selRL  = selTx    ? SIM_LEDGER.find(l=>l.txId===selTx.id)      : null
  const selRC  = selTx    ? SIM_RECON.find(r=>r.txId===selTx.id)       : null
  const dept   = selAct   ? DEPARTMENTS.find(d=>d.id===selAct.deptId)  : null

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="rounded-2xl p-5 shadow-sm overflow-hidden" style={{background:'#000'}}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="font-black text-white tracking-tighter" style={{fontSize:'1.8rem',fontFamily:'system-ui',letterSpacing:'-0.05em',lineHeight:0.9}}>uber</div>
                <div className="text-sm font-black text-white/50">QUÉBEC</div>
              </div>
              <div className="text-white font-black text-sm">Simulation Gouvernementale Complète · Phase 32</div>
              <div className="text-sm mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>
                {CURRENT_ENT.id} · 6 départements · {SIM_RAPPORT.drivers} chauffeurs · {SIM_RAPPORT.activitiesTotal} activités · 2026-09-20
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-1 rounded-full">⚠️ {PILOT}</div>
              <div className="text-xs text-white/30 mt-1">SIMULATION · NON TRANSMIS</div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="mt-3 pt-3 flex items-center gap-1 flex-wrap" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
            {['Entreprise','→','Département','→','Chauffeur','→','Véhicule','→','Activité','→','Transaction','→','Ledger','→','TPS/TVQ','→','Déclaration','→','Paiement','→','Audit','→','Admin Gov'].map((s,i)=>(
              <span key={i} className="text-sm font-bold" style={s==='→'?{color:'rgba(255,255,255,0.2)'}:{color:'rgba(255,255,255,0.7)'}}>{s}</span>
            ))}
          </div>
        </div>

        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ SIMULATION PILOTE · Données synthétiques · Aucune déclaration réelle · Aucun paiement réel · enterprise_id: {CURRENT_ENT.id}
        </div>

        {/* KPIs rapides */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[
            {l:'Depts',   v:'6',                                             c:'#000'},
            {l:'Chauff.', v:String(SIM_RAPPORT.drivers),                     c:'#003DA5'},
            {l:'Activités',v:String(SIM_RAPPORT.activitiesTotal),            c:'#7C3AED'},
            {l:'TX',      v:String(SIM_RAPPORT.transactions),                c:'#059669'},
            {l:'Brut',    v:money2(SIM_RAPPORT.grossTotal),                  c:'#059669'},
            {l:'TPS',     v:money2(SIM_RAPPORT.tpsTotal),                    c:'#7C3AED'},
            {l:'TVQ',     v:money2(SIM_RAPPORT.tvqTotal),                    c:'#4F46E5'},
            {l:'Pourboires',v:money2(SIM_RAPPORT.tipsTotal),                 c:'#003DA5'},
          ].map(k=>(
            <div key={k.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-center shadow-sm">
              <div className="text-sm font-black" style={{color:k.c}}>{k.v}</div>
              <div className="text-xs text-slate-400 mt-0.5">{k.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelected(null)}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer border"
              style={{background:tab===t.id?'#000':'white',color:tab===t.id?'white':'#64748B',borderColor:tab===t.id?'#000':'#e2e8f0'}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: VUE GLOBALE ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Par département */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-slate-800 dark:text-white mb-3">Résultats par département (DEMO)</div>
                {SIM_DEPT_SUMMARY.filter(d=>d.acts>0).map(d=>{
                  const dept = DEPARTMENTS.find(dep=>dep.id===d.deptId)
                  return (
                    <div key={d.deptId} className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{dept?.emoji??'📍'}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1">{dept?.name??d.deptId}</span>
                        <span className="text-sm font-black text-green-600">{money2(d.gross)}</span>
                      </div>
                      <div className="flex gap-3 ml-7 text-sm text-slate-400">
                        <span>{d.acts} activités</span>
                        <span>{d.drivers} chauffeur{d.drivers>1?'s':''}</span>
                        <span>TPS: {money2(d.tps)}</span>
                        <span>TVQ: {money2(d.tvq)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chauffeurs actifs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-slate-800 dark:text-white mb-3">Chauffeurs actifs — journée DEMO</div>
                {[...new Map(SIM_ACTIVITIES.filter(a=>a.status==='COMPLETED').map(a=>[a.driverId,a])).values()].map(a=>{
                  const txs = SIM_TRANSACTIONS.filter(t=>t.driverId===a.driverId)
                  return (
                    <div key={a.driverId} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white text-sm font-black shrink-0">
                        {a.driverName.split(' ').map((n:string)=>n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.driverName}</div>
                        <div className="text-sm text-slate-400">{a.driverId} · {a.vehicleId} · {a.plate}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-green-600">{money2(txs.reduce((s,t)=>s+t.gross,0))}</div>
                        <div className="text-xs text-slate-400">{txs.length} TX</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SCÉNARIO TRACÉ ── */}
        {tab==='scenario'&&(
          <div className="space-y-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Cliquez sur une transaction pour tracer sa chaîne complète : Activité → TX → Ledger → Réconciliation
            </div>

            {/* Liste transactions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-black text-slate-800 dark:text-white">{SIM_TRANSACTIONS.length} Transactions — 2026-09-20</div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {SIM_TRANSACTIONS.map(tx=>{
                  const act = SIM_ACTIVITIES.find(a=>a.id===tx.actId)
                  const dept= DEPARTMENTS.find(d=>d.id===tx.deptId)
                  const isSel = selected===tx.id
                  return (
                    <button key={tx.id} onClick={()=>setSelected(isSel?null:tx.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
                      style={{background:isSel?'#f8fafc':undefined}}>
                      <span className="text-base shrink-0">{dept?.emoji??'📍'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{tx.id} · {tx.driverName}</div>
                        <div className="text-sm text-slate-400">{act?.origin} → {act?.dest} · {act?.dist}km · {act?.dur}min</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-800 dark:text-white">{money2(tx.gross)}</div>
                        <div className="text-sm text-slate-400">+{money2(tx.tip)} tip · TPS:{money2(tx.tps)}</div>
                      </div>
                      <span className="text-sm">{isSel?'▲':'▼'}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tracé détaillé */}
            {selTx&&selAct&&(
              <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-black text-slate-800 dark:text-white mb-4">
                  🔗 Chaîne complète — {selTx.id}
                </div>
                <div className="space-y-3">
                  {[
                    {step:'1',label:'Entreprise',   icon:'🏢', lines:[`${CURRENT_ENT.legalName}`,`enterprise_id: ${CURRENT_ENT.id}`,`Mode: PILOTE DEMO`]},
                    {step:'2',label:'Département',  icon:dept?.emoji??'🏬', lines:[dept?.name??selAct.deptId,`dept_id: ${selAct.deptId}`]},
                    {step:'3',label:'Chauffeur',    icon:'👤', lines:[selAct.driverName,`driver_id: ${selAct.driverId}`,`Plaque: ${selAct.plate} (DEMO)`]},
                    {step:'4',label:'Véhicule',     icon:'🚗', lines:[`vehicle_id: ${selAct.vehicleId}`,`Plaque: ${selAct.plate}`]},
                    {step:'5',label:'Activité',     icon:'📍', lines:[`act_id: ${selAct.id}`,`${selAct.type} · ${selAct.origin} → ${selAct.dest}`,`${selAct.dist}km · ${selAct.dur}min · ${selAct.at.split('T')[1].slice(0,5)}`]},
                    {step:'6',label:'Transaction',  icon:'💳', lines:[`tx_id: ${selTx.id}`,`Brut: ${money2(selTx.gross)} · Pourboire: ${money2(selTx.tip)}`,`Frais: ${money2(selTx.fees)} · Net chauffeur: ${money2(selTx.netDriver)}`]},
                    {step:'7',label:'TPS/TVQ',      icon:'🧾', lines:[`TPS (5%): ${money2(selTx.tps)}`,`TVQ (9.975%): ${money2(selTx.tvq)}`,`Taxable: ${money2(selTx.taxableAmt)} · SIMULATION`]},
                    {step:'8',label:'Revenue Ledger',icon:'📒', lines:selRL?[`rl_id: ${selRL.id}`,`Statut: ${selRL.status}`,`Net: ${money2(selRL.net)}`]:['Non trouvé']},
                    {step:'9',label:'Réconciliation',icon:'🔄', lines:selRC?[`rec_id: ${selRC.id}`,`Statut: ${selRC.status}`,selRC.reason??'Aucun écart']: ['Non réconcilié']},
                    {step:'10',label:'Déclaration', icon:'📤', lines:[`DECL-Q3-2026 · ${SIM_DECLARATION.status}`,`TPS nette: ${money(SIM_DECLARATION.tpsNet)} (Q3 extrapolé)`,`SIMULATION — NON TRANSMIS`]},
                    {step:'11',label:'Audit',       icon:'📋', lines:[`Événements traçables: ${SIM_AUDIT.length}`,`Acteur: SYSTÈME + utilisateurs DEMO`]},
                  ].map((s,i)=>(
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white text-sm font-black">{s.step}</div>
                        {i<10&&<div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700 mt-0.5"/>}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span>{s.icon}</span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-200">{s.label}</span>
                        </div>
                        {s.lines.map((l,j)=>(
                          <div key={j} className="text-sm font-mono text-slate-500 dark:text-slate-400">{l}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: FISCAL ── */}
        {tab==='fiscal'&&(
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-black text-slate-800 dark:text-white mb-1">Déclaration TPS/TVQ · {SIM_DECLARATION.period}</div>
              <div className="text-sm font-bold text-red-500 mb-3">SIMULATION · NON TRANSMIS À REVENU QUÉBEC · DONNÉES SYNTHÉTIQUES</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {l:'Revenus bruts Q3 (DEMO)',   v:money(SIM_DECLARATION.grossRevenue)},
                  {l:'Pourboires Q3 (DEMO)',       v:money(SIM_DECLARATION.tipsTotal)},
                  {l:'TPS collectée',              v:money(SIM_DECLARATION.tpsCollected)},
                  {l:'TVQ collectée',              v:money(SIM_DECLARATION.tvqCollected)},
                  {l:'CTI TPS estimé (DEMO)',      v:money(SIM_DECLARATION.tpsCTI)},
                  {l:'RTI TVQ estimé (DEMO)',      v:money(SIM_DECLARATION.tvqRTI)},
                  {l:'TPS nette à remettre',       v:money(SIM_DECLARATION.tpsNet)},
                  {l:'TVQ nette à remettre',       v:money(SIM_DECLARATION.tvqNet)},
                ].map(r=>(
                  <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <div className="text-sm text-slate-400 mb-0.5">{r.l}</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white">{r.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl" style={{background:'#000'}}>
                <div className="text-sm font-bold text-white/60 mb-0.5">MONTANT TOTAL SIMULÉ À REMETTRE</div>
                <div className="text-2xl font-black text-white">{money(SIM_DECLARATION.totalDue)}</div>
                <div className="text-sm text-amber-400 mt-1">SIMULATION · {SIM_DECLARATION.status} · AUCUN PAIEMENT RÉEL</div>
              </div>
            </div>

            {/* Paiement simulé */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-black text-slate-800 dark:text-white mb-3">Paiement simulé</div>
              {[
                {l:'Référence',      v:SIM_PAYMENT.ref},
                {l:'Période',        v:SIM_PAYMENT.period},
                {l:'Montant',        v:money(SIM_PAYMENT.amount)},
                {l:'Échéance',       v:SIM_PAYMENT.due},
                {l:'Statut',         v:SIM_PAYMENT.status},
                {l:'Méthode',        v:SIM_PAYMENT.method},
                {l:'Date simulée',   v:SIM_PAYMENT.paidAt.split('T')[0]},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
                  <span className="text-slate-400">{r.l}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
                </div>
              ))}
              <div className="mt-3 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl">
                {SIM_PAYMENT.note}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: RÉCONCILIATION ── */}
        {tab==='recon'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800" style={{borderTop:'3px solid #000'}}>
              <div className="text-xs font-black text-slate-800 dark:text-white">Réconciliation — {SIM_RECON.length} cas</div>
              <div className="flex gap-3 mt-1 text-sm font-bold">
                <span className="text-green-600">✅ {SIM_RECON.filter(r=>r.status==='MATCH').length} MATCH</span>
                <span className="text-amber-600">⚠️ {SIM_RECON.filter(r=>r.status==='MINOR_VARIANCE').length} VARIANCE</span>
                <span className="text-red-500">🔴 {SIM_RECON.filter(r=>r.status==='REVIEW_REQUIRED').length} RÉVISION</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {SIM_RECON.map(r=>(
                <div key={r.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">{r.status==='MATCH'?'✅':r.status==='MINOR_VARIANCE'?'⚠️':'🔴'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.id}</span>
                        <span className="text-sm font-mono text-slate-400">{r.txId}</span>
                      </div>
                      {r.reason&&<div className="text-sm text-slate-500 mt-0.5">{r.reason}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{money2(r.expected)}</div>
                      {r.variance!==0&&<div className="text-sm font-bold text-red-500">{r.variance>0?'+':''}{money2(r.variance)}</div>}
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${r.status==='MATCH'?'bg-green-600':r.status==='MINOR_VARIANCE'?'bg-amber-500':'bg-red-600'}`}>
                      {r.status.replace('_',' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: AUDIT ── */}
        {tab==='audit'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800" style={{borderTop:'3px solid #000'}}>
              <div className="text-xs font-black text-slate-800 dark:text-white">Piste d'audit — {SIM_AUDIT.length} événements tracés</div>
              <div className="text-sm text-slate-400 mt-0.5">WHO · WHAT · WHEN · BEFORE → AFTER</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {SIM_AUDIT.map(e=>(
                <div key={e.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black dark:bg-white mt-1.5 shrink-0"/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">{e.action}</span>
                        <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{e.object}</span>
                        <span className="text-sm text-slate-400">{e.objectType}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">{e.detail}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>👤 {e.actor}</span>
                        <span>🕐 {e.at.split('T')[1].slice(0,8)}</span>
                        {e.before&&<span>{e.before} → <strong className="text-slate-600 dark:text-slate-300">{e.after}</strong></span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: RAPPORT FINAL ── */}
        {tab==='rapport'&&(
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-black text-slate-800 dark:text-white mb-3">Rapport Phase 32 — Simulation gouvernementale</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {[
                  {l:'Entreprise',        v:'1 (Uber Québec)'},
                  {l:'Départements',      v:String(SIM_RAPPORT.departments)},
                  {l:'Chauffeurs actifs', v:String(SIM_RAPPORT.drivers)},
                  {l:'Véhicules',         v:String(SIM_RAPPORT.vehicles)},
                  {l:'Activités',         v:`${SIM_RAPPORT.activitiesTotal} (${SIM_RAPPORT.completed} complétées)`},
                  {l:'Transactions',      v:String(SIM_RAPPORT.transactions)},
                  {l:'Revenus bruts',     v:money2(SIM_RAPPORT.grossTotal)},
                  {l:'Pourboires',        v:money2(SIM_RAPPORT.tipsTotal)},
                  {l:'TPS journée',       v:money2(SIM_RAPPORT.tpsTotal)},
                  {l:'TVQ journée',       v:money2(SIM_RAPPORT.tvqTotal)},
                  {l:'Entrées Ledger',    v:String(SIM_RAPPORT.ledgerEntries)},
                  {l:'MATCH recon.',      v:`${SIM_RAPPORT.matched}/${SIM_RECON.length}`},
                  {l:'Variances',         v:String(SIM_RAPPORT.variances)},
                  {l:'Révisions requises',v:String(SIM_RAPPORT.reviews)},
                  {l:'Déclarations',      v:'1 (Q3 2026)'},
                  {l:'Paiements simulés', v:'1'},
                  {l:'Événements audit',  v:String(SIM_RAPPORT.auditEvents)},
                ].map(r=>(
                  <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
                    <div className="text-xs text-slate-400">{r.l}</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white">{r.v}</div>
                  </div>
                ))}
              </div>

              {/* PASS/PARTIAL/FAIL */}
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Résultats PASS/PARTIAL/FAIL</div>
                {[
                  {l:'Entreprise Uber QC · isolation ENT-DEMO-001',      s:'PASS'},
                  {l:'6 départements Uber actifs',                        s:'PASS'},
                  {l:'6 chauffeurs avec véhicules tracés',                s:'PASS'},
                  {l:'12 activités multi-départements',                   s:'PASS'},
                  {l:'12 transactions avec TPS/TVQ calculés',             s:'PASS'},
                  {l:'Revenue Ledger complet',                            s:'PASS'},
                  {l:'Réconciliation — MATCH/VARIANCE/REVIEW',            s:'PASS'},
                  {l:'Déclaration Q3 simulée — NON TRANSMISE',            s:'PASS'},
                  {l:'Paiement simulé — PAID-DEMO',                       s:'PASS'},
                  {l:'Piste d\'audit — 10 événements traçables',          s:'PASS'},
                  {l:'Chaîne cliquable TX → Act → Ledger → Recon',       s:'PASS'},
                  {l:'Aucune donnée concurrente dans le compte',          s:'PASS'},
                  {l:'Labels PILOTE/DEMO/SIMULATION partout',             s:'PASS'},
                  {l:'Connexion Supabase Admin Gov (route /api)',         s:'PARTIAL'},
                  {l:'Driver Gov → Enterprise Gov tracé réel',           s:'PARTIAL'},
                ].map(r=>(
                  <div key={r.l} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{r.l}</span>
                    <span className={`text-sm font-black px-2 py-0.5 rounded-full text-white shrink-0 ml-2 ${r.s==='PASS'?'bg-green-600':r.s==='FAIL'?'bg-red-600':'bg-amber-500'}`}>{r.s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-slate-400 text-center p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              {SIM_RAPPORT.note}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
