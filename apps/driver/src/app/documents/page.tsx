'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import { driverDocuments } from '@/data/driver.mock'
import { Upload, AlertTriangle } from 'lucide-react'

export default function DocumentsPage() {
  const expiring = driverDocuments.filter(d => d.status === 'EXPIRING').length
  return (
    <AppShell>
      <PageHeader title="Mes documents" subtitle="Permis · Assurance · Inspection · Conformité" />
      <div className="px-4">
        {expiring > 0 && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300"><strong>{expiring} document(s)</strong> expire(nt) bientôt. Renouvelez avant l'expiration.</p>
          </div>
        )}
        <div className="space-y-3 mb-5">
          {driverDocuments.map(doc => (
            <Card key={doc.id}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                  {doc.type === 'LICENSE' ? '🪪' : doc.type === 'INSURANCE' ? '🛡️' : doc.type === 'INSPECTION' ? '🔧' : doc.type === 'TAXI_PERMIT' ? '📋' : '📷'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-white text-sm">{doc.name}</span>
                    <DocBadge status={doc.status} />
                  </div>
                  <div className="text-[10px] text-slate-500">Expire: {doc.expiryDate}</div>
                  <div className="text-[10px] text-slate-600 font-mono">{doc.fileRef}</div>
                </div>
                {doc.status === 'EXPIRING' && (
                  <button className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-all">
                    Renouveler
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
        <button className="w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-400 flex items-center justify-center gap-2 hover:border-slate-600 transition-colors">
          <Upload size={16} /> Ajouter un document
        </button>
      </div>
    </AppShell>
  )
}
