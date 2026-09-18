'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
  PILOT, money, money2, fmtDt, fmtDate,
  ENTERPRISES, REPRESENTATIVES, ENT_DOCS, ENT_OBLIGATIONS, ENT_CONNECTIONS,
  ENT_WEBHOOKS, ENT_ALERTS, ENT_TRANSACTIONS, ENT_RECON, ENT_AUDIT,
  SECTOR_CONF, STATUS_CONF, VERIF_CONF, CONN_CONF, OBL_STATUS,
  ALERT_PRIORITY, REPR_ROLES,
} from '@/lib/enterprise-data'

const TABS = [
  {k:'overview',      l:'📊 Vue d\'ensemble'},
  {k:'identity',      l:'🏢 Identité'},
  {k:'representatives',l:'👤 Représentants'},
  {k:'drivers',       l:'🚗 Chauffeurs'},
  {k:'vehicles',      l:'🚘 Véhicules'},
  {k:'documents',     l:'📄 Documents'},
  {k:'activities',    l:'📍 Activités'},
  {k:'transactions',  l:'💳 Transactions'},
  {k:'revenue',       l:'💰 Revenus'},
  {k:'taxes',         l:'🧾 Fiscalité'},
  {k:'obligations',   l:'📅 Obligations'},
  {k:'connections',   l:'🔌 Connexions'},
  {k:'api',           l:'🔐 API'},
  {k:'webhooks',      l:'📡 Webhooks'},
  {k:'reconciliation',l:'🔄 Réconciliation'},
  {k:'compliance',    l:'⚖️ Conformité'},
  {k:'alerts',        l:'🚨 Alertes'},
  {k:'reports',       l:'📑 Rapports'},
  {k:'audit',         l:'🛡️ Audit'},
] as const
type Tab = typeof TABS[number]['k']

