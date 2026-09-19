'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, DEPARTMENTS, UBER_QC_PUBLIC, OPS_ACTIVITIES } from '@/lib/data'

export default function ServicesPage() {
  const [sel, setSel] = useState('ALL')

  const active = DEPARTMENTS.filter(d=>d.status==='ACTIVE')
  const selDept = sel!=='ALL' ? DEPARTMENTS.find(d=>d.slug===sel) : null

  const totalGross   = active.reduce((s,d)=>s+d.gross,0)
  const totalTPS     = active.reduce((s,d)=>s+d.tps,0)
  const totalTVQ     = active.reduce((s,d)=>s+d.tvq,0)
  const totalTips    = active.reduce((s,d)=>s+d.tips,0)
  const totalDrivers = active.reduce((s,d)=>s+d.drivers,0)
  const totalVeh     = active.reduce((s,d)=>s+d.vehicles,0)
  const totalActs    = active.reduce((s,d)=>s+d.activities,0)
  const totalTxs     = active.reduce((s,d)=>s+d.transactions,0)

  const d = selDept ?? null

  const WORKFLOW = ['ENTREPRISE','→','SERVICE/DEPT','→','CHAUFFEURS','→','VÉHICULES','→','ACTIVITÉS','→','TRANSACTIONS','→','REVENUS','→','TPS/TVQ','→','DÉCLARATIONS','→','TAXIMETER.GOV']

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Services & Départements</h1>
          <p className="text-sm text-slate-500 mt-1">Vue consolidée · Filtrage par service · Chaîne activité→déclaration</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · DONNÉES SYNTHÉTIQUES · Nb chauffeurs/livreurs par département = non publié officiellement · 12 351 = véhicules réf. publique 2024
        </div>

        {/* Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#000',color:'white'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Sélecteur */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={()=>setSel('ALL')} className="text-[9px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer" style={{background:sel==='ALL'?'#000':'transparent',color:sel==='ALL'?'white':'#64748B',borderColor:sel==='ALL'?'#000':'rgba(148,163,184,0.30)'}}>
            Tous les services
          </button>
          {active.map(dept=>(
            <button key={dept.slug} onClick={()=>setSel(dept.slug)} className="text-[9px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer" style={{background:sel===dept.slug?dept.color:'transparent',color:sel===dept.slug?'white':'#64748B',borderColor:sel===dept.slug?dept.color:'rgba(148,163,184,0.30)'}}>
              {dept.emoji} {dept.name}
            </button>
          ))}
        </div>

        {/* KPI dynamiques */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {l:'Chauffeurs/Livreurs*', v:(d?d.drivers:totalDrivers).toLocaleString('fr-CA'), c:'#000000',bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'Véhicules (SYNTH.)',    v:(d?d.vehicles:totalVeh).toLocaleString('fr-CA'),   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Activités (DEMO)',      v:((d?d.activities:totalActs)/1000).toFixed(0)+'k',  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
            {l:'Transactions (DEMO)',   v:((d?d.transactions:totalTxs)/1000).toFixed(0)+'k', c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            {l:'Revenus bruts (DEMO)',  v:money(d?d.gross:totalGross),  c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'TPS collectée (DEMO)',  v:money(d?d.tps:totalTPS),      c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
            {l:'TVQ collectée (DEMO)',  v:money(d?d.tvq:totalTVQ),      c:'#4F46E5',bg:'bg-indigo-50 dark:bg-indigo-500/8'},
            {l:'Pourboires (DEMO)',     v:money(d?d.tips:totalTips),    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Grille services ou détail sélectionné */}
        {sel==='ALL'?(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {active.map(dept=>{
              const dActs = OPS_ACTIVITIES.filter(a=>a.dept===dept.slug).length
              return (
                <div key={dept.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{dept.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{dept.name}</span>
                        <span className="text-[7px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{background:dept.color}}>ACTIF</span>
                      </div>
                      <div className="text-[8px] text-slate-400 leading-tight">{dept.desc}</div>
                    </div>
                    {dept.alerts>0&&<span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full shrink-0">⚠️ {dept.alerts}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                      {l:'Chauffeurs*',    v:dept.drivers.toLocaleString('fr-CA')},
                      {l:'Activités (k)',  v:(dept.activities/1000).toFixed(1)},
                      {l:'Revenus (M$)',   v:(dept.gross/1_000_000).toFixed(1)},
                    ].map(s=>(
                      <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
                        <div className="text-[10px] font-black text-slate-800 dark:text-slate-200">{s.v}</div>
                        <div className="text-[7px] text-slate-400">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-purple-600 dark:text-purple-400">TPS: {money2(dept.tps)}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">TVQ: {money2(dept.tvq)}</span>
                    <span className="text-blue-600 dark:text-blue-400">{money2(dept.tips)} tips</span>
                  </div>
                  <div className="text-[8px] text-amber-600 dark:text-amber-400 italic mt-1.5">{dept.fiscalNote}</div>
                  {dActs>0&&<div className="text-[8px] text-slate-400 mt-1">{dActs} activités récentes dans les données pilote</div>}
                  <button onClick={()=>setSel(dept.slug)} className="mt-2 w-full py-1.5 rounded-xl text-[9px] font-bold text-white cursor-pointer hover:opacity-90" style={{background:dept.color}}>
                    → Voir {dept.name}
                  </button>
                </div>
              )
            })}
          </div>
        ):(
          /* Détail département sélectionné */
          d&&(
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:`3px solid ${d.color}`}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{d.emoji}</span>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{d.name}</div>
                    <div className="text-[9px] text-amber-600 dark:text-amber-400">⚠️ DONNÉES SYNTHÉTIQUES — PILOTE</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {l:'Chauffeurs (SYNTH.)',  v:d.drivers.toLocaleString('fr-CA'), c:'#000'},
                    {l:'Véhicules (SYNTH.)',   v:d.vehicles.toLocaleString('fr-CA'),c:'#003DA5'},
                    {l:'Activités (DEMO)',     v:d.activities.toLocaleString('fr-CA'),c:'#7C3AED'},
                    {l:'Transactions (DEMO)',  v:d.transactions.toLocaleString('fr-CA'),c:'#059669'},
                    {l:'Revenus bruts (DEMO)', v:money(d.gross),    c:'#059669'},
                    {l:'Pourboires (DEMO)',    v:money(d.tips),     c:'#003DA5'},
                    {l:'TPS (DEMO)',           v:money(d.tps),      c:'#7C3AED'},
                    {l:'TVQ (DEMO)',           v:money(d.tvq),      c:'#4F46E5'},
                  ].map(r=>(
                    <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
                      <div className="text-sm font-black" style={{color:r.c}}>{r.v}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">{r.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[9px] text-amber-700 dark:text-amber-400">
                  📋 {d.fiscalNote}
                </div>
              </div>

              {/* Activités récentes du département */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
                  Activités récentes — {d.name} (DEMO)
                </div>
                {OPS_ACTIVITIES.filter(a=>a.dept===d.slug).slice(0,5).map(a=>(
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span className="text-base">{d.emoji}</span>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.svc} · {a.origin} → {a.dest}</div>
                      <div className="text-[9px] text-slate-400">{a.driverId} · {fmtDt(a.at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-green-600 dark:text-green-400">{money2(a.fare)}</div>
                      {a.tip>0&&<div className="text-[8px] text-slate-400">+{money2(a.tip)} tip</div>}
                    </div>
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${a.status==='TERMINÉE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50'}`}>{a.status}</span>
                  </div>
                ))}
                {OPS_ACTIVITIES.filter(a=>a.dept===d.slug).length===0&&(
                  <div className="px-5 py-4 text-[10px] text-slate-400 italic">Aucune activité récente dans les données pilote pour ce département</div>
                )}
              </div>

              {/* Liens modules */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {l:'Chauffeurs',    href:'/drivers',       icon:'👤'},
                  {l:'Activités',     href:'/activities',    icon:'📍'},
                  {l:'Transactions',  href:'/transactions',  icon:'💳'},
                  {l:'Revenus',       href:'/revenue',       icon:'💰'},
                  {l:'Fiscal',        href:'/fiscal',        icon:'🧾'},
                  {l:'Conformité',    href:'/compliance',    icon:'⚖️'},
                ].map(a=>(
                  <Link key={a.l} href={a.href} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center hover:shadow-md transition-shadow">
                    <div className="text-xl mb-1">{a.icon}</div>
                    <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{a.l}</div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}

        <div className="text-[8px] text-slate-400">* {UBER_QC_PUBLIC.chauffeurs_note}</div>
      </div>
    </AppShell>
  )
}
