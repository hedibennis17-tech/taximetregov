'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { X } from 'lucide-react'
import { DEMO_TRANSACTIONS, DEMO_DRIVERS, DEMO_PROVIDERS, PILOT_BANNER, TPS_RATE, TVQ_RATE, r2 } from '@/lib/demo-data'

const SRC_ICON:Record<string,string> = {TAXI:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',SKIP:'🟠'}
const SOURCES = ['','TAXI','UBER','LYFT','DOORDASH','INSTACART','UBER_EATS']
const STATUS_CONF:Record<string,{label:string;color:string;bg:string}> = {
  RECONCILED:          {label:'Réconcilié',       color:'#059669',bg:'rgba(5,150,105,0.12)'},
  REVIEW_REQUIRED:     {label:'À réviser',        color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  REFUND_PROCESSED:    {label:'Remboursement',    color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  AMOUNT_DIFFERENCE:   {label:'Écart montant',    color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  MISSING_TIP_DATA:    {label:'Tip manquant',     color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
}
const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))

function Tx360Modal({tx,onClose}:{tx:typeof DEMO_TRANSACTIONS[0];onClose:()=>void}) {
  const driver = DEMO_DRIVERS.find(d=>d.id===tx.driver)
  const sc = STATUS_CONF[tx.status]??STATUS_CONF['RECONCILED']!
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-bold text-white font-mono">{tx.id}</div>
            <div className="text-[10px] text-slate-400">{SRC_ICON[tx.provider]} {tx.provider} · {tx.service} · {fmtDt(tx.at)}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer"><X size={14} className="text-slate-400"/></button>
        </div>

        <div className="mb-3 p-2 rounded-lg text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{background:sc.bg}}>
          <span className="text-xs font-bold" style={{color:sc.color}}>{sc.label}</span>
        </div>

        {/* Transaction 360° */}
        <div className="text-[11px] font-bold text-slate-300 mb-3">📊 TRANSACTION 360°</div>

        {/* Identité */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Identité</div>
          {[
            {label:'Transaction ID', val:tx.id},
            {label:'Activity ID',    val:tx.actId},
            {label:'Webhook ID',     val:tx.whId??'N/A (Taxi)'},
            {label:'Driver ID',      val:tx.driver},
            {label:'Chauffeur',      val:driver?.name??'—'},
            {label:'Provider ID',    val:DEMO_PROVIDERS.find(p=>p.code===tx.provider)?.id??tx.provider},
            {label:'Réconciliation', val:tx.rec},
          ].map(r=>(
            <div key={r.label} className="flex justify-between text-xs py-1.5 border-b border-slate-700 last:border-0">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white font-mono text-[10px]">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Financier */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Financier</div>
          {[
            {label:'Montant client',         val:money(tx.clientAmt), color:'text-white'},
            {label:'Revenu activité (base)',  val:money(tx.base),     color:'text-green-400'},
            {label:'Pourboire',              val:money(tx.tip),       color:'#F5C842'},
            {label:'TPS (5%)',               val:money(tx.tps),       color:'text-purple-400'},
            {label:'TVQ (9,975%)',           val:money(tx.tvq),       color:'text-purple-400'},
            {label:'Frais fournisseur',      val:money(tx.fee),       color:'text-red-400'},
            {label:'Ajustement',             val:money(tx.adj),       color:'text-amber-400'},
            {label:'Remboursement',          val:money(tx.refund),    color:'text-amber-400'},
            {label:'Net chauffeur',          val:money(tx.driverNet), color:'text-green-400'},
          ].map(r=>(
            <div key={r.label} className="flex justify-between text-xs py-1.5 border-b border-slate-700 last:border-0">
              <span className="text-slate-400">{r.label}</span>
              <span className={`font-bold ${typeof r.color==='string'&&r.color.startsWith('#')?'':(r.color??'text-white')}`} style={typeof r.color==='string'&&r.color.startsWith('#')?{color:r.color}:{}}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* Transparence */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Transparence transactionnelle</div>
          <div className="flex flex-col gap-1 items-center text-center text-[10px]">
            {[
              {label:`Client: ${money(tx.clientAmt)}`, bg:'bg-blue-500/15', color:'text-blue-400'},
              {label:'↓ Fournisseur', bg:'', color:'text-slate-500'},
              {label:`Base: ${money(tx.base)} + Tip: ${money(tx.tip)}`, bg:'bg-green-500/10', color:'text-green-400'},
              {label:`TPS: ${money(tx.tps)} + TVQ: ${money(tx.tvq)}`, bg:'bg-purple-500/10', color:'text-purple-400'},
              {label:`Frais: ${money(tx.fee)}`, bg:'bg-red-500/10', color:'text-red-400'},
              {label:'↓', bg:'', color:'text-slate-500'},
              {label:`Chauffeur: ${money(tx.driverNet)}`, bg:'bg-green-500/15', color:'text-green-300'},
            ].map((r,i)=>(
              <div key={i} className={`${r.bg} rounded-lg px-3 py-1 font-semibold ${r.color} w-full max-w-xs`}>{r.label}</div>
            ))}
          </div>
        </div>

        {/* Période fiscale */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fiscal</div>
          {[
            {label:'Période',    val:tx.period},
            {label:'Taux TPS',  val:`${(TPS_RATE*100).toFixed(0)}%`},
            {label:'Taux TVQ',  val:`${(TVQ_RATE*100).toFixed(3)}%`},
            {label:'TPS',       val:money(tx.tps)},
            {label:'TVQ',       val:money(tx.tvq)},
            {label:'Statut',    val:sc.label},
          ].map(r=>(
            <div key={r.label} className="flex justify-between text-xs py-1.5 border-b border-slate-700 last:border-0">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white font-semibold">{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const [source, setSource] = useState('')
  const [selected, setSelected] = useState<typeof DEMO_TRANSACTIONS[0]|null>(null)

  const filtered = source ? DEMO_TRANSACTIONS.filter(t=>t.provider===source) : DEMO_TRANSACTIONS
  const totals = {
    gross:     r2(DEMO_TRANSACTIONS.reduce((s,t)=>s+t.base,0)),
    tips:      r2(DEMO_TRANSACTIONS.reduce((s,t)=>s+t.tip,0)),
    tps:       r2(DEMO_TRANSACTIONS.reduce((s,t)=>s+t.tps,0)),
    tvq:       r2(DEMO_TRANSACTIONS.reduce((s,t)=>s+t.tvq,0)),
    net:       r2(DEMO_TRANSACTIONS.reduce((s,t)=>s+t.driverNet,0)),
  }

  return (
    <AppShell>
      {selected&&<Tx360Modal tx={selected} onClose={()=>setSelected(null)}/>}
      <PageHeader title="Transactions" subtitle="Revenue Ledger · 30 transactions synthétiques · TAXIMETER.GOV"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {label:'Total tx', val:String(DEMO_TRANSACTIONS.length), color:'text-blue-400',  bg:'bg-blue-500/10'},
            {label:'Revenus',  val:money(totals.gross),               color:'text-green-400', bg:'bg-green-500/10'},
            {label:'Pourboires',val:money(totals.tips),               color:'#F5C842',        bg:'bg-yellow-500/8'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className="text-base font-black" style={s.color.startsWith('#')?{color:s.color}:{}} {...(!s.color.startsWith('#')&&{className:`text-base font-black ${s.color}`})}>{s.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto">
          {SOURCES.map(s=>(
            <button key={s} onClick={()=>setSource(s)} className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all" style={{
              background:source===s?'#003DA5':'rgba(255,255,255,0.05)',
              color:source===s?'white':'#94A3B8',
              borderColor:source===s?'#003DA5':'rgba(255,255,255,0.10)',
            }}>
              {s?`${SRC_ICON[s]} ${s}`:'Toutes'} {s&&`(${DEMO_TRANSACTIONS.filter(t=>t.provider===s).length})`}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="text-xs font-bold text-white">{filtered.length} transaction(s)</div>
            <span className="text-[9px] text-amber-400">PILOTE · Cliquer pour Transaction 360°</span>
          </div>
          {filtered.map((tx,idx)=>{
            const sc = STATUS_CONF[tx.status]??STATUS_CONF['RECONCILED']!
            return (
              <div key={tx.id} onClick={()=>setSelected(tx)} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/50">
                <span className="text-xl shrink-0">{SRC_ICON[tx.provider]??'💳'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-white font-mono">{tx.id}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{tx.provider} · {tx.service} · {fmtDt(tx.at)}</div>
                  <div className="flex gap-3 text-[9px] text-slate-500 mt-0.5">
                    <span>Base: {money(tx.base)}</span>
                    {tx.tip>0&&<span style={{color:'#F5C842'}}>Tip: {money(tx.tip)}</span>}
                    <span className="text-purple-400">TPS+TVQ: {money(r2(tx.tps+tx.tvq))}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-green-400">{money(tx.driverNet)}</div>
                  <div className="text-[9px] text-slate-500">net chauffeur</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totaux */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Totaux — {DEMO_TRANSACTIONS.length} transactions pilotes</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {label:'Revenus bruts',  val:money(totals.gross),  color:'text-green-400'},
              {label:'Pourboires',     val:money(totals.tips),   color:'#F5C842'},
              {label:'TPS totale',     val:money(totals.tps),    color:'text-purple-400'},
              {label:'TVQ totale',     val:money(totals.tvq),    color:'text-purple-400'},
              {label:'Net chauffeurs', val:money(totals.net),    color:'text-green-300'},
            ].map(r=>(
              <div key={r.label} className="flex justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">{r.label}</span>
                <span className="font-bold" style={r.color.startsWith('#')?{color:r.color}:{}} {...(!r.color.startsWith('#')&&{className:`font-bold ${r.color}`})}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
