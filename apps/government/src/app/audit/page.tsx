'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Shield, RefreshCw } from 'lucide-react'
import React from 'react'
import { PILOT, fmtDt, AUDIT_LOGS } from '@/lib/compliance-data'

const NAV = [
  {href:'/alerts',           l:'🚨 Alertes',  active:false},
  {href:'/compliance/cases', l:'📁 Dossiers', active:false},
  {href:'/audit',            l:'🛡️ Audit',    active:true},
]

const ACTION_CONF: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  ALERT_CREATED:      {label:'Alerte créée',       color:'#DC2626', bg:'rgba(220,38,38,0.10)',  icon:'🚨'},
  CASE_CREATED:       {label:'Dossier créé',        color:'#003DA5', bg:'rgba(0,61,165,0.10)',   icon:'📁'},
  CASE_VIEWED:        {label:'Dossier consulté',    color:'#64748B', bg:'rgba(100,116,139,0.10)',icon:'👁️'},
  CASE_RESOLVED:      {label:'Dossier résolu',      color:'#059669', bg:'rgba(5,150,105,0.12)',  icon:'✅'},
  INFO_REQUESTED:     {label:'Info demandée',       color:'#7C3AED', bg:'rgba(124,58,237,0.12)', icon:'📝'},
  DOCUMENT_VERIFIED:  {label:'Document vérifié',    color:'#059669', bg:'rgba(5,150,105,0.12)',  icon:'📄'},
  DOCUMENT_UPDATED:   {label:'Document modifié',    color:'#B45309', bg:'rgba(180,83,9,0.10)',   icon:'✏️'},
  TRANSACTION_REVIEWED:{label:'Transaction analysée',color:'#003DA5',bg:'rgba(0,61,165,0.10)',  icon:'💳'},
  WEBHOOK_FAILURE:    {label:'Webhook interrompu',  color:'#DC2626', bg:'rgba(220,38,38,0.10)',  icon:'⚠️'},
  REPORT_GENERATED:   {label:'Rapport généré',      color:'#003DA5', bg:'rgba(0,61,165,0.10)',   icon:'📊'},
  REPORT_EXPORTED:    {label:'Rapport exporté',     color:'#003DA5', bg:'rgba(0,61,165,0.10)',   icon:'📥'},
}

const ROLE_CONF: Record<string,{color:string;bg:string}> = {
  SUPER_ADMIN:{color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  ADMIN:      {color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  SYSTEM:     {color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  ANALYST:    {color:'#7C3AED',bg:'rgba(124,58,237,0.10)'},
  AUDITOR:    {color:'#059669',bg:'rgba(5,150,105,0.10)'},
}

const MODULES = ['ALL','COMPLIANCE','ALERTS','DRIVERS','DOCUMENTS','PLATFORM','REPORTS','ANALYTICS']

export default function AuditPage() {
  const [module, setModule]   = useState('ALL')
  const [search, setSearch]   = useState('')

  const filtered = AUDIT_LOGS.filter(a => {
    if (module !== 'ALL' && a.module !== module) return false
    if (search && !`${a.action} ${a.obj} ${a.user} ${a.note}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total:   AUDIT_LOGS.length,
    system:  AUDIT_LOGS.filter(a=>a.role==='SYSTEM').length,
    admin:   AUDIT_LOGS.filter(a=>a.role==='ADMIN').length,
    super:   AUDIT_LOGS.filter(a=>a.role==='SUPER_ADMIN').length,
  }

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Journal d'audit</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Traçabilité complète · Toutes actions · TAXIMETER.GOV</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Événements total', v:stats.total,  c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'📋'},
            {l:'Système',          v:stats.system, c:'#64748B', bg:'bg-slate-100 dark:bg-slate-800',    icon:'⚙️'},
            {l:'Admin',            v:stats.admin,  c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'👤'},
            {l:'Super Admin',      v:stats.super,  c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',     icon:'🔑'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)} placeholder="Rechercher action, objet, utilisateur…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-qc-blue"/>
          <div className="flex gap-1.5 overflow-x-auto flex-nowrap">
            {MODULES.map(m=>(
              <button key={m} onClick={()=>setModule(m)} className="shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:module===m?'#003DA5':'transparent',color:module===m?'white':'#64748B',borderColor:module===m?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {m==='ALL'?'Tous modules':m}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline audit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400"/>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{filtered.length} événement(s)</span>
            </div>
            <span className="text-[9px] text-slate-400">Chronologique · Plus récent en premier</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {['Date/Heure','Action','Module','Objet','Utilisateur','Rôle','Note'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a=>{
                  const ac = ACTION_CONF[a.action] ?? {label:a.action,color:'#64748B',bg:'rgba(100,116,139,0.10)',icon:'📋'}
                  const rc = ROLE_CONF[a.role] ?? ROLE_CONF['SYSTEM']!
                  return (
                    <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 text-[9px] font-mono text-slate-500 whitespace-nowrap">{fmtDt(a.at)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span>{ac.icon}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap" style={{color:ac.color,background:ac.bg}}>{ac.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.module}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[9px] font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">{a.obj}</td>
                      <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{a.user}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{color:rc.color,background:rc.bg}}>{a.role}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[9px] text-slate-400 max-w-xs truncate">{a.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note légale */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-slate-400 shrink-0 mt-0.5"/>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Ce journal d'audit représente les actions enregistrées dans le système TAXIMETER.GOV en mode PILOTE. Toutes les données sont synthétiques. En production, chaque action serait conservée de manière immuable avec horodatage certifié. Aucune donnée réelle de citoyen ou d'entreprise n'est impliquée.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
