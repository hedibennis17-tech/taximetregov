'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { useState } from 'react'
import { AUDIT_P2, CONN_STATUS } from '@/lib/enterprise-phase2-data'
import { ENTERPRISES, SECTOR_CONF, ALERT_PRIORITY, ENT_ALERTS, STATUS_CONF } from '@/lib/enterprise-data'
import { ENT_AUDIT, CONN_CONF } from '@/lib/enterprise-data'

const TPS=0.05; const TVQ=0.09975; 
function EntSelector({selected,onSelect}:{selected:string|null;onSelect:(id:string|null)=>void}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
      <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Sélectionner une entreprise</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {ENTERPRISES.map((e: typeof ENTERPRISES[0])=>{
          const sc=SECTOR_CONF[e.sector]??{icon:'🏢',color:'#64748B',label:e.sector}
          const cs=CONN_STATUS[e.connection]??CONN_STATUS['DISCONNECTED']!
          return (
            <button key={e.id} onClick={()=>onSelect(e.id===selected?null:e.id)}
              className="text-left p-3 rounded-xl border transition-all cursor-pointer"
              style={{borderColor:selected===e.id?'#003DA5':'rgba(148,163,184,0.25)',background:selected===e.id?'#EEF3FB':'transparent',outlineColor:'#003DA5'}}>
              <div className="flex items-center gap-1.5 mb-1"><span className="text-base">{sc.icon}</span><span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{e.tradeName}</span></div>
              <div className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${cs.dot}`}/><span className="text-[8px]" style={{color:cs.color}}>{cs.label}</span>{e.alerts>0&&<span className="text-[8px] font-bold text-red-500 ml-auto">{e.alerts}⚠</span>}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CommandDetail({entId}:{entId:string}) {
  const ent = ENTERPRISES.find(e=>e.id===entId)
  if (!ent) return null
  const sc = SECTOR_CONF[ent.sector]??{icon:'🏢',color:'#64748B',label:ent.sector}
  const stc = STATUS_CONF[ent.status]??{label:ent.status,color:'#64748B',bg:''}
  const timeline = [...AUDIT_P2.filter(a=>a.entId===entId),...ENT_AUDIT.filter(a=>a.entId===entId)].sort((a: {at:string;id:string;what:string;resource:string;who?:string;why?:string},b: {at:string;id:string;what:string;resource:string;who?:string;why?:string})=>b.at.localeCompare(a.at)).slice(0,8)
  const alerts = ENT_ALERTS.filter(a=>a.entId===entId&&a.status!=='INFO')
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl shrink-0">{sc.icon}</div>
          <div className="flex-1">
            <div className="text-xl font-black text-slate-900 dark:text-white">{ent.tradeName}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{ent.legalName} · NEQ: {ent.neq}</div>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:stc.color,background:stc.bg}}>{stc.label}</span>
              <span className="text-[8px] text-slate-500">{sc.label} · {ent.jurisdiction} · {ent.repr}</span>
            </div>
          </div>
          <Link href={`/admin/enterprises/${ent.id}`} className="text-[9px] font-bold text-qc-blue hover:underline shrink-0">→ Fiche</Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[
            {l:'Chauffeurs',v:ent.drivers,c:'#003DA5'},{l:'Véhicules',v:ent.vehicles,c:'#059669'},
            {l:'Activités',v:ent.activities.toLocaleString('fr-CA'),c:'#7C3AED'},
            {l:'Rev. Q3',v:money(ent.grossQ3),c:'#059669'},{l:'TPS Q3',v:money(Math.round(ent.grossQ3*TPS*100)/100),c:'#7C3AED'},
            {l:'TVQ Q3',v:money(Math.round(ent.grossQ3*TVQ*100)/100),c:'#7C3AED'},
            {l:'Conformité',v:`${ent.compliance}%`,c:ent.compliance>=95?'#059669':ent.compliance>=80?'#B45309':'#DC2626'},
            {l:'Alertes',v:ent.alerts,c:ent.alerts>0?'#DC2626':'#059669'},
          ].map(s=>(
            <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 text-center">
              <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[7px] text-slate-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Timeline gouvernementale</div>
        {timeline.length>0?(
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"/>
            {timeline.map((a: {id:string;what:string;at:string;resource:string;who?:string;why?:string})=>(
              <div key={a.id} className="relative mb-4 last:mb-0">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500"/>
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.what}</div>
                <div className="text-[9px] text-slate-400">{(a as {who?:string}).who??'SYSTEM'} · {fmtDt(a.at)} · {a.resource}</div>
                {(a as {why?:string}).why&&<div className="text-[9px] text-slate-500 italic">{(a as {why:string}).why}</div>}
              </div>
            ))}
          </div>
        ):<div className="text-center text-[10px] text-slate-400 py-4">Aucun événement pour cette entreprise</div>}
      </div>
      {alerts.length>0&&(
        <div className="bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">🚨 Alertes actives ({alerts.length})</div>
          {alerts.map(a=>(
            <div key={a.id} className="py-1.5 border-b border-red-100 dark:border-red-500/10 last:border-0 text-[10px]">
              <span className="font-bold" style={{color:ALERT_PRIORITY[a.priority]?.color??'#DC2626'}}>{a.priority}</span> · <span className="text-slate-700 dark:text-slate-200">{a.title}</span> · <span className="text-slate-400 italic">{a.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Page() {
  const [selected, setSelected] = useState<string|null>('ENT-DEMO-001')
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🏛️</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Command Center</h1>
        </div>
        <p className="text-sm text-slate-500 mb-4">Dossier gouvernemental complet · Timeline · Supervision · PILOTE</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/command"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Sélecteur entreprise */}
        <EntSelector selected={selected} onSelect={setSelected}/>
        {selected && <CommandDetail entId={selected}/>}
        {!selected && <div className="text-center py-12 text-sm text-slate-400">← Sélectionner une entreprise</div>}

      </div>
    </AppShell>
  )
}
