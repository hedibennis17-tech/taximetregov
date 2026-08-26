'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockReceipts } from '@/lib/engines/document.engine'
import { AlertCircle } from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

const catIcons: Record<string,string> = {
  FUEL:'⛽', MAINTENANCE:'🔧', PARKING:'🅿️', TOLL:'🛣️', OTHER:'🧾', FOOD:'🍕', VEHICLE:'🚗'
}

export default function ReceiptsPage() {
  const total = mockReceipts.reduce((a, r) => a + (r.totalAmount ?? 0), 0)
  const confirmed = mockReceipts.filter(r => r.verificationStatus === 'VERIFIED').length

  return (
    <AppShell>
      <PageHeader title="Mes reçus" subtitle="Dépenses professionnelles · OCR · Fiscal" />
      <div className="px-4">
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 text-xs text-amber-200">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          Reçus enregistrés pour suivi professionnel. La déductibilité fiscale de chaque dépense est à confirmer avec un comptable ou les règles officielles applicables.
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label:'Reçus', val:mockReceipts.length, color:'text-white' },
            { label:'Confirmés', val:confirmed, color:'text-green-400' },
            { label:'Total', val:fmt(total), color:'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-base tabular-nums ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-6">
          {mockReceipts.map(receipt => (
            <Card key={receipt.id} className={receipt.verificationStatus === 'UNVERIFIED' ? 'border-amber-500/20' : ''}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                  {catIcons[receipt.category] || '🧾'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-white text-sm">{(receipt.supplier ?? '—')}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${receipt.verificationStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {receipt.verificationStatus === 'VERIFIED' ? '✅ Confirmé' : '⚠ En attente'}
                    </span>
                    {receipt.ocrStatus === 'CONFIRMED' && <span className="text-[9px] text-qc-blue-light">OCR ✓</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mb-1">{(receipt.receiptDate ?? '—')} · {receipt.category} · {receipt.paymentMethod}</div>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-slate-400">TPS: <span className="text-blue-400">{fmt((receipt.gstAmount ?? 0))}</span></span>
                    <span className="text-slate-400">TVQ: <span className="text-purple-400">{fmt((receipt.qstAmount ?? 0))}</span></span>
                  </div>
                  {receipt.linkedExpenseId && (
                    <div className="text-[9px] text-qc-blue-light mt-0.5">🔗 Lié à une dépense</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-white tabular-nums">{fmt((receipt.totalAmount ?? 0))}</div>
                  <div className="text-[10px] text-slate-500">TTC</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