const TPS=0.05; const TVQ=0.09975; const r2=(n:number)=>Math.round(n*100)/100
const DOC_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  APPROVED:      {label:'Approuvé',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  PENDING:       {label:'En attente',  color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  UNDER_REVIEW:  {label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  REJECTED:      {label:'Rejeté',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
const MOCK_ACTIVITIES = [
  {id:'ACT-ENT-001',type:'TAXI',      driver:'DRV-QC-0001',at:'2026-09-18T10:30:00Z',origin:'Montréal-Nord (DEMO)',dest:'YUL (DEMO)',   dist:'22 km',dur:'28 min',status:'COMPLETED'},
  {id:'ACT-ENT-002',type:'TAXI',      driver:'DRV-QC-0001',at:'2026-09-18T09:10:00Z',origin:'Plateau (DEMO)',   dest:'Centre-ville',   dist:'4.8 km',dur:'12 min',status:'COMPLETED'},
  {id:'ACT-ENT-003',type:'RIDESHARE', driver:'DRV-QC-0002',at:'2026-09-18T08:40:00Z',origin:'Laval (DEMO)',    dest:'Montréal',       dist:'18 km',dur:'25 min',status:'COMPLETED'},
  {id:'ACT-ENT-004',type:'DELIVERY',  driver:'DRV-QC-0003',at:'2026-09-18T10:00:00Z',origin:'Entrepôt (DEMO)',dest:'Client (DEMO)',   dist:'8 km', dur:'20 min',status:'COMPLETED'},
]

export default function EnterpriseProfilePage() {
  const { id } = useParams<{id:string}>()
  const [tab, setTab] = useState<Tab>('overview')

  const ent = ENTERPRISES.find(e=>e.id===id)
  if (!ent) return (
    <AppShell>
      <div className="px-6 py-8">
        <Link href="/admin/enterprises" className="flex items-center gap-2 text-xs text-qc-blue mb-4"><ArrowLeft size={12}/> Registre</Link>
        <p className="text-sm text-red-500">Entreprise non trouvée: {id}</p>
        <p className="text-xs text-slate-400 mt-1">IDs disponibles: {ENTERPRISES.map(e=>e.id).join(', ')}</p>
      </div>
    </AppShell>
  )

  const sc  = SECTOR_CONF[ent.sector]!
  const stc = STATUS_CONF[ent.status]!
  const vc  = VERIF_CONF[ent.verif]!
  const cc  = CONN_CONF[ent.connection]!
  const reprs   = REPRESENTATIVES[id] ?? []
  const docs    = ENT_DOCS[id] ?? []
  const obls    = ENT_OBLIGATIONS[id] ?? []
  const conns   = ENT_CONNECTIONS[id] ?? []
  const webhooks= ENT_WEBHOOKS.filter(w=>w.entId===id)
  const alerts  = ENT_ALERTS.filter(a=>a.entId===id)
  const txs     = ENT_TRANSACTIONS.filter(t=>t.entId===id)
  const recons  = ENT_RECON.filter(r=>r.entId===id)
  const audits  = ENT_AUDIT.filter(a=>a.entId===id)
  const totalTx = txs.reduce((s,t)=>s+t.gross,0)
  const totalTps= r2(ent.grossQ3*TPS)
  const totalTvq= r2(ent.grossQ3*TVQ)

  // Chauffeurs liés (pilote — données synthétiques)
  const linkedDrivers = [
    {id:'drv-demo-001',driver_number:'DRV-QC-0001',first_name:'Jean',  last_name:'Tremblay',services:['TAXI','RIDESHARE'],gross:42800,status:'ACTIVE'},
    {id:'drv-demo-002',driver_number:'DRV-QC-0002',first_name:'Marie', last_name:'Gagnon',  services:['RIDESHARE','DELIVERY'],gross:38600,status:'ACTIVE'},
    {id:'drv-demo-003',driver_number:'DRV-QC-0003',first_name:'Karim', last_name:'Hassan',  services:['DELIVERY'],gross:29400,status:'ACTIVE'},
  ] as Array<{id:string;driver_number:string;first_name:string;last_name:string;services:string[];gross:number;status:string}>

  return (
    <AppShell>
      <div className="px-4 md:px-6 pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
          <Link href="/admin/enterprises" className="flex items-center gap-1 hover:text-qc-blue"><ArrowLeft size={11}/> Registre</Link>
          <span>›</span><span className="text-slate-700 dark:text-slate-200">{ent.tradeName}</span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl shrink-0">{sc.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">{ent.tradeName}</h1>
                  <div className="text-[10px] text-slate-400 mt-0.5">{ent.legalName} · NEQ: {ent.neq}</div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{color:stc.color,background:stc.bg}}>{stc.label}</span>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${vc.color}`}>{vc.label}</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">PILOTE</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${cc.dot}`}/>
                <span className="text-[10px] font-bold" style={{color:cc.color}}>{cc.label}</span>
                <span className="text-[9px] text-slate-400">· {sc.label} · {ent.jurisdiction} · {ent.repr}</span>
              </div>
            </div>
          </div>

          {/* Chaîne */}
          <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-100 dark:border-blue-500/15 rounded-xl px-3 py-2 mb-4">
            <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold text-blue-700 dark:text-blue-400">
              {[ent.id,'→','Chauffeurs','→','Véhicules','→','Activités','→','Transactions','→','Revenus','→','TPS/TVQ','→','Obligations','→','API','→','Webhooks','→','Réconciliation','→','Conformité','→','Audit','→','GOV'].map((s,i)=>(
                <span key={i} className={s==='→'?'text-blue-300 dark:text-blue-800':''}>{s}</span>
              ))}
            </div>
          </div>

          {/* KPI rapides */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              {l:'Chauffeurs',  v:ent.drivers, c:'#003DA5'},
              {l:'Activités Q3',v:ent.activities.toLocaleString('fr-CA'), c:'#059669'},
              {l:'Rev. Q3',     v:money(ent.grossQ3), c:'#059669'},
              {l:'TPS Q3',      v:money(totalTps), c:'#7C3AED'},
              {l:'TVQ Q3',      v:money(totalTvq), c:'#7C3AED'},
              {l:'Conformité',  v:`${ent.compliance}%`, c:ent.compliance>=95?'#059669':ent.compliance>=80?'#B45309':'#DC2626'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
                <div className="text-[8px] text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-4 pb-1 flex-nowrap">
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className="shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:tab===t.k?'#003DA5':'transparent',color:tab===t.k?'white':'#64748B',borderColor:tab===t.k?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Synthèse gouvernementale — {PILOT}</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {l:'Revenus bruts Q3',   v:money(ent.grossQ3),  c:'text-green-600 dark:text-green-400'},
                  {l:'TPS collectée Q3',   v:money(totalTps),     c:'text-purple-600 dark:text-purple-400'},
                  {l:'TVQ collectée Q3',   v:money(totalTvq),     c:'text-purple-600 dark:text-purple-400'},
                  {l:'Activités Q3',       v:ent.activities.toLocaleString('fr-CA'), c:'text-blue-600 dark:text-blue-400'},
                  {l:'Chauffeurs liés',    v:ent.drivers, c:'text-slate-700 dark:text-slate-300'},
                  {l:'Véhicules',          v:ent.vehicles, c:'text-slate-700 dark:text-slate-300'},
                  {l:'Connexion',          v:cc.label,    c:''},
                  {l:'Conformité',         v:`${ent.compliance}%`, c:ent.compliance>=95?'text-green-600 dark:text-green-400':'text-amber-600 dark:text-amber-400'},
                  {l:'Alertes actives',    v:alerts.filter(a=>a.status!=='INFO').length, c:alerts.filter(a=>a.status!=='INFO').length>0?'text-red-500':'text-slate-400'},
                  {l:'Documents',          v:`${docs.filter(d=>d.status==='APPROVED').length}/${docs.length||'—'}`, c:'text-slate-700 dark:text-slate-300'},
                ].map(r=>(
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-[10px] text-slate-500">{r.l}</span>
                    <span className={`text-[10px] font-bold ${r.c||''}`} style={r.l==='Connexion'?{color:cc.color}:{}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            {alerts.filter(a=>a.priority==='CRITICAL'||a.priority==='HIGH').length>0&&(
              <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
                <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">🚨 Alertes prioritaires</div>
                {alerts.filter(a=>a.priority==='CRITICAL'||a.priority==='HIGH').map(a=>(
                  <div key={a.id} className="text-[10px] text-slate-600 dark:text-slate-300 py-1 border-b border-red-100 dark:border-red-500/10 last:border-0">
                    <span className="font-bold" style={{color:ALERT_PRIORITY[a.priority]!.color}}>{a.priority}</span> · {a.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── IDENTITÉ ── */}
        {tab==='identity'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Fiche d'identité gouvernementale — DÉMO</div>
            {[
              {l:'Enterprise ID',        v:ent.id},
              {l:'Raison sociale',       v:ent.legalName},
              {l:'Nom commercial',       v:ent.tradeName},
              {l:'NEQ',                  v:ent.neq},
              {l:'Identifiant fiscal',   v:ent.taxId},
              {l:'Secteur',              v:`${sc.icon} ${sc.label}`},
              {l:'Type',                 v:ent.type},
              {l:'Juridiction',          v:ent.jurisdiction},
              {l:'Adresse',              v:ent.address},
              {l:'Ville',                v:ent.city},
              {l:'Province',             v:ent.province},
              {l:'Code postal',          v:ent.postal},
              {l:'Téléphone',            v:ent.phone},
              {l:'Courriel',             v:ent.email},
              {l:'Site web',             v:ent.website},
              {l:'Date inscription',     v:fmtDate(ent.registered)},
              {l:'Statut',               v:stc.label},
              {l:'Vérification',         v:vc.label.replace('text-green-600 dark:text-green-400','').replace('text-amber-600 dark:text-amber-400','')},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-[10px] text-slate-500">{r.l}</span>
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── REPRÉSENTANTS ── */}
        {tab==='representatives'&&(
          <div className="space-y-2">
            {(reprs.length>0?reprs:[{name:ent.repr,role:'OWNER',email:ent.email,phone:ent.phone,status:'ACTIVE'}]).map((r,i)=>{
              const rc = REPR_ROLES[r.role]??{label:r.role,color:'#64748B'}
              return (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white shrink-0">{r.name[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{r.name}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">{r.email} · {r.phone}</div>
                    </div>
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">{r.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── CHAUFFEURS ── */}
        {tab==='drivers'&&(
          <div className="space-y-2">
            <div className="text-[9px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">Chauffeurs reliés à cette entreprise (pilote — utilise les données Driver Gov existantes)</div>
            {linkedDrivers.map(d=>(
              <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white shrink-0">{d.first_name[0]}{d.last_name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.first_name} {d.last_name}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{d.driver_number} · {(d as {services?:string[]}).services?.join(', ')??''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-green-600 dark:text-green-400">{money((d as {gross?:number}).gross??0)}</div>
                  <div className="text-[8px] text-slate-400">Rev. Q3</div>
                </div>
                <Link href={`/drivers/${d.id}`} className="text-[9px] font-bold text-qc-blue hover:underline shrink-0">→ Dossier</Link>
              </div>
            ))}
          </div>
        )}

        {/* ── VÉHICULES ── */}
        {tab==='vehicles'&&(
          <div className="space-y-2">
            <div className="text-[9px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">Véhicules associés à l'entreprise (pilote — base véhicules Admin Gov)</div>
            {Array.from({length:Math.min(ent.vehicles,3)},(_,i)=>(
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">DEMO-{sc.icon} VÉH-{ent.id.slice(-3)}-00{i+1}</div>
                  <div className="text-[9px] text-slate-400">Plaque: DEMO-{ent.id.slice(-3)}-{(i+1).toString().padStart(3,'0')} · Assurance: 2027-03-15 · Inspection: 2027-09-01</div>
                </div>
                <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">ACTIF</span>
              </div>
            ))}
            <Link href="/vehicles" className="block text-center text-[10px] text-qc-blue hover:underline">→ Administration des véhicules</Link>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab==='documents'&&(
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Workflow: UPLOAD → REÇU → VALIDATION → APPROUVÉ / REFUSÉ → EXPIRATION → RENOUVELLEMENT</div>
            {(docs.length>0?docs:[
              {id:'EDOC-DEF',type:'NEQ',label:'Numéro entreprise QC',number:ent.neq,issued:ent.registered,expires:null,status:'APPROVED',note:null}
            ]).map(d=>{
              const dsc = DOC_STATUS[d.status]??DOC_STATUS['PENDING']!
              return (
                <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">📄</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.label}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:dsc.color,background:dsc.bg}}>{dsc.label}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">{d.number} · Émis: {fmtDate(d.issued)}{d.expires?` · Expire: ${fmtDate(d.expires)}`:''}</div>
                      {d.note&&<div className="text-[9px] text-slate-500 italic mt-0.5">{d.note}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ACTIVITÉS ── */}
        {tab==='activities'&&(
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{l:'Total Q3',v:ent.activities.toLocaleString('fr-CA'),c:'#003DA5'},{l:'Taxi',v:Math.round(ent.activities*0.4).toLocaleString('fr-CA'),c:'#003DA5'},{l:'Livraison',v:Math.round(ent.activities*0.6).toLocaleString('fr-CA'),c:'#059669'}].map(s=>(
                <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-base font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {MOCK_ACTIVITIES.slice(0,ent.drivers>0?4:0).map(a=>(
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm flex items-center gap-3">
                <span className="text-xl shrink-0">{a.type==='TAXI'?'🚕':a.type==='RIDESHARE'?'🚗':'📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{a.id}</div>
                  <div className="text-[9px] text-slate-400">{fmtDt(a.at)} · {a.driver} · {a.origin} → {a.dest}</div>
                  <div className="text-[9px] text-slate-400">{a.dist} · {a.dur}</div>
                </div>
                <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 rounded-full shrink-0">{a.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {tab==='transactions'&&(
          <div className="space-y-2">
            {txs.length>0?(
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white">{txs.length} transaction(s) DEMO</div>
                {txs.map(tx=>(
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{tx.id}</div>
                      <div className="text-[9px] text-slate-400">{tx.provider} · {tx.driverId} · {fmtDt(tx.at)}</div>
                      <div className="text-[9px] text-slate-400">TPS: {money2(tx.tps)} · TVQ: {money2(tx.tvq)} · Tip: {money2(tx.tip)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-green-600 dark:text-green-400">{money2(tx.gross)}</div>
                      <div className="text-[8px] font-bold" style={{color:tx.status==='COMPLETED'?'#059669':tx.status==='PENDING'?'#B45309':'#DC2626'}}>{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ):<div className="text-center py-8 text-[10px] text-slate-400">Aucune transaction pour cette entreprise dans les données pilotes.</div>}
            <Link href="/transactions" className="block text-center text-[10px] text-qc-blue hover:underline">→ Centre Transactions</Link>
          </div>
        )}

        {/* ── REVENUS ── */}
        {tab==='revenue'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                {l:'Revenus bruts Q3',  v:money(ent.grossQ3),                      c:'#059669', bg:'bg-green-50 dark:bg-green-500/8'},
                {l:'Pourboires est.',   v:money(Math.round(ent.grossQ3*0.10)),     c:'', bg:'bg-yellow-50 dark:bg-yellow-500/8',style:{color:'#B45309'}},
                {l:'Revenus nets est.', v:money(Math.round(ent.grossQ3*0.80)),     c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/8'},
                {l:'Part chauffeurs',  v:money(Math.round(ent.grossQ3*0.78)),     c:'#64748B', bg:'bg-slate-50 dark:bg-slate-800'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent shadow-sm`}>
                  <div className="text-base font-black" style={s.style??{color:s.c as string}}>{s.v}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Répartition par service</div>
              {[{l:'Taxi/Course',v:Math.round(ent.grossQ3*0.40),icon:'🚕'},{l:'Rideshare',v:Math.round(ent.grossQ3*0.35),icon:'🚗'},{l:'Livraison',v:Math.round(ent.grossQ3*0.25),icon:'📦'}].filter(s=>s.v>0).map(s=>(
                <div key={s.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-500">{s.icon} {s.l}</span>
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{money(s.v)}</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/15 p-3 rounded-xl">{PILOT} · Ces revenus sont des données synthétiques estimées</div>
          </div>
        )}

        {/* ── FISCALITÉ ── */}
        {tab==='taxes'&&(
          <div className="space-y-3">
            <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-xl">{PILOT} · ESTIMATION · AUCUNE TRANSMISSION OFFICIELLE À REVENU QUÉBEC</div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">TPS/TVQ — Q3 2026</div>
              {[
                {l:'Revenus bruts',        v:money(ent.grossQ3),          c:'text-slate-800 dark:text-slate-200'},
                {l:'+ Pourboires',         v:money(Math.round(ent.grossQ3*0.10)), style:{color:'#B45309'}},
                {l:'= Base taxable',       v:money(Math.round(ent.grossQ3*1.10)), c:'text-green-600 dark:text-green-400'},
                {l:`TPS collectée (${TPS*100}%)`,v:money(totalTps),       c:'text-purple-600 dark:text-purple-400'},
                {l:`TVQ collectée (${TVQ*100}%)`,v:money(totalTvq),       c:'text-purple-600 dark:text-purple-400'},
                {l:'Crédits TPS (est.)',   v:`− ${money(r2(totalTps*0.20))}`, c:'text-slate-400'},
                {l:'Crédits TVQ (est.)',   v:`− ${money(r2(totalTvq*0.20))}`, c:'text-slate-400'},
                {l:'TPS NETTE ESTIMÉE',    v:money(r2(totalTps*0.80)),    c:'text-purple-700 dark:text-purple-300'},
                {l:'TVQ NETTE ESTIMÉE',    v:money(r2(totalTvq*0.80)),    c:'text-purple-700 dark:text-purple-300'},
                {l:'SOLDE ESTIMÉ Q3',      v:money(r2((totalTps+totalTvq)*0.80)), c:'text-green-600 dark:text-green-400'},
              ].map((r,i)=>(
                <div key={r.l} className={`flex justify-between py-1.5 ${i>0?'border-t border-slate-100 dark:border-slate-800':''}`}>
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className={`text-[10px] font-bold ${(r as {c?:string}).c??''}`} style={(r as {style?:object}).style}>{r.v}</span>
                </div>
              ))}
            </div>
            <Link href="/tax/center" className="block text-center text-[10px] text-qc-blue hover:underline">→ Centre fiscal gouvernemental</Link>
          </div>
        )}

        {/* ── OBLIGATIONS ── */}
        {tab==='obligations'&&(
          <div className="space-y-2">
            {(obls.length>0?obls:[{id:'OBL-DEF',type:'TPS/TVQ',period:'Q3 2026',due:'2026-10-31',amount:r2((totalTps+totalTvq)*0.80),status:'UPCOMING',filed:null,paid:null}]).map(o=>{
              const osc = OBL_STATUS[o.status]!
              return (
                <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{o.type} — {o.period}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:osc.color,background:osc.bg}}>{osc.label}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">{o.id}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-slate-800 dark:text-white">{money2(o.amount)}</div>
                      <div className="text-[9px] text-slate-400">Échéance: {fmtDate(o.due)}</div>
                    </div>
                  </div>
                  {(o.filed||o.paid)&&(
                    <div className="flex gap-4 text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      {o.filed&&<span>✓ Soumis: {fmtDate(o.filed)}</span>}
                      {o.paid&&<span>✓ Payé: {fmtDate(o.paid)}</span>}
                    </div>
                  )}
                  {o.status==='OVERDUE'&&<div className="mt-2 text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 p-2 rounded-lg">⚠️ OBLIGATION EN RETARD — Action requise</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* ── CONNEXIONS ── */}
        {tab==='connections'&&(
          <div className="space-y-2">
            <div className="p-2.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">SIMULATION · Aucune connexion gouvernementale réelle</div>
            {(conns.length>0?conns:[{provider:'API TAXIMETER.GOV',method:'OAuth',status:'PENDING',lastSync:null,scopes:['read'],errors:0,health:0}]).map((c,i)=>{
              const csc = CONN_CONF[c.status]!
              return (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${csc.dot}`}/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{c.provider}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:csc.color,background:'rgba(0,0,0,0.05)'}}>{csc.label}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">{c.method} · Santé: {c.health}% · Erreurs: {c.errors}</div>
                    </div>
                    {c.lastSync&&<div className="text-[9px] text-slate-400 shrink-0">Sync: {fmtDt(c.lastSync)}</div>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {c.scopes.map(s=><span key={s} className="text-[7px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{s}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── API ── */}
        {tab==='api'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">🔐 Credentials API (DEMO)</div>
              {[
                {l:'Enterprise API ID',  v:`API-${ent.id}`},
                {l:'Méthode auth',       v:'OAuth 2.0 (DEMO)'},
                {l:'Client ID',          v:`CLI-${ent.id.slice(-3)}-DEMO`},
                {l:'Secret',             v:'●●●●●●●●●●●●●●●● (masqué)'},
                {l:'Scopes',             v:conns[0]?.scopes.join(', ')??'read:basic'},
                {l:'Dernière utilisation',v:ent.lastSync?fmtDt(ent.lastSync):'—'},
                {l:'Expiration',         v:'2027-01-01 (DEMO)'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className={`text-[10px] font-mono ${r.l==='Secret'?'text-slate-400':'text-slate-800 dark:text-slate-200'}`}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="p-3 text-[9px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl font-bold">
              🔒 Les secrets ne sont jamais affichés en clair · Rotation disponible · Révocation instantanée — PILOTE DEMO
            </div>
          </div>
        )}

        {/* ── WEBHOOKS ── */}
        {tab==='webhooks'&&(
          <div className="space-y-2">
            {(webhooks.length>0?webhooks:[]).length>0?(
              webhooks.map(w=>(
                <div key={w.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{w.event}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${w.status==='PROCESSED'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>{w.status}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">{w.id} · {w.provider} · {fmtDt(w.at)}</div>
                      <div className="text-[9px] text-slate-400">Tentatives: {w.attempts}{w.error&&` · Erreur: ${w.error}`}</div>
                    </div>
                    {w.response&&<span className="text-[9px] font-bold text-green-600 dark:text-green-400 shrink-0">{w.response}</span>}
                  </div>
                </div>
              ))
            ):<div className="text-center py-6 text-[10px] text-slate-400">Aucun webhook pour cette entreprise dans les données pilotes.</div>}
          </div>
        )}

        {/* ── RÉCONCILIATION ── */}
        {tab==='reconciliation'&&(
          <div className="space-y-2">
            <div className="p-2.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl">Écart détecté → analyse → justification → résolution → audit · NE PAS qualifier automatiquement une différence de fraude</div>
            {(recons.length>0?recons:[{id:'REC-DEF',entId:id,txId:'—',sourceAmt:0,ledgerAmt:0,diff:0,status:'MATCHED',note:'Aucun écart détecté pour cette entreprise'}]).map(r=>(
              <div key={r.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm ${r.status==='DISCREPANCY'?'border-amber-200 dark:border-amber-500/30':'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">{r.id}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${r.status==='MATCHED'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{r.status}</span>
                    </div>
                    {r.txId!=='—'&&<div className="text-[9px] text-slate-400 mt-0.5">TX: {r.txId}</div>}
                  </div>
                  {r.diff>0&&<div className="text-right shrink-0"><div className="text-sm font-black text-red-500">Écart: {money2(r.diff)}</div></div>}
                </div>
                {r.status==='DISCREPANCY'&&(
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-red-50 dark:bg-red-500/8 rounded-lg p-2.5 border border-red-200 dark:border-red-500/15">
                      <div className="text-[8px] font-bold text-red-700 dark:text-red-400">Source A</div>
                      <div className="text-sm font-black text-red-600 dark:text-red-400">{money2(r.sourceAmt)}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/8 rounded-lg p-2.5 border border-blue-200 dark:border-blue-500/15">
                      <div className="text-[8px] font-bold text-blue-700 dark:text-blue-400">Revenue Ledger</div>
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400">{money2(r.ledgerAmt)}</div>
                    </div>
                  </div>
                )}
                {r.note&&<div className="text-[9px] text-slate-500 italic">{r.note}</div>}
                {r.status==='DISCREPANCY'&&(
                  <div className="mt-2 flex gap-2">
                    <Link href="/compliance/cases" className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100">→ Ouvrir dossier</Link>
                    <Link href="/audit" className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CONFORMITÉ ── */}
        {tab==='compliance'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:`3px solid ${ent.compliance>=95?'#059669':ent.compliance>=80?'#B45309':'#DC2626'}`}}>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" stroke={ent.compliance>=95?'#059669':ent.compliance>=80?'#B45309':'#DC2626'} strokeDasharray={`${ent.compliance} ${100-ent.compliance}`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{color:ent.compliance>=95?'#059669':ent.compliance>=80?'#B45309':'#DC2626'}}>{ent.compliance}%</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">Score de conformité (PILOTE)</div>
                  <div className="text-[10px] text-slate-400 mt-1">Documents · Obligations · Connexions · Transactions</div>
                  <div className="text-[9px] font-bold mt-1" style={{color:ent.compliance>=95?'#059669':ent.compliance>=80?'#B45309':'#DC2626'}}>
                    {ent.compliance>=95?'✓ CONFORME':ent.compliance>=80?'⚠ ATTENTION REQUISE':'✗ ACTION REQUISE'}
                  </div>
                </div>
              </div>
            </div>
            {alerts.filter(a=>a.status!=='INFO').length>0&&(
              <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
                <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">Points de non-conformité</div>
                {alerts.filter(a=>a.status!=='INFO').map(a=>(
                  <div key={a.id} className="text-[10px] text-slate-600 dark:text-slate-300 py-1.5 border-b border-red-100 dark:border-red-500/10 last:border-0 flex items-start gap-2">
                    <AlertTriangle size={10} className="shrink-0 mt-0.5" style={{color:ALERT_PRIORITY[a.priority]!.color}}/>
                    <div>
                      <span className="font-bold">{a.title}</span>
                      <span className="text-slate-400"> · {a.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-[9px] text-slate-400 text-center">Score indicatif administratif uniquement · Non opposable · {PILOT}</div>
          </div>
        )}

        {/* ── ALERTES ── */}
        {tab==='alerts'&&(
          <div className="space-y-2">
            {alerts.length>0?alerts.map(a=>(
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm" style={{borderLeft:`3px solid ${ALERT_PRIORITY[a.priority]!.color}`}}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.title}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:ALERT_PRIORITY[a.priority]!.color,background:ALERT_PRIORITY[a.priority]!.bg}}>{a.priority}</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{a.type} · {fmtDt(a.at)}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 italic">{a.desc}</div>
                  </div>
                  <span className={`text-[8px] font-bold shrink-0 px-1.5 py-0.5 rounded-full ${a.status==='IN_PROGRESS'?'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10':a.status==='INFO'?'text-slate-400 bg-slate-100':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{a.status}</span>
                </div>
              </div>
            )):<div className="text-center py-8 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/8 rounded-2xl border border-green-200 dark:border-green-500/20"><CheckCircle size={20} className="mx-auto mb-2"/><div>Aucune alerte active</div></div>}
          </div>
        )}

        {/* ── RAPPORTS ── */}
        {tab==='reports'&&(
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Rapports disponibles (PILOTE)</div>
            {['Rapport revenus Q3','Rapport TPS/TVQ','Rapport transactions','Rapport chauffeurs','Rapport conformité','Rapport réconciliation','Rapport audit'].map(r=>(
              <div key={r} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r} — {ent.tradeName}</div>
                    <div className="text-[8px] text-slate-400">PDF · CSV · PILOTE DEMO</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button className="px-2 py-1 rounded-lg text-[8px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer">Aperçu</button>
                  <button className="px-2 py-1 rounded-lg text-[8px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer">Export</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AUDIT ── */}
        {tab==='audit'&&(
          <div className="space-y-2">
            {(audits.length>0?audits:[{id:'EAUD-DEF',entId:id,at:ent.registered+'T00:00:00Z',who:'SYSTEM',what:'ENTERPRISE_CREATED',resource:ent.id,old:null,newVal:'PENDING',why:'Inscription entreprise'}]).map(a=>(
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px]">📋</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.what}</span>
                      <span className="text-[8px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 rounded-full">{a.who}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">{a.resource} · {fmtDt(a.at)}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{a.why}</div>
                    {(a.old||a.newVal)&&<div className="text-[8px] text-slate-400 mt-1">{a.old&&<span>Avant: <span className="text-red-400">{a.old}</span> · </span>}Après: <span className="text-green-600 dark:text-green-400">{a.newVal}</span></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
