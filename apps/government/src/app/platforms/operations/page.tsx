'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { CheckCircle, X, ExternalLink, RefreshCw } from 'lucide-react'
import { mockPlatformHealth, gatewayKpis } from '@/data/gateway.mock'
import { DEMO_TRANSACTIONS, DEMO_WEBHOOKS, PILOT_BANNER, DEMO_PROVIDERS } from '@/lib/demo-data'

// ─── Données opérations DEMO ──────────────────────────────────
const SRC_ICON:Record<string,string> = {uber:'⬛',lyft:'🟣',doordash:'🔴',instacart:'🟢',ubereats:'🟡',skip:'🟠',taxi:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'🔴',INSTACART:'🟢',UBER_EATS:'🟡',SKIP:'🟠',TAXI:'🚕'}

const OPERATIONS = [
  {id:'OP-DEMO-0001',provider:'UBER',     event:'TRIP_COMPLETED',   src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:148, txId:'TX-DEMO-1001', actId:'ACT-DEMO-001', drvId:'DEMO-DRV-001', at:'2026-09-17T08:41:12Z', retry:0, err:null},
  {id:'OP-DEMO-0002',provider:'UBER',     event:'TIP_ADDED',        src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:92,  txId:'TX-DEMO-1001', actId:'ACT-DEMO-001', drvId:'DEMO-DRV-001', at:'2026-09-17T08:41:20Z', retry:0, err:null},
  {id:'OP-DEMO-0003',provider:'UBER',     event:'PAYMENT_CAPTURED', src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:105, txId:'TX-DEMO-1002', actId:'ACT-DEMO-002', drvId:'DEMO-DRV-001', at:'2026-09-17T07:22:05Z', retry:0, err:null},
  {id:'OP-DEMO-0004',provider:'LYFT',     event:'TRIP_COMPLETED',   src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:88,  txId:'TX-DEMO-1006', actId:'ACT-DEMO-006', drvId:'DEMO-DRV-001', at:'2026-09-17T08:05:15Z', retry:0, err:null},
  {id:'OP-DEMO-0005',provider:'LYFT',     event:'TIP_ADDED',        src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:76,  txId:'TX-DEMO-1007', actId:'ACT-DEMO-007', drvId:'DEMO-DRV-002', at:'2026-09-17T07:45:20Z', retry:0, err:null},
  {id:'OP-DEMO-0006',provider:'DOORDASH', event:'DELIVERY_COMPLETED',src:'WEBHOOK', records:1,  status:'SUCCESS',   ms:201, txId:'TX-DEMO-1016', actId:'ACT-DEMO-016', drvId:'DEMO-DRV-001', at:'2026-09-17T12:30:05Z', retry:0, err:null},
  {id:'OP-DEMO-0007',provider:'DOORDASH', event:'PAYMENT_CAPTURED', src:'WEBHOOK',  records:1,  status:'PENDING',   ms:0,   txId:'TX-DEMO-1019', actId:'ACT-DEMO-019', drvId:'DEMO-DRV-003', at:'2026-09-16T19:00:05Z', retry:0, err:null},
  {id:'OP-DEMO-0008',provider:'DOORDASH', event:'ADJUSTMENT',       src:'WEBHOOK',  records:1,  status:'FAILED_DEMO',ms:0,  txId:'TX-DEMO-1020', actId:'ACT-DEMO-020', drvId:'DEMO-DRV-001', at:'2026-09-16T14:31:00Z', retry:1, err:'INVALID_PAYLOAD'},
  {id:'OP-DEMO-0009',provider:'DOORDASH', event:'TRIP_COMPLETED',   src:'WEBHOOK',  records:1,  status:'RETRYING',  ms:0,   txId:null,           actId:null,           drvId:'DEMO-DRV-002', at:'2026-09-16T13:15:00Z', retry:2, err:'NETWORK_TIMEOUT'},
  {id:'OP-DEMO-0010',provider:'INSTACART',event:'DELIVERY_COMPLETED',src:'WEBHOOK', records:1,  status:'SUCCESS',   ms:312, txId:'TX-DEMO-1021', actId:'ACT-DEMO-021', drvId:'DEMO-DRV-002', at:'2026-09-17T13:00:10Z', retry:0, err:null},
  {id:'OP-DEMO-0011',provider:'INSTACART',event:'PAYMENT_CAPTURED', src:'WEBHOOK',  records:1,  status:'RETRYING',  ms:0,   txId:'TX-DEMO-1023', actId:'ACT-DEMO-023', drvId:'DEMO-DRV-001', at:'2026-09-15T14:31:00Z', retry:3, err:'TIMEOUT'},
  {id:'OP-DEMO-0012',provider:'LYFT',     event:'TRIP_COMPLETED',   src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:118, txId:'TX-DEMO-1010', actId:'ACT-DEMO-010', drvId:'DEMO-DRV-002', at:'2026-09-16T12:21:00Z', retry:0, err:null},
  {id:'OP-DEMO-0013',provider:'LYFT',     event:'REFUND',           src:'WEBHOOK',  records:1,  status:'SUCCESS',   ms:95,  txId:'TX-DEMO-1009', actId:'ACT-DEMO-009', drvId:'DEMO-DRV-003', at:'2026-09-16T15:31:00Z', retry:0, err:null},
  {id:'OP-DEMO-0014',provider:'UBER_EATS',event:'DELIVERY_COMPLETED',src:'WEBHOOK', records:1,  status:'SUCCESS',   ms:178, txId:'TX-DEMO-1024', actId:'ACT-DEMO-024', drvId:'DEMO-DRV-001', at:'2026-09-17T12:00:05Z', retry:0, err:null},
  {id:'OP-DEMO-0015',provider:'UBER',     event:'TRIP_COMPLETED',   src:'WEBHOOK',  records:1,  status:'DUPLICATE', ms:62,  txId:'TX-DEMO-1010', actId:'ACT-DEMO-010', drvId:'DEMO-DRV-002', at:'2026-09-16T12:21:30Z', retry:0, err:'DUPLICATE_DETECTED'},
  {id:'OP-DEMO-0016',provider:'TAXI',     event:'TRIP_SYNC',        src:'API_PULL', records:24, status:'SUCCESS',   ms:55,  txId:'TX-DEMO-1011', actId:'ACT-DEMO-011', drvId:'DEMO-DRV-001', at:'2026-09-17T08:20:00Z', retry:0, err:null},
  {id:'OP-DEMO-0017',provider:'TAXI',     event:'BATCH_IMPORT',     src:'FILE',     records:18, status:'SUCCESS',   ms:340, txId:'TX-DEMO-1012', actId:'ACT-DEMO-012', drvId:'DEMO-DRV-002', at:'2026-09-17T07:00:00Z', retry:0, err:null},
  {id:'OP-DEMO-0018',provider:'UBER',     event:'PAYOUT',           src:'API_PULL', records:5,  status:'SUCCESS',   ms:220, txId:'TX-DEMO-1029', actId:'ACT-DEMO-029', drvId:'DEMO-DRV-001', at:'2026-09-15T10:00:00Z', retry:0, err:null},
  {id:'OP-DEMO-0019',provider:'LYFT',     event:'SYNC',             src:'API_PULL', records:12, status:'SUCCESS',   ms:184, txId:'TX-DEMO-1030', actId:'ACT-DEMO-030', drvId:'DEMO-DRV-003', at:'2026-09-15T08:30:00Z', retry:0, err:null},
  {id:'OP-DEMO-0020',provider:'SKIP',     event:'API_PULL',         src:'SIMULATION',records:0, status:'PENDING',   ms:0,   txId:null,           actId:null,           drvId:null,           at:'2026-09-17T09:00:00Z', retry:0, err:'NOT_CONFIGURED'},
]

