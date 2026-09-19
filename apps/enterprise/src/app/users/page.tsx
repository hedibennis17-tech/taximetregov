'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_USERS, ROLE_CONF } from '@/lib/data'

export default function Page() {
  // page
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">{ENT_USERS.length} utilisateur(s) — Gestion des accès</div>
          {ENT_USERS.map(u=>{
            const rc=ROLE_CONF[u.role]??{label:u.role,color:'#64748B',perms:[]}
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="w-9 h-9 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white shrink-0">{u.name[0]}</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                  <div className="text-[9px] text-slate-400">{u.email}</div>
                </div>
                <div className="text-right">
                  <div><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span></div>
                  <div className="text-[8px] text-slate-400 mt-0.5">{u.lastLogin?fmtDt(u.lastLogin):'Jamais connecté'}</div>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${u.status==='ACTIVE'?'bg-green-500':'bg-amber-400'}`}/>
              </div>
            )
          })}
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">Structure des rôles</div>
          {Object.entries(ROLE_CONF).map(([k,v])=>(
            <div key={k} className="flex justify-between py-1.5 border-b border-blue-100 dark:border-blue-500/10 last:border-0">
              <span className="text-[9px] font-bold" style={{color:v.color}}>{v.label}</span>
              <span className="text-[9px] text-slate-400">{v.perms.join(' · ')}</span>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
