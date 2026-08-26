'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockDocuments, mockDocumentVersions, mockDocumentAudit,
  DOC_STATUS_CONFIG, DOC_TYPE_LABELS, DOC_CATEGORY_ICONS,
  computeDocStatus, daysUntilExpiry
} from '@/lib/engines/document.engine'
import { useSearchParams } from 'next/navigation'
import { Download, RefreshCw, Archive, Eye, Lock } from 'lucide-react'
import { Suspense } from 'react'

function DetailContent() {
  const params = useSearchParams()
  const id = params.get('id') ?? 'doc-001'
  const doc = mockDocuments.find(d => d.id === id) ?? mockDocuments[0]
  const today = new Date()
  const status = computeDocStatus(doc, today)
  const conf = DOC_STATUS_CONFIG[status]
  const days = daysUntilExpiry(doc.expirationDate)
  const versions = mockDocumentVersions.filter(v => v.documentId === doc.id)
  const audit = mockDocumentAudit.filter(e => e.documentId === doc.id)

  return (
    <AppShell>
      <PageHeader title={DOC_TYPE_LABELS[doc.documentType]} subtitle={DOC_CATEGORY_ICONS[doc.category] + ' ' + doc.category} />
      <div className="px-4">
        {/* Status card */}
        <div className={`flex items-center gap-4 p-4 rounded-3xl mb-5 border ${status === 'VERIFIED' ? 'bg-green-500/5 border-green-500/20' : status === 'EXPIRING_SOON' ? 'bg-amber-500/5 border-amber-500/20' : status === 'EXPIRED' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900 border-slate-800'}`}>
          <div className="text-4xl">{DOC_CATEGORY_ICONS[doc.category]}</div>
          <div className="flex-1">
            <div className="font-bold text-white mb-0.5">{DOC_TYPE_LABELS[doc.documentType]}</div>
            <div className={`text-sm font-bold ${conf.color}`}>{conf.icon} {conf.label}</div>
            {days !== null && (
              <div className={`text-xs mt-0.5 ${days < 0 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                {days < 0 ? 'Expiré il y a ' + Math.abs(days) + 'j' : 'Expire dans ' + days + 'j'}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">Informations</div>
          <div className="space-y-2">
            {[
              { label:'ID', val:doc.id, mono:true },
              { label:'Type', val:DOC_TYPE_LABELS[doc.documentType] },
              { label:'Catégorie', val:doc.category },
              { label:'Émetteur', val:doc.issuer ?? '—' },
              { label:'Référence', val:doc.referenceNumber ?? '—', mono:true },
              { label:'Date', val:doc.documentDate ?? '—' },
              { label:'Expiration', val:doc.expirationDate ?? 'Sans expiration' },
              { label:'Téléchargé', val:new Date(doc.uploadedAt).toLocaleDateString('fr-CA') },
              { label:'Taille', val:doc.fileSizeKb + ' KB' },
              { label:'Hash', val:doc.fileHash.slice(0,14)+'...', mono:true },
              { label:'Vérifié par', val:doc.verifiedBy ?? '— (non vérifié)' },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`text-xs font-medium ${s.mono ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Links */}
        {(doc.linkedVehicleId || doc.linkedTransactionId || doc.linkedTaxPeriod) && (
          <Card className="mb-4">
            <div className="font-semibold text-white text-sm mb-3">Documents liés</div>
            <div className="space-y-1.5">
              {doc.linkedVehicleId && <div className="text-xs text-slate-300">Vehicule: <span className="font-mono text-qc-blue-light">{doc.linkedVehicleId}</span></div>}
              {doc.linkedTransactionId && <div className="text-xs text-slate-300">Transaction: <span className="font-mono text-qc-blue-light">{doc.linkedTransactionId}</span></div>}
              {doc.linkedTaxPeriod && <div className="text-xs text-slate-300">Période fiscale: <span className="font-mono text-qc-blue-light">{doc.linkedTaxPeriod}</span></div>}
            </div>
          </Card>
        )}

        {/* Versions */}
        {versions.length > 0 && (
          <Card className="mb-4">
            <div className="font-semibold text-white text-sm mb-3">Versions</div>
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.versionId} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${v.status === 'VERIFIED' ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">Version {v.version}</div>
                    <div className="text-[10px] text-slate-500">{new Date(v.uploadedAt).toLocaleDateString('fr-CA')}</div>
                  </div>
                  {v.status === 'VERIFIED' && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">ACTUEL</span>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-qc-blue text-white font-semibold text-sm hover:bg-qc-blue-dark transition-all">
            <Eye size={16} /> Consulter
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-all">
            <Download size={16} /> Télécharger
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-all">
            <RefreshCw size={16} /> Remplacer
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 font-semibold text-sm hover:bg-slate-700 transition-all">
            <Archive size={16} /> Archiver
          </button>
        </div>

        {/* Legal hold */}
        {doc.legalHold && (
          <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <Lock size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">Conservation legale active — ne peut pas etre supprime sans autorisation gouvernementale.</p>
          </div>
        )}

        {/* Audit */}
        {audit.length > 0 && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-3">Journal d'audit</div>
            <div className="space-y-1.5">
              {audit.slice(0, 5).map(e => (
                <div key={e.auditId} className="flex items-center gap-2 text-[10px] py-1 border-b border-slate-800 last:border-0">
                  <span className={`font-bold w-36 shrink-0 ${e.actorRole === 'DRIVER' ? 'text-blue-400' : 'text-green-400'}`}>{e.action}</span>
                  <span className="text-slate-500 flex-1 truncate">{e.actor}</span>
                  <span className="text-slate-600 shrink-0">{new Date(e.timestamp).toLocaleTimeString('fr-CA')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default function DocumentDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>}>
      <DetailContent />
    </Suspense>
  )
}
