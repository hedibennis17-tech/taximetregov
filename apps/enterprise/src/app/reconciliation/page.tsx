'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, money2, fmtDt, RECON_ITEMS, EXCEPTIONS, ENT_DRIVERS, RECON_STATUS_CONF, EXC_STATUS_CONF, EXC_TYPE_CONF, ALL_TRANSACTIONS } from '@/lib/data'

const WORKFLOW = ['SOURCE FOURNISSEUR','→','NORMALISATION','→','MATCHING','→','DIFFÉRENCE','→','DOSSIER','→','EXPLICATION','→','RÉSOLUTION']
const MATCH_CONF: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  EXACT_MATCH:   {label:'Exact',       color:'#059669',bg:'rgba(5,150,105,0.12)',   icon:'✅'},
  PARTIAL_MATCH: {label:'Partiel',     color:'#B45309', bg:'rgba(180,83,9,0.10)',   icon:'🔸'},
  MISMATCH:      {label:'Écart',       color:'#DC2626',bg:'rgba(220,38,38,0.10)',   icon:'⚠️'},
  MISSING:       {label:'Manquant',    color:'#DC2626',bg:'rgba(220,38,38,0.10)',   icon:'❌'},
  DUPLICATE:     {label:'Doublon',     color:'#7C3AED',bg:'rgba(124,58,237,0.12)',  icon:'🔄'},
}

