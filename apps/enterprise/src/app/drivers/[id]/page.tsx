'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PILOT, money, money2, fmtDt, fmtDate, ENT_DRIVERS, ENT_ACTIVITIES, ENT_TRANSACTIONS, ENT_DOCS_FULL, DRIVER_DETAIL, DOC_STATUS, SYNC_STATUS } from '@/lib/data'

const TABS = ['Identité','Véhicule','Documents','Activités','Revenus','Conformité','Historique'] as const
type Tab = typeof TABS[number]

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:    {label:'Actif',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  SUSPENDED: {label:'Suspendu',color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:   {label:'En attente',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
}

export default function DriverProfilePage() {
  const { id } = useParams<{id:string}>()
  const [tab, setTab] = useState<Tab>('Identité')

  const drv = ENT_DRIVERS.find(d=>d.id===id)
  const det = DRIVER_DETAIL[id]

  if (!drv) return (
    <AppShell>
      <div className="px-6 py-8">
        <Link href="/drivers" className="flex items-center gap-2 text-xs text-qc-blue mb-4"><ArrowLeft size={12}/> Chauffeurs</Link>
        <p className="text-sm text-red-500">Chauffeur non trouvé: {id}</p>
      </div>
    </AppShell>
  )

  const sc     = STATUS_CONF[drv.status]!
  const ss     = SYNC_STATUS[det?.syncStatus??'DEMO']!
  const drvActs= ENT_ACTIVITIES.filter(a=>a.driverId===id)
  const drvTxs = ENT_TRANSACTIONS.filter(t=>t.driverId===id)
  const drvDocs= ENT_DOCS_FULL.filter(d=>d.ownerId===id)
  const gross  = drvTxs.reduce((s,t)=>s+t.gross,0)
  const tps    = drvTxs.reduce((s,t)=>s+t.tps,0)
  const tvq    = drvTxs.reduce((s,t)=>s+t.tvq,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
        <Link href="/drivers" className="flex items-center gap-2 text-xs text-slate-500 hover:text-qc-blue">
          <ArrowLeft size={12}/> Chauffeurs
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl font-black text-white shrink-0">{drv.name.split(' ').map((n:string)=>n[0]).join('')}</div>
            <div className="flex-1">
              <div className="text-xl font-black text-slate-900 dark:text-white">{drv.name}</div>
              <div className="text-sm font-mono text-slate-400 mt-0.5">{drv.id}</div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                <span className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{drv.relation}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/>
                  <span className="text-sm font-bold" style={{color:ss.color}}>{ss.label} · PILOTE</span>
                </div>
              </div>
            </div>
          </div>
          {/* KPI rapides */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {l:'Activités Q3',   v:drvActs.length,     c:'#003DA5'},
              {l:'Revenus Q3',     v:money(gross),        c:'#059669'},
              {l:'Conformité',     v:`${det?.complianceScore??0}%`,c:det?.complianceScore&&det.complianceScore>=90?'#059669':'#B45309'},
            ].map(s=>(
              <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
                <div className="text-sm text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto flex-nowrap pb-1">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:tab===t?'#003DA5':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t}
            </button>
          ))}
        </div>

        {/* ── IDENTITÉ ── */}
        {tab==='Identité'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            {[
              {l:'Driver ID',          v:drv.id},
              {l:'Nom complet',         v:drv.name},
              {l:'Courriel',            v:det?.email??'—'},
              {l:'Téléphone',           v:det?.phone??'—'},
              {l:'Adresse',             v:det?.address??'—'},
              {l:'Statut',              v:sc.label},
              {l:'Relation',            v:drv.relation},
              {l:'Date d\'association', v:det?fmtDate(det.joined):'—'},
              {l:'Synchronisation',     v:ss.label},
              {l:'Réf. externe',        v:det?.externalRef??'Non configurée'},
              {l:'Dernière sync',       v:det?.lastSync?fmtDt(det.lastSync):'—'},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm text-slate-500">{r.l}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-right max-w-[55%]">{r.v}</span>
              </div>
            ))}
            <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/15 rounded-xl text-sm text-blue-700 dark:text-blue-400 font-bold">
              🔗 Lié à un compte Driver Gov — aucun doublon créé · {PILOT}
            </div>
          </div>
        )}

        {/* ── VÉHICULE ── */}
        {tab==='Véhicule'&&(
          <div className="space-y-3">
            {drv.vehicle?(
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Véhicule assigné</div>
                {[
                  {l:'Véhicule ID',   v:drv.vehicle},
                  {l:'Plaque',        v:drv.plate??'—'},
                ].map(r=>(
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-sm text-slate-500">{r.l}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
                  </div>
                ))}
                <Link href={`/vehicles/${drv.vehicle}`} className="mt-3 block text-center text-sm font-bold text-qc-blue hover:underline">→ Voir dossier véhicule complet</Link>
              </div>
            ):(
              <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 text-center text-sm text-amber-700 dark:text-amber-400 font-bold">
                ⚠️ Aucun véhicule assigné à ce chauffeur
                <div className="mt-2"><button className="text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer">Assigner un véhicule</button></div>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab==='Documents'&&(
          <div className="space-y-2">
            {drvDocs.length>0?drvDocs.map(doc=>{
              const dsc = DOC_STATUS[doc.status]!
              return (
                <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">📄 {doc.label}</span>
                        <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:dsc.color,background:`${dsc.color}18`}}>{dsc.label}</span>
                      </div>
                      <div className="text-sm text-slate-400">{doc.number} · Émis: {fmtDate(doc.issued)}{doc.expires?` · Expire: ${fmtDate(doc.expires)}`:''}</div>
                      {doc.note&&<div className="text-sm text-amber-600 dark:text-amber-400 italic mt-0.5">{doc.note}</div>}
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">{doc.syncStatus}</span>
                  </div>
                </div>
              )
            }):<div className="text-center py-6 text-sm text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">Aucun document enregistré pour ce chauffeur</div>}
            <Link href="/documents" className="block text-center text-sm text-qc-blue hover:underline">→ Centre documents complet</Link>
          </div>
        )}

        {/* ── ACTIVITÉS ── */}
        {tab==='Activités'&&(
          <div className="space-y-2">
            {drvActs.length>0?drvActs.map(a=>(
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm flex items-center gap-3">
                <span className="text-xl">{a.type==='TAXI'?'🚕':'🚗'}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.origin} → {a.dest}</div>
                  <div className="text-sm text-slate-400">{fmtDt(a.at)} · {a.dist}km · {a.dur}min · {a.type} · {a.provider}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-green-600 dark:text-green-400">{money2(a.fare)}</div>
                  <div className="text-sm font-bold text-green-500">{a.status}</div>
                </div>
              </div>
            )):<div className="text-center py-6 text-sm text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">Aucune activité récente</div>}
          </div>
        )}

        {/* ── REVENUS ── */}
        {tab==='Revenus'&&(
          <div className="space-y-3">
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · ESTIMATION · Aucune transmission officielle</div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              {[
                {l:'Revenu brut',      v:money2(gross),                      c:'text-green-600 dark:text-green-400'},
                {l:'Pourboires',       v:money2(drvTxs.reduce((s,t)=>s+t.tip,0)), c:'text-slate-700 dark:text-slate-300'},
                {l:'TPS collectée',    v:money2(tps),                         c:'text-purple-600 dark:text-purple-400'},
                {l:'TVQ collectée',    v:money2(tvq),                         c:'text-purple-600 dark:text-purple-400'},
                {l:'Part chauffeur (~80%)', v:money2(gross*0.80),             c:'text-blue-600 dark:text-blue-400'},
                {l:'Transactions',     v:`${drvTxs.length}`,                  c:'text-slate-700 dark:text-slate-300'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{r.l}</span>
                  <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONFORMITÉ ── */}
        {tab==='Conformité'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" stroke={det&&det.complianceScore>=90?'#059669':det&&det.complianceScore>=70?'#B45309':'#DC2626'} strokeDasharray={`${det?.complianceScore??0} ${100-(det?.complianceScore??0)}`} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{color:det&&det.complianceScore>=90?'#059669':det&&det.complianceScore>=70?'#B45309':'#DC2626'}}>{det?.complianceScore??0}%</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">Conformité · PILOTE</div>
                  <div className="text-sm" style={{color:det&&det.complianceScore>=90?'#059669':det&&det.complianceScore>=70?'#B45309':'#DC2626'}}>
                    {det&&det.complianceScore>=90?'✅ Conforme':det&&det.complianceScore>=70?'⚠️ Attention requise':'❌ Intervention requise'}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Indicateur administratif uniquement</div>
                </div>
              </div>
            </div>
            {det?.docsStatus!=='OK'&&(
              <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400">⚠️ Documents nécessitant attention</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Statut documents: {det?.docsStatus}</div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {tab==='Historique'&&(
          <div className="space-y-2">
            {(det?.history??[]).map((h,i)=>(
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-sm shrink-0">📋</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.action}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{h.note}</div>
                </div>
                <div className="text-sm font-mono text-slate-400 shrink-0">{fmtDt(h.at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