const IMPORTS = [
  {id:'IMP-DEMO-001', provider:'UBER',     type:'JSON', total:24, processed:23, rejected:0, dup:1, status:'SUCCESS', at:'2026-09-17T06:00:00Z'},
  {id:'IMP-DEMO-002', provider:'LYFT',     type:'CSV',  total:18, processed:18, rejected:0, dup:0, status:'SUCCESS', at:'2026-09-17T05:30:00Z'},
  {id:'IMP-DEMO-003', provider:'DOORDASH', type:'JSON', total:32, processed:31, rejected:0, dup:0, status:'PENDING', at:'2026-09-16T23:00:00Z'},
  {id:'IMP-DEMO-004', provider:'TAXI',     type:'BATCH',total:560,processed:560,rejected:0, dup:0, status:'SUCCESS', at:'2026-09-16T22:00:00Z'},
  {id:'IMP-DEMO-005', provider:'INSTACART',type:'JSON', total:12, processed:11, rejected:1, dup:0, status:'PARTIAL', at:'2026-09-16T20:00:00Z'},
]

const ERRORS = [
  {id:'ERR-DEMO-001', provider:'LYFT',     op:'OP-DEMO-0005', type:'INVALID_PAYLOAD',  at:'2026-09-16T14:31:00Z', retry:1, status:'RESOLVED'},
  {id:'ERR-DEMO-002', provider:'DOORDASH', op:'OP-DEMO-0009', type:'NETWORK_TIMEOUT',  at:'2026-09-16T13:15:00Z', retry:2, status:'RETRYING'},
  {id:'ERR-DEMO-003', provider:'INSTACART',op:'OP-DEMO-0011', type:'TIMEOUT',          at:'2026-09-15T14:31:00Z', retry:3, status:'RETRYING'},
  {id:'ERR-DEMO-004', provider:'SKIP',     op:'OP-DEMO-0020', type:'NOT_CONFIGURED',   at:'2026-09-17T09:00:00Z', retry:0, status:'PENDING'},
]