export default function ReconciliationPage() {
  const [tab,    setTab]    = useState<'overview'|'items'|'exceptions'|'statements'>('overview')
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const matched   = RECON_ITEMS.filter(r=>r.status==='MATCHED').length
  const variance  = RECON_ITEMS.filter(r=>r.status==='VARIANCE').length
  const missing   = RECON_ITEMS.filter(r=>r.status==='MISSING').length
  const openExc   = EXCEPTIONS.filter(e=>e.status!=='CLOSED').length
  const totalDiff = RECON_ITEMS.reduce((s,r)=>s+Math.abs(r.diff),0)

  const filtered = RECON_ITEMS.filter(r=>{
    if (filter!=='ALL' && r.status!==filter) return false
    if (search && !`${r.id} ${r.txId} ${r.provider} ${r.driverId}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Réconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">Source vs Revenue Ledger · Matching · Exceptions · Transparence financière</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Un écart ≠ une fraude automatique — chaque cas est analysé individuellement</div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Processus de réconciliation</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-5 gap-2">
          {[
            {l:'Équilibrés',  v:matched,            c:'#059669',bg:'bg-green-50 dark:bg-green-500/10',   icon:'✅'},
            {l:'Variances',   v:variance,            c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',  icon:'⚠️'},
            {l:'Manquants',   v:missing,             c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',      icon:'❌'},
            {l:'Exceptions',  v:openExc,             c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',      icon:'🔴'},
            {l:'Total écarts',v:money(totalDiff),    c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',  icon:'💰'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([['overview','📊 Vue globale'],['items','🔄 Items'],['exceptions','⚠️ Exceptions'],['statements','📋 Relevés']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:tab===t?'#003DA5':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Vue chaîne client→gov */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Chaîne de transparence financière</div>
              <div className="flex flex-col gap-2">
                {[
                  {from:'CLIENT',         to:'Montant total payé (brut + TPS + TVQ + tip)',             icon:'👤'},
                  {from:'FOURNISSEUR',    to:'Répartition: frais plateforme / net chauffeur',           icon:'🔌'},
                  {from:'CHAUFFEUR',      to:'Revenu net reçu + pourboire',                             icon:'👨‍✈️'},
                  {from:'ENTREPRISE',     to:'Part entreprise + charges + obligations',                 icon:'🏢'},
                  {from:'REVENUE LEDGER', to:'Enregistrement structuré par transaction',                icon:'📒'},
                  {from:'TAXIMETER.GOV',  to:'Vérification et rapprochement automatique',               icon:'🏛️'},
                ].map((row,i)=>(
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-sm shrink-0">{row.icon}</div>
                    <div className="flex-1 py-1">
                      <div className="text-[9px] font-black text-blue-700 dark:text-blue-400">{row.from}</div>
                      <div className="text-[9px] text-slate-500">{row.to}</div>
                    </div>
                    {i<5&&<div className="text-slate-300 dark:text-slate-700 text-xs self-end pb-1 shrink-0">↓</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé par provider */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Réconciliation par fournisseur</div>
              {[...new Set(RECON_ITEMS.map(r=>r.provider))].map(prov=>{
                const items = RECON_ITEMS.filter(r=>r.provider===prov)
                const ok = items.filter(r=>r.status==='MATCHED').length
                const ko = items.filter(r=>r.status!=='MATCHED').length
                const total = items.reduce((s,r)=>s+r.sourceAmt,0)
                return (
                  <div key={prov} className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{prov}</span>
                      <div className="flex gap-3 text-[9px]">
                        <span className="text-green-600 dark:text-green-400">✅ {ok}</span>
                        {ko>0&&<span className="text-red-500">⚠️ {ko}</span>}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{money(total)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{width:`${(ok/items.length)*100}%`}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ITEMS ── */}
        {tab==='items'&&(
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
                  placeholder="REC ID, TX ID, fournisseur, chauffeur…"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['ALL','MATCHED','VARIANCE','MISSING'] as const).map(f=>{
                  const sc = f==='ALL'?null:RECON_STATUS_CONF[f]
                  return (
                    <button key={f} onClick={()=>setFilter(f)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:filter===f?'#003DA5':'transparent',color:filter===f?'white':'#64748B',borderColor:filter===f?'#003DA5':'rgba(148,163,184,0.30)'}}>
                      {f==='ALL'?`Tous (${RECON_ITEMS.length})`:`${sc?.icon} ${sc?.label}`}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {['Recon ID','TX ID','Date','Fournisseur','Chauffeur','Source','Ledger','Diff','TPS src','TPS ldgr','Statut'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.map(r=>{
                      const sc  = RECON_STATUS_CONF[r.status]!
                      const drv = ENT_DRIVERS.find(d=>d.id===r.driverId)
                      return (
                        <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 font-mono text-[9px] text-blue-600 dark:text-blue-400">{r.id}</td>
                          <td className="px-3 py-2.5 font-mono text-[9px] text-slate-500">{r.txId}</td>
                          <td className="px-3 py-2.5 text-[9px] text-slate-400 whitespace-nowrap">{fmtDt(r.at)}</td>
                          <td className="px-3 py-2.5 text-[9px] text-slate-700 dark:text-slate-300">{r.provider}</td>
                          <td className="px-3 py-2.5 text-[9px] text-slate-500 whitespace-nowrap">{drv?.name??r.driverId}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{money2(r.sourceAmt)}</td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{money2(r.ledgerAmt)}</td>
                          <td className={`px-3 py-2.5 font-black whitespace-nowrap ${r.diff!==0?'text-red-500':'text-green-600 dark:text-green-400'}`}>{r.diff!==0?`${money2(r.diff)}`:'—'}</td>
                          <td className="px-3 py-2.5 text-[9px] text-purple-600 dark:text-purple-400 whitespace-nowrap">{money2(r.tpsSource)}</td>
                          <td className="px-3 py-2.5 text-[9px] text-slate-400 whitespace-nowrap">{money2(r.tpsLedger)}</td>
                          <td className="px-3 py-2.5"><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{sc.icon} {sc.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {filtered.some(r=>r.note)&&(
              <div className="space-y-1">
                {filtered.filter(r=>r.note).map(r=>(
                  <div key={r.id} className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2 text-[9px]">
                    <span className="font-bold text-amber-700 dark:text-amber-400">{r.id}</span> <span className="text-slate-600 dark:text-slate-300 italic">— {r.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EXCEPTIONS ── */}
        {tab==='exceptions'&&(
          <div className="space-y-2">
            {EXCEPTIONS.map(e=>{
              const tc = EXC_TYPE_CONF[e.type]!
              const sc = EXC_STATUS_CONF[e.status]!
              const drv = ENT_DRIVERS.find(d=>d.id===e.driverId)
              return (
                <div key={e.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${tc.color}`}}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">{tc.icon}</span>
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">{e.id}</span>
                        <span className="text-[8px] font-bold" style={{color:tc.color}}>{tc.label}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">{e.txId??'—'} · {drv?.name??e.driverId??'—'} · {e.provider} · {fmtDt(e.at)}</div>
                    </div>
                    {e.diff!==0&&<div className="text-right shrink-0"><div className="text-lg font-black text-red-500">{money2(e.diff)}</div><div className="text-[8px] text-slate-400">écart</div></div>}
                  </div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-300 mb-2">{e.desc}</div>
                  {e.resolution&&(
                    <div className="bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/15 rounded-xl px-3 py-2 text-[9px] text-green-700 dark:text-green-400 mb-2">
                      ✅ Résolution: {e.resolution}
                    </div>
                  )}
                  {!e.resolution&&e.action&&(
                    <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/15 rounded-xl px-3 py-2 text-[9px] text-blue-700 dark:text-blue-400">
                      🎯 Action requise: {e.action}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── RELEVÉS ── */}
        {tab==='statements'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Comparaison multi-sources (DEMO)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {['TX ID','Provider','Source fournisseur','Enterprise Ledger','Chauffeur déclaré','Différence','Statut'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {RECON_ITEMS.map(r=>{
                      const sc  = RECON_STATUS_CONF[r.status]!
                      const tx  = ALL_TRANSACTIONS.find(t=>t.id===r.txId)
                      return (
                        <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 font-mono text-[9px] text-blue-600 dark:text-blue-400">{r.txId}</td>
                          <td className="px-3 py-2.5 text-[9px]">{r.provider}</td>
                          <td className="px-3 py-2.5 font-bold text-green-600 dark:text-green-400">{money2(r.sourceAmt)}</td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{money2(r.ledgerAmt)}</td>
                          <td className="px-3 py-2.5 text-blue-600 dark:text-blue-400">{tx?money2(tx.driverAmt):'—'}</td>
                          <td className={`px-3 py-2.5 font-black ${r.diff!==0?'text-red-500':'text-slate-300 dark:text-slate-700'}`}>{r.diff!==0?money2(r.diff):'—'}</td>
                          <td className="px-3 py-2.5"><span className="text-[8px] font-bold" style={{color:sc.color}}>{sc.icon} {sc.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-[9px] text-slate-400 italic">Source fournisseur ≠ Enterprise Ledger n'implique pas d'irrégularité — chaque cas est analysé séparément · {PILOT}</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
