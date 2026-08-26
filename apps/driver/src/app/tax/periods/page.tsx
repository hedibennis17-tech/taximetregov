'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockTaxPeriods, mockTaxSummary } from '@/lib/engines/tax.engine'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

const periodStatusConf: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  READY: { color:'text-green-400', bg:'border-green-500/20', icon:<CheckCircle size={14} className="text-green-400"/> },
  IN_PROGRESS: { color:'text-blue-400', bg:'border-qc-blue/30', icon:<Clock size={14} className="text-blue-400"/> },
  NOT_STARTED: { color:'text-slate-500', bg:'border-slate-700', icon:<Clock size={14} className="text-slate-500"/> },
  SUBMITTED: { color:'text-purple-400', bg:'border-purple-500/20', icon:<CheckCircle size={14} className="text-purple-400"/> },
  ACCEPTED: { color:'text-green-400', bg:'border-green-500/30', icon:<CheckCircle size={14} className="text-green-400"/> },
  AMENDED: { color:'text-amber-400', bg:'border-amber-500/20', icon:<AlertCircle size={14} className="text-amber-400"/> },
}

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

export default function TaxPeriodsPage() {
  const taxTypes = ['TPS', 'TVQ'] as const
  return (
    <AppShell>
      <PageHeader title="Périodes fiscales" subtitle="TPS · TVQ · Statuts · Préparation" />
      <div className="px-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label:'Revenu taxable', val:fmt(mockTaxSummary.taxableRevenue) },
            { label:'TPS collectée', val:fmt(mockTaxSummary.tpsCollected) },
            { label:'TVQ collectée', val:fmt(mockTaxSummary.tvqCollected) },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className="font-black text-white text-sm tabular-nums">{s.val}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Estimation disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 text-xs text-amber-200">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span><strong>ESTIMATION</strong> — Ces montants sont des estimations préliminaires. Ils ne constituent pas une obligation fiscale officielle. Consultez un comptable ou Revenu Québec / l'ARC pour vos déclarations.</span>
        </div>

        {/* Periods by tax type */}
        {taxTypes.map(taxType => {
          const periods = mockTaxPeriods.filter(p => p.taxType === taxType)
          return (
            <div key={taxType} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${taxType === 'TPS' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                <span className="font-bold text-white">{taxType}</span>
                <span className="text-[10px] text-slate-500">{taxType === 'TPS' ? '5% · Gouvernement fédéral' : '9.975% · Gouvernement du Québec'}</span>
              </div>
              <div className="space-y-2.5">
                {periods.map(period => {
                  const conf = periodStatusConf[period.status] || periodStatusConf.NOT_STARTED
                  return (
                    <div key={period.periodId} className={`driver-card p-4 border ${conf.bg}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{conf.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm">{period.periodLabel}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 ${conf.color}`}>{period.status}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{period.periodStart} → {period.periodEnd} · {period.periodType}</div>
                          {period.taxCollected > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {[
                                { label:'Taxable', val:fmt(period.taxableRevenue) },
                                { label:'Collecté', val:fmt(period.taxCollected) },
                                { label:'Remb.', val:fmt(period.adjustments) },
                              ].map(s => (
                                <div key={s.label} className="bg-slate-800/50 rounded-lg p-1.5 text-center">
                                  <div className="text-[10px] font-bold text-white tabular-nums">{s.val}</div>
                                  <div className="text-[9px] text-slate-500">{s.label}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {period.status === 'READY' && (
                          <button className="px-3 py-1.5 rounded-xl bg-qc-blue/20 border border-qc-blue/40 text-qc-blue-light text-[10px] font-bold shrink-0 hover:bg-qc-blue/30 transition-all">
                            Voir
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Note officielle */}
        <div className="driver-card p-4 mb-6">
          <div className="text-xs text-slate-400">
            <p className="mb-1"><strong className="text-white">Taximètre.GOV</strong> prépare et organise vos données fiscales.</p>
            <p>La soumission officielle à <strong className="text-white">Revenu Québec</strong> et à <strong className="text-white">l'ARC</strong> se fait via les canaux officiels. Taximètre.GOV ne remplace pas ces systèmes.</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
