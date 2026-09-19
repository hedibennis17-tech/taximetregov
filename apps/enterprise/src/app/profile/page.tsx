'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { CURRENT_ENT, ENT_USERS, ROLE_CONF } from '@/lib/data'

export default function Page() {
  // page
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1">{CURRENT_ENT.tradeName}</div>
          <div className="text-[10px] text-slate-400 mb-4">{CURRENT_ENT.legalName}</div>
          {[
            {l:'Enterprise ID',     v:CURRENT_ENT.id},
            {l:'NEQ',               v:CURRENT_ENT.neq},
            {l:'Identifiant fiscal',v:CURRENT_ENT.taxId},
            {l:'Secteur',           v:CURRENT_ENT.sector},
            {l:'Type',              v:CURRENT_ENT.type},
            {l:'Juridiction',       v:CURRENT_ENT.jurisdiction},
            {l:'Adresse',           v:`${CURRENT_ENT.address}, ${CURRENT_ENT.city} ${CURRENT_ENT.postal}`},
            {l:'Téléphone',         v:CURRENT_ENT.phone},
            {l:'Courriel',          v:CURRENT_ENT.email},
            {l:'Représentant',      v:CURRENT_ENT.repr},
            {l:'Statut',            v:CURRENT_ENT.status},
            {l:'Vérification',      v:CURRENT_ENT.verif},
            {l:'Inscription',       v:fmtDate(CURRENT_ENT.registered)},
          ].map(r=>(
            <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-[10px] text-slate-500">{r.l}</span>
              <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">{r.v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Représentants autorisés</div>
          {ENT_USERS.map(u=>{
            const rc=ROLE_CONF[u.role]??{label:u.role,color:'#64748B',perms:[]}
            return (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-qc-blue flex items-center justify-center text-[11px] font-black text-white shrink-0">{u.name[0]}</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                  <div className="text-[9px] text-slate-400">{u.email}</div>
                </div>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span>
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}
