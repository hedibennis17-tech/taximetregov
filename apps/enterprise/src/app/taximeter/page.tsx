'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, money, money2, fmtDt, fmtDate } from '@/lib/data'
import { ENT_DRIVERS } from '@/lib/data'

export default function Page() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chaîne taximètre</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['🏢 ENTREPRISE','→','🚕 TAXIMÈTRE','→','👤 CHAUFFEUR','→','🚗 COURSE','→','💳 TRANSACTION','→','💰 LEDGER','→','🧾 TAXES','→','🏛️ GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}>{s}</span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {['TXM-001','TXM-002','TXM-003','TXM-004','TXM-005','TXM-006'].map((id,i)=>{
            const drivers=['DRV-QC-0001','DRV-QC-0002','DRV-QC-0003','DRV-QC-0004',null,'DRV-QC-0006']
            const drv=ENT_DRIVERS.find(d=>d.id===drivers[i])
            const status=['ACTIVE','ACTIVE','ACTIVE','MAINTENANCE','AVAILABLE','ACTIVE'][i]
            return (
              <div key={id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex items-center gap-3">
                <span className="text-2xl shrink-0">🚕</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{id}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':status==='MAINTENANCE'?'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>{status}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">Chauffeur: {drv?.name??'Non assigné'} · Firmware: v2.3.1</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-blue-600 dark:text-blue-400">{[4820,3640,2640,0,0,1240][i].toLocaleString('fr-CA')}</div>
                  <div className="text-[8px] text-slate-400">courses</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
