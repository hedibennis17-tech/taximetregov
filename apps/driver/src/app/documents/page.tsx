'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockDocuments, mockReceipts, DOC_STATUS_CONFIG, DOC_CATEGORY_ICONS, DOC_TYPE_LABELS,
  daysUntilExpiry, computeDocStatus, type DocCategory, type DocStatus
} from '@/lib/engines/document.engine'
import { useState } from 'react'
import { Search, Upload, AlertTriangle, CheckCircle, ChevronRight, FileText, Shield, Lock } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_FILTERS: { key: DocCategory | 'ALL'; label: string }[] = [
  { key:'ALL', label:'Tous' },
  { key:'DRIVER', label:'🪪 Chauffeur' },
  { key:'VEHICLE', label:'🚗 Véhicule' },
  { key:'TAXI', label:'🚕 Taxi' },
  { key:'RIDESHARE', label:'🚗 Rideshare' },
  { key:'DELIVERY', label:'📦 Livraison' },
  { key:'TAX', label:'📊 Fiscal' },
  { key:'EXPENSE', label:'🧾 Dépenses' },
  { key:'RECEIPT', label:'🧾 Reçus' },
]

export default function DocumentsPage() {
  const [catFilter, setCatFilter] = useState<DocCategory | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  const today = new Date()
  const docs = mockDocuments.map(d => ({ ...d, _status: computeDocStatus(d, today) }))
  const expiring = docs.filter(d => d._status === 'EXPIRING_SOON' || d._status === 'EXPIRED').length
  const verified = docs.filter(d => d._status === 'VERIFIED').length

  const filtered = docs.filter(d => {
    if (catFilter !== 'ALL' && d.category !== catFilter) return false
    if (statusFilter !== 'ALL' && d._status !== statusFilter) return false
    if (search && !d.documentType.toLowerCase().includes(search.toLowerCase()) && !d.fileName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <PageHeader title="Mes documents" subtitle="Permis · Assurance · Reçus · Fiscaux" />
      <div className="px-4">
        {/* Security notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Lock size={12} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">Documents chiffrés · Accès restreint · Liens temporaires sécurisés · Audité à chaque accès</p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Total', val:docs.length, color:'text-white' },
            { label:'Vérifiés', val:verified, color:'text-green-400' },
            { label:'Alertes', val:expiring, color: expiring > 0 ? 'text-amber-400' : 'text-slate-500' },
            { label:'Reçus', val:mockReceipts.length, color:'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Expiry alerts */}
        {expiring > 0 && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-amber-300 text-sm mb-1">{expiring} document(s) à renouveler</div>
              <div className="space-y-1">
                {docs.filter(d => d._status === 'EXPIRING_SOON' || d._status === 'EXPIRED').map(d => {
                  const days = daysUntilExpiry(d.expirationDate)
                  const conf = DOC_STATUS_CONFIG[d._status]
                  return (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <span>{conf.icon}</span>
                      <span className="text-amber-200">{DOC_TYPE_LABELS[d.documentType]}</span>
                      <span className="text-amber-400 ml-auto font-semibold">
                        {days !== null && days < 0 ? 'EXPIRÉ' : days !== null ? `${days}j` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue transition-colors"
            placeholder="Rechercher un document..." />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {CATEGORY_FILTERS.map(f => (
            <button key={f.key} onClick={() => setCatFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${catFilter===f.key?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {(['ALL','VERIFIED','EXPIRING_SOON','EXPIRED','UPLOADED','REVIEW_REQUIRED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s as DocStatus | 'ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${statusFilter===s?'bg-slate-600 text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {s === 'ALL' ? 'Tous statuts' : DOC_STATUS_CONFIG[s as DocStatus]?.label ?? s}
            </button>
          ))}
        </div>

        {/* Document list */}
        <div className="space-y-3 mb-5">
          {filtered.map(doc => {
            const conf = DOC_STATUS_CONFIG[doc._status]
            const days = daysUntilExpiry(doc.expirationDate)
            const catIcon = DOC_CATEGORY_ICONS[doc.category]
            return (
              <Link key={doc.id} href={`/documents/detail?id=${doc.id}`}
                className={`driver-card p-4 flex items-start gap-3 hover:border-qc-blue/40 transition-all border ${doc._status === 'EXPIRING_SOON' ? 'border-amber-500/20' : doc._status === 'EXPIRED' ? 'border-red-500/20' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${conf.bg.replace('text-','bg-').replace('-400','-500/10').replace('bg-green-400','bg-green-500/10').replace('bg-amber-400','bg-amber-500/10').replace('bg-red-400','bg-red-500/10').replace('bg-blue-400','bg-blue-500/10').replace('bg-slate-400','bg-slate-800')}`}>
                  {catIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-white text-sm">{DOC_TYPE_LABELS[doc.documentType]}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.icon} {conf.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-0.5">{doc.issuer}</div>
                  {doc.expirationDate && (
                    <div className={`text-[10px] font-semibold ${days !== null && days < 0 ? 'text-red-400' : days !== null && days < 30 ? 'text-amber-400' : 'text-slate-500'}`}>
                      Expire: {doc.expirationDate} {days !== null && days >= 0 && `(${days}j)`}
                    </div>
                  )}
                  {doc.linkedTransactionId && (
                    <div className="text-[9px] text-qc-blue-light mt-0.5">🔗 Lié à une transaction</div>
                  )}
                </div>
                <ChevronRight size={16} className="text-slate-600 shrink-0 mt-1" />
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">Aucun document pour ce filtre</div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link href="/documents/receipts"
            className="driver-card p-4 flex flex-col gap-2 hover:border-qc-blue/40 transition-all">
            <span className="text-2xl">🧾</span>
            <span className="font-semibold text-white text-sm">Mes reçus</span>
            <span className="text-[10px] text-slate-400">{mockReceipts.length} reçus enregistrés</span>
          </Link>
          <Link href="/documents/upload"
            className="driver-card p-4 flex flex-col gap-2 border-dashed border-slate-700 hover:border-qc-blue/40 transition-all">
            <Upload size={22} className="text-slate-400" />
            <span className="font-semibold text-slate-300 text-sm">Ajouter</span>
            <span className="text-[10px] text-slate-400">PDF · JPG · PNG</span>
          </Link>
        </div>

        {/* Storage info */}
        <div className="driver-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">Stockage utilisé</span>
            <span className="text-xs text-slate-400">12.4 MB / 1 GB</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-qc-blue rounded-full" style={{width:'1.24%'}} />
          </div>
          <div className="text-[9px] text-slate-500 mt-1">Chiffrés · Stockage sécurisé · Liens temporaires uniquement</div>
        </div>
      </div>
    </AppShell>
  )
}
