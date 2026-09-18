'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Download, Eye } from 'lucide-react'
import { PILOT, money, fmtDate, NAV_REPORTS, ALL_REPORTS, STATUS_CONF } from '@/lib/reports-data'
import { TOP_PROVIDERS, MONTHLY_REVENUE } from '@/lib/analytics-data'
const nav = NAV_REPORTS.map(n=>({...n,active:n.href==='/reports/platform'}))

const PROVIDER_DETAIL = [
  {code:'TAXI',      name:'Taxi QC',    icon:'🚕', color:'#003DA5', transactions:158_400, brut:89_940_000, tps:4_497_000, tvq:8_966_535, webhooks:4840, quality:99.2, anomalies:2},
  {code:'UBER',      name:'Uber',       icon:'⬛', color:'#000000', transactions:98_460,  brut:53_964_000, tps:2_698_200, tvq:5_383_194, webhooks:3140, quality:98.7, anomalies:5},
  {code:'LYFT',      name:'Lyft',       icon:'🟣', color:'#FF00BF', transactions:42_180,  brut:24_644_220, tps:1_232_211, tvq:2_456_330, webhooks:1420, quality:97.9, anomalies:8},
  {code:'DOORDASH',  name:'DoorDash',   icon:'🔴', color:'#FF3008', transactions:124_800, brut:28_512_000, tps:1_425_600, tvq:2_843_172, webhooks:5020, quality:98.4, anomalies:4},
  {code:'INSTACART', name:'Instacart',  icon:'🟢', color:'#43B02A', transactions:86_400,  brut:17_236_800, tps:861_840,   tvq:1_718_386, webhooks:3810, quality:99.1, anomalies:1},
  {code:'UBEREATS',  name:'Uber Eats',  icon:'🟡', color:'#06C167', transactions:64_800,  brut:8_553_000,  tps:427_650,   tvq:852_412,   webhooks:2680, quality:98.2, anomalies:3},
]

const platformReports = ALL_REPORTS.filter(r=>r.cat==='PLATFORM')

export default function PlatformReportPage() {
  const totalTx    = PROVIDER_DETAIL.reduce((s,p)=>s+p.transactions,0)
  const totalBrut  = PROVIDER_DETAIL.reduce((s,p)=>s+p.brut,0)
  const totalTps   = PROVIDER_DETAIL.reduce((s,p)=>s+p.tps,0)
  const totalTvq   = PROVIDER_DETAIL.reduce((s,p)=>s+p.tvq,0)
  const maxBrut    = Math.max(...PROVIDER_DETAIL.map(p=>p.brut))

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Rapports plateformes</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Fournisseurs comparatifs · Transactions · Réconciliation · Q3 2026</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {nav.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · SIMULATION FOURNISSEURS</div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Fournisseurs actifs', v:'6',            c:'#003DA5', icon:'🔌'},
            {l:'Transactions (Q3)',  v:totalTx.toLocaleString('fr-CA'), c:'#003DA5', icon:'💳'},
            {l:'Revenus bruts (Q3)', v:money(totalBrut), c:'#059669', icon:'💰'},
            {l:'TPS+TVQ (Q3)',       v:money(totalTps+totalTvq), c:'#7C3AED', icon:'🧾'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tableau comparatif */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Comparatif fournisseurs — Q3 2026</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Fournisseur','Transactions','Revenus bruts','TPS','TVQ','Qualité','Anomalies'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {PROVIDER_DETAIL.map(p=>(
                  <tr key={p.code} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.icon}</span>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 w-20 overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${(p.brut/maxBrut)*100}%`,background:p.color}}/>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{p.transactions.toLocaleString('fr-CA')}</td>
                    <td className="px-4 py-3 font-black text-green-600 dark:text-green-400">{money(p.brut)}</td>
                    <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">{money(p.tps)}</td>
                    <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">{money(p.tvq)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.quality>=99?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{p.quality}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold ${p.anomalies>5?'text-red-500':p.anomalies>2?'text-amber-500':'text-slate-400'}`}>{p.anomalies}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 dark:bg-blue-500/10 border-t-2 border-blue-200 dark:border-blue-500/30">
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">TOTAL</td>
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">{totalTx.toLocaleString('fr-CA')}</td>
                  <td className="px-4 py-3 font-black text-blue-700 dark:text-blue-400">{money(totalBrut)}</td>
                  <td className="px-4 py-3 font-black text-purple-600 dark:text-purple-400">{money(totalTps)}</td>
                  <td className="px-4 py-3 font-black text-purple-600 dark:text-purple-400">{money(totalTvq)}</td>
                  <td className="px-4 py-3 font-black text-green-600 dark:text-green-400">98.6%</td>
                  <td className="px-4 py-3 font-black text-amber-600">23</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Rapports disponibles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">📥 Rapports plateformes disponibles</div>
          {platformReports.map(r=>{
            const sc = STATUS_CONF[r.status]??STATUS_CONF['DRAFT']!
            return (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-xl shrink-0">🔌</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.title}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">{r.id} · {r.format} · {r.size} · {r.records} enregistrement(s)</div>
                  <div className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5">{fmtDate(r.generatedAt)}</div>
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