const NORMALISATION = [
  {src:'trip_id',        norm:'activity_id',   desc:'Identifiant de course → activité TAXIMETER.GOV'},
  {src:'driver_uuid',    norm:'driver_id',      desc:'UUID fournisseur → ID chauffeur normalisé'},
  {src:'fare_total',     norm:'gross_amount',   desc:'Montant total course → revenu brut'},
  {src:'tip_amount',     norm:'tip_amount',     desc:'Pourboire → identique (déjà distinct)'},
  {src:'tax',            norm:'tax_amount',     desc:'Taxe fournisseur → TPS/TVQ calculé séparément'},
  {src:'driver_payout',  norm:'net_amount',     desc:'Paiement chauffeur → montant net'},
  {src:'timestamp_ms',   norm:'activity_date',  desc:'Timestamp Unix → date activité ISO 8601'},
]

const PIPELINE_STEPS = [
  {icon:'📡', step:'Réception webhook',      desc:'HTTP POST reçu du fournisseur'},
  {icon:'🔑', step:'Authentification',       desc:'Vérification clé API / OAuth DEMO'},
  {icon:'✍️',  step:'Validation signature',  desc:'HMAC-SHA256 du payload'},
  {icon:'🪪', step:'Identification provider',desc:'Mapping fournisseur → profil TAXIMETER.GOV'},
  {icon:'🔍', step:'Validation payload',     desc:'Champs obligatoires + types de données'},
  {icon:'🔄', step:'Détection doublons',     desc:'Vérification par event_id unique'},
  {icon:'⚙️',  step:'Normalisation',         desc:'Format fournisseur → standard TAXIMETER.GOV'},
  {icon:'💳', step:'Transaction créée',      desc:'Insertion dans revenue_ledger'},
  {icon:'🧮', step:'Moteur fiscal',          desc:'Calcul TPS 5% + TVQ 9,975%'},
  {icon:'⚖️',  step:'Réconciliation',        desc:'Rapprochement sources'},
  {icon:'📋', step:'Audit',                  desc:'Journal immuable de l\'opération'},
]

const STATUS_CONF:Record<string,{label:string;color:string;bg:string;bdr:string}> = {
  SUCCESS:      {label:'Traité',              color:'#059669',bg:'rgba(5,150,105,0.12)', bdr:'rgba(5,150,105,0.30)'},
  PENDING:      {label:'En attente',          color:'#B45309',bg:'rgba(180,83,9,0.10)',  bdr:'rgba(180,83,9,0.30)'},
  RETRYING:     {label:'Nouvelle tentative',  color:'#003DA5',bg:'rgba(0,61,165,0.10)',  bdr:'rgba(0,61,165,0.30)'},
  FAILED_DEMO:  {label:'Échec (démo)',        color:'#DC2626',bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.30)'},
  DUPLICATE:    {label:'Doublon ignoré',      color:'#7C3AED',bg:'rgba(124,58,237,0.12)',bdr:'rgba(124,58,237,0.30)'},
  PARTIAL:      {label:'Partiel',             color:'#B45309',bg:'rgba(180,83,9,0.10)',  bdr:'rgba(180,83,9,0.30)'},
}

const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(s))

