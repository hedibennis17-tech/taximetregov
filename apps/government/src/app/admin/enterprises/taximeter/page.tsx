'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money2, fmtDt, TAXIMETERS, TRIPS, RECON_STATUS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🚕</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Taximeter Center</h1></div>
        <p className="text-sm text-slate-500 mb-4">Entreprise → Taximètre → Chauffeur → Course → Transaction → Taxes</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/taximeter"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Chaîne taximètre */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chaîne taximètre numérique</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['🏢 ENTREPRISE','→','🚕 TAXIMÈTRE','→','👤 CHAUFFEUR','→','🚗 COURSE','→','💳 TRANSACTION','→','💰 REVENUE LEDGER','→','🧾 TAXES','→','🏛️ GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}>{s}</span>
            ))}
          </div>
        </div>

        {/* Taximètres */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Taximètres DEMO ({TAXIMETERS.length})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Taximètre ID','Entreprise','Chauffeur','Plaque','Véhicule','Courses','Firmware','Certification','Statut'].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TAXIMETERS.map(t=>{
                  const ent = ENTERPRISES.find(e=>e.id===t.entId)
                  return (
                    <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2.5 font-mono text-[9px] text-blue-600 dark:text-blue-400">{t.id}</td>
                      <td className="px-3 py-2.5 text-[10px] font-bold text-slate-800 dark:text-slate-200">{ent?.tradeName??t.entId}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-500">{t.driverId}</td>
                      <td className="px-3 py-2.5 font-mono text-[9px] text-slate-600 dark:text-slate-300">{t.plate}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-500">{t.year} {t.make} {t.model}</td>
                      <td className="px-3 py-2.5 font-bold text-blue-600 dark:text-blue-400 text-center">{t.totalTrips.toLocaleString('fr-CA')}</td>
                      <td className="px-3 py-2.5 font-mono text-[8px] text-slate-400">{t.firmware}</td>
                      <td className="px-3 py-2.5 font-mono text-[8px] text-green-600 dark:text-green-400">{t.cert}</td>
                      <td className="px-3 py-2.5"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${t.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{t.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Courses récentes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Courses récentes — DEMO</div>
          {TRIPS.map(trip=>(
            <div key={trip.id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono">🚕 {trip.id}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${trip.status==='TRANSMITTED'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{trip.status}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{trip.txmId} · {trip.driverId} · {fmtDt(trip.at)}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{trip.origin} → {trip.dest} · {trip.dist}km · {trip.dur}min · Attente: {trip.wait}min</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 font-mono">TPS: {money2(trip.tps)} · TVQ: {money2(trip.tvq)} · {trip.payment}{trip.txId?` · TX: ${trip.txId}`:' · TX: PENDING'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-black text-green-600 dark:text-green-400">{money2(trip.fare)}</div>
                  {trip.tip>0&&<div className="text-[9px] text-slate-400">+ {money2(trip.tip)} tip</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
