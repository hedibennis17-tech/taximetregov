'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { PILOT_BANNER, TPS_RATE, TVQ_RATE, r2 } from '@/lib/demo-data'

const PROVIDERS = ['UBER','LYFT','DOORDASH','INSTACART','UBER_EATS','TAXI']
const SERVICES:Record<string,string[]> = {
  UBER:['UberX','UberXL','Uber Black'],
  LYFT:['Standard','XL','Lux'],
  DOORDASH:['Livraison standard','Express'],
  INSTACART:['Épicerie standard','Express'],
  UBER_EATS:['Livraison standard'],
  TAXI:['Taxi standard','Taxi accessible'],
}
const DRIVERS = [
  {id:'DEMO-DRV-001',name:'Hedi Bennis'},
  {id:'DEMO-DRV-002',name:'Mohammed El-Amine'},
  {id:'DEMO-DRV-003',name:'Sofia Lapointe'},
]
const SRC_ICON:Record<string,string> = {UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',TAXI:'🚕'}
const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)

type SimResult = {
  actId:string; txId:string; whId:string|null; recId:string; audId:string
  provider:string; service:string; driver:string
  clientAmt:number; base:number; tip:number; fee:number
  tps:number; tvq:number; driverNet:number; period:string
  createdAt:string
}