// ─── Modal opération 360° ─────────────────────────────────────
function OpModal({op, onClose}:{op:typeof OPERATIONS[0];onClose:()=>void}) {
  const sc = STATUS_CONF[op.status]??STATUS_CONF['PENDING']!
  const stepsOk = op.status==='SUCCESS' ? PIPELINE_STEPS.length
    : op.status==='DUPLICATE' ? 6
    : op.status==='FAILED_DEMO' ? 4
    : op.status==='PENDING' ? 2
    : op.status==='RETRYING' ? 4
    : 3

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-bold text-white font-mono">{op.id}</div>
            <div className="text-[10px] text-slate-400 mt-1">{SRC_ICON[op.provider]??'📡'} {op.provider} · {op.event} · {fmtDt(op.at)}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer"><X size={14} className="text-slate-400"/></button>
        </div>

        <div className="mb-3 p-2 rounded-lg text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>
        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg" style={{background:sc.bg}}>
          <span className="text-xs font-bold" style={{color:sc.color}}>{sc.label}</span>
          {op.ms>0&&<span className="text-[10px] text-slate-400 ml-auto">{op.ms}ms</span>}
        </div>

        {/* OPÉRATION 360° */}
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">📊 OPÉRATION 360°</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            {label:'Operation ID', val:op.id},
            {label:'Provider',     val:op.provider},
            {label:'Source',       val:op.src},
            {label:'Event',        val:op.event},
            {label:'Activity ID',  val:op.actId??'—'},
            {label:'Transaction',  val:op.txId??'—'},
            {label:'Driver',       val:op.drvId??'—'},
            {label:'Records',      val:String(op.records)},
            {label:'Retry',        val:String(op.retry)},
            {label:'Erreur',       val:op.err??'Aucune'},
          ].map(r=>(
            <div key={r.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-700">
              <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">{r.label}</div>
              <div className="text-[10px] font-bold text-white font-mono truncate">{r.val}</div>
            </div>
          ))}
        </div>

        {/* Traçabilité */}
        {(op.txId||op.actId)&&(
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 mb-4">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">🔗 Traçabilité inter-modules</div>
            <div className="flex flex-wrap gap-2">
              {op.actId&&<a href="/operations/activity" className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-500/20">Activité {op.actId} <ExternalLink size={8}/></a>}
              {op.txId&&<a href="/transactions" className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-green-500/20">Transaction {op.txId} <ExternalLink size={8}/></a>}
              {op.txId&&<a href="/reconciliation" className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg flex items-center gap-1">Réconciliation <ExternalLink size={8}/></a>}
              {op.txId&&<a href="/audit" className="text-[10px] text-slate-400 bg-slate-700 border border-slate-600 px-2 py-1 rounded-lg flex items-center gap-1">Audit <ExternalLink size={8}/></a>}
            </div>
          </div>
        )}

        {/* Pipeline technique */}
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pipeline technique</div>
        <div className="space-y-1.5">
          {PIPELINE_STEPS.map((p,i)=>{
            const done = i < stepsOk
            return (
              <div key={p.step} className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${done?'bg-green-500/8 border border-green-500/15':'bg-slate-50/80 dark:bg-slate-800/50 border border-slate-700/50'}`}>
                <span className="text-sm shrink-0">{p.icon}</span>
                <div className="flex-1">
                  <div className={`text-[10px] font-bold ${done?'text-green-400':'text-slate-500'}`}>{p.step}</div>
                  <div className="text-[9px] text-slate-500">{p.desc}</div>
                </div>
                {done&&<CheckCircle size={11} className="text-green-400 shrink-0 mt-0.5"/>}
                {!done&&i===stepsOk&&<span className="text-[8px] text-amber-400 shrink-0 mt-0.5">⏳</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────
type TabKey = 'operations'|'gateway'|'webhooks'|'imports'|'normalisation'|'dedup'|'errors'|'quality'

const TABS:Array<{k:TabKey;l:string;e:string}> = [
  {k:'operations',  l:'Opérations',  e:'⚙️'},
  {k:'gateway',     l:'API Gateway', e:'🔌'},
  {k:'webhooks',    l:'Webhooks',    e:'📡'},
  {k:'imports',     l:'Imports',     e:'📥'},
  {k:'normalisation',l:'Norm.',      e:'🔄'},
  {k:'dedup',       l:'Dédup.',      e:'🔍'},
  {k:'errors',      l:'Erreurs',     e:'⚠️'},
  {k:'quality',     l:'Qualité',     e:'📊'},
]

export default function PlatformOperationsPage() {
  const [tab, setTab]         = useState<TabKey>('operations')
  const [selected, setSelected] = useState<typeof OPERATIONS[0]|null>(null)
  const [simRunning, setSimRunning] = useState(false)
  const [simDone, setSimDone] = useState(false)

  const stats = {
    total:   OPERATIONS.length,
    success: OPERATIONS.filter(o=>o.status==='SUCCESS').length,
    pending: OPERATIONS.filter(o=>o.status==='PENDING').length,
    retry:   OPERATIONS.filter(o=>o.status==='RETRYING').length,
    failed:  OPERATIONS.filter(o=>o.status==='FAILED_DEMO').length,
    dup:     OPERATIONS.filter(o=>o.status==='DUPLICATE').length,
    apiReqs: 128, webhooks:96, processed:91, imported:74,
  }

  function runSim() {
    setSimRunning(true)
    setTimeout(()=>{ setSimRunning(false); setSimDone(true); setTimeout(()=>setSimDone(false),4000) }, 1800)
  }

  return (
    <AppShell>
      {selected&&<OpModal op={selected} onClose={()=>setSelected(null)}/>}

      <PageHeader title="Opérations plateformes" subtitle="Gateway · Webhooks · Imports · Normalisation · TAXIMETER.GOV"/>

      <div className="px-4 md:px-6 pb-8 space-y-4">
        {/* Bannière pilote */}
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">
          {PILOT_BANNER} · SIMULATION — AUCUNE CONNEXION FOURNISSEUR RÉELLE
        </div>

        {/* Explication du module */}
        <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-2">🔌 À quoi sert ce module?</div>
          <div className="text-[10px] text-slate-300 leading-relaxed mb-2">
            Le module Opérations plateformes représente la passerelle technique permettant, dans le cadre d'intégrations autorisées, de recevoir, valider, normaliser, traiter et suivre les données provenant de fournisseurs numériques.
          </div>
          <div className="text-[10px] text-slate-400 italic">
            « L'objectif n'est pas de présumer qu'une plateforme est connectée ou qu'une donnée est exacte. L'objectif est de démontrer comment une architecture pourrait permettre, sous réserve des ententes, autorisations, API et exigences de sécurité applicables, de structurer et vérifier les échanges de données entre plusieurs systèmes. »
          </div>
        </div>

        {/* Pipeline architecture */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Architecture · Flux d'une donnée dans TAXIMETER.GOV</div>
          <div className="flex flex-wrap gap-1 text-[9px] items-center">
            {['PLATEFORME','→','Connexion','→','API/Webhook','→','Auth','→','Validation','→','Normalisation','→','Déduplication','→','Activité','→','Transaction','→','Revenue Ledger','→','TPS/TVQ','→','Réconciliation','→','Audit','→','Rapport'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-600 shrink-0':`shrink-0 px-2 py-1 rounded-lg text-[9px] font-semibold ${s==='PLATEFORME'?'bg-blue-500/15 text-blue-400 border border-blue-500/25':s==='Transaction'||s==='Revenue Ledger'||s==='TPS/TVQ'?'bg-green-500/10 text-green-400 border border-green-500/20':'bg-slate-800 border border-slate-700 text-slate-300'}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {label:'Opérations',    val:stats.total,   color:'text-blue-400',  bg:'bg-blue-500/10'},
            {label:'Succès',        val:stats.success,  color:'text-green-400', bg:'bg-green-500/10'},
            {label:'Webhooks',      val:stats.webhooks, color:'text-purple-400',bg:'bg-purple-500/10'},
            {label:'API requests',  val:stats.apiReqs,  color:'text-slate-300', bg:'bg-slate-700/50'},
            {label:'Importés',      val:stats.imported, color:'text-green-400', bg:'bg-green-500/10'},
            {label:'En attente',    val:stats.pending,  color:'text-amber-400', bg:'bg-amber-500/10'},
            {label:'Doublons',      val:stats.dup,      color:'text-purple-400',bg:'bg-purple-500/10'},
            {label:'Erreurs',       val:stats.failed+ERRORS.length, color:'text-red-400', bg:'bg-red-500/10'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Simulateur rapide */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-white">🚀 Simulateur d'opération</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Déclenche une opération DEMO complète à travers toute la chaîne</div>
            </div>
            {simDone&&<span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-lg">✅ Opération simulée!</span>}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              {label:'Fournisseur', val:'UBER (DEMO)'},
              {label:'Événement',   val:'TRIP_COMPLETED'},
              {label:'Chauffeur',   val:'DEMO-DRV-001'},
            ].map(f=>(
              <div key={f.label} className="bg-slate-800 border border-slate-700 rounded-lg p-2">
                <div className="text-[8px] text-slate-400 uppercase mb-1">{f.label}</div>
                <div className="text-[10px] font-bold text-white">{f.val}</div>
              </div>
            ))}
          </div>
          <button onClick={runSim} disabled={simRunning} className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${simRunning?'bg-slate-700 text-slate-500 cursor-not-allowed':'bg-qc-blue text-white hover:bg-blue-700 cursor-pointer'}`}>
            {simRunning?<><RefreshCw size={12} className="animate-spin"/>Simulation en cours…</>:'▶ Simuler une opération pilote'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className="shrink-0 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all" style={{
              background:tab===t.k?'#003DA5':'rgba(255,255,255,0.04)',
              color:tab===t.k?'white':'#94A3B8',
              borderColor:tab===t.k?'#003DA5':'rgba(255,255,255,0.08)',
            }}>{t.e} {t.l}</button>
          ))}
        </div>

        {/* ── TAB OPÉRATIONS ── */}
        {tab==='operations'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="text-xs font-bold text-white">{OPERATIONS.length} opérations (pilote)</div>
              <span className="text-[9px] text-amber-400">Cliquer pour Opération 360°</span>
            </div>
            {OPERATIONS.map((op,idx)=>{
              const sc = STATUS_CONF[op.status]??STATUS_CONF['PENDING']!
              return (
                <div key={op.id} onClick={()=>setSelected(op)} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50/80 dark:bg-slate-800/50">
                  <span className="text-lg shrink-0">{SRC_ICON[op.provider]??'📡'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{op.id}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      {op.retry>0&&<span className="text-[8px] text-amber-400">↻{op.retry}</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{op.event} · {op.src} · {fmtDt(op.at)}</div>
                    {op.txId&&<div className="text-[9px] text-blue-400 mt-0.5 font-mono">{op.txId}</div>}
                  </div>
                  <div className="text-[10px] text-slate-500 shrink-0 text-right">
                    {op.ms>0&&<div>{op.ms}ms</div>}
                    <div>{op.records} rec.</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB API GATEWAY ── */}
        {tab==='gateway'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'Requêtes aujourd\'hui', val:'128',    color:'text-blue-400'},
                {label:'Succès',               val:'124',    color:'text-green-400'},
                {label:'Échecs',               val:'4',      color:'text-red-400'},
                {label:'Latence moy.',          val:'184 ms', color:'text-slate-300'},
                {label:'Auth DEMO',            val:'DEMO VALIDATION', color:'text-amber-400'},
                {label:'Dernière requête',     val:'08:42:14',color:'text-slate-300'},
              ].map(r=>(
                <div key={r.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1">{r.label}</div>
                  <div className={`text-sm font-bold ${r.color}`}>{r.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Endpoints d'architecture DEMO</div>
              <div className="text-[9px] text-amber-400 mb-3 bg-amber-500/8 p-2 rounded-lg border border-amber-500/15">Ces endpoints représentent l'architecture cible. Ils ne sont pas des API gouvernementales officielles.</div>
              {['/api/providers','/api/activities','/api/transactions','/api/webhooks','/api/reconciliation','/api/taxes'].map(ep=>(
                <div key={ep} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] font-mono text-blue-400">{ep}</span>
                  <span className="text-[9px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">DEMO</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sécurité (DEMO)</div>
              {['Authentification API','Autorisation OAuth DEMO','Validation signature HMAC','Chiffrement TLS DEMO','Contrôle d\'accès','Journaux d\'audit','Rate limiting','Prévention doublons'].map(s=>(
                <div key={s} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <CheckCircle size={10} className="text-green-400 shrink-0"/>
                  <span className="text-[10px] text-slate-300">{s}</span>
                  <span className="ml-auto text-[8px] text-amber-400">DEMO</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB WEBHOOKS ── */}
        {tab==='webhooks'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <div className="text-xs font-bold text-white">{DEMO_WEBHOOKS.length} événements webhook (pilote)</div>
            </div>
            {DEMO_WEBHOOKS.map((wh,idx)=>{
              const stmap:Record<string,string> = {PROCESSED:'text-green-400',DUPLICATE_DETECTED:'text-purple-400',VALIDATION_PENDING:'text-amber-400',REJECTED_DEMO:'text-red-400',RETRYING:'text-blue-400'}
              return (
                <div key={wh.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{SRC_ICON[wh.provider]??'📡'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white font-mono">{wh.id}</span>
                      <span className={`text-[8px] font-bold ${stmap[wh.status]??'text-slate-400'}`}>{wh.status}</span>
                      {wh.dup&&<span className="text-[8px] text-purple-400 bg-purple-500/10 px-1.5 rounded-full">DOUBLON</span>}
                    </div>
                    <div className="text-[9px] text-slate-400">{wh.eventType} · Sig: {wh.sig} · {new Date(wh.received).toLocaleTimeString('fr-CA')}</div>
                  </div>
                  <div className="text-[9px] text-slate-500 shrink-0 font-mono">{wh.txId}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB IMPORTS ── */}
        {tab==='imports'&&(
          <div className="space-y-2">
            {IMPORTS.map(imp=>{
              const sc = STATUS_CONF[imp.status]??STATUS_CONF['PENDING']!
              return (
                <div key={imp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{SRC_ICON[imp.provider]??'📥'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-white font-mono">{imp.id}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        <span className="text-[8px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{imp.type}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] flex-wrap">
                        <span className="text-slate-400">Total: <strong className="text-white">{imp.total}</strong></span>
                        <span className="text-green-400">Traités: {imp.processed}</span>
                        {imp.dup>0&&<span className="text-purple-400">Doublons: {imp.dup}</span>}
                        {imp.rejected>0&&<span className="text-red-400">Rejetés: {imp.rejected}</span>}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">{fmtDt(imp.at)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB NORMALISATION ── */}
        {tab==='normalisation'&&(
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl text-[10px] text-blue-300">
              Différentes plateformes utilisent des structures de données différentes. TAXIMETER.GOV normalise tous les formats vers un standard commun.
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="text-[9px] font-bold text-amber-400 uppercase mb-2">Format fournisseur</div>
                {NORMALISATION.map(n=>(
                  <div key={n.src} className="py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="text-[10px] font-mono text-amber-300">{n.src}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center pt-8 gap-1">
                {NORMALISATION.map((_,i)=><span key={i} className="text-slate-600 text-xs">→</span>)}
              </div>
              <div className="flex-1 bg-slate-900 border border-green-500/20 rounded-xl p-3">
                <div className="text-[9px] font-bold text-green-400 uppercase mb-2">Standard TAXIMETER.GOV</div>
                {NORMALISATION.map(n=>(
                  <div key={n.norm} className="py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="text-[10px] font-mono text-green-400">{n.norm}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Descriptions</div>
              {NORMALISATION.map(n=>(
                <div key={n.src} className="flex gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[9px] font-mono text-amber-300 w-28 shrink-0">{n.src}</span>
                  <span className="text-[9px] text-slate-400">{n.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB DÉDUPLICATION ── */}
        {tab==='dedup'&&(
          <div className="space-y-3">
            <div className="p-3 bg-purple-500/8 border border-purple-500/20 rounded-xl text-[10px] text-purple-300">
              Le système vérifie que chaque événement n'est traité qu'une seule fois. Un doublon détecté est ignoré — aucune transaction financière n'est créée deux fois.
            </div>
            {OPERATIONS.filter(o=>o.status==='DUPLICATE').map(op=>(
              <div key={op.id} className="bg-slate-900 border border-purple-500/25 rounded-xl p-4 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔄</span>
                  <div>
                    <div className="text-xs font-bold text-purple-400">DOUBLON DÉTECTÉ</div>
                    <div className="text-[10px] text-slate-400 font-mono">{op.id} · {op.provider}</div>
                  </div>
                </div>
                {[
                  {label:'Transaction originale',   val:op.txId??'—',           color:'text-green-400'},
                  {label:'Événement reçu (doublon)',val:op.id,                  color:'text-purple-400'},
                  {label:'Statut',                  val:'SECOND ÉVÉNEMENT IGNORÉ',color:'text-amber-400'},
                  {label:'Transaction financière',  val:'NON CRÉÉE (doublon)',  color:'text-red-400'},
                  {label:'Audit',                   val:'CRÉÉ — doublon enregistré',color:'text-slate-300'},
                ].map(r=>(
                  <div key={r.label} className="flex justify-between text-[10px] py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400">{r.label}</span>
                    <span className={`font-bold ${r.color}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="text-[9px] text-slate-400">Total doublons bloqués (pilote): <strong className="text-white">{OPERATIONS.filter(o=>o.status==='DUPLICATE').length}</strong> · Aucune transaction financière en double.</div>
            </div>
          </div>
        )}

        {/* ── TAB ERREURS ── */}
        {tab==='errors'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {label:'Erreurs actives', val:ERRORS.filter(e=>e.status!=='RESOLVED').length, color:'text-red-400',   bg:'bg-red-500/10'},
                {label:'Résolues',        val:ERRORS.filter(e=>e.status==='RESOLVED').length, color:'text-green-400', bg:'bg-green-500/10'},
                {label:'Tentatives',      val:ERRORS.reduce((s,e)=>s+e.retry,0),              color:'text-amber-400', bg:'bg-amber-500/10'},
              ].map(s=>(
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
                  <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Retry queue */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">File de réessai (DEMO)</div>
              {OPERATIONS.filter(o=>o.status==='RETRYING').map(op=>(
                <div key={op.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-base">{SRC_ICON[op.provider]??'📡'}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-white font-mono">{op.id}</div>
                    <div className="text-[9px] text-slate-400">{op.err} · Tentative {op.retry}</div>
                  </div>
                  <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">RETRYING</span>
                </div>
              ))}
            </div>
            {ERRORS.map(err=>{
              const resolved = err.status==='RESOLVED'
              return (
                <div key={err.id} className={`bg-slate-900 border rounded-xl p-3 ${resolved?'border-green-500/20':'border-red-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{SRC_ICON[err.provider]??'⚠️'}</span>
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{err.id}</div>
                      <div className="text-[9px] text-slate-400">{err.provider} · {err.op}</div>
                    </div>
                    <span className={`ml-auto text-[8px] font-bold px-2 py-0.5 rounded-full ${resolved?'text-green-400 bg-green-500/10':'text-red-400 bg-red-500/10'}`}>{err.status}</span>
                  </div>
                  {[
                    {l:'Type',        v:err.type},
                    {l:'Tentatives',  v:String(err.retry)},
                    {l:'Horodatage',  v:fmtDt(err.at)},
                  ].map(r=>(
                    <div key={r.l} className="flex justify-between text-[10px] py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-slate-400">{r.l}</span>
                      <span className="text-slate-900 dark:text-white font-mono">{r.v}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB QUALITÉ ── */}
        {tab==='quality'&&(
          <div className="space-y-3">
            <div className="p-2 rounded-lg text-[9px] text-amber-400 bg-amber-500/8 border border-amber-500/15">INDICATEURS SYNTHÉTIQUES DE DÉMONSTRATION</div>
            {[
              {label:'Complétude',    val:98, desc:'Champs présents vs attendus',     color:'#059669'},
              {label:'Cohérence',     val:97, desc:'Données cohérentes entre sources', color:'#059669'},
              {label:'Validité',      val:99, desc:'Format et types conformes',        color:'#059669'},
              {label:'Unicité',       val:99, desc:'Doublons détectés et bloqués',     color:'#7C3AED'},
              {label:'Ponctualité',   val:95, desc:'Délai de traitement acceptable',   color:'#B45309'},
            ].map(q=>(
              <div key={q.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-bold text-white">{q.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{q.desc}</div>
                  </div>
                  <div className="text-2xl font-black" style={{color:q.color}}>{q.val}<span className="text-sm">%</span></div>
                </div>
                <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${q.val}%`,background:q.color}}/>
                </div>
              </div>
            ))}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Doublons & champs manquants (DEMO)</div>
              <div className="flex gap-6">
                <div><div className="text-xl font-black text-purple-400">2</div><div className="text-[9px] text-slate-400">Doublons bloqués</div></div>
                <div><div className="text-xl font-black text-amber-400">1</div><div className="text-[9px] text-slate-400">Champ manquant</div></div>
                <div><div className="text-xl font-black text-green-400">128</div><div className="text-[9px] text-slate-400">Ops validées</div></div>
              </div>
            </div>
            {/* Liens modules */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Modules reliés</div>
              <div className="flex flex-wrap gap-2">
                {[
                  {l:'Connexions',    h:'/platforms'},
                  {l:'Webhook Engine',h:'/webhooks/engine'},
                  {l:'Transactions',  h:'/transactions'},
                  {l:'Réconciliation',h:'/reconciliation'},
                  {l:'Rapports',      h:'/reports'},
                  {l:'Audit',         h:'/audit'},
                ].map(lk=>(
                  <a key={lk.l} href={lk.h} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-semibold hover:bg-blue-500/20">
                    {lk.l} <ExternalLink size={9}/>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
