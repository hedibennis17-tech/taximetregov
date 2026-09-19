'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, fmtDt, ALL_NOTIFICATIONS, NOTIF_TYPE_CONF, NOTIF_PRIORITY_CONF, DEPARTMENTS } from '@/lib/data'

export default function NotificationsPage() {
  const [typeF,    setTypeF]    = useState('ALL')
  const [priorityF,setPriorityF]= useState('ALL')
  const [statusF,  setStatusF]  = useState('ALL')
  const [deptF,    setDeptF]    = useState('ALL')
  const [search,   setSearch]   = useState('')
  const [sel,      setSel]      = useState<string|null>(null)

  const filtered = ALL_NOTIFICATIONS.filter(n=>{
    if (typeF!=='ALL'     && n.type!==typeF)         return false
    if (priorityF!=='ALL' && n.priority!==priorityF) return false
    if (statusF!=='ALL'   && n.status!==statusF)     return false
    if (deptF!=='ALL'     && n.dept!==deptF&&n.dept!=='ALL') return false
    if (search && !`${n.title} ${n.desc} ${n.type} ${n.source}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selN = ALL_NOTIFICATIONS.find(n=>n.id===sel)
  const unread    = ALL_NOTIFICATIONS.filter(n=>!n.read).length
  const urgent    = ALL_NOTIFICATIONS.filter(n=>n.priority==='HIGH'||n.priority==='CRITICAL').length
  const fiscal    = ALL_NOTIFICATIONS.filter(n=>['TAX_DEADLINE','TAX_CALCULATION','PAYMENT_DUE','DECLARATION_READY'].includes(n.type)).length
  const govMsg    = ALL_NOTIFICATIONS.filter(n=>n.type==='GOVERNMENT_MESSAGE').length
  const types     = [...new Set(ALL_NOTIFICATIONS.map(n=>n.type))]

  const WORKFLOW = ['ÉVÉNEMENT','→','DÉTECTION','→','CRÉATION','→','PRIORITÉ','→','DESTINATAIRE','→','NOTIFICATION','→','ACTION','→','RÉSOLUTION']

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        {/* Header logos */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <div className="text-black dark:text-white font-black" style={{fontSize:'1.4rem',fontFamily:'system-ui',letterSpacing:'-0.04em'}}>uber</div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"/>
              <div className="flex items-center gap-1"><span className="font-black" style={{color:'#06B029',fontSize:'0.9rem',fontFamily:'system-ui'}}>Uber</span><span className="font-black text-black dark:text-white" style={{fontSize:'0.9rem',fontFamily:'system-ui'}}>Eats</span></div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre de notifications</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fiscal · Documents · Conformité · API · Gouvernement · Système</p>
          </div>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Notifications synthétiques · Aucune communication gouvernementale réelle
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-black text-white'}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total (30)',      v:ALL_NOTIFICATIONS.length,c:'#000',   bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'Non lues',        v:unread,                  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'Urgentes/Élevées',v:urgent,                  c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Fiscales',        v:fiscal,                  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Titre, description, source, type…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['ALL','NOUVELLE','LUE','EN TRAITEMENT','RÉSOLUE','FERMÉE'].map(s=>(
              <button key={s} onClick={()=>setStatusF(s)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border cursor-pointer transition-all" style={{background:statusF===s?'#000':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#000':'rgba(148,163,184,0.30)'}}>
                {s==='ALL'?`Tous (${ALL_NOTIFICATIONS.length})`:s}
              </button>
            ))}
            {['ALL','CRITICAL','HIGH','MEDIUM','LOW'].map(p=>(
              <button key={p} onClick={()=>setPriorityF(p)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border cursor-pointer transition-all" style={{background:priorityF===p?NOTIF_PRIORITY_CONF[p]?.color??'#000':'transparent',color:priorityF===p?'white':'#64748B',borderColor:priorityF===p?NOTIF_PRIORITY_CONF[p]?.color??'#000':'rgba(148,163,184,0.30)'}}>
                {p==='ALL'?'Tous niveaux':NOTIF_PRIORITY_CONF[p]?.label??p}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={()=>setDeptF('ALL')} className="px-2 py-1 rounded-lg text-[8px] font-bold border cursor-pointer" style={{background:deptF==='ALL'?'#000':'transparent',color:deptF==='ALL'?'white':'#64748B',borderColor:deptF==='ALL'?'#000':'rgba(148,163,184,0.30)'}}>Tous depts</button>
            {DEPARTMENTS.filter(d=>d.status==='ACTIVE').map(d=>(
              <button key={d.slug} onClick={()=>setDeptF(d.slug)} className="px-2 py-1 rounded-lg text-[8px] font-bold border cursor-pointer" style={{background:deptF===d.slug?d.color:'transparent',color:deptF===d.slug?'white':'#64748B',borderColor:deptF===d.slug?d.color:'rgba(148,163,184,0.30)'}}>
                {d.emoji} {d.name.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Liste notifications */}
          <div className="lg:col-span-2 space-y-1.5">
            <div className="text-[9px] text-slate-400 px-1">{filtered.length} notification(s)</div>
            {filtered.map(n=>{
              const tc = NOTIF_TYPE_CONF[n.type]!
              const pc = NOTIF_PRIORITY_CONF[n.priority]!
              const dept = DEPARTMENTS.find(d=>d.slug===n.dept)
              return (
                <div key={n.id} onClick={()=>setSel(sel===n.id?null:n.id)}
                  className="bg-white dark:bg-slate-900 border rounded-2xl p-3.5 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  style={{borderColor:sel===n.id?tc.color:'rgba(226,232,240,0.8)',borderWidth:sel===n.id?2:1,
                          borderLeft:`4px solid ${n.priority==='CRITICAL'?'#DC2626':n.priority==='HIGH'?'#B45309':tc.color}`,
                          opacity:n.read&&n.status==='FERMÉE'?0.65:1}}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">{tc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                        {!n.read&&<div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"/>}
                      </div>
                      <div className="text-[9px] text-slate-500 leading-snug truncate">{n.desc}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{color:pc.color,background:pc.bg}}>{pc.label}</span>
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{color:tc.color,background:tc.bg}}>{tc.label}</span>
                        {dept&&<span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{color:dept.color,background:`${dept.color}15`}}>{dept.emoji}</span>}
                        <span className="text-[8px] font-mono text-slate-400">{fmtDt(n.at)}</span>
                        <span className="text-[8px] text-slate-400">· {n.source}</span>
                      </div>
                    </div>
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${n.status==='NOUVELLE'?'text-red-500 bg-red-50':n.status==='RÉSOLUE'||n.status==='FERMÉE'?'text-slate-400 bg-slate-100 dark:bg-slate-800':'text-blue-600 bg-blue-50'}`}>{n.status}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Détail + stats */}
          <div className="space-y-3">
            {selN&&(
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-lg">{NOTIF_TYPE_CONF[selN.type]?.icon}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{selN.id}</span>
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mb-2">{selN.title}</div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-2 mb-2">{selN.desc}</div>
                  {[
                    {l:'Type',        v:NOTIF_TYPE_CONF[selN.type]?.label},
                    {l:'Priorité',    v:selN.priority},
                    {l:'Statut',      v:selN.status},
                    {l:'Destinataire',v:selN.to},
                    {l:'Source',      v:selN.source},
                    {l:'Date',        v:fmtDt(selN.at)},
                    {l:'Lu',          v:selN.read?'Oui':'Non'},
                  ].map(r=>(
                    <div key={r.l} className="flex justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 py-1">
                      <span className="text-[9px] text-slate-400">{r.l}</span>
                      <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{r.v}</span>
                    </div>
                  ))}
                  {selN.action&&(
                    <div className="pt-2">
                      <button className="w-full py-2 rounded-xl text-[9px] font-bold bg-black text-white cursor-pointer">{selN.action}</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Résumé par type */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">Par catégorie</div>
              {[
                {l:'Fiscalité',     v:ALL_NOTIFICATIONS.filter(n=>['TAX_DEADLINE','TAX_CALCULATION','PAYMENT_DUE','DECLARATION_READY'].includes(n.type)).length,icon:'🧾',c:'#7C3AED'},
                {l:'Documents',     v:ALL_NOTIFICATIONS.filter(n=>n.type.startsWith('DOCUMENT')).length, icon:'📄',c:'#B45309'},
                {l:'Conformité',    v:ALL_NOTIFICATIONS.filter(n=>n.type==='COMPLIANCE_ALERT').length,   icon:'⚖️',c:'#B45309'},
                {l:'API/Webhooks',  v:ALL_NOTIFICATIONS.filter(n=>['API_ERROR','WEBHOOK_ERROR'].includes(n.type)).length,icon:'📡',c:'#DC2626'},
                {l:'Sync',          v:ALL_NOTIFICATIONS.filter(n=>n.type.startsWith('SYNC')).length,     icon:'🔄',c:'#059669'},
                {l:'Transactions',  v:ALL_NOTIFICATIONS.filter(n=>n.type.includes('TRANSACTION')||n.type.includes('RECONCILIATION')).length,icon:'💸',c:'#DC2626'},
                {l:'Gouvernement',  v:ALL_NOTIFICATIONS.filter(n=>n.type==='GOVERNMENT_MESSAGE').length, icon:'🏛️',c:'#003DA5'},
                {l:'Système',       v:ALL_NOTIFICATIONS.filter(n=>n.type==='SYSTEM_ALERT').length,       icon:'🖥️',c:'#64748B'},
              ].map(s=>(
                <div key={s.l} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-base shrink-0">{s.icon}</span>
                  <span className="text-[9px] flex-1 text-slate-600 dark:text-slate-400">{s.l}</span>
                  <span className="text-sm font-black" style={{color:s.c}}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
