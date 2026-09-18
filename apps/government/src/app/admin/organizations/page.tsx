'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PILOT, fmtDt, ORGANIZATIONS, ORG_TYPE_CONF, ORG_STATUS } from '@/lib/admin-data'

const NAV = [
  {href:'/admin/users',         l:'👥 Utilisateurs', active:false},
  {href:'/admin/organizations', l:'🏢 Organisations', active:true},
  {href:'/system/health',       l:'❤️ Santé système', active:false},
  {href:'/system/settings',     l:'⚙️ Paramètres',    active:false},
]

const WORKFLOW = ['ORGANISATION','→','IDENTIFICATION','→','AUTHENTIFICATION','→','AUTORISATION','→','CONNEXION','→','ACTIVITÉS','→','TRANSACTIONS','→','FISCALITÉ','→','AUDIT']

export default function AdminOrgsPage() {
  const [expanded, setExpanded] = useState<string|null>(null)
  const [typeF,    setTypeF]    = useState('ALL')

  const filtered = typeF==='ALL' ? ORGANIZATIONS : ORGANIZATIONS.filter(o=>o.type===typeF)
  const stats = {
    total:  ORGANIZATIONS.length,
    active: ORGANIZATIONS.filter(o=>o.status==='ACTIVE').length,
    pending:ORGANIZATIONS.filter(o=>o.status==='PENDING').length,
    conns:  ORGANIZATIONS.reduce((s,o)=>s+o.connections,0),
  }

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Registre des organisations</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Gouvernement · Taxi · Livraison · Plateformes · Entreprises · PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Aucune organisation réelle connectée</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total organisations',  v:stats.total,   c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'🏢'},
            {l:'Actives',              v:stats.active,  c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'✅'},
            {l:'En attente',           v:stats.pending, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⏳'},
            {l:'Connexions actives',   v:stats.conns,   c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/10',icon:'🔌'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Cycle d'intégration organisation</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Filtres type */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={()=>setTypeF('ALL')} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:typeF==='ALL'?'#003DA5':'transparent',color:typeF==='ALL'?'white':'#64748B',borderColor:typeF==='ALL'?'#003DA5':'rgba(148,163,184,0.30)'}}>Tous ({ORGANIZATIONS.length})</button>
          {Object.entries(ORG_TYPE_CONF).map(([k,v])=>(
            <button key={k} onClick={()=>setTypeF(k)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:typeF===k?'#003DA5':'transparent',color:typeF===k?'white':'#64748B',borderColor:typeF===k?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Liste accordéon */}
        <div className="space-y-2">
          {filtered.map(o=>{
            const tc = ORG_TYPE_CONF[o.type]!
            const sc = ORG_STATUS[o.status]!
            const isExp = expanded===o.id
            return (
              <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={()=>setExpanded(isExp?null:o.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-50 dark:bg-slate-800">{tc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{o.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      <span className="text-[8px] font-bold" style={{color:tc.color}}>{tc.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">{o.id} · {o.jurisdiction}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex gap-3 text-[9px] text-slate-500">
                        <span>👤 {o.users}</span>
                        <span>🚗 {o.vehicles}</span>
                        <span>📍 {o.activities.toLocaleString('fr-CA')}</span>
                        <span>🔌 {o.connections}</span>
                      </div>
                      {o.lastSync && <div className="text-[8px] text-slate-400 mt-0.5">Sync: {fmtDt(o.lastSync)}</div>}
                    </div>
                    {isExp ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-3">
                    <div className="text-[9px] text-slate-500 italic">{o.note}</div>
                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {l:'Utilisateurs', v:o.users,                              c:'#003DA5'},
                        {l:'Véhicules',    v:o.vehicles,                           c:'#059669'},
                        {l:'Activités',    v:o.activities.toLocaleString('fr-CA'), c:'#7C3AED'},
                        {l:'Connexions',   v:o.connections,                        c:'#B45309'},
                      ].map(s=>(
                        <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                          <div className="text-sm font-black" style={{color:s.c}}>{s.v}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Connexions DEMO */}
                    {o.connections>0 && (
                      <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/15 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-blue-700 dark:text-blue-400 mb-1">🔌 Connexions API (PILOTE SIMULATION)</div>
                        <div className="text-[8px] text-slate-500">CONN-DEMO-{o.id.slice(-3)} · OAuth DEMO · Dernière sync: {o.lastSync?fmtDt(o.lastSync):'—'} · SIMULATION — Aucune API réelle</div>
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Link href="/audit" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
                      <button className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 cursor-pointer hover:bg-blue-100">📊 Rapport</button>
                    </div>
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
