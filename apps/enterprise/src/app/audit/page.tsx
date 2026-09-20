'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, fmtDt, AUDIT_EVENTS, AUDIT_ACTION_CONF, DEPARTMENTS } from '@/lib/data'

const RESULT_CONF: Record<string,{color:string}> = {
  SUCCESS:{color:'#059669'},FAILED:{color:'#DC2626'},WARNING:{color:'#B45309'},
  PENDING:{color:'#B45309'},INFO:{color:'#003DA5'},OPEN:{color:'#DC2626'},
  ALERT:{color:'#B45309'},
}
const MODULES = [...new Set(AUDIT_EVENTS.map(e=>e.module))]
const ACTIONS = [...new Set(AUDIT_EVENTS.map(e=>e.action))]

export default function AuditPage() {
  const [tab, setTab]       = useState<'events'|'financial'|'tax'|'gov'>('events')
  const [search, setSearch] = useState('')
  const [moduleF,setModuleF]= useState('ALL')
  const [actionF,setActionF]= useState('ALL')
  const [deptF,  setDeptF]  = useState('ALL')
  const [sel,    setSel]    = useState<string|null>(null)

  const filtered = AUDIT_EVENTS.filter(e=>{
    if (moduleF!=='ALL' && e.module!==moduleF) return false
    if (actionF!=='ALL' && e.action!==actionF) return false
    if (deptF!=='ALL'   && e.dept!==deptF && e.dept!=='ALL') return false
    if (search && !`${e.id} ${e.user} ${e.action} ${e.module} ${e.obj} ${e.objId}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selEvt = AUDIT_EVENTS.find(e=>e.id===sel)

  const today = AUDIT_EVENTS.filter(e=>e.at.startsWith('2026-09-18')).length
  const sensitive = AUDIT_EVENTS.filter(e=>['PAYMENT','APPROVE','REJECT','TAX_CALCULATION','EXPORT'].includes(e.action)).length

  const WORKFLOW_GOV = ['ENTREPRISE','↓','TAXIMETER.GOV','↓','DONNÉES PRÉPARÉES','↓','VALIDATION','↓','TRANSMISSION SIMULÉE','↓','ACCUSÉ SIMULÉ','↓','RAPPROCHEMENT']

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Journal d'audit</h1>
          <p className="text-sm text-slate-500 mt-1">Qui · Quoi · Quand · Sur quelle donnée · Résultat</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Journal append-only DEMO · Données synthétiques · Horodatage local
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:`Aujourd'hui`,      v:today,                                           c:'#000',   bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'Actions sensibles',v:sensitive,                                        c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Total événements', v:AUDIT_EVENTS.length,                             c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Utilisateurs actifs',v:[...new Set(AUDIT_EVENTS.map(e=>e.user))].length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([['events','📋 Événements'],['financial','💰 Financier'],['tax','🧾 Fiscal'],['gov','🏛️ Gouvernemental']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:tab===t?'#000':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#000':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── ÉVÉNEMENTS ── */}
        {tab==='events'&&(
          <>
            <div className="space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
                  placeholder="ID, utilisateur, action, module, objet…"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
              </div>
              <div className="flex gap-1.5 flex-wrap text-sm">
                <select value={moduleF} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setModuleF(e.target.value)} className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-sm">
                  <option value="ALL">Tous modules</option>
                  {MODULES.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <select value={actionF} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setActionF(e.target.value)} className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-sm">
                  <option value="ALL">Toutes actions</option>
                  {ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                <select value={deptF} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setDeptF(e.target.value)} className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-sm">
                  <option value="ALL">Tous depts</option>
                  {DEPARTMENTS.filter(d=>d.status==='ACTIVE').map(d=><option key={d.slug} value={d.slug}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tableau */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} événement(s)</span>
                  <button className="px-2 py-1 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">↓ Exporter DEMO</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                      {['ID','Date','Utilisateur','Action','Module','Objet','Résultat'].map(h=>(
                        <th key={h} className="px-3 py-2 text-left text-sm font-bold text-white whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.slice(0,30).map(e=>{
                        const ac = AUDIT_ACTION_CONF[e.action]
                        const rc = RESULT_CONF[e.result]??{color:'#64748B'}
                        return (
                          <tr key={e.id} onClick={()=>setSel(sel===e.id?null:e.id)} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" style={{background:sel===e.id?'#EEF3FB':''}}>
                            <td className="px-3 py-2 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{e.id}</td>
                            <td className="px-3 py-2 font-mono text-sm text-slate-400 whitespace-nowrap">{fmtDt(e.at)}</td>
                            <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{e.user.length>12?e.user.split(' ')[0]:e.user}</td>
                            <td className="px-3 py-2 whitespace-nowrap"><span className="text-sm font-bold" style={{color:ac?.color??'#64748B'}}>{ac?.icon??'⚡'} {e.action}</span></td>
                            <td className="px-3 py-2 text-sm text-slate-400 whitespace-nowrap">{e.module}</td>
                            <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[80px] truncate">{e.obj}</td>
                            <td className="px-3 py-2"><span className="text-sm font-bold whitespace-nowrap" style={{color:rc.color}}>{e.result}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Détail */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                {selEvt?(
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white">{selEvt.id}</div>
                    <div className="p-4 space-y-1.5">
                      {[
                        {l:'Date/heure', v:fmtDt(selEvt.at)},
                        {l:'Utilisateur',v:selEvt.user},
                        {l:'Rôle',       v:selEvt.role},
                        {l:'Action',     v:selEvt.action},
                        {l:'Module',     v:selEvt.module},
                        {l:'Objet',      v:selEvt.obj},
                        {l:'ID objet',   v:selEvt.objId},
                        {l:'Résultat',   v:selEvt.result},
                        {l:'Département',v:selEvt.dept},
                        {l:'IP (DEMO)',  v:selEvt.ip},
                        {l:'Session',    v:selEvt.session},
                        {l:'Avant',      v:selEvt.prev??'—'},
                        {l:'Après',      v:selEvt.next??'—'},
                      ].map(r=>(
                        <div key={r.l} className="flex justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 py-1">
                          <span className="text-sm text-slate-400">{r.l}</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-right max-w-[55%] truncate">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ):(
                  <div className="p-6 text-center text-sm text-slate-400 italic">Cliquer sur un événement pour voir le détail complet</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── FINANCIER ── */}
        {tab==='financial'&&(
          <div className="space-y-3">
            <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl font-bold">
              Aucune suppression silencieuse · Historique complet · Soft delete uniquement · DEMO
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Audit financier</div>
              {AUDIT_EVENTS.filter(e=>['TRANSACTION','PAYMENT','EXPORT','APPROVE'].includes(e.action)).map(e=>{
                const ac = AUDIT_ACTION_CONF[e.action]!
                const rc = RESULT_CONF[e.result]??{color:'#64748B'}
                return (
                  <div key={e.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-lg shrink-0">{ac.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{e.user}</span>
                        <span className="text-sm font-bold" style={{color:ac.color}}>{e.action}</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{e.role}</span>
                      </div>
                      <div className="text-sm text-slate-400">{e.obj} · {e.objId} · {fmtDt(e.at)}</div>
                      {e.prev&&<div className="text-sm text-slate-400 mt-0.5">{e.prev} → {e.next}</div>}
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{color:rc.color}}>{e.result}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── FISCAL ── */}
        {tab==='tax'&&(
          <div className="space-y-3">
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl font-bold">
              Estimation pilote — aucune transmission officielle
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Événements fiscaux</div>
              {AUDIT_EVENTS.filter(e=>['TAX_CALCULATION','APPROVE','PAYMENT'].includes(e.action)&&['fiscal','declarations','payments'].includes(e.module)).map(e=>{
                const ac = AUDIT_ACTION_CONF[e.action]!
                return (
                  <div key={e.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-lg shrink-0">{ac.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{e.action} · {e.obj}</div>
                      <div className="text-sm text-slate-400">{e.user} · {fmtDt(e.at)}</div>
                      {e.next&&<div className="text-sm text-purple-600 dark:text-purple-400">{e.next}</div>}
                    </div>
                    <span className="text-sm font-bold" style={{color:RESULT_CONF[e.result]?.color??'#64748B'}}>{e.result}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── GOUVERNEMENTAL ── */}
        {tab==='gov'&&(
          <div className="space-y-4">
            <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
              ⚠️ SIMULATION UNIQUEMENT — Aucune connexion gouvernementale réelle — Les mots « simulé » et « DEMO » sont intentionnels
            </div>
            {/* Timeline gouvernementale */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Workflow de transmission (SIMULÉ)</div>
              <div className="space-y-2">
                {WORKFLOW_GOV.map((step,i)=>(
                  step==='↓'?(
                    <div key={i} className="text-center text-slate-300 dark:text-slate-700 font-bold">↓</div>
                  ):(
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:i===0?'#000':i===8?'rgba(5,150,105,0.1)':'rgba(0,61,165,0.06)'}}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{background:i===0?'#06B029':i===8?'#059669':'#003DA5'}}/>
                      <span className="text-sm font-bold" style={{color:i===0?'white':i===8?'#059669':'#003DA5'}}>{step}</span>
                      {i>=4&&<span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded ml-auto">SIMULÉ</span>}
                      {i<4&&i>0&&<span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded ml-auto">PILOTE</span>}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

const WORKFLOW_GOV = ['ENTREPRISE','↓','TAXIMETER.GOV','↓','DONNÉES PRÉPARÉES','↓','VALIDATION','↓','TRANSMISSION SIMULÉE','↓','ACCUSÉ SIMULÉ','↓','RAPPROCHEMENT']
