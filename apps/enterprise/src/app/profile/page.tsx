'use client'
import React, { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ROLE_LABELS, ROLE_COLORS, getRolePermissions, type Role } from '@/lib/auth/rbac'
import { getSecurityLog, type SecurityLogEntry } from '@/lib/auth/securityLog'
import { PILOT, CURRENT_ENT } from '@/lib/data'

export default function ProfilePage() {
  const { user } = useAuth()
  const [log, setLog] = useState<SecurityLogEntry[]>([])

  useEffect(() => {
    setLog(getSecurityLog().slice(0, 20))
  }, [])

  if (!user) return null

  const role    = user.role as Role
  const perms   = getRolePermissions(role)
  const color   = ROLE_COLORS[role] ?? '#64748B'
  const label   = ROLE_LABELS[role] ?? role

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-4xl mx-auto">

        {/* Header */}
        <div className="rounded-2xl p-5 shadow-sm" style={{background:'#000'}}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0" style={{background:color}}>
              {user.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
            </div>
            <div className="flex-1">
              <div className="text-white font-black text-base">{user.name}</div>
              <div className="text-[10px]" style={{color:'rgba(255,255,255,0.5)'}}>{user.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:color}}>{label}</span>
                <span className="text-[8px] font-bold text-green-400">🔒 SESSION SÉCURISÉE</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[8px]" style={{color:'rgba(255,255,255,0.35)'}}>Enterprise ID</div>
              <div className="text-[9px] font-black text-white">{user.enterpriseId}</div>
              <div className="text-[7px] mt-1 text-amber-400">{PILOT}</div>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · Données synthétiques · Mode démo · {CURRENT_ENT.id}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Infos compte */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-black text-slate-800 dark:text-white mb-3">Informations du compte</div>
            {[
              {l:'Nom',           v:user.name},
              {l:'Courriel',      v:user.email},
              {l:'Rôle',          v:label},
              {l:'Enterprise ID', v:user.enterpriseId},
              {l:'User ID',       v:user.id.slice(0,8)+'…'},
              {l:'Entreprise',    v:CURRENT_ENT.legalName},
              {l:'Mode',          v:'PILOTE · DONNÉES SYNTHÉTIQUES'},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-[10px]">
                <span className="text-slate-400 font-bold">{r.l}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold text-right max-w-[60%] truncate">{r.v}</span>
              </div>
            ))}
          </div>

          {/* Permissions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-black text-slate-800 dark:text-white mb-1">Permissions ({perms.length})</div>
            <div className="text-[8px] text-slate-400 mb-3">Basées sur le rôle : <span className="font-bold" style={{color}}>{label}</span></div>
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {perms.map(p=>(
                <div key={p} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"/>
                  <span className="text-[8px] font-mono text-slate-600 dark:text-slate-400">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journal de sécurité */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-black text-slate-800 dark:text-white mb-3">Journal de sécurité — Session actuelle</div>
          {log.length === 0 ? (
            <div className="text-[10px] text-slate-400 italic">Aucun événement enregistré</div>
          ) : (
            <div className="space-y-1.5">
              {log.map((e:SecurityLogEntry)=>(
                <div key={(e as {id:string}).id} className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-base shrink-0">
                    {e.event==='LOGIN'?'✅':e.event==='LOGOUT'?'👋':e.event==='LOGIN_FAILED'?'❌':e.event==='ACCESS_DENIED'?'🚫':e.event==='SESSION_CREATED'?'🔐':'📝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-slate-800 dark:text-slate-200">{e.event}</div>
                    {e.detail&&<div className="text-[8px] text-slate-400 truncate">{e.detail}</div>}
                    {e.route&&<div className="text-[8px] font-mono text-slate-400">{e.route}</div>}
                  </div>
                  <div className="text-[8px] text-slate-400 shrink-0">{e.at.split('T')[1].slice(0,8)}</div>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${e.success?'text-green-600 bg-green-50':'text-red-500 bg-red-50'}`}>
                    {e.success?'OK':'REFUSÉ'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
