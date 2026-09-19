'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PILOT, money, fmtDt, ENT_DRIVERS, ENT_ACTIVITIES, ENT_TRANSACTIONS, DRIVER_DETAIL, UBER_DRIVERS_SAMPLE, DRIVERS_SUMMARY, DEPARTMENTS, SYNC_STATUS } from '@/lib/data'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:    {label:'Actif',      color:'#059669',bg:'rgba(5,150,105,0.12)'},
  SUSPENDED: {label:'Suspendu',  color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:   {label:'En attente',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
}
const DOC_BADGE: Record<string,{label:string;color:string}> = {
  OK:      {label:'Docs OK',      color:'#059669'},
  EXPIRING:{label:'Doc expirant', color:'#B45309'},
  EXPIRED: {label:'Doc expiré',   color:'#DC2626'},
}

export default function DriversPage() {
  const [view,   setView]   = useState<'pilote'|'sample'>('pilote')
  const [deptF,  setDeptF]  = useState('ALL')
  const [statusF,setStatusF]= useState('ALL')
  const [search, setSearch] = useState('')

  // Vue pilote: 6 chauffeurs détaillés
  const filteredPilote = ENT_DRIVERS.filter(d=>{
    if (statusF==='ACTIVE'    && d.status!=='ACTIVE')    return false
    if (statusF==='SUSPENDED' && d.status!=='SUSPENDED') return false
    if (statusF==='DOCS'      && d.docs==='OK')          return false
    if (search && !`${d.name} ${d.id} ${d.plate??''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Vue sample: ~45 chauffeurs synthétiques
  const filteredSample = UBER_DRIVERS_SAMPLE.filter(d=>{
    if (deptF!=='ALL'       && d.dept!==deptF)          return false
    if (statusF==='ACTIVE'  && d.status!=='ACTIVE')      return false
    if (statusF==='SUSPENDED' && d.status!=='SUSPENDED') return false
    if (statusF==='DOCS'    && d.docs==='OK')            return false
    if (search && !`${d.name} ${d.id} ${d.dept}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeDepts = DEPARTMENTS.filter(d=>d.status==='ACTIVE')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Chauffeurs & Livreurs</h1>
            <p className="text-sm text-slate-500 mt-1">Gestion de la force de travail · Conformité · Synchronisation</p>
          </div>
          <button className="px-3 py-2 rounded-xl text-[10px] font-bold bg-black text-white cursor-pointer hover:bg-slate-800 shrink-0">+ Ajouter</button>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · DONNÉES SYNTHÉTIQUES · {DRIVERS_SUMMARY.note}
        </div>

        {/* KPI consolidés Uber QC (synthétiques) */}
        <div className="rounded-2xl p-4 shadow-sm" style={{background:'#000'}}>
          <div className="text-[8px] font-bold mb-2" style={{color:'rgba(255,255,255,0.45)'}}>
            FORCE DE TRAVAIL UBER QUÉBEC — DONNÉES SYNTHÉTIQUES DEMO
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              {l:'Total estimé (SYNTH.)',    v:DRIVERS_SUMMARY.totalSynthetic.toLocaleString('fr-CA'), note:'Estimation synthétique tous depts'},
              {l:'Profils complets (DEMO)',  v:DRIVERS_SUMMARY.totalPilot,   note:'Avec données détaillées'},
              {l:'Échantillon DEMO',        v:DRIVERS_SUMMARY.totalSample,  note:'Chauffeurs représentatifs'},
              {l:'Véhicules réf. publique', v:'12 351',                     note:'Source: Travelnet 2024'},
            ].map(s=>(
              <div key={s.l}>
                <div className="text-white font-black text-lg">{s.v}</div>
                <div className="text-[8px]" style={{color:'rgba(255,255,255,0.55)'}}>{s.l}</div>
                <div className="text-[7px]" style={{color:'rgba(255,255,255,0.3)'}}>{s.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 text-[7px]" style={{borderTop:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)'}}>
            ⚠️ {DRIVERS_SUMMARY.publicRef} — Nombre de chauffeurs actifs par département: non publié officiellement
          </div>
        </div>

        {/* Par département (synthétique) */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {activeDepts.map(d=>(
            <div key={d.id} className="rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700" style={{background:deptF===d.slug?d.color:undefined}}>
              <button onClick={()=>setDeptF(deptF===d.slug?'ALL':d.slug)} className="cursor-pointer w-full">
                <div className="text-lg mb-0.5">{d.emoji}</div>
                <div className="text-[10px] font-black" style={{color:deptF===d.slug?'white':d.color}}>{d.drivers.toLocaleString('fr-CA')}</div>
                <div className="text-[7px]" style={{color:deptF===d.slug?'rgba(255,255,255,0.7)':'#94a3b8'}}>{d.name.split(' ').slice(-1)[0]}</div>
                <div className="text-[6px] italic" style={{color:deptF===d.slug?'rgba(255,255,255,0.5)':'#cbd5e1'}}>SYNTH.</div>
              </button>
            </div>
          ))}
        </div>

        {/* Bascule vue */}
        <div className="flex gap-2 items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            <button onClick={()=>setView('pilote')} className="px-3 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all" style={{background:view==='pilote'?'#000':'transparent',color:view==='pilote'?'white':'#64748B'}}>
              📋 Profils complets ({ENT_DRIVERS.length})
            </button>
            <button onClick={()=>setView('sample')} className="px-3 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all" style={{background:view==='sample'?'#000':'transparent',color:view==='sample'?'white':'#64748B'}}>
              👥 Échantillon DEMO ({UBER_DRIVERS_SAMPLE.length})
            </button>
          </div>
          <span className="text-[8px] text-slate-400 italic">{view==='pilote'?'Profils avec données détaillées et dossier complet':'Aperçu représentatif — données synthétiques'}</span>
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)}
              placeholder="Nom, Driver ID, département…"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs pl-9 outline-none text-slate-800 dark:text-white"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{v:'ALL',l:'Tous'},{v:'ACTIVE',l:'Actifs'},{v:'SUSPENDED',l:'Suspendus'},{v:'DOCS',l:'Docs ⚠️'}].map(f=>(
              <button key={f.v} onClick={()=>setStatusF(f.v)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:statusF===f.v?'#000':'transparent',color:statusF===f.v?'white':'#64748B',borderColor:statusF===f.v?'#000':'rgba(148,163,184,0.30)'}}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── VUE PROFILS COMPLETS ── */}
        {view==='pilote'&&(
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-2 rounded-xl">
              📋 Profils complets avec dossier détaillé, historique, activités, revenus et documents
            </div>
            {filteredPilote.map(d=>{
              const sc  = STATUS_CONF[d.status]!
              const dc  = DOC_BADGE[d.docs]!
              const det = DRIVER_DETAIL[d.id]
              const ss  = SYNC_STATUS[det?.syncStatus??'DEMO'] ?? {label:'DEMO',color:'#7C3AED',dot:'bg-purple-400'}
              const drvActs = ENT_ACTIVITIES.filter(a=>a.driverId===d.id).length
              const drvRev  = ENT_TRANSACTIONS.filter(t=>t.driverId===d.id).reduce((s,t)=>s+t.gross,0)
              return (
                <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-sm font-black text-white shrink-0">{d.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{d.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        {d.docs!=='OK'&&<span className="text-[8px] font-bold" style={{color:dc.color}}>⚠️ {dc.label}</span>}
                        <span className="text-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{d.relation}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mb-1">{d.id}{d.plate?` · ${d.plate}`:''}{d.vehicle?` · ${d.vehicle}`:''}</div>
                      <div className="flex gap-3 text-[9px] text-slate-400 flex-wrap">
                        <span>📍 {drvActs} activités</span>
                        {drvRev>0&&<span>💰 {money(drvRev)}</span>}
                        <div className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}/><span style={{color:ss.color}}>{ss.label}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Link href={`/drivers/${d.id}`} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 whitespace-nowrap">→ Profil</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── VUE ÉCHANTILLON ── */}
        {view==='sample'&&(
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
              ⚠️ DONNÉES SYNTHÉTIQUES · {filteredSample.length} chauffeurs affichés sur ~{DRIVERS_SUMMARY.totalSynthetic.toLocaleString('fr-CA')} estimés (synthétiques) · Profil complet disponible uniquement pour les 6 chauffeurs pilote
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{filteredSample.length} chauffeur(s) · Échantillon représentatif</span>
                <span className="text-[8px] text-amber-600 dark:text-amber-400">SYNTHÉTIQUE</span>
              </div>
              {filteredSample.map(d=>{
                const sc = STATUS_CONF[d.status] ?? STATUS_CONF['ACTIVE']!
                const dc = DOC_BADGE[d.docs] ?? DOC_BADGE['OK']!
                const dept = DEPARTMENTS.find(dep=>dep.slug===d.dept)
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0" style={{background:dept?.color??'#000'}}>
                      {dept?.emoji??'👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        {d.docs!=='OK'&&<span className="text-[8px] font-bold" style={{color:dc.color}}>⚠️ {dc.label}</span>}
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{color:dept?.color,background:`${dept?.color}15`}}>{dept?.emoji} {dept?.name}</span>
                      </div>
                      <div className="text-[8px] font-mono text-slate-400">{d.id} · {d.plate} · {d.services.join(', ')}</div>
                    </div>
                    <div className="text-right shrink-0 text-[9px]">
                      <div className="font-bold text-green-600 dark:text-green-400">{money(d.revQ3)}</div>
                      <div className="text-slate-400">{d.actQ3} activités</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-[8px] text-slate-400 italic text-center">
              Cliquer sur → Profil uniquement disponible pour les 6 chauffeurs pilote · Passer à "Profils complets"
            </div>
          </div>
        )}

        {/* Workflow ajout */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Workflow ajout chauffeur</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['IDENTIFICATION','→','INVITATION','→','LIAISON DRIVER GOV','→','VÉRIFICATION','→','DOCUMENTS','→','VÉHICULE','→','DÉPARTEMENT','→','ACTIVATION','→','SYNC TAXIMETER.GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#000',color:'white'}:{}}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
