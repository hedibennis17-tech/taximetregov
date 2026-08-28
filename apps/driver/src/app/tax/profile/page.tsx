'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, DocBadge } from '@/components/ui'
import { mockTaxProfile, mockTaxRegistrations } from '@/lib/engines/tax.engine'
import { Shield, AlertCircle, CheckCircle, Clock, Lock } from 'lucide-react'

const regStyle: Record<string,string> = {
  REGISTERED: 'text-green-400', NOT_REGISTERED: 'text-slate-500',
  PENDING: 'text-amber-400', EXEMPT: 'text-blue-400',
  UNKNOWN: 'text-slate-500', REVIEW_REQUIRED: 'text-orange-400',
}
const verStyle: Record<string,string> = {
  VERIFIED: 'text-green-400', UNVERIFIED: 'text-amber-400',
  PENDING: 'text-blue-400', REJECTED: 'text-red-400',
  EXPIRED: 'text-orange-400', REVIEW_REQUIRED: 'text-orange-400',
}

export default function TaxProfilePage() {
  const p = mockTaxProfile

  return (
    <AppShell>
      <PageHeader title="Profil fiscal" subtitle="Identité fiscale · Inscriptions · Juridiction" />
      <div className="px-4">
        {/* NAS protection notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
          <Lock size={13} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-200">
            <strong>NAS/SIN:</strong> Jamais demandé ni affiché ici. Si légalement requis, chiffré dans un coffre sécurisé · affiché uniquement <span className="font-mono">***-***-XXX</span> · accès restreint · audité.
          </p>
        </div>

        {/* Identity */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">🏛️ Identité fiscale</div>
          <div className="space-y-2.5">
            {[
              { label:'Nom légal', val:"Mohamed Benali" },
              { label:'Juridiction', val:p.jurisdiction === 'CA-QC' ? '🇨🇦 Québec, Canada' : p.jurisdiction },
              { label:'Résidence fiscale', val:p.jurisdiction },
              { label:'Statut professionnel', val:p.businessStatus.replace('_', ' ') },
              { label:'Numéro entreprise', val:"••••••1234", mono:true },
              { label:'Statut du compte', val:p.status },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`text-xs font-semibold ${s.mono ? 'font-mono text-qc-blue-light' : 'text-white'}`}>{s.val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tax registrations */}
        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">📋 Inscriptions fiscales</div>
          <div className="space-y-4">
            {mockTaxRegistrations.map(reg => (
              <div key={reg.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{reg.taxType}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${regStyle[reg.status]}`}>{reg.status}</span>
                    <span className={`text-[10px] ${verStyle[reg.verificationStatus]}`}>{reg.verificationStatus}</span>
                  </div>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Numéro</span>
                    <span className="font-mono text-qc-blue-light">{reg.maskedReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Depuis</span>
                    <span className="text-slate-300">{reg.effectiveFrom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source</span>
                    <span className="text-slate-300">{reg.verificationStatus}</span>
                  </div>
                </div>
                {reg.verificationStatus === 'NOT_STARTED' && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400">
                    <AlertCircle size={10} /> Non vérifiée — un numéro saisi n'est pas automatiquement valide
                  </div>
                )}
                {reg.verificationStatus === 'VERIFIED' && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-green-400">
                    <CheckCircle size={10} /> Vérifiée · {reg.effectiveFrom}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Architecture note */}
        <Card className="mb-4 border-blue-500/20">
          <div className="flex items-start gap-2.5">
            <Shield size={14} className="text-qc-blue-light mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400 space-y-1">
              <p><strong className="text-white">Vérification gouvernementale:</strong> L'architecture permet une vérification via une API officielle (Revenu Québec/ARC). En mode pilote, vérification manuelle uniquement.</p>
              <p><strong className="text-white">Règles fiscales:</strong> Chargées depuis TaxRuleEngine · versionnées · non hardcodées · auditables.</p>
            </div>
          </div>
        </Card>

        {/* Audit log */}
        <Card className="mb-6">
          <div className="font-semibold text-white text-sm mb-3">📋 Journal d'audit fiscal</div>
          <div className="space-y-1">
            {([] as {auditId:string;action:string;actor:string;timestamp:string;result:string;details:string}[]).map(e => (
              <div key={e.auditId} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0 text-[10px]">
                <span className={`font-bold w-44 shrink-0 ${e.result === 'SUCCESS' ? 'text-green-400' : e.result === 'WARNING' ? 'text-amber-400' : 'text-red-400'}`}>
                  {e.action}
                </span>
                <span className="text-slate-400 flex-1 truncate">{e.details}</span>
                <span className={`ml-auto font-bold shrink-0 ${e.result === 'SUCCESS' ? 'text-green-400' : 'text-amber-400'}`}>{e.result}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
