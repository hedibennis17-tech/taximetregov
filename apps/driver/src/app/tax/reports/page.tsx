'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockTaxReports, mockAnnualSummary } from '@/lib/engines/tax.engine'
import { Download, FileText, AlertCircle } from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

const statusConf: Record<string,{color:string;bg:string}> = {
  DRAFT: { color:'text-slate-400', bg:'border-slate-700' },
  READY: { color:'text-green-400', bg:'border-green-500/20' },
  UNDER_REVIEW: { color:'text-blue-400', bg:'border-blue-500/20' },
  SUBMITTED: { color:'text-purple-400', bg:'border-purple-500/20' },
  ACCEPTED: { color:'text-green-400', bg:'border-green-500/30' },
  REJECTED: { color:'text-red-400', bg:'border-red-500/20' },
  AMENDED: { color:'text-amber-400', bg:'border-amber-500/20' },
  CANCELLED: { color:'text-slate-500', bg:'border-slate-700' },
}

export default function TaxReportsPage() {
  return (
    <AppShell>
      <PageHeader title="Rapports fiscaux" subtitle="TPS · TVQ · Revenus · PRÉPARATION uniquement" />
      <div className="px-4">
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 text-xs text-amber-200">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          Ces rapports sont préliminaires. Le statut SUBMITTED requiert une soumission via les canaux officiels de Revenu Québec / ARC. Taximètre.GOV ne transmet pas directement à ces systèmes en mode pilote.
        </div>

        {/* Summary card */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">📊 Résumé fiscal — ESTIMATION</div>
          <div className="space-y-2">
            {[
              { label:'Revenus bruts', val:fmt(mockAnnualSummary.totalTaxableRevenue), color:'text-white' },
              { label:'Revenus taxables', val:fmt(mockAnnualSummary.totalTaxableRevenue), color:'text-white' },
              { label:'TPS collectée (5%)', val:fmt(mockAnnualSummary.tpsCollected), color:'text-blue-400' },
              { label:'TVQ collectée (9.975%)', val:fmt(mockAnnualSummary.tvqCollected), color:'text-purple-400' },
              { label:'Total taxes', val:fmt(mockAnnualSummary.totalTax), color:'text-orange-400' },
              { label:'Ajustements', val:fmt(mockAnnualSummary.totalAdjustments), color:'text-amber-400' },
              { label:'Remboursements', val:`-${fmt(mockAnnualSummary.totalRefunds)}`, color:'text-red-400' },
              { label:'Net estimé payable', val:fmt(mockAnnualSummary.totalTax), color:'text-green-400', bold:true },
            ].map(s => (
              <div key={s.label} className={`flex justify-between py-1.5 ${s.bold ? 'border-t border-slate-700 pt-2.5 mt-1' : 'border-b border-slate-800 last:border-0'}`}>
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`font-mono font-bold text-sm ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-amber-400 flex items-center gap-1.5">
            <AlertCircle size={10} /> ESTIMATION — pas une obligation fiscale officielle
          </div>
        </Card>

        {/* Reports list */}
        <div className="space-y-3 mb-6">
          {mockTaxReports.map(report => {
            const conf = statusConf[report.status] || statusConf.DRAFT
            return (
              <Card key={report.reportId} className={`border ${conf.bg}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-white text-sm">{(report.tpsCollected > 0 ? "TPS" : "TVQ")}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-300">{report.periodStart.slice(0,7)+" → "+report.periodEnd.slice(0,7)}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 ${conf.color}`}>{report.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">{report.jurisdiction} · Généré: {new Date(report.generatedAt).toLocaleDateString('fr-CA')}</div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {[
                        { label:'Brut', val:fmt(report.grossRevenue) },
                        { label:'Taxable', val:fmt(report.taxableRevenue) },
                        { label:'Collecté', val:fmt(report.tpsCollected + report.tvqCollected) },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-800/50 rounded-lg p-1.5">
                          <div className="text-slate-500">{s.label}</div>
                          <div className="font-bold text-white tabular-nums">{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all shrink-0">
                    <Download size={12} /> PDF
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