export default function SimulatorPage() {
  const [provider, setProvider] = useState('UBER')
  const [service,  setService]  = useState('UberX')
  const [driver,   setDriver]   = useState(DRIVERS[0]!.id)
  const [base,     setBase]     = useState('30.00')
  const [tip,      setTip]      = useState('3.00')
  const [fee,      setFee]      = useState('6.00')
  const [adj,      setAdj]      = useState('0.00')
  const [result,   setResult]   = useState<SimResult|null>(null)
  const [loading,  setLoading]  = useState(false)

  const baseN = parseFloat(base)||0
  const tipN  = parseFloat(tip)||0
  const feeN  = parseFloat(fee)||0
  const adjN  = parseFloat(adj)||0
  const tps   = r2((baseN+tipN)*TPS_RATE)
  const tvq   = r2((baseN+tipN)*TVQ_RATE)
  const clientAmt = r2(baseN+tipN+tps+tvq)
  const driverNet = r2(baseN+tipN-feeN+adjN)

  function simulate() {
    setLoading(true)
    setTimeout(()=>{
      const ts   = Date.now()
      const rand = Math.random().toString(36).slice(2,6).toUpperCase()
      setResult({
        actId:   `ACT-SIM-${rand}`,
        txId:    `TX-SIM-${rand}`,
        whId:    provider!=='TAXI'?`WH-SIM-${rand}`:null,
        recId:   `REC-SIM-${rand}`,
        audId:   `AUD-SIM-${rand}`,
        provider, service,
        driver:  DRIVERS.find(d=>d.id===driver)?.name??driver,
        clientAmt, base:baseN, tip:tipN, fee:feeN,
        tps, tvq, driverNet,
        period:  '2026-Q3',
        createdAt: new Date(ts).toISOString(),
      })
      setLoading(false)
    }, 1200)
  }

  return (
    <AppShell>
      <PageHeader title="Simulateur gouvernemental" subtitle="Simulation de la chaîne transactionnelle complète · Mode pilote"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER} · Aucune donnée réelle impliquée</div>

        {/* Explication */}
        <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-2">🎯 Objectif du simulateur</div>
          <div className="text-[10px] text-slate-300 leading-relaxed">
            Créez une transaction synthétique et observez comment TAXIMETER.GOV génère automatiquement tous les objets associés : activité, transaction, webhook, revenue ledger, calcul fiscal, réconciliation et audit.
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
          <div className="text-xs font-bold text-white mb-2">Paramètres de la transaction</div>

          {/* Provider + Service */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">Fournisseur</div>
              <select value={provider} onChange={e=>{setProvider(e.target.value);setService(SERVICES[e.target.value]?.[0]??'')}} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                {PROVIDERS.map(p=><option key={p} value={p}>{SRC_ICON[p]} {p}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">Service</div>
              <select value={service} onChange={e=>setService(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                {(SERVICES[provider]??[]).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Driver */}
          <div>
            <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">Chauffeur</div>
            <select value={driver} onChange={e=>setDriver(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
              {DRIVERS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Revenu de base ($)',  val:base,  set:setBase},
              {label:'Pourboire ($)',       val:tip,   set:setTip},
              {label:'Frais fournisseur ($)',val:fee,  set:setFee},
              {label:'Ajustement ($)',      val:adj,   set:setAdj},
            ].map(f=>(
              <div key={f.label}>
                <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">{f.label}</div>
                <input type="number" value={f.val} onChange={e=>f.set(e.target.value)} step="0.01" min="0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"/>
              </div>
            ))}
          </div>

          {/* Aperçu calcul */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Aperçu du calcul</div>
            <div className="space-y-1">
              {[
                {label:'Revenu activité',  val:money(baseN),    color:'text-green-400'},
                {label:'+ Pourboire',      val:money(tipN),     color:'text-yellow-400'},
                {label:`+ TPS (${(TPS_RATE*100).toFixed(0)}%)`, val:money(tps), color:'text-purple-400'},
                {label:`+ TVQ (${(TVQ_RATE*100).toFixed(3)}%)`,val:money(tvq),  color:'text-purple-400'},
                {label:'= Montant client', val:money(clientAmt),color:'text-white'},
                {label:'− Frais',          val:money(feeN),     color:'text-red-400'},
                {label:'= Net chauffeur',  val:money(driverNet),color:'text-green-400'},
              ].map(r=>(
                <div key={r.label} className="flex justify-between text-[10px]">
                  <span className="text-slate-400">{r.label}</span>
                  <span className={`font-bold ${r.color}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={simulate} disabled={loading} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${loading?'bg-slate-700 text-slate-500 cursor-not-allowed':'bg-qc-blue text-white hover:bg-blue-700 cursor-pointer'}`}>
            {loading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Simulation en cours…</>:'🚀 Simuler la transaction'}
          </button>
        </div>

        {/* Résultat */}
        {result&&(
          <div className="bg-slate-900 border border-green-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400"/>
              <div className="text-sm font-bold text-green-400">Transaction simulée avec succès</div>
            </div>
            <div className="p-2 rounded-lg text-[9px] text-amber-400 bg-amber-500/8 border border-amber-500/15">{PILOT_BANNER}</div>

            {/* Chaîne générée */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Objets générés par la simulation</div>
            <div className="space-y-2">
              {[
                {icon:'🏃',label:'Activité',         val:result.actId,  desc:'Course/livraison enregistrée'},
                {icon:'💳',label:'Transaction',       val:result.txId,   desc:`${money(result.clientAmt)} client · ${money(result.driverNet)} chauffeur`},
                {icon:'📡',label:'Webhook',           val:result.whId??'N/A (Taxi direct)', desc:result.whId?'Événement fournisseur simulé':'Taxi: pas de webhook'},
                {icon:'📊',label:'Revenue Ledger',    val:'RL-'+result.txId, desc:`Base: ${money(result.base)} + Tip: ${money(result.tip)}`},
                {icon:'🧮',label:'Calcul fiscal',     val:'TAX-'+result.txId, desc:`TPS: ${money(result.tps)} · TVQ: ${money(result.tvq)}`},
                {icon:'⚖️', label:'Réconciliation',   val:result.recId,  desc:'Statut: RECONCILED (simulation)'},
                {icon:'📋',label:'Audit',             val:result.audId,  desc:`Créé: ${new Date(result.createdAt).toLocaleString('fr-CA')}`},
              ].map(o=>(
                <div key={o.label} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-lg shrink-0">{o.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{o.label}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{o.val}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{o.desc}</div>
                  </div>
                  <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5"/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
