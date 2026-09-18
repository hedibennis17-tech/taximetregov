'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, fmtDt, USERS, USER_STATUS, ROLE_CONF } from '@/lib/admin-data'

const NAV = [
  {href:'/admin/users',         l:'👥 Utilisateurs', active:true},
  {href:'/admin/organizations', l:'🏢 Organisations', active:false},
  {href:'/system/health',       l:'❤️ Santé système', active:false},
  {href:'/system/settings',     l:'⚙️ Paramètres',    active:false},
]

export default function AdminUsersPage() {
  const [search, setSearch]   = useState('')
  const [roleF,  setRoleF]    = useState('ALL')
  const [statusF,setStatusF]  = useState('ALL')

  const filtered = USERS.filter(u => {
    if (statusF !== 'ALL' && u.status !== statusF) return false
    if (roleF   !== 'ALL' && u.role   !== roleF)   return false
    if (search && !`${u.name} ${u.id} ${u.email} ${u.org}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total:    USERS.length,
    active:   USERS.filter(u=>u.status==='ACTIVE').length,
    pending:  USERS.filter(u=>u.status==='PENDING').length,
    inactive: USERS.filter(u=>['INACTIVE','SUSPENDED','REVOKED'].includes(u.status)).length,
  }

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Utilisateurs gouvernementaux</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Comptes autorisés · Rôles · Permissions · TAXIMETER.GOV PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total utilisateurs', v:stats.total,   c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'👥'},
            {l:'Actifs',             v:stats.active,  c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'✅'},
            {l:'En attente',         v:stats.pending, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⏳'},
            {l:'Inactifs/Suspendus', v:stats.inactive,c:'#64748B', bg:'bg-slate-100 dark:bg-slate-800',   icon:'🔒'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Nom, ID, email, organisation…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white pl-9 outline-none focus:border-qc-blue"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL','ACTIVE','PENDING','INACTIVE','SUSPENDED'].map(s=>(
              <button key={s} onClick={()=>setStatusF(s)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:statusF===s?'#003DA5':'transparent',color:statusF===s?'white':'#64748B',borderColor:statusF===s?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {s==='ALL'?`Tous (${USERS.length})`:USER_STATUS[s]?.label??s}
              </button>
            ))}
            <select value={roleF} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setRoleF(e.target.value)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
              <option value="ALL">Tous rôles</option>
              {Object.keys(ROLE_CONF).map(r=><option key={r} value={r}>{ROLE_CONF[r]!.label}</option>)}
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} utilisateur(s)</span>
            <span className="text-[9px] text-slate-400">DEMO · Aucun compte gouvernemental réel</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['ID','Nom','Organisation','Rôle','Statut','Dernière connexion','Permissions','Actions'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(u=>{
                  const sc = USER_STATUS[u.status]!
                  const rc = ROLE_CONF[u.role]!
                  return (
                    <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-[9px] font-mono text-slate-400 whitespace-nowrap">{u.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-qc-blue flex items-center justify-center text-[10px] font-black text-white shrink-0">{u.name[0]}</div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{u.name}</div>
                            <div className="text-[8px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 whitespace-nowrap">{u.org}</td>
                      <td className="px-4 py-3"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span></td>
                      <td className="px-4 py-3"><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></td>
                      <td className="px-4 py-3 text-[9px] font-mono text-slate-400 whitespace-nowrap">{u.lastLogin?fmtDt(u.lastLogin):'Jamais'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {u.perms.slice(0,2).map(p=><span key={p} className="text-[7px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded">{p}</span>)}
                          {u.perms.length>2&&<span className="text-[7px] text-slate-400">+{u.perms.length-2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap">Voir</button>
                          <button className="text-[9px] font-bold text-slate-400 hover:underline cursor-pointer whitespace-nowrap">Modifier</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
