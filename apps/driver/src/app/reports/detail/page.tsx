'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockTaxReports, mockReportAudit, mockRevenueReport, mockExpenseReport,
  mockMileageReport, REPORT_STATUS_CONF, fmt
} from '@/lib/engines/reporting.engine'
import { useSearchParams } from 'next/navigation'
import { Download, Lock, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function DetailContent() {
  const params = useSearchParams()
  const id = params.get('id') ?? 'RPT-TPS-Q1'
  const report = mockTaxReports.find(r => r.reportId === id) ?? mockTaxReports[0]
  const conf = REPORT_STATUS_CONF[report.status]
  const audit = mockReportAudit.filter(e => e.reportId === report.reportId)

  return (
    <AppShell>
      <PageHeader title={`Rapport ${report.taxType}`} subtitle={`${report.periodStart} → ${report.periodEnd}`} />
      <div className="px-4">
        {/* Status */}
        <div className={`flex items-center gap-4 p-4 rounded-3xl mb-5 border ${conf.bg} border-opacity-30`}>
          <div className="text-4xl">{conf.icon}</div>
          <div className="flex-1">
            <div className="font-bold text-white mb-0.5">{report.taxType} — {report.jurisdiction}</div>
            <div className={`text-sm font-bold ${conf.color}`}>{conf.label}</div>
            {report.isEstimate && <div className="text-[10px] text-amber-400 mt-0.5">⚠ ESTIMATION — pas une déclaration officielle</div>}
            {report.status === 'LOCKED' && <div className="text-[10px] text-purple-300 mt-0.5">🔒 Modification via AMENDMENT uniquement</div>}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500">Version</div>
            <div className="font-black text-white text-xl">v{report.version}</div>
          </div>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label:'Rev. bruts', val:fmt(report.grossRevenue), color:'text-white' },
            { label:'Rev. taxable', val:fmt(report.taxableRevenue), color:'text-blue-400' },
            { label:'Taxe est.', val:fmt(report.taxAmount), color:'text-orange-400' },
            { label:'Ajustements', val:fmt(report.adjustments), color:'text-green-400' },
            { label:'Remboursements', val:fmt(report.refunds), color:'text-red-400' },
            { label:'NET estimé', val:fmt(report.netTaxAmount), color:'text-green-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-sm tabular-nums ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Metadata */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">Informations rapport</div>
          <div className="space-y-2">
            {[
              { label:'Report ID', val:report.reportId, mono:true },
              { label:'Juridiction', val:report.jurisdiction },
              { label:'Type', val:report.taxType },
              { label:'Règles appliquées', val:report.ruleVersion, mono:true },
              { label:'Généré le', val:new Date(report.generatedAt).toLocaleString('fr-CA') },
              { label:'Verrouillé', val:report.lockedAt ? new Date(report.lockedAt).toLocaleString('fr-CA') : '—' },
              { label:'Soumis', val:report.submittedAt ? new Date(report.submittedAt).toLocaleString('fr-CA') : 'Non soumis officiellement' },
              { label:'Référence soumission', val:report.submissionReference ?? '— (jamais générée si non soumis)' },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`text-xs font-medium ${s.mono ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'} max-w-[55%] text-right`}>{s.val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Warnings */}
        {report.warnings.length > 0 && (
          <Card className="mb-4 border-amber-500/20">
            <div className="font-semibold text-white text-sm mb-2">Alertes</div>
            {report.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-amber-300">
                <AlertCircle size={11} className="mt-0.5 shrink-0"/> {w}
              </div>
            ))}
          </Card>
        )}

        {/* Note officielle */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <p className="text-xs text-amber-200">{report.note}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['PDF','CSV','JSON'].map(f => (
            <button key={f} className="py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700 transition-all">
              <Download size={12}/> {f}
            </button>
          ))}
        </div>
        {report.status !== 'LOCKED' && (
          <button className="w-full py-3.5 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-all mb-3">
            <Lock size={14}/> Verrouiller ce rapport
          </button>
        )}
        {report.status === 'LOCKED' && (
          <button className="w-full py-3.5 rounded-2xl border border-slate-700 text-amber-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all mb-3">
            📋 Créer un amendement
          </button>
        )}

        {/* Audit */}
        {audit.length > 0 && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-3">Journal d'audit</div>
            <div className="space-y-1">
              {audit.map(e => (
                <div key={e.auditId} className="flex items-center gap-2 text-[10px] py-1 border-b border-slate-800 last:border-0">
                  <span className={`font-bold w-36 shrink-0 ${e.actorRole === 'SYSTEM' ? 'text-blue-400' : 'text-green-400'}`}>{e.action}</span>
                  <span className="text-slate-500 flex-1 truncate">{e.details}</span>
                  <span className="text-slate-600 shrink-0">{new Date(e.timestamp).toLocaleDateString('fr-CA')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>}>
      <DetailContent />
    </Suspense>
  )
}
