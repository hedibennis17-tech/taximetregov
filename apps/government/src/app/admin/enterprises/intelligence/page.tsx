'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, fmtDt, INTELLIGENCE_FINDINGS, INT_SEV } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'
import Link from 'next/link'

const TYPE_ICONS: Record<string,string> = {VARIANCE:'📊',MISSING:'❓',WEBHOOK:'🔌',FISCAL:'🧾',SYNC:'🔄',POSITIVE:'✅'}

export default function Page() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🧠</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Intelligence</h1></div>
        <p className="text-sm text-slate-500 mb-4">Analyse anomalies · Variations · Données manquantes · Incohérences · Outil d'analyse uniquement</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/intelligence"/>
        <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 px-3 py-2 rounded-xl">
          🤖 L'intelligence analyse et priorise — elle NE DÉCIDE PAS automatiquement d'une sanction ou d'une irrégularité réglementaire · {PILOT}
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Critique',  v:INTELLIGENCE_FINDINGS.filter(f=>f.severity==='CRITICAL').length, c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'Élevé',     v:INTELLIGENCE_FINDINGS.filter(f=>f.severity==='HIGH').length,     c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Moyen',     v:INTELLIGENCE_FINDINGS.filter(f=>f.severity==='MEDIUM').length,   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Positif',   v:INTELLIGENCE_FINDINGS.filter(f=>f.severity==='INFO').length,     c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Findings */}
        <div className="space-y-3">
          {INTELLIGENCE_FINDINGS.map(f=>{
            const ent = ENTERPRISES.find(e=>e.id===f.entId)
            const sc = INT_SEV[f.severity]!
            const icon = TYPE_ICONS[f.type]??'📋'
            return (
              <div key={f.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{f.title}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{f.severity}</span>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{f.type}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mb-1">{ent?.tradeName??f.entId} · {fmtDt(f.at)}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{f.desc}</div>
                    <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/15 rounded-lg px-3 py-1.5">
                      <div className="text-[8px] font-bold text-blue-700 dark:text-blue-400 mb-0.5">Action suggérée (non décision)</div>
                      <div className="text-[9px] text-slate-600 dark:text-slate-300">{f.action}</div>
                    </div>
                  </div>
                </div>
                {f.severity!=='INFO'&&(
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <Link href={`/admin/enterprises/${f.entId}`} className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100">→ Fiche entreprise</Link>
                    <Link href="/admin/enterprises/reconciliation" className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🔄 Réconciliation</Link>
                    <Link href="/admin/enterprises/audit" className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">🛡️ Audit</Link>
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
