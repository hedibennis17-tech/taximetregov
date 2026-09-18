'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { PILOT, money, fmtDt, APPROVALS, APP_STATUS, PRIORITY_CONF, TYPE_ICONS } from '@/lib/operations-data'

const NAV = [
  {href:'/tasks',                  l:'📋 Tâches',          active:false},
  {href:'/approvals',              l:'🔐 Approbations',    active:true},
  {href:'/operations/calendar',    l:'📅 Calendrier',      active:false},
  {href:'/operations/data-quality',l:'🧹 Qualité données', active:false},
]

export default function ApprovalsPage() {
  const [items, setItems] = useState(APPROVALS)
  const [action, setAction] = useState<{id:string;type:'APPROVE'|'REJECT'|'RETURN'}|null>(null)
  const [comment, setComment] = useState('')

  function doAction() {
    if (!action) return
    const newStatus = action.type==='APPROVE'?'APPROVED':action.type==='REJECT'?'REJECTED':'RETURNED'
    setItems((prev: typeof APPROVALS)=>prev.map((a: typeof APPROVALS[0])=>a.id===action.id?{...a,status:newStatus}:a))
    setAction(null); setComment('')
  }

  const pending  = items.filter((a: typeof APPROVALS[0])=>a.status==='PENDING').length
  const approved = items.filter((a: typeof APPROVALS[0])=>a.status==='APPROVED').length
  const returned = items.filter((a: typeof APPROVALS[0])=>['REJECTED','RETURNED'].includes(a.status)).length

  return (
    <AppShell>
      {/* Modal action */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {action.type==='APPROVE'?'✅ Approuver':action.type==='REJECT'?'❌ Rejeter':'↩️ Retourner pour correction'}
            </div>
            <div className="text-[9px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-xl mb-3">{PILOT}</div>
            <textarea value={comment} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setComment(e.target.value)}
              placeholder="Commentaire (requis pour rejeter/retourner)…"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 outline-none focus:border-qc-blue resize-none h-20 mb-3"/>
            <div className="flex gap-2">
              <button onClick={doAction} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer hover:opacity-90" style={{background:action.type==='APPROVE'?'#059669':action.type==='REJECT'?'#DC2626':'#7C3AED'}}>
                Confirmer
              </button>
              <button onClick={()=>{setAction(null);setComment('')}} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Approbations</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Workflow de validation · Révision · Décisions administratives</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Aucune approbation gouvernementale réelle</div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow d'approbation</div>
          <div className="flex items-center gap-2 flex-wrap text-[9px] font-bold">
            {['📤 DEMANDE','→','⏳ EN ATTENTE','→','🔍 RÉVISION','→','✅ APPROUVÉE','↕','❌ REJETÉE','↕','↩️ RETOURNÉE'].map((s,i)=>(
              <span key={i} className={['→','↕'].includes(s)?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'En attente',  v:pending,  c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10',  icon:'⏳'},
            {l:'Approuvées',  v:approved, c:'#059669', bg:'bg-green-50 dark:bg-green-500/10',  icon:'✅'},
            {l:'Rejet/Retour',v:returned, c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',     icon:'↩️'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {items.map((a: typeof APPROVALS[0])=>{
            const sc = APP_STATUS[a.status]!
            const pc = PRIORITY_CONF[a.priority]!
            const isPending = a.status==='PENDING'
            return (
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{TYPE_ICONS[a.type]??'🔐'}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{a.obj}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        <span className="text-[8px] font-bold" style={{color:pc.color}}>{pc.label}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mb-1">{a.id}</div>
                      <div className="text-[10px] text-slate-500">{a.note}</div>
                    </div>
                  </div>
                  {a.amount>0 && <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-800 dark:text-white">{money(a.amount)}</div>
                    {a.diff>0 && <div className="text-[9px] text-red-500 font-bold">Écart: {money(a.diff)}</div>}
                  </div>}
                </div>

                <div className="flex gap-3 text-[9px] text-slate-400 mb-3 flex-wrap">
                  <span>👤 Demandeur: {a.requester}</span>
                  <span>🎯 Assigné: {a.assignee}</span>
                  <span>📅 {fmtDt(a.createdAt)}</span>
                  {a.relatedModule && <Link href={a.relatedModule} className="text-blue-600 dark:text-blue-400 hover:underline font-bold">→ Voir source</Link>}
                </div>

                {isPending && (
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={()=>setAction({id:a.id,type:'APPROVE'})} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-100">
                      <CheckCircle size={12}/> Approuver
                    </button>
                    <button onClick={()=>setAction({id:a.id,type:'REJECT'})} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-400 cursor-pointer hover:bg-red-100">
                      <XCircle size={12}/> Rejeter
                    </button>
                    <button onClick={()=>setAction({id:a.id,type:'RETURN'})} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 text-purple-700 dark:text-purple-400 cursor-pointer hover:bg-purple-100">
                      <RotateCcw size={12}/> Retourner
                    </button>
                    <div className="text-[8px] font-bold text-slate-400 self-center">DÉMO</div>
                  </div>
                )}
                {!isPending && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-bold" style={{color:sc.color}}>
                    {sc.label} — inscrit dans l'audit
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
