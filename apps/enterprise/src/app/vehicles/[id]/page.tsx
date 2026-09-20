'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PILOT, money2, fmtDt, fmtDate, ENT_VEHICLES, ENT_DRIVERS, ENT_ACTIVITIES, ENT_DOCS_FULL, VEHICLE_DETAIL, DOC_STATUS, SYNC_STATUS } from '@/lib/data'

const TABS = ['Identification','Chauffeur','Documents','Activités','Taximètre','Conformité','Historique'] as const
type Tab = typeof TABS[number]

const VEH_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:    {label:'Actif',      color:'#059669',bg:'rgba(5,150,105,0.12)'},
  MAINTENANCE:{label:'Maintenance',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  AVAILABLE: {label:'Disponible', color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
}

export default function VehicleProfilePage() {
  const { id } = useParams<{id:string}>()
  const [tab, setTab] = useState<Tab>('Identification')

  const veh  = ENT_VEHICLES.find(v=>v.id===id)
  const det  = VEHICLE_DETAIL[id]
  if (!veh) return (
    <AppShell>
      <div className="px-6 py-8">
        <Link href="/vehicles" className="flex items-center gap-2 text-xs text-qc-blue mb-4"><ArrowLeft size={12}/> Véhicules</Link>
        <p className="text-sm text-red-500">Véhicule non trouvé: {id}</p>
      </div>
    </AppShell>
  )

  const drv  = ENT_DRIVERS.find(d=>d.id===veh.driver)
  const sc   = VEH_STATUS[veh.status]!
  const ss   = SYNC_STATUS[det?.syncStatus??'DEMO']!
  const docs = ENT_DOCS_FULL.filter(d=>d.ownerId===id)
  const acts = ENT_ACTIVITIES.filter(a=>a.vehicleId===id)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
        <Link href="/vehicles" className="flex items-center gap-2 text-xs text-slate-500 hover:text-qc-blue"><ArrowLeft size={12}/> Véhicules</Link>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shrink-0">🚗</div>
            <div className="flex-1">
              <div className="text-xl font-black text-slate-900 dark:text-white">{veh.year} {veh.make} {veh.model}</div>
              <div className="text-sm font-mono text-slate-400">{veh.id} · {veh.plate}</div>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                {det?.taximeterId&&<span className="text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">🚕 Taximètre: {det.taximeterId} · DEMO</span>}
                <div className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/><span className="text-sm font-bold" style={{color:ss.color}}>{ss.label}</span></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {l:'Activités',    v:acts.length,          c:'#003DA5'},
              {l:'Documents',    v:docs.length,           c:'#059669'},
              {l:'Conformité',   v:`${det?.complianceScore??0}%`, c:det&&det.complianceScore>=90?'#059669':'#B45309'},
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

        {tab==='Identification'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            {[
              {l:'Vehicle ID',    v:veh.id},
              {l:'Marque',        v:veh.make},
              {l:'Modèle',        v:veh.model},
              {l:'Année',         v:String(veh.year)},
              {l:'Couleur',       v:det?.color??'—'},
              {l:'VIN',           v:veh.vin},
              {l:'Plaque',        v:veh.plate},
              {l:'Usage',         v:det?.useType??'TAXI'},
              {l:'Statut',        v:sc.label},
              {l:'Assurance expire', v:fmtDate(veh.insurance)},
              {l:'Inspection expire',v:fmtDate(veh.inspection)},
              {l:'Immatriculation',  v:fmtDate(veh.reg)},
              {l:'Synchronisation',  v:ss.label},
              {l:'Taximètre',        v:det?.taximeterId??'Non installé'},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm text-slate-500">{r.l}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {tab==='Chauffeur'&&(
          drv?(
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white">{drv.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{drv.name}</div>
                  <div className="text-sm font-mono text-slate-400">{drv.id} · {drv.relation}</div>
                </div>
              </div>
              <Link href={`/drivers/${drv.id}`} className="block text-center text-sm font-bold text-qc-blue hover:underline">→ Voir profil chauffeur complet</Link>
            </div>
          ):(
            <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 text-center text-sm text-amber-700 dark:text-amber-400 font-bold">
              ⚠️ Aucun chauffeur assigné — <button className="text-qc-blue cursor-pointer hover:underline">Assigner un chauffeur</button>
            </div>
          )
        )}

        {tab==='Documents'&&(
          <div className="space-y-2">
            {docs.length>0?docs.map(doc=>{
              const dsc = DOC_STATUS[doc.status]!
              return (
                <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">📄 {doc.label}</span>
                    <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:dsc.color,background:`${dsc.color}18`}}>{dsc.label}</span>
                  </div>
                  <div className="text-sm text-slate-400">{doc.number} · {doc.expires?`Expire: ${fmtDate(doc.expires)}`:'Pas d\'expiration'}</div>
                  {doc.note&&<div className="text-sm text-amber-600 dark:text-amber-400 italic mt-0.5">{doc.note}</div>}
                </div>
              )
            }):<div className="text-center py-6 text-sm text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">Aucun document enregistré</div>}
          </div>
        )}

        {tab==='Activités'&&(
          <div className="space-y-2">
            {acts.length>0?acts.map(a=>(
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm flex items-center gap-3">
                <span className="text-xl">🚕</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.origin} → {a.dest}</div>
                  <div className="text-sm text-slate-400">{fmtDt(a.at)} · {a.dist}km · {a.dur}min</div>
                </div>
                <div className="text-sm font-black text-green-600 dark:text-green-400 shrink-0">{money2(a.fare)}</div>
              </div>
            )):<div className="text-center py-6 text-sm text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">Aucune activité récente</div>}
          </div>
        )}

        {tab==='Taximètre'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Taximètre numérique — DÉMO</div>
              {[
                {l:'Taximètre ID',  v:det?.taximeterId??'Non installé'},
                {l:'Statut install.',v:det?.taximeterId?'INSTALLÉ':'NON INSTALLÉ'},
                {l:'Sync',          v:ss.label},
                {l:'Dernière vue',  v:det?.lastSync?fmtDt(det.lastSync):'—'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{r.l}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-3 text-sm text-blue-700 dark:text-blue-400 font-bold">
              🚕 Chaîne: Véhicule → Taximètre → Session → Course → Transaction → Revenue Ledger · PILOTE
            </div>
          </div>
        )}

        {tab==='Conformité'&&(
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
                <div className="text-sm font-bold text-slate-800 dark:text-white">Conformité véhicule · PILOTE</div>
                <div className="text-sm text-slate-400 mt-1">Documents · Inspection · Assurance · Immatriculation</div>
              </div>
            </div>
          </div>
        )}

        {tab==='Historique'&&(
          <div className="space-y-2">
            {(det?.history??[]).map((h,i)=>(
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-sm shrink-0">🚗</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.action}</div>
                  <div className="text-sm text-slate-400">{h.note}</div>
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
