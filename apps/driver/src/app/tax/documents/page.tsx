'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import { Upload, FileText, Lock } from 'lucide-react'

const fiscalDocs = [
  { id:'fd-001', name:'Rapport TPS — Q1 2026', type:'TAX_REPORT', period:'Jan-Mar 2026', status:'VALID', date:'2026-04-30', size:'124 KB' },
  { id:'fd-002', name:'Rapport TVQ — Q1 2026', type:'TAX_REPORT', period:'Jan-Mar 2026', status:'VALID', date:'2026-04-30', size:'118 KB' },
  { id:'fd-003', name:'Rapport revenus — Q2 2026', type:'REVENUE_REPORT', period:'Avr-Jun 2026', status:'VALID', date:'2026-07-31', size:'208 KB' },
  { id:'fd-004', name:'Attestation TPS — ARC', type:'TAX_REGISTRATION', period:'N/A', status:'VALID', date:'2024-01-15', size:'45 KB' },
  { id:'fd-005', name:'Attestation TVQ — RQ', type:'TAX_REGISTRATION', period:'N/A', status:'VALID', date:'2024-01-15', size:'42 KB' },
  { id:'fd-006', name:'Rapport TPS — Q2 2026', type:'TAX_REPORT', period:'Avr-Jun 2026', status:'EXPIRING', date:'2026-09-30', size:'136 KB' },
]

const typeIcons: Record<string, string> = {
  TAX_REPORT: '📊', REVENUE_REPORT: '💰', TAX_REGISTRATION: '📋',
  GOVERNMENT_NOTICE: '🏛️', VERIFICATION: '✅', OTHER: '📄',
}

export default function TaxDocumentsPage() {
  return (
    <AppShell>
      <PageHeader title="Documents fiscaux" subtitle="Rapports · Attestations · Déclarations" />
      <div className="px-4">
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
          <Lock size={13} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-200">Documents fiscaux chiffrés · Accès restreint · Audité à chaque consultation</p>
        </div>

        <div className="space-y-3 mb-5">
          {fiscalDocs.map(doc => (
            <div key={doc.id} className="driver-card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">{typeIcons[doc.type] || '📄'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-semibold text-white text-sm">{doc.name}</span>
                  <DocBadge status={doc.status} />
                </div>
                <div className="text-[10px] text-slate-500">{doc.period} · {doc.date} · {doc.size}</div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all shrink-0">
                <FileText size={12} /> Voir
              </button>
            </div>
          ))}
        </div>

        <button className="w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-400 flex items-center justify-center gap-2 hover:border-slate-600 transition-colors mb-6">
          <Upload size={16} /> Ajouter un document fiscal
        </button>
      </div>
    </AppShell>
  )
}
