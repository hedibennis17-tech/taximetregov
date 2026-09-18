'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { PILOT, fmtDt, TASKS, TASK_STATUS, PRIORITY_CONF, TYPE_ICONS } from '@/lib/operations-data'

const NAV = [
  {href:'/tasks',                  l:'📋 Tâches',          active:true},
  {href:'/approvals',              l:'🔐 Approbations',    active:false},
  {href:'/operations/calendar',    l:'📅 Calendrier',      active:false},
  {href:'/operations/data-quality',l:'🧹 Qualité données', active:false},
]

const WORKFLOW = ['DONNÉE','→','CONTRÔLE','→','🚨 ALERTE','→','📁 DOSSIER','→','📋 TÂCHE','→','ASSIGNATION','→','🔐 APPROBATION','→','✅ RÉSOLUTION','→','🛡️ AUDIT']

export default function TasksPage() {
  const [status,   setStatus]   = useState('ALL')
  const [priority, setPriority] = useState('ALL')
  const [tasks,    setTasks]    = useState(TASKS)

  const filtered = tasks.filter(t => {
    if (status !== 'ALL' && t.status !== status) return false
    if (priority !== 'ALL' && t.priority !== priority) return false
    return true
  })

  const stats = {
    open:     tasks.filter(t=>!['DONE','CANCELLED'].includes(t.status)).length,
    inProg:   tasks.filter(t=>t.status==='IN_PROGRESS').length,
    approval: tasks.filter(t=>t.status==='APPROVAL').length,
    done:     tasks.filter(t=>t.status==='DONE').length,
  }

  function markDone(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? {...t, status:'DONE'} : t))
  }

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre des opérations</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Tâches · Assignation · Suivi · Coordination gouvernementale</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Chaîne workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Flux opérationnel</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Tâches ouvertes',  v:stats.open,     c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'📋'},
            {l:'En cours',         v:stats.inProg,   c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10',  icon:'⚡'},
            {l:'À approuver',      v:stats.approval, c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/10',icon:'🔐'},
            {l:'Terminées',        v:stats.done,     c:'#059669', bg:'bg-green-50 dark:bg-green-500/10',  icon:'✅'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {[{v:'ALL',l:'Toutes'},{v:'TODO',l:'À faire'},{v:'IN_PROGRESS',l:'En cours'},{v:'PENDING',l:'En attente'},{v:'APPROVAL',l:'À approuver'},{v:'DONE',l:'Terminées'}].map(f=>(
            <button key={f.v} onClick={()=>setStatus(f.v)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:status===f.v?'#003DA5':'transparent',color:status===f.v?'white':'#64748B',borderColor:status===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>{f.l}</button>
          ))}
          <select value={priority} onChange={e=>setPriority(e.target.value)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
            <option value="ALL">Toutes priorités</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(p=><option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Liste tâches */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} tâche(s)</span>
            <span className="text-[9px] text-slate-400">DEMO · Aucune action réelle</span>
          </div>
          {filtered.map(t => {
            const sc = TASK_STATUS[t.status]!
            const pc = PRIORITY_CONF[t.priority]!
            const overdue = new Date(t.dueAt) < new Date() && !['DONE','CANCELLED'].includes(t.status)
            return (
              <div key={t.id} className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" style={{borderLeft:`3px solid ${pc.color}`}}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{TYPE_ICONS[t.type]??'📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{t.title}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      <span className="text-[8px] font-bold" style={{color:pc.color}}>{pc.label}</span>
                      {overdue && <span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 rounded-full">RETARD</span>}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mb-1">{t.id} · Source: {t.source}</div>
                    <div className="text-[10px] text-slate-500 mb-1">{t.note}</div>
                    <div className="flex gap-3 text-[9px] text-slate-400 flex-wrap">
                      {t.driver && <span>👤 {t.driver}</span>}
                      <span>👤 Assigné: {t.assignee}</span>
                      <span>📅 Échéance: {fmtDt(t.dueAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {t.relatedModule && (
                      <Link href={t.relatedModule} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 whitespace-nowrap">→ Voir source</Link>
                    )}
                    {!['DONE','CANCELLED'].includes(t.status) && (
                      <button onClick={()=>markDone(t.id)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 text-green-700 dark:text-green-400 hover:bg-green-100 cursor-pointer whitespace-nowrap">✅ Marquer fait</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
