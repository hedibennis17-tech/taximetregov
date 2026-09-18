'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { PILOT, COMPLIANCE_STATS, COMPLIANCE_MONTHLY } from '@/lib/analytics-data'
const NAV=[{href:'/analytics/overview',l:'📊 Vue globale',active:false},{href:'/analytics/revenue',l:'💰 Revenus',active:false},{href:'/analytics/taxes',l:'📋 Taxes',active:false},{href:'/analytics/taxi',l:'🚕 Taxi',active:false},{href:'/analytics/delivery',l:'📦 Livraisons',active:false},{href:'/analytics/compliance',l:'⚖️ Conformité',active:true},{href:'/analytics/intelligence',l:'🧠 Intelligence',active:false},{href:'/analytics/drivers',l:'🚗 Chauffeurs',active:false}]
export default function CompliancePage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Conformité</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Dossiers chauffeurs · Documents · Licences · Province QC</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">{NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}</div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Taux global */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #059669'}}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle size={28} className="text-green-600 dark:text-green-400"/>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-black text-green-700 dark:text-green-400">{COMPLIANCE_STATS.complianceRate}%</div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">Taux de conformité provincial</div>
              <div className="text-[10px] text-slate-400 mt-1">{COMPLIANCE_STATS.fullyCompliant.toLocaleString('fr-CA')} chauffeurs sur {COMPLIANCE_STATS.totalDrivers.toLocaleString('fr-CA')} sont pleinement conformes</div>
            </div>
            <div className="text-right shrink-0">
              <div className="w-20 h-20 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#059669" strokeWidth="3"
                    strokeDasharray={`${COMPLIANCE_STATS.complianceRate} ${100-COMPLIANCE_STATS.complianceRate}`}
                    strokeDashoffset="25" strokeLinecap="round"/>
                  <text x="18" y="20.5" textAnchor="middle" className="text-[7px] font-black" fill="#059669">{COMPLIANCE_STATS.complianceRate}%</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Conformes',     v:COMPLIANCE_STATS.fullyCompliant, icon:<CheckCircle size={18}/>,    c:'#059669', bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Issues mineures',v:COMPLIANCE_STATS.minorIssues,  icon:<AlertTriangle size={18}/>,  c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Suspendus',     v:COMPLIANCE_STATS.suspended,      icon:<XCircle size={18}/>,        c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10'},
            {l:'En attente',   v:COMPLIANCE_STATS.pending,         icon:<AlertTriangle size={18}/>,  c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} border border-white dark:border-transparent rounded-2xl p-4 text-center`}>
              <div className="flex justify-center mb-2" style={{color:s.c}}>{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v.toLocaleString('fr-CA')}</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Critères */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Critères de conformité</div>
          {[
            {l:'Conformité documents',    v:COMPLIANCE_STATS.docCompliance},
            {l:'Licences valides',         v:COMPLIANCE_STATS.licenseCompliance},
            {l:'Assurance valide',         v:COMPLIANCE_STATS.insuranceCompliance},
            {l:'Inspection à jour',        v:COMPLIANCE_STATS.inspectionCompliance},
          ].map(r=>(
            <div key={r.l} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{r.l}</span>
                <span className="text-xs font-black" style={{color:r.v>=97?'#059669':r.v>=90?'#B45309':'#DC2626'}}>{r.v}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:`${r.v}%`,background:r.v>=97?'#059669':r.v>=90?'#B45309':'#DC2626'}}/>
              </div>
            </div>
          ))}
        </div>

        {/* Évolution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Évolution du taux de conformité</div>
          {COMPLIANCE_MONTHLY.map(m=>(
            <div key={m.month} className="flex items-center gap-3 mb-2">
              <div className="w-8 text-[10px] font-bold text-slate-500 shrink-0">{m.month}</div>
              <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div className="h-full rounded-lg" style={{width:`${m.rate}%`,background:m.rate>=91?'#059669':'#B45309'}}/>
              </div>
              <div className="w-14 text-[10px] font-black text-right shrink-0" style={{color:m.rate>=91?'#059669':'#B45309'}}>{m.rate}%</div>
              <div className="w-16 text-[9px] text-red-500 shrink-0">{m.suspended} suspendus</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
