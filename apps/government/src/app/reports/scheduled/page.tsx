'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, Clock, XCircle, Play, Pause } from 'lucide-react'
import { PILOT, fmtDate, NAV_REPORTS, SCHEDULED, CAT_CONF } from '@/lib/reports-data'
const nav = NAV_REPORTS.map(n=>({...n,active:n.href==='/reports/scheduled'}))

export default function ScheduledPage() {
  const [items, setItems] = useState(SCHEDULED)
  const toggle = (id:string) => setItems(prev=>prev.map(s=>s.id===id?{...s,active:!s.active}:s))

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Rapports programmés</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Automatisation · Planification · Envoi automatique</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {nav.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Rapports actifs',   v:items.filter(s=>s.active).length,  c:'#059669', bg:'bg-green-50 dark:bg-green-500/10',  icon:'✅'},
            {l:'En pause',         v:items.filter(s=>!s.active).length,  c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⏸️'},
            {l:'Destinataires',    v:items.reduce((s,r)=>s+r.recipients,0), c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10', icon:'👥'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 text-center border border-white dark:border-transparent`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-800 dark:text-white">Planifications actives</div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:shadow-sm" style={{background:'#003DA5',color:'white',borderColor:'#003DA5'}}>
              + Nouveau
            </button>
          </div>
          {items.map(s=>{
            const cc = CAT_CONF[s.cat]??CAT_CONF['FISCAL']!
            return (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{background:s.active?'#EEF3FB':'#F8FAFC'}}>
                  {cc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold ${s.active?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                      {s.active?'ACTIF':'EN PAUSE'}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px] text-slate-400 flex-wrap">
                    <span>🔄 {s.freq}</span>
                    <span>📄 {s.format}</span>
                    <span>👥 {s.recipients} destinataire(s)</span>
                    <span>⏱️ Prochain: {fmtDate(s.next)}</span>
                  </div>
                  <div className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5">Dernier: {fmtDate(s.last)}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={()=>toggle(s.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer hover:shadow-sm"
                    style={{background:s.active?'#FFF7ED':'#F0FDF4',color:s.active?'#92400E':'#166534',borderColor:s.active?'#FED7AA':'#A7F3D0'}}>
                    {s.active?<><Pause size={10}/> Pause</>:<><Play size={10}/> Activer</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">📋 Note gouvernementale</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
            En production, les rapports programmés seraient envoyés aux destinataires autorisés via les canaux sécurisés gouvernementaux. Le pilote TAXIMETER.GOV démontre la capacité de planification sans transmission réelle.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
