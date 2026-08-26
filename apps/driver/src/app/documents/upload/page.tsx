'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { DOC_CATEGORY_ICONS, type DocCategory, type DocType } from '@/lib/engines/document.engine'
import { useState } from 'react'
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CATEGORIES: { key: DocCategory; label: string; types: DocType[] }[] = [
  { key:'DRIVER', label:'🪪 Chauffeur', types:['DRIVER_LICENSE', 'TAXI_PERMIT', 'TAXI_LICENSE'] },
  { key:'VEHICLE', label:'🚗 Véhicule', types:['VEHICLE_REGISTRATION', 'VEHICLE_INSURANCE', 'INSPECTION_CERTIFICATE', 'COMMERCIAL_INSURANCE'] },
  { key:'TAX', label:'📊 Fiscal', types:['TAX_REGISTRATION', 'TAX_REPORT'] },
  { key:'RECEIPT', label:'🧾 Reçu', types:['RECEIPT', 'FUEL_RECEIPT', 'MAINTENANCE_RECEIPT', 'PARKING_RECEIPT', 'TOLL_RECEIPT'] },
  { key:'RIDESHARE', label:'🚗 Rideshare', types:['PROVIDER_STATEMENT', 'REVENUE_STATEMENT'] },
  { key:'DELIVERY', label:'📦 Livraison', types:['PROVIDER_STATEMENT', 'REVENUE_STATEMENT'] },
]

type UploadStep = 'category' | 'type' | 'file' | 'ocr_review' | 'success'

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<UploadStep>('category')
  const [selectedCat, setSelectedCat] = useState<DocCategory | null>(null)
  const [selectedType, setSelectedType] = useState<DocType | null>(null)
  const [ocrData, setOcrData] = useState({ supplier:'Shell Station', date:'2026-08-24', amount:'72.50', tps:'3.45', tvq:'7.23' })

  const catDef = CATEGORIES.find(c => c.key === selectedCat)

  const handleFileSimulation = () => {
    if (selectedCat === 'RECEIPT') setStep('ocr_review')
    else setStep('success')
  }

  return (
    <AppShell showNav={false}>
      <PageHeader title="Ajouter un document" subtitle={`Étape: ${step}`} />
      <div className="px-4">
        {/* File security notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Shield size={12} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">Validation sécurité · Scan malware · MIME vérifié · Lien temporaire uniquement · Jamais URL publique</p>
        </div>

        {/* ─── STEP: Category ──────────────────────────── */}
        {step === 'category' && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-400 mb-4">Choisir la catégorie</div>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => { setSelectedCat(cat.key); setStep('type') }}
                className="w-full driver-card p-4 flex items-center gap-3 hover:border-qc-blue/40 transition-all text-left">
                <span className="text-2xl">{DOC_CATEGORY_ICONS[cat.key]}</span>
                <div>
                  <div className="font-semibold text-white">{cat.label}</div>
                  <div className="text-[10px] text-slate-500">{cat.types.length} types disponibles</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ─── STEP: Type ──────────────────────────────── */}
        {step === 'type' && catDef && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-400 mb-4">Type de document — {catDef.label}</div>
            {catDef.types.map(type => (
              <button key={type} onClick={() => { setSelectedType(type); setStep('file') }}
                className="w-full driver-card p-4 flex items-center gap-3 hover:border-qc-blue/40 transition-all text-left">
                <FileText size={20} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-white">{type.replace(/_/g,' ')}</span>
              </button>
            ))}
            <button onClick={() => setStep('category')} className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-all">← Retour</button>
          </div>
        )}

        {/* ─── STEP: File ──────────────────────────────── */}
        {step === 'file' && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-slate-400 mb-2">Ajouter le fichier</div>
            <div className="p-6 rounded-3xl border-2 border-dashed border-slate-700 text-center">
              <Upload size={36} className="text-slate-500 mx-auto mb-3" />
              <div className="font-semibold text-white mb-1">Glisser-déposer ou choisir</div>
              <div className="text-xs text-slate-500">PDF · JPG · PNG · WEBP · Max 10 MB</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleFileSimulation} className="py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                <Camera size={16} /> Scanner
              </button>
              <button onClick={handleFileSimulation} className="py-3.5 rounded-2xl bg-qc-blue text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-qc-blue-dark transition-all">
                <Upload size={16} /> Choisir
              </button>
            </div>
            <Card>
              <div className="text-[10px] text-slate-500 space-y-1">
                <div>✅ Validation sécurité automatique</div>
                <div>✅ Scan malware avant stockage</div>
                <div>✅ Vérification type MIME réel</div>
                <div>✅ Hash intégrité calculé</div>
                {selectedCat === 'RECEIPT' && <div>✅ OCR automatique (reçus)</div>}
              </div>
            </Card>
            <button onClick={() => setStep('type')} className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-all">← Retour</button>
          </div>
        )}

        {/* ─── STEP: OCR Review ────────────────────────── */}
        {step === 'ocr_review' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-2">
              <AlertCircle size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-300">OCR a extrait les informations ci-dessous. Vérifiez et corrigez si nécessaire avant de confirmer.</p>
            </div>
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🧾 Vérifier les informations extraites</div>
              <div className="space-y-3">
                {[
                  { label:'Fournisseur', key:'supplier' as const },
                  { label:'Date', key:'date' as const },
                  { label:'Montant', key:'amount' as const },
                  { label:'TPS', key:'tps' as const },
                  { label:'TVQ', key:'tvq' as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">{f.label}</label>
                    <input value={ocrData[f.key]} onChange={e => setOcrData(p => ({...p, [f.key]: e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-qc-blue transition-colors" />
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-amber-400 mt-3">⚠ OCR = proposition. Vérifiez les données avant de confirmer.</div>
            </Card>
            <button onClick={() => setStep('success')}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-500 transition-all">
              Confirmer et enregistrer
            </button>
            <button onClick={() => setStep('file')} className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-all">← Modifier</button>
          </div>
        )}

        {/* ─── STEP: Success ───────────────────────────── */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <div className="text-xl font-black text-white mb-1">Document enregistré</div>
            <div className="text-sm text-slate-400 mb-6">Stockage sécurisé · Hash calculé · En attente de vérification</div>
            <div className="driver-card p-4 mb-6 text-left space-y-1.5">
              {[
                { label:'Catégorie', val:selectedCat || '—' },
                { label:'Type', val:selectedType?.replace(/_/g,' ') || '—' },
                { label:'Statut', val:'UPLOADED — En attente de vérification' },
                { label:'Vérification', val:'Manuelle requise — jamais automatique' },
                { label:'Stockage', val:'Chiffré · Lien temporaire' },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-white">{s.val}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/documents')}
              className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold hover:bg-qc-blue-dark transition-all">
              ← Mes documents
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
