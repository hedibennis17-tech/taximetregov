'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, fmtDt, SESSIONS, SES_STATUS, ROLE_COLORS } from '@/lib/security-data'

const NAV = [
  {href:'/security/center',    l:'🛡️ Security Center', active:false},
  {href:'/security/monitoring',l:'📡 Monitoring',       active:false},
  {href:'/security/sessions',  l:'🔑 Sessions',         active:true},
  {href:'/governance/center',  l:'⚖️ Gouvernance',      active:false},
  {href:'/privacy/center',     l:'🔒 Confidentialité',  active:false},
]

export default function SessionsPage() {
  const [sessions, setSessions] = useState(SESSIONS)
  const [filter,   setFilter]   = useState('ALL')

  const revoke = (id: string) => setSessions((prev: typeof SESSIONS) =>
    prev.map((s: typeof SESSIONS[0]) => s.id === id ? {...s, status:'REVOKED'} : s)
  )

  const filtered = filter === 'ALL' ? sessions : sessions.filter((s: typeof SESSIONS[0]) => s.status === filter)

  const stats = {
    active:  sessions.filter((s: typeof SESSIONS[0])=>s.status==='ACTIVE').length,
    expired: sessions.filter((s: typeof SESSIONS[0])=>s.status==='EXPIRED').length,
    revoked: sessions.filter((s: typeof SESSIONS[0])=>s.status==='REVOKED').length,
  }

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestion des sessions</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Sessions actives · Historique · Révocation · TAXIMETER.GOV DEMO</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Sessions actives',  v:stats.active,  c:'#059669', bg:'bg-green-50 dark:bg-green-500/10',  icon:'🟢'},
            {l:'Expirées (24h)',    v:stats.expired, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10',  icon:'⏰'},
            {l:'Révoquées',        v:stats.revoked, c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',      icon:'🚫'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {[{v:'ALL',l:'Toutes'},{v:'ACTIVE',l:'Actives'},{v:'EXPIRED',l:'Expirées'},{v:'REVOKED',l:'Révoquées'}].map(f=>(
            <button key={f.v} onClick={()=>setFilter(f.v)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:filter===f.v?'#003DA5':'transparent',color:filter===f.v?'white':'#64748B',borderColor:filter===f.v?'#003DA5':'rgba(148,163,184,0.30)'}}>{f.l}</button>
          ))}
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">{filtered.length} session(s)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Session ID','Utilisateur','Organisation','Rôle','Connexion','Activité','Device','Lieu','Statut','Action'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((s: typeof SESSIONS[0])=>{
                  const sc = SES_STATUS[s.status]!
                  const rc = ROLE_COLORS[s.role]??'#64748B'
                  return (
                    <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-[9px] font-mono text-slate-500 whitespace-nowrap">{s.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.user}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 whitespace-nowrap">{s.org}</td>
                      <td className="px-4 py-3"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc}}>{s.role}</span></td>
                      <td className="px-4 py-3 text-[9px] text-slate-500 whitespace-nowrap">{fmtDt(s.loginAt)}</td>
                      <td className="px-4 py-3 text-[9px] text-slate-500 whitespace-nowrap">{fmtDt(s.lastAt)}</td>
                      <td className="px-4 py-3 text-[9px] text-slate-400">{s.device}</td>
                      <td className="px-4 py-3 text-[9px] text-slate-400 whitespace-nowrap">📍 {s.location}</td>
                      <td className="px-4 py-3"><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        {s.status==='ACTIVE' && (
                          <button onClick={()=>revoke(s.id)} className="text-[9px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer whitespace-nowrap">Révoquer</button>
                        )}
                        {s.status!=='ACTIVE' && <span className="text-[9px] text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 text-center">PILOTE · Révocation DEMO uniquement · Aucune session gouvernementale réelle</div>
      </div>
    </AppShell>
  )
}
