'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Download, Eye, CheckCircle } from 'lucide-react'
import { PILOT, money, fmtDate, NAV_REPORTS, ALL_REPORTS, STATUS_CONF } from '@/lib/reports-data'
import { MONTHLY_REVENUE, MONTHLY_TAX, TOTAL_TPS, TOTAL_TVQ, TOTAL_TAX, TOTAL_BRUT } from '@/lib/analytics-data'
const nav = NAV_REPORTS.map(n=>({...n,active:n.href==='/reports/tax'}))
const r2 = (n:number)=>Math.round(n*100)/100

const DECLARATIONS = [
  { id:'DEC-QC-2026-Q3', period:'Q3 2026', label:'Juillet · Août · Septembre', status:'DRAFT',     brut:224_850_000, tips:22_485_000, tps:12_366_750,  tvq:24_666_631,  tpsCredits:1_124_250, tvqCredits:2_239_882, tpsNet:11_242_500, tvqNet:22_426_749, solde:33_669_249, dueDate:'2026-10-31', filedAt:null },
  { id:'DEC-QC-2026-Q2', period:'Q2 2026', label:'Avril · Mai · Juin',         status:'VALIDATED', brut:203_500_000, tips:20_350_000, tps:11_192_500,  tvq:22_309_238,  tpsCredits:1_017_500, tvqCredits:2_028_113, tpsNet:10_175_000, tvqNet:20_281_125, solde:30_456_125, dueDate:'2026-07-31', filedAt:'2026-07-28T14:00:00Z' },
  { id:'DEC-QC-2026-Q1', period:'Q1 2026', label:'Janvier · Février · Mars',   status:'VALIDATED', brut:186_000_000, tips:18_600_000, tps:10_230_000,  tvq:20_387_100,  tpsCredits:930_000,   tvqCredits:1_853_618, tpsNet:9_300_000,  tvqNet:18_533_482, solde:27_833_482, dueDate:'2026-04-30', filedAt:'2026-04-25T10:00:00Z' },
]

const fiscalReports = ALL_REPORTS.filter(r=>r.cat==='FISCAL')

export default function TaxReportPage() {
  const totalSolde = DECLARATIONS.reduce((s,d)=>s+d.solde,0)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Rapports fiscaux</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">TPS/TVQ · Déclarations provinciales · Revenu Québec (simulation)</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {nav.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · SIMULATION — AUCUNE TRANSMISSION À REVENU QUÉBEC</div>

        {/* KPI fiscaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Total TPS collectée (9M)', v:money(TOTAL_TPS),  c:'#7C3AED', icon:'🧾'},
            {l:'Total TVQ collectée (9M)', v:money(TOTAL_TVQ),  c:'#7C3AED', icon:'🧾'},
            {l:'Total à remettre (9M)',    v:money(TOTAL_TAX),  c:'#003DA5', icon:'🏛️'},
            {l:'Solde 3 trimestres',       v:money(totalSolde), c:'#059669', icon:'✅'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-base font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Déclarations */}
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Déclarations TPS/TVQ — Province QC</div>
          <div className="space-y-3">
            {DECLARATIONS.map(d=>{
              const sc = STATUS_CONF[d.status]??STATUS_CONF['DRAFT']!
              return (
                <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-black text-slate-900 dark:text-white">{d.period}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{d.label}</div>
                      <div className="text-[9px] font-mono text-slate-300 dark:text-slate-600 mt-0.5">{d.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-400">Échéance</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200">{new Date(d.dueDate).toLocaleDateString('fr-CA')}</div>
                      {d.filedAt && <div className="text-[9px] text-green-600 dark:text-green-400 mt-0.5">✓ Soumis {new Date(d.filedAt).toLocaleDateString('fr-CA')}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      {l:'Revenus bruts',      v:money(d.brut),    c:'text-slate-800 dark:text-slate-200'},
                      {l:'+ Pourboires',       v:money(d.tips),    c:'', style:{color:'#B45309'}},
                      {l:'TPS nette',          v:money(d.tpsNet),  c:'text-purple-600 dark:text-purple-400'},
                      {l:'TVQ nette',          v:money(d.tvqNet),  c:'text-purple-600 dark:text-purple-400'},
                    ].map(r=>(
                      <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                        <div className="text-[9px] text-slate-400 mb-1">{r.l}</div>
                        <div className={`text-sm font-black ${r.c}`} style={(r as {style?:object}).style}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border" style={{background:'#EEF3FB',borderColor:'#BFDBFE'}}>
                    <div className="text-xs font-bold text-blue-800 dark:text-blue-300">SOLDE ESTIMÉ À REMETTRE</div>
                    <div className="text-lg font-black text-blue-700 dark:text-blue-400">{money(d.solde)}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50">
                      <Eye size={12}/> Aperçu
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white cursor-pointer hover:bg-blue-700">
                      <Download size={12}/> PDF
                    </button>
                    <Link href="/tax/declarations" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100">
                      → Déclaration officielle
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tableau mensuel recap */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Récapitulatif mensuel TPS/TVQ</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Mois','Rev. bruts','TPS (5%)','TVQ (9,975%)','Total taxes','Période'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {MONTHLY_REVENUE.map((m,i)=>{
                  const t = MONTHLY_TAX[i]!
                  const qtr = i<3?'Q1':i<6?'Q2':'Q3'
                  return (
                    <tr key={m.month} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{m.month} 2026</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{money(m.brut)}</td>
                      <td className="px-4 py-2.5 font-bold text-purple-600 dark:text-purple-400">{money(t.tps)}</td>
                      <td className="px-4 py-2.5 font-bold text-purple-700 dark:text-purple-300">{money(t.tvq)}</td>
                      <td className="px-4 py-2.5 font-black text-slate-900 dark:text-white">{money(t.total)}</td>
                      <td className="px-4 py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">{qtr}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rapports fiscaux disponibles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">📥 Rapports fiscaux disponibles</div>
          {fiscalReports.map(r=>{
            const sc = STATUS_CONF[r.status]??STATUS_CONF['DRAFT']!
            return (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-xl shrink-0">🧾</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.title}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">{r.id} · {r.format} · {r.size}</div>
                  {r.brut>0 && <div className="text-[9px] text-green-600 dark:text-green-400 font-bold mt-0.5">Revenus: {money(r.brut)} · TPS: {money(r.tps)} · TVQ: {money(r.tvq)}</div>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100"><Eye size={11} className="text-slate-500"/></button>
                  <button className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 cursor-pointer hover:bg-blue-100"><Download size={11} className="text-blue-600 dark:text-blue-400"/></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
