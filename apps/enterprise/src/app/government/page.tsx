'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, fmtDate, CURRENT_ENT, TAX_PERIODS, ALL_DECLARATIONS, ALL_PAYMENTS, UBER_PUBLIC_DATA } from '@/lib/data'

const GOV_CONNECTIONS = [
  {id:'GOV-001',org:'TAXIMETER.GOV',   type:'PLATFORM',  status:'CONNECTED',note:'Connexion principale pilote',lastSync:'2026-09-18T10:38:00Z'},
  {id:'GOV-002',org:'Revenu Québec',   type:'PROVINCIAL',status:'PLANNED',  note:'API gouvernementale à définir — sous autorisation réglementaire',lastSync:null},
  {id:'GOV-003',org:'ARC (Canada)',    type:'FEDERAL',   status:'PLANNED',  note:'Intégration future — accord légal requis',lastSync:null},
  {id:'GOV-004',org:'CTQ',             type:'REGULATORY',status:'PLANNED',  note:'Commission des transports du Québec — intégration future',lastSync:null},
]
const WORKFLOW_GOVT = ['ENTREPRISE','→','DEMANDE CONNEXION','→','AUTHENTIFICATION','→','AUTORISATION','→','PERMISSIONS','→','API CREDENTIALS','→','TEST','→','SYNCHRONISATION','→','JOURNAL']
const CONN_COLORS: Record<string,string> = {CONNECTED:'#059669',PLANNED:'#7C3AED',ERROR:'#DC2626'}
const CONN_DOTS: Record<string,string>  = {CONNECTED:'bg-green-500',PLANNED:'bg-purple-400',ERROR:'bg-red-500'}

