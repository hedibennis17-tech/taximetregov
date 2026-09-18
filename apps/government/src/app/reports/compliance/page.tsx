'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Download, Eye, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { PILOT, fmtDate, NAV_REPORTS, ALL_REPORTS, STATUS_CONF } from '@/lib/reports-data'
import { COMPLIANCE_STATS, COMPLIANCE_MONTHLY } from '@/lib/analytics-data'
const nav = NAV_REPORTS.map(n=>({...n,active:n.href==='/reports/compliance'}))

const DRIVER_SAMPLE = [
  {num:'DRV-QC-0001', name:'Jean Tremblay',  status:'CONFORME',         pct:100, docs:'5/5', lic:'Valide', ins:'Valide', susp:false, alert:false},
  {num:'DRV-QC-0002', name:'Marie Gagnon',   status:'CONFORME',         pct:100, docs:'3/3', lic:'Valide', ins:'Valide', susp:false, alert:false},
  {num:'DRV-QC-0003', name:'Karim Hassan',   status:'CONFORME',         pct:100, docs:'2/2', lic:'Valide', ins:'Valide', susp:false, alert:false},
  {num:'DRV-QC-0004', name:'Sophie Martin',  status:'EN VÉRIFICATION',  pct:60,  docs:'0/5', lic:'Attente',ins:'Attente',susp:false, alert:true},
  {num:'DRV-QC-0005', name:'Ali Bouchard',   status:'EN VÉRIFICATION',  pct:60,  docs:'0/4', lic:'Attente',ins:'Attente',susp:false, alert:true},
  {num:'DRV-QC-0006', name:'Nadia Patel',    status:'CONFORME',         pct:100, docs:'2/2', lic:'Valide', ins:'⚠ Expire 28j', susp:false, alert:true},
  {num:'DRV-QC-0007', name:'Marc Leblanc',   status:'SUSPENDU',         pct:30,  docs:'1/5', lic:'Susp.',  ins:'Expirée',susp:true, alert:true},
  {num:'DRV-QC-0008', name:'Amira Tremblay', status:'EN RÉVISION',      pct:80,  docs:'1/3', lic:'Valide', ins:'Valide', susp:false, alert:true},
]

const complianceReports = ALL_REPORTS.filter(r=>r.cat==='COMPLIANCE')

export default function ComplianceReportPage() {
  const conforme = DRIVER_SAMPLE.filter(d=>d.status==='CONFORME').length
  const alertes  = DRIVER_SAMPLE.filter(d=>d.alert).length
  const suspendus= DRIVER_SAMPLE.filter(d=>d.susp).length

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Rapports de conformité</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Dossiers chauffeurs · Documents · Licences · Province QC</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {nav.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Taux de conformité',  v:`${COMPLIANCE_STATS.complianceRate}%`, c:'#059669', icon:'⚖️'},
            {l:'Chauffeurs conformes',v:COMPLIANCE_STATS.fullyCompliant.toLocaleString('fr-CA'), c:'#059669', icon:'✅'},
            {l:'Issues / alertes',    v:COMPLIANCE_STATS.minorIssues.toLocaleString('fr-CA'), c:'#B45309', icon:'⚠️'},
            {l:'Suspendus',           v:COMPLIANCE_STATS.suspended.toLocaleString('fr-CA'), c:'#DC2626', icon:'🚫'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tableau chauffeurs pilotes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-800 dark:text-white">Statut conformité — Chauffeurs pilotes DEMO</div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white cursor-pointer hover:bg-blue-700">
              <Download size={11}/> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Chauffeur','Statut','Dossier %','Documents','Licence','Assurance','Alertes'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {DRIVER_SAMPLE.map(d=>(
                  <tr key={d.num} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <Link href={`/drivers/drv-demo-00${d.num.slice(-1)}`} className="font-bold text-blue-600 dark:text-blue-400 hover:underline block">{d.name}</Link>
                      <div className="text-[9px] text-slate-400 font-mono">{d.num}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        d.status==='CONFORME'?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':
                        d.status==='SUSPENDU'?'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10':
                        'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${d.pct}%`,background:d.pct===100?'#059669':d.pct>60?'#B45309':'#DC2626'}}/>
                        </div>
                        <span className="font-bold text-[10px]" style={{color:d.pct===100?'#059669':d.pct>60?'#B45309':'#DC2626'}}>{d.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">{d.docs}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold ${d.lic==='Valide'?'text-green-600 dark:text-green-400':d.lic==='Susp.'?'text-red-500':'text-amber-500'}`}>{d.lic}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold ${d.ins==='Valide'?'text-green-600 dark:text-green-400':d.ins==='Expirée'?'text-red-500':'text-amber-500'}`}>{d.ins}</span>
                    </td>
                    <td className="px-4 py-3">
                      {d.susp ? <span className="flex items-center gap-1 text-[9px] text-red-500"><XCircle size={10}/> Suspendu</span>
                      : d.alert ? <span className="flex items-center gap-1 text-[9px] text-amber-500"><AlertTriangle size={10}/> Alerte</span>
                      : <span className="flex items-center gap-1 text-[9px] text-green-600 dark:text-green-400"><CheckCircle size={10}/> OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Évolution conformité */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Évolution mensuelle — Province QC</div>
          {COMPLIANCE_MONTHLY.map(m=>(
            <div key={m.month} className="flex items-center gap-3 mb-2">
              <div className="w-8 text-[10px] font-bold text-slate-500 shrink-0">{m.month}</div>
              <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div className="h-full rounded-lg" style={{width:`${m.rate}%`,background:m.rate>=91?'#059669':'#B45309'}}/>
              </div>
              <div className="w-12 text-[10px] font-black text-right" style={{color:m.rate>=91?'#059669':'#B45309'}}>{m.rate}%</div>
              <div className="w-20 text-[9px] text-red-400 shrink-0">🚫 {m.suspended}</div>
            </div>
          ))}
        </div>

        {/* Rapports disponibles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">📥 Rapports conformité disponibles</div>
          {complianceReports.map(r=>{
            const sc = STATUS_CONF[r.status]??STATUS_CONF['DRAFT']!
            return (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-xl shrink-0">⚖️</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.title}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">{r.id} · {r.format} · {r.size} · {r.records.toLocaleString('fr-CA')} enreg.</div>
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
