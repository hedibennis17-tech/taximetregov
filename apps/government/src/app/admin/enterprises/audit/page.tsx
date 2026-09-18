'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, fmtDt, AUDIT_P2 } from '@/lib/enterprise-phase2-data'
import { ENT_AUDIT } from '@/lib/enterprise-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

const ALL_AUDIT = [...AUDIT_P2,...ENT_AUDIT.map(a=>({...a,source:'PHASE1'}))].sort((a,b)=>b.at.localeCompare(a.at))

export default function Page() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🛡️</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Audit Trail</h1></div>
        <p className="text-sm text-slate-500 mb-4">WHO · WHAT · WHEN · RESOURCE · SOURCE · OLD VALUE → NEW VALUE · REASON</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/audit"/>
        <div className="text-[9px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
          {PILOT} · Aucune modification critique n'efface silencieusement l'historique · {ALL_AUDIT.length} événements
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Qui','Quoi','Quand','Entreprise','Ressource','Source','Ancienne valeur','Nouvelle valeur','Raison'].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ALL_AUDIT.map(a=>{
                  const ent = ENTERPRISES.find(e=>e.id===a.entId)
                  return (
                    <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{(a as {who?:string}).who??'SYSTEM'}</td>
                      <td className="px-3 py-2.5 text-[9px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{a.what}</td>
                      <td className="px-3 py-2.5 text-[8px] font-mono text-slate-400 whitespace-nowrap">{fmtDt(a.at)}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-500 whitespace-nowrap">{ent?.tradeName??a.entId}</td>
                      <td className="px-3 py-2.5 text-[8px] font-mono text-slate-400 whitespace-nowrap">{a.resource}</td>
                      <td className="px-3 py-2.5"><span className="text-[7px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded">{(a as {source?:string}).source??'SYSTEM'}</span></td>
                      <td className="px-3 py-2.5 text-[9px] text-red-400">{(a as {old?:string|null}).old??'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-green-600 dark:text-green-400">{(a as {newVal?:string|null}).newVal??'—'}</td>
                      <td className="px-3 py-2.5 text-[9px] text-slate-400 italic max-w-[140px] truncate">{(a as {why?:string}).why??'—'}</td>
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
