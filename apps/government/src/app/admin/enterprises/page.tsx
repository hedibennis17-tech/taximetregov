import React from 'react'
'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, ENTERPRISES, SECTOR_CONF, STATUS_CONF, VERIF_CONF, CONN_CONF, ENT_ALERTS } from '@/lib/enterprise-data'

const NAV = [
  {href:'/admin/enterprises/overview',l:'📊 Vue globale',  active:false},
  {href:'/admin/enterprises',          l:'📋 Registre',     active:true},
  {href:'/admin/users',                l:'👥 Utilisateurs', active:false},
  {href:'/admin/organizations',        l:'🏢 Organisations',active:false},
]

const SECTORS = ['Tous','TAXI','DELIVERY','LOGISTICS','BROKER','AUTO_PARTS','COURIER','TRANSPORT','PLATFORM']

export default function EnterpriseRegistryPage() {
  const [search, setSearch]   = useState('')
  const [sector, setSector]   = useState('Tous')
  const [status, setStatus]   = useState('Tous')

  const filtered = ENTERPRISES.filter(e=>{
    if (sector!=='Tous' && e.sector!==sector) return false
    if (status!=='Tous' && e.status!==status) return false
    if (search && !`${e.tradeName} ${e.legalName} ${e.id} ${e.neq} ${e.repr}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Registre des entreprises</h1>
        <p className="text-sm text-slate-500 mb-4">Toutes les entreprises participantes à TAXIMETER.GOV · PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Nom, Enterprise ID, NEQ, représentant…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none focus:border-qc-blue text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {SECTORS.map(s=>(
              <button key={s} onClick={()=>setSector(s)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:sector===s?'#003DA5':'transparent',color:sector===s?'white':'#64748B',borderColor:sector===s?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {s==='Tous'?`Tous (${ENTERPRISES.length})`:((SECTOR_CONF[s]?.icon??'')+(SECTOR_CONF[s]?.label??s))}
              </button>
            ))}
            {['Tous','ACTIVE','PENDING','SUSPENDED'].map(s=>(
              <button key={`st-${s}`} onClick={()=>setStatus(s)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:status===s?'#003DA5':'transparent',color:status===s?'white':'#64748B',borderColor:status===s?'#003DA5':'rgba(148,163,184,0.30)'}}>
                {s==='Tous'?'Tous statuts':(STATUS_CONF[s]?.label??s)}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} entreprise(s)</span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400">DEMO · Cliquer → fiche complète</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Entreprise','Secteur','NEQ','Chauffeurs','Activités','Rev. Q3','TPS Q3','Connexion','Conformité','Alertes','Statut'].map(h=>(
                  <th key={h} className="px-3 py-3 text-left text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(e=>{
                  const sc  = SECTOR_CONF[e.sector]!
                  const stc = STATUS_CONF[e.status]!
                  const vc  = VERIF_CONF[e.verif]!
                  const cc  = CONN_CONF[e.connection]!
                  const alerts = ENT_ALERTS.filter(a=>a.entId===e.id&&a.status!=='INFO').length
                  return (
                    <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-3">
                        <Link href={`/admin/enterprises/${e.id}`} className="block">
                          <div className="font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">{e.tradeName}</div>
                          <div className="text-[8px] text-slate-400 font-mono mt-0.5">{e.id}</div>
                          <div className="text-[8px] text-slate-400">{e.repr}</div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-[9px] font-bold" style={{color:sc.color}}><span>{sc.icon}</span>{sc.label}</span>
                      </td>
                      <td className="px-3 py-3 text-[9px] font-mono text-slate-500 whitespace-nowrap">{e.neq}</td>
                      <td className="px-3 py-3 font-bold text-blue-600 dark:text-blue-400 text-center">{e.drivers}</td>
                      <td className="px-3 py-3 text-[10px] text-slate-600 dark:text-slate-400 text-right">{e.activities.toLocaleString('fr-CA')}</td>
                      <td className="px-3 py-3 font-bold text-green-600 dark:text-green-400 whitespace-nowrap">{money(e.grossQ3)}</td>
                      <td className="px-3 py-3 font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">{money(e.tpsQ3)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${cc.dot}`}/>
                          <span className="text-[9px] font-semibold whitespace-nowrap" style={{color:cc.color}}>{cc.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${e.compliance}%`,background:e.compliance>=95?'#059669':e.compliance>=80?'#B45309':'#DC2626'}}/>
                          </div>
                          <span className="text-[9px] font-bold" style={{color:e.compliance>=95?'#059669':e.compliance>=80?'#B45309':'#DC2626'}}>{e.compliance}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {alerts>0?<span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">{alerts}</span>:<span className="text-[9px] text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="px-3 py-3"><span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap" style={{color:stc.color,background:stc.bg}}>{stc.label}</span></td>
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
