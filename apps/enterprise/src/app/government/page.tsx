'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, fmtDate, money, money2, CURRENT_ENT, TAX_PERIODS, ALL_DECLARATIONS, ALL_PAYMENTS, GOV_MESSAGES, GOV_SUBMISSIONS, GOV_SUBMISSION_STATUS_CONF, GOV_MSG_TYPE_CONF, DEPARTMENTS, UBER_PUBLIC_DATA } from '@/lib/data'

const WORKFLOW_FULL = ['ENTREPRISE','→','ENTERPRISE GOV','→','COLLECTE','→','VALIDATION','→','CONTRÔLE','→','PRÉPARATION','→','SOUMISSION DEMO','→','TAXIMETER.GOV','→','RÉCEPTION DEMO','→','RAPPROCHEMENT','→','AUDIT']

const MSG_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  NOUVELLE:  {label:'Nouvelle',    color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  LUE:       {label:'Lue',         color:'#64748B',bg:'rgba(100,116,139,0.08)'},
  RÉPONDUE:  {label:'Répondue',    color:'#059669',bg:'rgba(5,150,105,0.10)'},
  FERMÉE:    {label:'Fermée',      color:'#64748B',bg:'rgba(100,116,139,0.06)'},
}

export default function GovernmentPage() {
  const [tab, setTab] = useState<'overview'|'messages'|'submissions'|'status'|'taximeter'>('overview')
  const [selMsg, setSelMsg] = useState<string|null>(null)

  const selMsgData = GOV_MESSAGES.find(m=>m.id===selMsg)
  const newMsgs    = GOV_MESSAGES.filter(m=>m.status==='NOUVELLE').length
  const openSubs   = GOV_SUBMISSIONS.filter(s=>s.status==='BROUILLON').length
  const totalRec   = GOV_SUBMISSIONS.reduce((s,sub)=>s+(sub.records||0),0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <div className="text-black dark:text-white font-black" style={{fontSize:'1.4rem',fontFamily:'system-ui',letterSpacing:'-0.04em'}}>uber</div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"/>
              <div className="flex items-center gap-1"><span className="font-black" style={{color:'#06B029',fontSize:'0.9rem',fontFamily:'system-ui'}}>Uber</span><span className="font-black text-black dark:text-white" style={{fontSize:'0.9rem',fontFamily:'system-ui'}}>Eats</span></div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre gouvernemental</h1>
            <p className="text-sm text-slate-500 mt-0.5">TAXIMETER.GOV · Messages · Déclarations · Transmissions · Audit</p>
          </div>
        </div>
        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE · Toutes les transmissions = SIMULATION DEMO
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {([['overview','🏛️ Vue globale'],['messages','📬 Messages'],['submissions','📤 Transmissions'],['status','📊 Statut fiscal'],['taximeter','🔗 TAXIMETER.GOV']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:tab===t?'#000':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#000':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Workflow */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow de transmission (SIMULÉ)</div>
              <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
                {WORKFLOW_FULL.map((s,i)=>(
                  <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-black text-white'}>{s}</span>
                ))}
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {l:'Messages gouvernementaux', v:GOV_MESSAGES.length,   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
                {l:'Nouveaux messages',         v:newMsgs,              c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'Transmissions DEMO',        v:GOV_SUBMISSIONS.filter(s=>s.status!=='BROUILLON').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'En préparation',            v:openSubs,             c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Identité */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #000'}}>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-black dark:text-white font-black rounded-xl bg-black text-white px-3 py-2" style={{fontFamily:'system-ui',letterSpacing:'-0.04em',fontSize:'1.5rem'}}>uber</div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{CURRENT_ENT.legalName}</div>
                  <div className="text-[9px] text-slate-400">{CURRENT_ENT.tradeName} · NEQ: {CURRENT_ENT.neq} (FICTIF·DEMO)</div>
                </div>
              </div>
              {[
                {l:'TPS (FICTIF·DEMO)', v:CURRENT_ENT.taxId},
                {l:'TVQ (FICTIF·DEMO)', v:CURRENT_ENT.tvqId},
                {l:'Représentant',      v:`${CURRENT_ENT.repr} · ${CURRENT_ENT.reprTitle}`},
                {l:'Statut connexion',  v:'SIMULATION PILOTE — Aucune connexion officielle'},
                {l:'Environnement',     v:'DEMO / PILOTE'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[9px] text-slate-400">{r.l}</span>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 text-right">{r.v}</span>
                </div>
              ))}
            </div>

            {/* Messages récents */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Messages récents</span>
                <button onClick={()=>setTab('messages')} className="text-[9px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer">Voir tout →</button>
              </div>
              {GOV_MESSAGES.slice(0,5).map(m=>{
                const tc = GOV_MSG_TYPE_CONF[m.type]!
                const sc = MSG_STATUS_CONF[m.status]!
                return (
                  <div key={m.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span className="text-lg shrink-0">{tc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{m.subject}</div>
                      <div className="text-[9px] text-slate-400">{m.from} · {fmtDt(m.at)}</div>
                    </div>
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {tab==='messages'&&(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-1.5">
              <div className="text-[9px] text-slate-400 px-1">{GOV_MESSAGES.length} messages · {newMsgs} nouvelles</div>
              {GOV_MESSAGES.map(m=>{
                const tc = GOV_MSG_TYPE_CONF[m.type]!
                const sc = MSG_STATUS_CONF[m.status]!
                return (
                  <div key={m.id} onClick={()=>setSelMsg(selMsg===m.id?null:m.id)}
                    className="bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                    style={{borderColor:selMsg===m.id?'#003DA5':'rgba(226,232,240,0.8)',borderWidth:selMsg===m.id?2:1,
                            opacity:m.status==='FERMÉE'?0.65:1}}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{tc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{m.subject}</span>
                          <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                          {m.responseRequired&&<span className="text-[7px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">Réponse requise</span>}
                        </div>
                        <div className="text-[9px] text-slate-400">{m.from} → {m.to} · {fmtDt(m.at)}</div>
                        {m.dueAt&&<div className="text-[8px] text-amber-600 dark:text-amber-400">Délai: {fmtDate(m.dueAt)}</div>}
                      </div>
                      <span className="text-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded shrink-0">{m.type}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Détail message */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden h-fit">
              {selMsgData?(
                <>
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-800 dark:text-white">{selMsgData.subject}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">{selMsgData.from}</div>
                  </div>
                  <div className="p-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3 text-[9px] text-slate-700 dark:text-slate-200 leading-relaxed">{selMsgData.body}</div>
                    <div className="space-y-1">
                      {[
                        {l:'Date',   v:fmtDt(selMsgData.at)},
                        {l:'Type',   v:selMsgData.type},
                        {l:'Statut', v:selMsgData.status},
                        {l:'ID',     v:selMsgData.id},
                      ].map(r=>(
                        <div key={r.l} className="flex justify-between text-[9px] border-b border-slate-100 dark:border-slate-800 py-1 last:border-0">
                          <span className="text-slate-400">{r.l}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{r.v}</span>
                        </div>
                      ))}
                    </div>
                    {selMsgData.responseRequired&&(
                      <button className="mt-3 w-full py-2 rounded-xl text-[9px] font-bold bg-blue-600 text-white cursor-pointer">↩ Répondre · DEMO</button>
                    )}
                  </div>
                </>
              ):(
                <div className="p-6 text-center text-[10px] text-slate-400 italic">Cliquer sur un message pour le lire</div>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSMISSIONS ── */}
        {tab==='submissions'&&(
          <div className="space-y-3">
            <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
              TRANSMISSIONS SIMULÉES — AUCUNE VALEUR OFFICIELLE — DEMO PILOTE UNIQUEMENT
            </div>
            {GOV_SUBMISSIONS.map(s=>{
              const sc = GOV_SUBMISSION_STATUS_CONF[s.status]!
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">📤</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{s.type} · {s.period}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-slate-400">
                        {s.at&&<div>Date: {fmtDt(s.at)}</div>}
                        {s.records>0&&<div>Enregistrements: {s.records}</div>}
                        {s.by&&<div>Par: {s.by}</div>}
                        {s.txId&&<div>Réf: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{s.txId}</span></div>}
                      </div>
                      <div className="text-[8px] text-amber-600 dark:text-amber-400 italic mt-1">{s.note}</div>
                    </div>
                    {s.status==='BROUILLON'&&(
                      <button className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-black text-white cursor-pointer shrink-0">Préparer · DEMO</button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Checklist soumission */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Checklist avant soumission Q3 (DEMO)</div>
              {[
                {l:'Identité entreprise vérifiée', ok:true},
                {l:'Revenus Q3 calculés',          ok:true},
                {l:'TPS/TVQ Q3 estimées',          ok:true},
                {l:'Transactions réconciliées',    ok:false,note:'2 exceptions ouvertes'},
                {l:'Documents conformes',          ok:false,note:'2 documents expirants'},
                {l:'Rapport Q3 généré',            ok:true},
                {l:'Validation Finance',           ok:false,note:'Approbation en attente'},
                {l:'Approbation Propriétaire',     ok:false,note:'Signature requise'},
              ].map(item=>(
                <div key={item.l} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{item.ok?'✅':'⏳'}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{item.l}</div>
                    {item.note&&<div className="text-[8px] text-amber-600 dark:text-amber-400">{item.note}</div>}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 rounded-xl text-[9px] font-bold bg-slate-800 text-white cursor-pointer">📋 Préparer Q3 · DEMO</button>
                <div className="flex-1 py-2 rounded-xl text-[9px] font-bold text-center bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">⛔ Soumettre au gouvernement</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATUT FISCAL ── */}
        {tab==='status'&&(
          <div className="space-y-3">
            <div className="text-[9px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl font-bold">
              ESTIMATION PILOTE · AUCUNE TRANSMISSION OFFICIELLE · Données synthétiques
            </div>
            {TAX_PERIODS.map(tp=>(
              <div key={tp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{tp.period}</div>
                    <div className="text-[9px] text-slate-400">{fmtDate(tp.start)} → {fmtDate(tp.end)}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${tp.status==='PAID'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>
                      {tp.status==='PAID'?'✅ Clôturée':'⏳ En cours'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {l:'Revenus (DEMO)',  v:money(tp.gross),         c:'#059669'},
                    {l:'TPS estimée',     v:money2(tp.tpsCollected), c:'#7C3AED'},
                    {l:'TVQ estimée',     v:money2(tp.tvqCollected), c:'#4F46E5'},
                    {l:'À remettre',      v:money2(tp.tpsCollected+tp.tvqCollected),c:'#DC2626'},
                  ].map(r=>(
                    <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                      <div className="text-sm font-black" style={{color:r.c}}>{r.v}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">{r.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-[8px] text-slate-400 italic text-center">Intégration Revenu Québec — Préparation pilote · Aucune transmission officielle active</div>
          </div>
        )}

        {/* ── TAXIMETER.GOV ── */}
        {tab==='taximeter'&&(
          <div className="space-y-4">
            {/* Connexion */}
            <div className="rounded-2xl p-5 shadow-sm" style={{background:'#000'}}>
              <div className="text-[8px] font-bold mb-1" style={{color:'rgba(255,255,255,0.45)'}}>CONNEXION TAXIMETER.GOV · MODE PILOTE</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-400"/>
                <span className="text-white font-black">SIMULATION PILOTE</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {l:'Enregistrements transmis DEMO',v:'9 840'},
                  {l:'Transmissions réussies',        v:'3/4'},
                  {l:'Statut connexion',              v:'SIMULATION'},
                ].map(s=>(
                  <div key={s.l}>
                    <div className="text-white font-black text-lg">{s.v}</div>
                    <div className="text-[8px]" style={{color:'rgba(255,255,255,0.5)'}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture data */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Données disponibles pour transmission</div>
              {[
                {l:'Entreprise',    v:`${CURRENT_ENT.legalName} · NEQ: ${CURRENT_ENT.neq}`,                     ok:true},
                {l:'Départements',  v:`${DEPARTMENTS.filter(d=>d.status==='ACTIVE').length} actifs sur 7`,        ok:true},
                {l:'Chauffeurs',    v:'6 profils complets + 45 échantillon DEMO',                                 ok:true},
                {l:'Activités',     v:`20 activités pilote + ${DEPARTMENTS.reduce((s,d)=>s+d.activities,0).toLocaleString('fr-CA')} estimées SYNTH.`,ok:true},
                {l:'Transactions',  v:'15 transactions · 13 réconciliées',                                        ok:false},
                {l:'Revenus',       v:`${money(DEPARTMENTS.filter(d=>d.status==='ACTIVE').reduce((s,d)=>s+d.gross,0))} estimés SYNTH.`,ok:true},
                {l:'TPS/TVQ',       v:'Calculées Q1/Q2/Q3 · ESTIMATION PILOTE',                                  ok:true},
                {l:'Déclarations',  v:'3 (Q1/Q2 acceptées · Q3 en préparation)',                                 ok:false},
                {l:'Conformité',    v:'94% indicateur DEMO',                                                      ok:true},
                {l:'Audit',         v:'50 événements archivés',                                                   ok:true},
              ].map(r=>(
                <div key={r.l} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{r.ok?'✅':'⏳'}</span>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r.l}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 text-right max-w-[40%]">{r.v}</span>
                </div>
              ))}
            </div>

            {/* Note Revenu Québec */}
            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-2">🍁 Intégration Revenu Québec — Architecture future</div>
              <div className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed">
                TAXIMETER.GOV peut être conçu pour fonctionner avec les services gouvernementaux lorsque les API, autorisations, contrats et normes de sécurité nécessaires seront disponibles. Aucune connexion réelle à Revenu Québec n'existe dans ce pilote.
              </div>
              <a href="https://www.revenuquebec.ca" target="_blank" rel="noopener noreferrer" className="mt-2 block text-[9px] font-bold text-blue-600 hover:underline">🍁 Site officiel Revenu Québec →</a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
