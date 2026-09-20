'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, money2, fmtDt, OPS_ACTIVITIES, ENT_DRIVERS, DEPARTMENTS } from '@/lib/data'

const SVC_ICONS: Record<string,string> = {
  'UBER TAXI':'🚕','UBERX':'🚗','UBERXL':'🚗','UBER GREEN':'🟢',
  'UBER EATS':'🍔','UBER GROCERY':'🛒','UBER COURIER':'📦',
}
const STATUS_CONF: Record<string,{color:string;bg:string}> = {
  'TERMINÉE':  {color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'À VÉRIFIER':{color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  'EN COURS':  {color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  'ANNULÉE':   {color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}

export default function OperationsPage() {
  const [deptF, setDeptF] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState<string|null>(null)

  const filtered = OPS_ACTIVITIES.filter(a=>{
    if (deptF!=='ALL' && a.dept!==deptF) return false
    if (search && !`${a.id} ${a.svc} ${a.driverId} ${a.origin} ${a.dest}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selAct = OPS_ACTIVITIES.find(a=>a.id===sel)

  const totalGross = filtered.reduce((s,a)=>s+a.fare,0)
  const totalTPS   = filtered.reduce((s,a)=>s+a.tps,0)
  const totalTips  = filtered.reduce((s,a)=>s+a.tip,0)
  const totalDist  = filtered.reduce((s,a)=>s+a.dist,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre des opérations</h1>
          <p className="text-sm text-slate-500 mt-1">Activités · Courses · Livraisons · Performance · Traçabilité</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · DONNÉES SYNTHÉTIQUES · 20 activités pilote représentatives</div>

        {/* Chaîne traçabilité */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase mb-2">Chaîne de traçabilité</div>
          <div className="flex items-center gap-1 flex-wrap text-sm font-bold">
            {['ACTIVITÉ','→','TRANSACTION','→','LEDGER','→','FISCALITÉ','→','DÉCLARATION','→','TAXIMETER.GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-black text-white'}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI dynamiques */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:`Activités (${filtered.length})`, v:filtered.length,         c:'#000',   bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'Revenus bruts (DEMO)',            v:money(totalGross),       c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'TPS collectée (DEMO)',            v:money(totalTPS),         c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
            {l:'Km totaux (DEMO)',                v:`${totalDist.toFixed(0)} km`,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="ID activité, service, chauffeur, origine…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={()=>setDeptF('ALL')} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:deptF==='ALL'?'#000':'transparent',color:deptF==='ALL'?'white':'#64748B',borderColor:deptF==='ALL'?'#000':'rgba(148,163,184,0.30)'}}>
              Tous ({OPS_ACTIVITIES.length})
            </button>
            {DEPARTMENTS.filter(d=>d.status==='ACTIVE').map(d=>(
              <button key={d.slug} onClick={()=>setDeptF(d.slug)} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:deptF===d.slug?d.color:'transparent',color:deptF===d.slug?'white':'#64748B',borderColor:deptF===d.slug?d.color:'rgba(148,163,184,0.30)'}}>
                {d.emoji} {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tableau activités */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} activité(s)</span>
              <Link href="/reconciliation" className="text-sm font-bold text-qc-blue hover:underline">→ Réconciliation</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                  {['ID','Service','Chauffeur','Trajet','Dist.','Brut','Tip','TPS','Statut'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-sm font-bold text-white uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map(a=>{
                    const sc = STATUS_CONF[a.status]??{color:'#64748B',bg:'rgba(100,116,139,0.10)'}
                    const isSelected = sel===a.id
                    return (
                      <tr key={a.id} onClick={()=>setSel(isSelected?null:a.id)} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" style={{background:isSelected?'#EEF3FB':''}}>
                        <td className="px-3 py-2 font-mono text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">{a.id}</td>
                        <td className="px-3 py-2 text-sm whitespace-nowrap">{SVC_ICONS[a.svc]??'📍'} {a.svc}</td>
                        <td className="px-3 py-2 text-sm text-slate-500 whitespace-nowrap">{a.driverId}</td>
                        <td className="px-3 py-2 text-sm text-slate-500 whitespace-nowrap max-w-[100px] truncate">{a.origin}→{a.dest}</td>
                        <td className="px-3 py-2 text-sm text-center text-slate-500">{a.dist}km</td>
                        <td className="px-3 py-2 font-bold text-green-600 dark:text-green-400 whitespace-nowrap">{money2(a.fare)}</td>
                        <td className="px-3 py-2 text-sm text-blue-600 dark:text-blue-400">{a.tip>0?money2(a.tip):'—'}</td>
                        <td className="px-3 py-2 text-sm text-purple-600 dark:text-purple-400">{money2(a.tps)}</td>
                        <td className="px-3 py-2"><span className="text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{a.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Détail activité sélectionnée */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            {selAct?(
              <>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-800 dark:text-white">
                  {SVC_ICONS[selAct.svc]??'📍'} {selAct.id}
                </div>
                <div className="p-4 space-y-2">
                  {[
                    {l:'Service',      v:selAct.svc},
                    {l:'Département',  v:DEPARTMENTS.find(d=>d.slug===selAct.dept)?.name??selAct.dept},
                    {l:'Chauffeur',    v:selAct.driverId},
                    {l:'Véhicule',     v:selAct.vehicleId},
                    {l:'Date',         v:fmtDt(selAct.at)},
                    {l:'Origine',      v:selAct.origin},
                    {l:'Destination',  v:selAct.dest},
                    {l:'Distance',     v:`${selAct.dist} km`},
                    {l:'Durée',        v:`${selAct.dur} min`},
                    {l:'Montant brut', v:money2(selAct.fare)},
                    {l:'Pourboire',    v:selAct.tip>0?money2(selAct.tip):'—'},
                    {l:'TPS',          v:money2(selAct.tps)},
                    {l:'TVQ',          v:money2(selAct.tvq)},
                    {l:'Commission',   v:money2(selAct.commission)},
                    {l:'Part chauffeur',v:money2(selAct.driverAmt)},
                    {l:'Statut',       v:selAct.status},
                    {l:'TX liée',      v:selAct.txId},
                  ].map(r=>(
                    <div key={r.l} className="flex justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 py-1">
                      <span className="text-sm text-slate-400">{r.l}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
                    </div>
                  ))}
                  {/* Chaîne traçabilité mini */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-bold text-slate-400 mb-1.5">Traçabilité</div>
                    {[
                      {l:'Activité',  v:'✅ '+selAct.id,   c:'#059669'},
                      {l:'Transaction',v:'✅ '+selAct.txId,c:'#059669'},
                      {l:'Ledger',    v:'✅ SYNCED',        c:'#059669'},
                      {l:'TPS/TVQ',   v:'✅ Calculé',       c:'#7C3AED'},
                      {l:'Déclaration',v:'⏳ Q3 en cours',   c:'#B45309'},
                    ].map(r=>(
                      <div key={r.l} className="flex justify-between py-0.5">
                        <span className="text-sm text-slate-400">{r.l}</span>
                        <span className="text-sm font-bold" style={{color:r.c}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ):(
              <div className="p-6 text-center text-sm text-slate-400 italic">
                Cliquer sur une activité pour voir son détail et sa chaîne de traçabilité
              </div>
            )}
          </div>
        </div>

        {/* Rapprochement rapide */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Rapprochement des activités (DEMO)</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              {l:'Activités terminées',     v:filtered.filter(a=>a.status==='TERMINÉE').length,    c:'#059669',icon:'✅'},
              {l:'À vérifier',              v:filtered.filter(a=>a.status==='À VÉRIFIER').length,  c:'#B45309',icon:'⚠️'},
              {l:'Avec transaction liée',   v:filtered.length,                                      c:'#003DA5',icon:'💳'},
              {l:'TPS calculée (DEMO)',     v:money(totalTPS),                                      c:'#7C3AED',icon:'🧾'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
                <div className="text-sm text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          <Link href="/reconciliation" className="mt-3 block text-center text-sm font-bold text-qc-blue hover:underline">→ Voir réconciliation complète</Link>
        </div>
      </div>
    </AppShell>
  )
}
