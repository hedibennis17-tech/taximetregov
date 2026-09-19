'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, DEPARTMENTS, UBER_QC_PUBLIC } from '@/lib/data'

export default function DepartmentsPage() {
  const [sel, setSel] = useState<string|null>(null)
  const selDept = DEPARTMENTS.find(d=>d.id===sel)

  const totalDrivers = DEPARTMENTS.reduce((s,d)=>s+d.drivers,0)
  const totalVehicles = DEPARTMENTS.reduce((s,d)=>s+d.vehicles,0)
  const totalGross    = DEPARTMENTS.reduce((s,d)=>s+d.gross,0)
  const totalTPS      = DEPARTMENTS.reduce((s,d)=>s+d.tps,0)
  const totalTVQ      = DEPARTMENTS.reduce((s,d)=>s+d.tvq,0)
  const totalActs     = DEPARTMENTS.reduce((s,d)=>s+d.activities,0)
  const totalAlerts   = DEPARTMENTS.reduce((s,d)=>s+d.alerts,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Départements & Services</h1>
          <p className="text-sm text-slate-500 mt-1">Uber Taxi · Rides · Green · Eats · Épicerie · Courier · Direct</p>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · Données chauffeurs/revenus par département = SYNTHÉTIQUES · Références publiques identifiées séparément
        </div>

        {/* KPI consolidés */}
        <div className="rounded-2xl p-5 shadow-sm" style={{background:'#000'}}>
          <div className="text-white font-black tracking-tighter mb-1" style={{fontSize:'1.8rem',fontFamily:'system-ui',letterSpacing:'-0.04em'}}>uber</div>
          <div className="text-[9px] font-bold mb-3" style={{color:'rgba(255,255,255,0.45)'}}>QUÉBEC · {DEPARTMENTS.filter(d=>d.status==='ACTIVE').length} départements actifs · PILOTE</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              {l:'Chauffeurs/Livreurs (SYNTH.)', v:totalDrivers.toLocaleString('fr-CA'),  note:'Données synthétiques'},
              {l:'Véhicules (SYNTH.)',            v:totalVehicles.toLocaleString('fr-CA'), note:'vs 12 351 référence pub.'},
              {l:'Activités Q3 (DEMO)',           v:totalActs.toLocaleString('fr-CA'),    note:'Synthétiques'},
              {l:'Revenus estimés (DEMO)',        v:money(totalGross),                     note:'Synthétiques'},
            ].map(s=>(
              <div key={s.l}>
                <div className="text-white font-black text-lg">{s.v}</div>
                <div className="text-[8px]" style={{color:'rgba(255,255,255,0.55)'}}>{s.l}</div>
                <div className="text-[7px]" style={{color:'rgba(255,255,255,0.3)'}}>{s.note}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.1)'}}>
            {[
              {l:'TPS collectée (DEMO)', v:money(totalTPS)},
              {l:'TVQ collectée (DEMO)', v:money(totalTVQ)},
              {l:'Alertes actives',      v:totalAlerts},
            ].map(s=>(
              <div key={s.l}>
                <div className="text-white font-black">{s.v}</div>
                <div className="text-[8px]" style={{color:'rgba(255,255,255,0.45)'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Référence publique */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mb-2">📋 Références publiques vérifiées</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {l:'Véhicules Uber QC (réf.)',     v:'12 351',    note:UBER_QC_PUBLIC.vehicules_note, badge:'PUBLIC'},
              {l:'Impact économique QC 2024',    v:'1,9 G$',   note:'Uber Canada/Public First · Impact estimé ≠ CA', badge:'PUBLIC'},
              {l:'Retombées Uber Eats QC',       v:'>270 M$',  note:'Restaurateurs partenaires 2024', badge:'PUBLIC'},
              {l:'Chauffeurs actifs QC',         v:'—',        note:UBER_QC_PUBLIC.chauffeurs_note, badge:'NON PUBLIÉ'},
              {l:'Chauffeurs pilote (DEMO)',      v:totalDrivers.toLocaleString('fr-CA'), note:'Synthétiques uniquement', badge:'SYNTH.'},
              {l:'Source véhicules',             v:'Travelnet 2024', note:UBER_QC_PUBLIC.vehicules_source, badge:'PUBLIC'},
            ].map(s=>(
              <div key={s.l} className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${s.badge==='PUBLIC'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':s.badge==='NON PUBLIÉ'?'text-slate-500 bg-slate-100 dark:bg-slate-800':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{s.badge}</span>
                </div>
                <div className="text-sm font-black text-slate-800 dark:text-white">{s.v}</div>
                <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
                <div className="text-[7px] text-slate-400 italic mt-0.5 leading-tight">{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grille départements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEPARTMENTS.map(d=>(
            <div key={d.id}
              onClick={()=>setSel(sel===d.id?null:d.id)}
              className="bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
              style={{borderColor:sel===d.id?d.color:'rgba(226,232,240,0.8)',borderWidth:sel===d.id?2:1,opacity:d.status==='PLANNED'?0.6:1}}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{d.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${d.status==='ACTIVE'?'text-white':'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10'}`} style={d.status==='ACTIVE'?{background:d.color}:{}}>{d.status}</span>
                    </div>
                    <div className="text-[8px] text-slate-400 leading-tight">{d.desc}</div>
                  </div>
                </div>
                {d.alerts>0&&<span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full shrink-0">⚠️ {d.alerts}</span>}
              </div>

              {d.status==='ACTIVE'&&(
                <>
                  {/* Métriques */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      {l:'Chauffeurs*',  v:d.drivers.toLocaleString('fr-CA'),      c:'text-slate-700 dark:text-slate-300'},
                      {l:'Activités',    v:(d.activities/1000).toFixed(1)+'k',     c:'text-slate-700 dark:text-slate-300'},
                      {l:'Revenus',      v:'$'+(d.gross/1_000_000).toFixed(1)+'M', c:'text-green-600 dark:text-green-400'},
                      {l:'Exceptions',   v:d.exceptions,                           c:d.exceptions>0?'text-red-500':'text-slate-400'},
                    ].map(s=>(
                      <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
                        <div className={`text-[10px] font-black ${s.c}`}>{s.v}</div>
                        <div className="text-[7px] text-slate-400">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* TPS/TVQ */}
                  <div className="flex gap-2 text-[9px]">
                    <span className="text-purple-600 dark:text-purple-400">TPS: {money2(d.tps)}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">TVQ: {money2(d.tvq)}</span>
                    <span className="text-blue-600 dark:text-blue-400 ml-auto">{money2(d.tips)} tips</span>
                  </div>
                </>
              )}
              {d.status==='PLANNED'&&(
                <div className="text-[9px] text-purple-600 dark:text-purple-400 italic">🔮 Déploiement futur — données à venir</div>
              )}
            </div>
          ))}
        </div>

        {/* Détail département sélectionné */}
        {selDept&&selDept.status==='ACTIVE'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:`3px solid ${selDept.color}`}}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selDept.emoji}</span>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">{selDept.name}</div>
                <div className="text-[9px] text-amber-600 dark:text-amber-400 italic">⚠️ DONNÉES SYNTHÉTIQUES — PILOTE</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                {l:'Chauffeurs/Livreurs (SYNTH.)',v:selDept.drivers.toLocaleString('fr-CA'),       c:'text-slate-800 dark:text-slate-200'},
                {l:'Véhicules (SYNTH.)',           v:selDept.vehicles.toLocaleString('fr-CA'),      c:'text-slate-800 dark:text-slate-200'},
                {l:'Activités (DEMO)',             v:selDept.activities.toLocaleString('fr-CA'),    c:'text-blue-600 dark:text-blue-400'},
                {l:'Transactions (DEMO)',          v:selDept.transactions.toLocaleString('fr-CA'),  c:'text-blue-600 dark:text-blue-400'},
                {l:'Revenus bruts (DEMO)',         v:money(selDept.gross),                          c:'text-green-600 dark:text-green-400'},
                {l:'Pourboires (DEMO)',            v:money(selDept.tips),                           c:'text-blue-600 dark:text-blue-400'},
                {l:'TPS collectée (DEMO)',         v:money(selDept.tps),                            c:'text-purple-600 dark:text-purple-400'},
                {l:'TVQ collectée (DEMO)',         v:money(selDept.tvq),                            c:'text-indigo-600 dark:text-indigo-400'},
              ].map(r=>(
                <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
                  <div className={`text-sm font-black ${r.c}`}>{r.v}</div>
                  <div className="text-[8px] text-slate-400 mt-0.5">{r.l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex gap-2"><span className="text-slate-400">Note publique:</span><span className="text-slate-700 dark:text-slate-300 italic">{selDept.publicNote}</span></div>
              <div className="flex gap-2"><span className="text-slate-400">Note fiscale:</span><span className="text-slate-700 dark:text-slate-300 italic">{selDept.fiscalNote}</span></div>
              {selDept.lastSync&&<div className="flex gap-2"><span className="text-slate-400">Dernière sync:</span><span className="font-mono text-slate-600 dark:text-slate-400">{fmtDt(selDept.lastSync)}</span></div>}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link href="/drivers" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">👤 Chauffeurs</Link>
              <Link href="/activities" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">📍 Activités</Link>
              <Link href="/fiscal" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🧾 Fiscal</Link>
              <Link href="/compliance" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">⚖️ Conformité</Link>
            </div>
          </div>
        )}

        <div className="text-[8px] text-slate-400 leading-relaxed">
          * Nombre de chauffeurs actifs par département au Québec: non publié officiellement par Uber. Les chiffres affichés sont des données synthétiques créées pour la démonstration TAXIMETER.GOV. Ne pas extrapoler ces données comme des statistiques officielles.
        </div>
      </div>
    </AppShell>
  )
}