export default function GovernmentPage() {
  const [tab, setTab] = useState<'overview'|'fiscal'|'rq'|'public'>('overview')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Connexion gouvernementale</h1>
          <p className="text-sm text-slate-500 mt-1">TAXIMETER.GOV · Revenu Québec (planifié) · ARC (planifié) · Mode pilote</p>
        </div>
        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE · API gouvernementales à définir sous autorisation réglementaire
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([['overview','🏛️ Vue globale'],['fiscal','🧾 Dossier fiscal'],['rq','🍁 Revenu Québec'],['public','📊 Données publiques']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:tab===t?'#003DA5':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Workflow */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow de connexion gouvernementale</div>
              <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
                {WORKFLOW_GOVT.map((s,i)=>(
                  <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
                ))}
              </div>
            </div>

            {/* Identité */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #000'}}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-white font-black tracking-tighter shrink-0" style={{fontSize:'2rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1,background:'#000',padding:'8px 14px',borderRadius:'12px'}}>uber</div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{CURRENT_ENT.legalName}</div>
                  <div className="text-[10px] text-slate-400">{CURRENT_ENT.tradeName} · NEQ: {CURRENT_ENT.neq}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {l:'NEQ',               v:CURRENT_ENT.neq+' (FICTIF·DEMO)'},
                  {l:'TPS',               v:CURRENT_ENT.taxId+' (FICTIF·DEMO)'},
                  {l:'TVQ',               v:CURRENT_ENT.tvqId+' (FICTIF·DEMO)'},
                  {l:'Statut inscription',v:'Inscrit TPS/TVQ (DEMO)'},
                  {l:'Représentant',      v:CURRENT_ENT.repr},
                  {l:'Juridiction',       v:CURRENT_ENT.jurisdiction},
                ].map(r=>(
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500">{r.l}</span>
                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200 text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connexions gouvernementales */}
            <div className="space-y-2">
              {GOV_CONNECTIONS.map(gc=>(
                <div key={gc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${CONN_DOTS[gc.status]??'bg-slate-400'}`}/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{gc.org}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:CONN_COLORS[gc.status]??'#64748B'}}>{gc.status}</span>
                        <span className="text-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{gc.type}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 italic">{gc.note}</div>
                      {gc.lastSync&&<div className="text-[8px] font-mono text-slate-400 mt-0.5">Sync: {fmtDt(gc.lastSync)}</div>}
                    </div>
                    {gc.status==='PLANNED'&&<span className="text-[8px] font-bold text-purple-600 dark:text-purple-400 shrink-0">🔮 Planifié</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Note architecture future */}
            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-2">🏛️ Architecture gouvernementale future</div>
              <div className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed">
                TAXIMETER.GOV peut être conçu pour fonctionner avec les services gouvernementaux lorsque les API, autorisations, contrats et normes de sécurité nécessaires seront disponibles. Aucune connexion réelle n'existe actuellement. Toute intégration avec Revenu Québec ou l'ARC nécessiterait des ententes officielles, des vérifications de sécurité et des autorisations réglementaires.
              </div>
            </div>
          </div>
        )}

        {/* ── DOSSIER FISCAL ── */}
        {tab==='fiscal'&&(
          <div className="space-y-4">
            <div className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
              ESTIMATION UNIQUEMENT · DONNÉES PILOTE · AUCUNE TRANSMISSION OFFICIELLE
            </div>

            {/* KPI fiscal */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Périodes fiscales',    v:TAX_PERIODS.length,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
                {l:'Déclarations',         v:ALL_DECLARATIONS.length,c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
                {l:'Paiements DEMO',       v:ALL_PAYMENTS.filter(p=>p.status==='PAID').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Tableau périodes */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Périodes fiscales (DEMO)</div>
              {TAX_PERIODS.map(tp=>(
                <div key={tp.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{tp.period}</div>
                    <div className="text-[9px] text-slate-400">{fmtDate(tp.start)} → {fmtDate(tp.end)}</div>
                  </div>
                  <div className="flex gap-4 text-[9px]">
                    <div className="text-center">
                      <div className="font-bold text-green-600 dark:text-green-400">{money(tp.gross)}</div>
                      <div className="text-slate-400">Revenus</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600 dark:text-purple-400">{money2(tp.tpsCollected)}</div>
                      <div className="text-slate-400">TPS</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">{money2(tp.tvqCollected)}</div>
                      <div className="text-slate-400">TVQ</div>
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${tp.status==='PAID'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>
                        {tp.status==='PAID'?'Clôturée':'En cours'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note Revenu Québec chauffeurs Uber */}
            <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-2">📋 Note fiscale importante (Revenu Québec)</div>
              <div className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
                <div>· Les opérateurs comme Uber peuvent percevoir et remettre certaines TPS/TVQ pour leurs chauffeurs selon les ententes applicables.</div>
                <div>· Les chauffeurs liés à un répondant sous entente peuvent avoir des obligations déclaratives propres selon leur situation.</div>
                <div>· Les règles pour Uber Eats peuvent différer de celles pour les services de transport de personnes.</div>
                <div className="font-bold text-amber-700 dark:text-amber-400">· Ce système ne remplace pas les obligations légales. Toujours valider avec un comptable certifié.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVENU QUÉBEC ── */}
        {tab==='rq'&&(
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shrink-0">RQ</div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">Revenu Québec</div>
                  <div className="text-[10px] text-slate-400">Connexion gouvernementale · MODE PILOTE</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400"/>
                    <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">NON CONNECTÉ — PLANIFIÉ</span>
                  </div>
                </div>
              </div>

              {/* Status modules */}
              {[
                {l:'Profil fiscal',         v:'Non connecté · PILOTE'},
                {l:'TPS — Déclarations',    v:'Non transmis · PILOTE'},
                {l:'TVQ — Déclarations',    v:'Non transmis · PILOTE'},
                {l:'Solde actuel',          v:'ESTIMATION · PILOTE'},
                {l:'Crédits/Remboursements',v:'Non calculés officiellement'},
                {l:'Historique paiements',  v:'PILOTE uniquement'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[9px] text-slate-500">{r.l}</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">{r.v}</span>
                </div>
              ))}

              <div className="mt-4 space-y-2">
                <a href="https://www.revenuquebec.ca" target="_blank" rel="noopener noreferrer"
                  className="block w-full py-2.5 rounded-xl text-[10px] font-bold text-center bg-blue-600 text-white hover:bg-blue-700">
                  🍁 OUVRIR MON DOSSIER REVENU QUÉBEC (Site officiel)
                </a>
                <div className="text-[8px] text-slate-400 text-center">Redirection vers revenuquebec.ca — site gouvernemental officiel</div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 mb-2">🔮 Architecture future prévue</div>
              <div className="flex flex-col gap-2 text-[8px] font-bold">
                {['ENTERPRISE GOV','↓ OAuth 2.0 + Contrat officiel','TAXIMETER.GOV GATEWAY','↓ API sécurisée autorisée','REVENU QUÉBEC','↓ Validation + Accusé de réception','DOSSIER FISCAL NUMÉRIQUE'].map((s,i)=>(
                  <div key={i} className={s.startsWith('↓')?'text-purple-300 dark:text-purple-800 pl-3':'px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DONNÉES PUBLIQUES ── */}
        {tab==='public'&&(
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Données publiques vérifiées — Uber Québec</div>
              <div className="text-[9px] text-slate-400 mb-4">Source: Uber Canada / Public First · {UBER_PUBLIC_DATA.publication}</div>

              {/* Impact économique */}
              <div className="bg-black rounded-2xl p-4 mb-4">
                <div className="text-[9px] font-bold mb-1" style={{color:'rgba(255,255,255,0.5)'}}>IMPACT ÉCONOMIQUE ESTIMÉ — QUÉBEC 2024</div>
                <div className="text-3xl font-black text-white">1,9 G$</div>
                <div className="text-[9px] mt-1" style={{color:'rgba(255,255,255,0.6)'}}>Dont Uber Eats pour restaurateurs : &gt;270 M$</div>
                <div className="text-[8px] mt-2 font-bold text-amber-400">⚠️ {UBER_PUBLIC_DATA.noteImpact}</div>
              </div>

              {[
                {l:'Année de référence',         v:String(UBER_PUBLIC_DATA.anneeRef)},
                {l:'Date de publication',         v:UBER_PUBLIC_DATA.publication},
                {l:'Source',                      v:UBER_PUBLIC_DATA.source},
                {l:'Nb chauffeurs QC (officiel)', v:UBER_PUBLIC_DATA.chauffeursQC},
                {l:'Source chauffeurs',           v:UBER_PUBLIC_DATA.chauffeursSource},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[9px] text-slate-500">{r.l}</span>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 text-right max-w-[55%]">{r.v}</span>
                </div>
              ))}

              <a href={UBER_PUBLIC_DATA.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 block text-center text-[9px] font-bold text-qc-blue hover:underline">
                → Voir la source officielle Uber Canada
              </a>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="text-[9px] text-slate-500 leading-relaxed">
                <span className="font-bold">Données synthétiques DEMO :</span> Les données opérationnelles affichées dans Enterprise Gov (chauffeurs, véhicules, activités, transactions, revenus) sont des données de démonstration fictives. Elles ne représentent pas les chiffres d'affaires ou états financiers réels d'Uber Technologies Inc., Uber Canada Inc. ou de l'une de leurs filiales.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
