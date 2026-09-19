'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_VEHICLES, ENT_DRIVERS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="grid grid-cols-3 gap-2">
          {[{l:'Actifs',v:ENT_VEHICLES.filter(v=>v.status==='ACTIVE').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Maintenance',v:ENT_VEHICLES.filter(v=>v.status==='MAINTENANCE').length,c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Disponibles',v:ENT_VEHICLES.filter(v=>v.status==='AVAILABLE').length,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
          ].map(s=>(<div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}><div className="text-xl font-black" style={{color:s.c}}>{s.v}</div><div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div></div>))}
        </div>
        <div className="space-y-2">
          {ENT_VEHICLES.map(v=>{
            const drv=ENT_DRIVERS.find(d=>d.id===v.driver)
            const insOk=new Date(v.insurance)>new Date()
            const insWarn=new Date(v.insurance)<new Date('2026-12-31')&&insOk
            return (
              <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">🚗</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{v.year} {v.make} {v.model}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${v.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':v.status==='MAINTENANCE'?'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>{v.status}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">{v.id} · {v.plate} · VIN: {v.vin.slice(-8)}</div>
                    <div className="text-[9px] text-slate-400">Chauffeur: {drv?.name??'Non assigné'}</div>
                    <div className="flex gap-3 text-[8px] mt-1">
                      <span className={insWarn?'text-amber-500 font-bold':'text-slate-400'}>🛡️ Ass: {fmtDate(v.insurance)}</span>
                      <span className="text-slate-400">🔧 Inspect: {fmtDate(v.inspection)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
