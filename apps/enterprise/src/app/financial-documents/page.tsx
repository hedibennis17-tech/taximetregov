'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, money2, fmtDt, FINANCIAL_DOCS, FD_TYPE_CONF, FD_STATUS_CONF, REVENUE } from '@/lib/data'

const MONTHLY_SYNTH = [
  {m:'Avr',gross:44_200,tps:2210,tvq:4409.15},
  {m:'Mai',gross:48_600,tps:2430,tvq:4847.85},
  {m:'Juin',gross:51_680,tps:2584,tvq:5150.58},
  {m:'Juil',gross:142_800,tps:7140,tvq:14_234.46},
  {m:'Août',gross:148_400,tps:7420,tvq:14_793.06},
  {m:'Sep', gross:121_600,tps:6080,tvq:12_122.70},
]
const maxBar = Math.max(...MONTHLY_SYNTH.map(m=>m.gross))

export default function FinancialDocsPage() {
  const [typeF,   setTypeF]   = useState('ALL')
  const [statusF, setStatusF] = useState('ALL')
  const [search,  setSearch]  = useState('')
  const [ver,     setVer]     = useState<string|null>(null)

  const types   = [...new Set(FINANCIAL_DOCS.map(d=>d.type))]
  const filtered = FINANCIAL_DOCS.filter(d=>{
    if (typeF!=='ALL'   && d.type!==typeF)     return false
    if (statusF!=='ALL' && d.status!==statusF) return false
    if (search && !`${d.id} ${d.label} ${d.period} ${d.source}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalGross = FINANCIAL_DOCS.filter(d=>d.gross>0).reduce((s,d)=>s+d.gross,0)
  const totalTps   = FINANCIAL_DOCS.filter(d=>d.type.includes('DÉCL_TPS')).reduce((s,d)=>s+d.net,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Documents financiers & relevés</h1>
          <p className="text-sm text-slate-500 mt-1">Relevés · Déclarations · Pourboires · Rapports · Versionnement · Export</p>
        </div>
        <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · DONNÉES SYNTHÉTIQUES · NE REPRÉSENTE PAS LE CHIFFRE D'AFFAIRES RÉEL D'UBER OU D'UNE AUTRE ENTREPRISE
        </div>

        {/* Vue financière synthétique */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Vue financière consolidée (DEMO)</div>
          <div className="space-y-0">
            {[
              {l:'① Revenus bruts (all services)',  v:money(REVENUE.grossQ3),            c:'text-green-600 dark:text-green-400',  note:'Taxi + Rideshare + Livraison · Q3 2026'},
              {l:'② − Commissions / frais plateforme',v:`− ${money(REVENUE.fees)}`,      c:'text-red-500',                        note:'~15% selon service'},
              {l:'③ + Pourboires',                  v:`+ ${money(REVENUE.tips)}`,         c:'text-blue-600 dark:text-blue-400',    note:'Séparés des revenus principaux'},
              {l:'④ − TPS collectée (5%)',           v:`− ${money(REVENUE.tpsQ3)}`,       c:'text-purple-600 dark:text-purple-400',note:'À remettre ARC'},
              {l:'⑤ − TVQ collectée (9,975%)',       v:`− ${money(REVENUE.tvqQ3)}`,       c:'text-indigo-600 dark:text-indigo-400',note:'À remettre Revenu Québec'},
              {l:'⑥ ± Ajustements & remboursements', v:money(REVENUE.adj+REVENUE.refunds),c:'text-amber-600 dark:text-amber-400',  note:'Corrections et remboursements'},
              {l:'⑦ Part chauffeurs (~78%)',          v:`− ${money(REVENUE.driverQ3)}`,   c:'text-blue-700 dark:text-blue-300',    note:'Revenus versés aux chauffeurs'},
              {l:'⑧ REVENU ENTREPRISE NET',           v:money(REVENUE.entQ3),             c:'text-green-700 dark:text-green-300',  note:'Part entreprise estimée · SYNTHÉTIQUE', bold:true},
            ].map(r=>(
              <div key={r.l} className={`flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 ${'bold' in r && r.bold?'bg-slate-50 dark:bg-slate-800 px-3 rounded-xl -mx-3 mt-1':''}`}>
                <div>
                  <div className={`text-sm ${'bold' in r && r.bold?'font-black':'font-semibold'} text-slate-800 dark:text-slate-200`}>{r.l}</div>
                  <div className="text-sm text-slate-400 italic">{r.note}</div>
                </div>
                <div className={`text-sm font-black ${r.c} shrink-0 ml-2`}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique mensuel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Revenus par mois — multi-services (SYNTHÉTIQUE)</div>
          <div className="text-sm text-slate-400 mb-4">Avr–Sep 2026 · Taxi + Rideshare + Livraison · DONNÉES DEMO</div>
          <div className="flex items-end gap-2 h-20">
            {MONTHLY_SYNTH.map(m=>(
              <div key={m.m} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">{(m.gross/1000).toFixed(0)}k</div>
                <div className="w-full rounded-t-lg" style={{height:`${(m.gross/maxBar)*100}%`,background:'#003DA5',opacity:0.8}}/>
                <div className="text-sm text-slate-400">{m.m}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              {l:'TPS Q3 déclarée',  v:money(totalTps),          c:'text-purple-600 dark:text-purple-400'},
              {l:'TVQ Q3 estimée',   v:money(REVENUE.tvqQ3),     c:'text-indigo-600 dark:text-indigo-400'},
              {l:'Documents archivés',v:FINANCIAL_DOCS.filter(d=>d.status==='ARCHIVÉ').length, c:'text-slate-700 dark:text-slate-300'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
                <div className="text-sm text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Nom, période, source…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={()=>setTypeF('ALL')} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:typeF==='ALL'?'#003DA5':'transparent',color:typeF==='ALL'?'white':'#64748B',borderColor:typeF==='ALL'?'#003DA5':'rgba(148,163,184,0.30)'}}>Tous types</button>
            {types.map(t=>{
              const tc = FD_TYPE_CONF[t]!
              return (
                <button key={t} onClick={()=>setTypeF(t)} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:typeF===t?tc.color:'transparent',color:typeF===t?'white':'#64748B',borderColor:typeF===t?tc.color:'rgba(148,163,184,0.30)'}}>
                  {tc.icon} {tc.label}
                </button>
              )
            })}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['ALL','VALIDÉ','EN_COURS','ARCHIVÉ'].map(s=>{
              const sc = s==='ALL'?null:FD_STATUS_CONF[s]
              return (
                <button key={s} onClick={()=>setStatusF(s)} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:statusF===s?'#7C3AED':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#7C3AED':'rgba(148,163,184,0.30)'}}>
                  {s==='ALL'?`Tous statuts`:sc?.label??s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Liste documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} document(s)</span>
            <span className="text-sm font-bold text-slate-400">Versionnement · Aucune suppression silencieuse</span>
          </div>
          {filtered.map(doc=>{
            const tc = FD_TYPE_CONF[doc.type]!
            const sc = FD_STATUS_CONF[doc.status]!
            return (
              <div key={doc.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{borderLeft:`3px solid ${tc.color}`}}>
                <span className="text-xl shrink-0 mt-0.5">{tc.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{doc.label}</span>
                    <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{color:tc.color,background:`${tc.color}15`}}>{tc.label}</span>
                    {doc.version>1&&<span className="text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">V{doc.version}</span>}
                  </div>
                  <div className="text-sm font-mono text-slate-400 mb-0.5">{doc.id} · {doc.period} · Source: {doc.source}</div>
                  <div className="flex gap-4 text-sm flex-wrap">
                    {doc.gross>0&&<span className="text-green-600 dark:text-green-400">Brut: {money(doc.gross)}</span>}
                    {doc.tps>0&&<span className="text-purple-600 dark:text-purple-400">TPS: {money2(doc.tps)}</span>}
                    {doc.tvq>0&&<span className="text-indigo-600 dark:text-indigo-400">TVQ: {money2(doc.tvq)}</span>}
                    {doc.tips>0&&<span className="text-blue-600 dark:text-blue-400">Tips: {money2(doc.tips)}</span>}
                  </div>
                  <div className="text-sm text-slate-400 mt-0.5">{fmtDt(doc.at)} · Par: {doc.by}</div>
                  {doc.note&&<div className="text-sm text-amber-600 dark:text-amber-400 italic mt-0.5">{doc.note}</div>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button className="px-2 py-1 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer">Voir</button>
                  <button className="px-2 py-1 rounded-lg text-sm font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer">↓ Export</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note versionnement */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">📋 Politique de versionnement</div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <div>· Aucune suppression physique des documents — toutes les versions sont conservées.</div>
            <div>· Chaque correction crée une nouvelle version avec motif, auteur et date.</div>
            <div>· Les exports PDF/CSV/JSON incluent le numéro de version et la date de génération.</div>
            <div>· Le journal d'audit enregistre chaque consultation, modification et export.</div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
