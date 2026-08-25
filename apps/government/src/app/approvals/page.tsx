'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockApprovals, type ApprovalStatus } from '@/data/operations.mock'
import { CheckCircle, XCircle, Clock, Shield, AlertCircle, Eye } from 'lucide-react'

const statusColors: Record<ApprovalStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600', SUBMITTED: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700', APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-100 text-slate-400',
}
const typeLabels: Record<string, string> = {
  LICENSE_RENEWAL: '📋 Renouvellement licence', FINANCIAL_CORRECTION: '💰 Correction financière',
  DRIVER_REACTIVATION: '🚗 Réactivation chauffeur', PLATFORM_CONFIG: '🔌 Config. plateforme',
  DOCUMENT_REVIEW: '📄 Révision document',
}

export default function ApprovalsPage() {
  const pending = mockApprovals.filter(a => a.status === 'SUBMITTED' || a.status === 'IN_REVIEW')
  const approved = mockApprovals.filter(a => a.status === 'APPROVED')

  return (
    <AppShell>
      <PageHeader title="Workflows d'approbation" subtitle="Maker-Checker · Principe des quatre yeux · Audit obligatoire" />

      {/* Four-eyes principle notice */}
      <Card className="mb-5 p-4">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-qc-blue mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Principe des quatre yeux (Maker-Checker)</div>
            <p className="text-xs text-slate-500">Pour les opérations sensibles marquées <span className="font-bold text-qc-blue">Maker-Checker requis</span>, la personne qui crée la demande ne peut pas approuver elle-même. Un superviseur ou agent autorisé différent doit valider. Chaque approbation génère automatiquement un AuditLog immuable.</p>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="En attente" value={pending.length} icon={<Clock size={16} />} color="orange" />
        <KpiCard label="Approuvées" value={approved.length} icon={<CheckCircle size={16} />} color="green" />
        <KpiCard label="Maker-Checker requis" value={mockApprovals.filter(a => a.makerCheckerRequired).length} icon={<Shield size={16} />} color="blue" />
        <KpiCard label="Total" value={mockApprovals.length} color="gray" />
      </div>

      {/* Approval list */}
      <div className="space-y-4">
        {mockApprovals.map(appr => (
          <Card key={appr.id} className={`p-5 ${appr.status === 'IN_REVIEW' ? 'border-amber-200 dark:border-amber-900' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{appr.title}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColors[appr.status]}`}>{appr.status}</span>
                  {appr.makerCheckerRequired && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-qc-blue bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      <Shield size={9} /> MAKER-CHECKER REQUIS
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mb-2">{typeLabels[appr.type] || appr.type}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{appr.description}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                  <span>Créé par : <span className="font-semibold text-slate-600 dark:text-slate-400">{appr.createdByName}</span></span>
                  {appr.reviewedBy && <span>Approuvé par : <span className="font-semibold text-green-600">{appr.reviewedBy}</span></span>}
                  <span className="font-mono">{new Date(appr.createdAt).toLocaleDateString('fr-CA')}</span>
                  <span className="font-mono">{appr.id}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={14} /></button>
                {(appr.status === 'SUBMITTED' || appr.status === 'IN_REVIEW') && (
                  <>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                      <CheckCircle size={12} /> Approuver
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                      <XCircle size={12} /> Rejeter
                    </button>
                  </>
                )}
                {appr.status === 'APPROVED' && (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-semibold px-3 py-1.5">
                    <CheckCircle size={13} /> Approuvé ✓
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
