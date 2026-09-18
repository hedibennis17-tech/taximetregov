'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Layers, Scale, ShieldAlert, ArrowLeft, X } from 'lucide-react'
import { DEMO_TRANSACTIONS, DEMO_DRIVERS, PILOT_BANNER, TPS_RATE, TVQ_RATE, r2 } from '@/lib/demo-data'

const ICON: Record<string,string> = {TAXI:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',SKIP:'🟠'}
const SOURCES = ['','TAXI','UBER','LYFT','DOORDASH','INSTACART','UBER_EATS']
const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  RECONCILED:        {label:'Réconcilié',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  REVIEW_REQUIRED:   {label:'À réviser',     color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  REFUND_PROCESSED:  {label:'Remboursement', color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  AMOUNT_DIFFERENCE: {label:'Écart montant', color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  MISSING_TIP_DATA:  {label:'Tip manquant',  color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
}
const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))

// Enrichir avec info chauffeur
const TX = DEMO_TRANSACTIONS.map(tx => ({
  ...tx,
  driver_name: DEMO_DRIVERS.find(d=>d.id===tx.driver)?.name ?? tx.driver,
  driver_number: DEMO_DRIVERS.find(d=>d.id===tx.driver)?.number ?? tx.driver,
}))

function Tx360Modal({tx,onClose}:{tx:typeof TX[0];onClose:()=>void}) {
  const sc = STATUS_CONF[tx.status]??STATUS_CONF['RECONCILED']!
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-white font-mono">{tx.id}</div>
            <div className="text-[10px] text-slate-400 mt-1">{ICON[tx.provider]} {tx.provider} · {tx.service} · {fmtDt(tx.at)}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer"><X size={14} className="text-slate-400"/></button>
        </div>

        <div className="mb-3 p-2 rounded-lg text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>
        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg" style={{background:sc.bg}}>
          <span className="text-xs font-bold" style={{color:sc.color}}>{sc.label}</span>
        </div>

        {/* Transparence visuelle */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Transparence transactionnelle</div>
          <div className="flex flex-col items-center gap-1 text-[10px]">
            {[
              {label:`Client: ${money(tx.clientAmt)}`,bg:'bg-blue-500/15',color:'text-blue-400'},
              {label:'↓ Fournisseur',bg:'',color:'text-slate-500'},
              {label:`Activité: ${money(tx.base)}`,bg:'bg-green-500/10',color:'text-green-400'},
              {label:`+ Pourboire: ${money(tx.tip)}`,bg:'rgba(245,198,66,0.10)',color:'#F5C842'},
              {label:`TPS ${(TPS_RATE*100).toFixed(0)}%: ${money(tx.tps)}  TVQ ${(TVQ_RATE*100).toFixed(3)}%: ${money(tx.tvq)}`,bg:'bg-purple-500/10',color:'text-purple-400'},
              {label:`Frais plateforme: ${money(tx.fee)}`,bg:'bg-red-500/10',color:'text-red-400'},
              {label:'↓ Chauffeur',bg:'',color:'text-slate-500'},
              {label:`Net chauffeur: ${money(tx.driverNet)}`,bg:'bg-green-500/15',color:'text-green-300'},
            ].map((r,i)=>(
              <div key={i} className={`${r.bg} rounded-lg px-3 py-1.5 font-semibold w-full max-w-sm text-center`} style={r.color.startsWith('#')?{color:r.color}:{}} {...(!r.color.startsWith('#')&&{className:`${r.bg} rounded-lg px-3 py-1.5 font-semibold w-full max-w-sm text-center ${r.color}`})}>{r.label}</div>
            ))}
          </div>
        </div>

        {/* Identité + Fiscal */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Identité</div>
            {[
              {l:'Chauffeur',  v:tx.driver_name},
              {l:'No.',        v:tx.driver_number},
              {l:'Activity ID',v:tx.actId},
              {l:'Webhook ID', v:tx.whId??'N/A (Taxi direct)'},
              {l:'Réconcil.',  v:tx.rec},
              {l:'Période',    v:tx.period},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-700 last:border-0">
                <span className="text-[10px] text-slate-400">{r.l}</span>
                <span className="text-[10px] font-bold text-white font-mono">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Financier complet</div>
            {[
              {l:'Brut client',         v:money(tx.clientAmt), c:'text-white'},
              {l:'Revenu activité',      v:money(tx.base),      c:'text-green-400'},
              {l:'Pourboire',           v:money(tx.tip),        c:'#F5C842'},
              {l:'TPS',                 v:money(tx.tps),        c:'text-purple-400'},
              {l:'TVQ',                 v:money(tx.tvq),        c:'text-purple-400'},
              {l:'Frais fournisseur',   v:money(tx.fee),        c:'text-red-400'},
              {l:'Ajustement',          v:money(tx.adj),        c:'text-amber-400'},
              {l:'Remboursement',       v:money(tx.refund),     c:'text-amber-400'},
              {l:'Net chauffeur',       v:money(tx.driverNet),  c:'text-green-400'},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-700 last:border-0">
                <span className="text-[10px] text-slate-400">{r.l}</span>
                <span className="text-[10px] font-bold" style={r.c.startsWith('#')?{color:r.c}:{}} {...(!r.c.startsWith('#')&&{className:`text-[10px] font-bold ${r.c}`})}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source comparison */}
        <div className="mt-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-700">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Comparaison des sources</div>
          {[
            {l:'Source fournisseur',  v:money(tx.clientAmt), s:tx.status==='RECONCILED'?'MATCH':tx.status==='REVIEW_REQUIRED'?'REVIEW':'PARTIAL'},
            {l:'Source chauffeur',    v:money(tx.driverNet), s:'PARTIAL'},
            {l:'Source gouvernement', v:money(tx.base+tx.tip), s:tx.status==='RECONCILED'?'MATCH':'REVIEW'},
          ].map(r=>{
            const sc2 = r.s==='MATCH'?{c:'text-green-400',l:'✓ MATCH'}:r.s==='PARTIAL'?{c:'text-amber-400',l:'~ PARTIEL'}:{c:'text-red-400',l:'⚠ RÉVISION'}
            return (
              <div key={r.l} className="flex items-center justify-between py-1.5 border-b border-slate-700 last:border-0">
                <span className="text-[10px] text-slate-400">{r.l}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white">{r.v}</span>
                  <span className={`text-[8px] font-bold ${sc2.c}`}>{sc2.l}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const NAV = [
  {href:'/provider-transparency', label:'Vue globale',   icon:Layers,      active:false},
  {href:'/provider-transparency/transactions', label:'Transactions', icon:Layers, active:true},
  {href:'/provider-transparency/reconciliation', label:'Réconciliation', icon:Scale, active:false},
  {href:'/provider-transparency/exceptions', label:'Exceptions', icon:ShieldAlert, active:false},
]

export default function TransactionsExplorerPage() {
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof TX[0]|null>(null)

  const filtered = TX.filter(tx =>
    (!source || tx.provider === source) &&
    (!search || `${tx.driver_name} ${tx.driver_number} ${tx.id} ${tx.actId}`.toLowerCase().includes(search.toLowerCase()))
  )

  const totals = {
    gross: r2(filtered.reduce((s,t)=>s+t.base,0)),
    tips:  r2(filtered.reduce((s,t)=>s+t.tip,0)),
    tps:   r2(filtered.reduce((s,t)=>s+t.tps,0)),
    tvq:   r2(filtered.reduce((s,t)=>s+t.tvq,0)),
    net:   r2(filtered.reduce((s,t)=>s+t.driverNet,0)),
  }

  return (
    <AppShell>
      {selected&&<Tx360Modal tx={selected} onClose={()=>setSelected(null)}/>}

      {/* Header nav */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/provider-transparency" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"><ArrowLeft size={13}/> Vue globale</Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white font-semibold">Transactions · Données pilotes</span>
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
        {/* Bannière */}
        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        {/* KPI */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[
            {l:'Transactions', v:String(filtered.length),  c:'text-blue-400',  bg:'bg-blue-500/10'},
            {l:'Revenus bruts',v:money(totals.gross),      c:'text-green-400', bg:'bg-green-500/10'},
            {l:'Pourboires',   v:money(totals.tips),       c:'',               bg:'bg-yellow-500/8', style:{color:'#F5C842'}},
            {l:'TPS + TVQ',    v:money(r2(totals.tps+totals.tvq)), c:'text-purple-400',bg:'bg-purple-500/10'},
            {l:'Net chauffeurs',v:money(totals.net),       c:'text-green-400', bg:'bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-sm font-black ${s.c}`} style={s.style??{}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom chauffeur, ID, référence…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white pl-9 outline-none focus:border-qc-blue"/>
            <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {SOURCES.map(s=>(
              <button key={s} onClick={()=>setSource(s)} className="px-3 py-2 rounded-xl text-[10px] font-bold border transition-all" style={{
                background:source===s?'#003DA5':'rgba(255,255,255,0.04)',
                color:source===s?'white':'#94A3B8',
                borderColor:source===s?'#003DA5':'rgba(255,255,255,0.08)',
              }}>
                {s?`${ICON[s]??''} ${s}`:'Tous'} {s&&`(${TX.filter(t=>t.provider===s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="text-xs font-bold text-white">{filtered.length} transaction(s) · Données pilotes Q3 2026</div>
            <span className="text-[9px] text-amber-400">Cliquer → Transaction 360°</span>
          </div>
          {/* En-têtes */}
          <div className="grid grid-cols-6 px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Chauffeur · Référence</div>
            <div>Source</div>
            <div className="text-right">Brut client</div>
            <div className="text-right">Pourboire</div>
            <div className="text-right">Net chauffeur · Date</div>
          </div>
          {filtered.map((tx)=>{
            const sc = STATUS_CONF[tx.status]??STATUS_CONF['RECONCILED']!
            return (
              <div key={tx.id} onClick={()=>setSelected(tx)} className="grid grid-cols-6 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50/80 dark:bg-slate-800/50 items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-white">{tx.driver_name}</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">{tx.id}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm">{ICON[tx.provider]??'💳'}</span>
                  <div className="text-[9px] text-slate-400 mt-0.5">{tx.service.split(' ')[0]}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{money(tx.clientAmt)}</div>
                  <div className="text-[9px] text-green-400 mt-0.5">base: {money(tx.base)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold" style={{color:tx.tip>0?'#F5C842':'#475569'}}>{money(tx.tip)}</div>
                  <div className="text-[9px] text-purple-400 mt-0.5">{money(r2(tx.tps+tx.tvq))} taxes</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-green-400">{money(tx.driverNet)}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{new Date(tx.at).toLocaleDateString('fr-CA',{month:'short',day:'numeric'})}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totaux */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Totaux — {filtered.length} transactions pilotes Q3 2026</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              {l:'Brut clients',    v:money(totals.gross), c:'text-white'},
              {l:'Pourboires',      v:money(totals.tips),  style:{color:'#F5C842'}},
              {l:'TPS',            v:money(totals.tps),    c:'text-purple-400'},
              {l:'TVQ',            v:money(totals.tvq),    c:'text-purple-400'},
              {l:'Net chauffeurs', v:money(totals.net),    c:'text-green-400'},
            ].map(r=>(
              <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                <div className="text-sm font-black" style={(r as {style?:object}).style??{}} {...(!( r as {style?:object}).style&&{className:`text-sm font-black ${(r as {c?:string}).c??''}`})}>{r.v}</div>
                <div className="text-[9px] text-slate-400 mt-1">{r.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
