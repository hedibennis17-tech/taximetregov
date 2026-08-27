'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockComplianceSnapshot, mockDriverProfile, mockIdentityVerification,
  mockDriverLicense, mockTaxiPermit, mockInsurance, mockComplianceDocs,
  mockProviderIdentities, mockAuditEvents,
  VERIFICATION_STATUS_CONF, PROVIDER_ICONS, PROVIDER_LABELS, CONN_STATUS_CONF,
} from '@/lib/engines/compliance.engine'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Lock, Shield } from 'lucide-react'

export default function CompliancePage() {
  const [tab, setTab] = useState<'overview' | 'documents' | 'providers' | 'audit'>('overview')
  const snap = mockComplianceSnapshot

  const overallColor = snap.overallStatus === 'ALL_CLEAR' ? 'text-green-400'
    : snap.overallStatus === 'PARTIAL' ? 'text-amber-400' : 'text-red-400'
  const overallIcon = snap.overallStatus === 'ALL_CLEAR' ? '✅' : snap.overallStatus === 'PARTIAL' ? '⚠️' : '❌'

  return (
    <AppShell>
      <PageHeader title="Conformité" subtitle="Identité · Permis · Services · Docs · Providers" />
      <div className="px-4">
        {/* Pilot notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
          <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0"/>
          <p className="text-xs text-amber-200">Mode pilote — VERIFIED = examen documentaire uniquement. Aucune API gouvernementale officielle connectée actuellement.</p>
        </div>

        {/* Overall status */}
        <div className={`flex items-center gap-4 p-5 rounded-3xl mb-5 border ${snap.overallStatus === 'ALL_CLEAR' ? 'bg-green-500/10 border-green-500/30' : snap.overallStatus === 'PARTIAL' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="text-4xl">{overallIcon}</div>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">Statut global</div>
            <div className={`font-black text-2xl ${overallColor}`}>{snap.overallStatus.replace('_',' ')}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500">DR-00001234</div>
            <div className="text-[10px] text-slate-600">{new Date(snap.timestamp).toLocaleDateString('fr-CA')}</div>
          </div>
        </div>

        {/* Service compliance grid */}
        <div className="space-y-3 mb-5">
          {[
            { key:'taxi', label:'🚕 Taxi', check:snap.taxi },
            { key:'rideshare', label:'🚗 Rideshare', check:snap.rideshare },
            { key:'delivery', label:'📦 Livraison', check:snap.delivery },
          ].map(({ label, check }) => (
            <div key={label} className={`driver-card p-4 border ${check.result === 'PASS' ? 'border-green-500/20' : check.result === 'WARNING' ? 'border-amber-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{check.result === 'PASS' ? '✅' : check.result === 'WARNING' ? '⚠️' : '❌'}</span>
                <span className="font-bold text-white">{label}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${check.result === 'PASS' ? 'bg-green-500/20 text-green-400' : check.result === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                  {check.result}
                </span>
                {!check.taximeterEnabled && (
                  <span className="text-[9px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Lock size={8}/> Txm: OFF</span>
                )}
              </div>
              {/* Mini checklist */}
              <div className="grid grid-cols-3 gap-1.5 text-[9px] mb-2">
                {Object.entries(check.checks).map(([k, ok]) => (
                  <div key={k} className={`flex items-center gap-1 ${ok ? 'text-green-400' : 'text-red-400'}`}>
                    {ok ? <CheckCircle size={9}/> : <AlertCircle size={9}/>}
                    <span className="capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</span>
                  </div>
                ))}
              </div>
              {check.blockers.map((b, i) => (
                <div key={i} className="text-[10px] text-red-300 flex items-start gap-1"><AlertCircle size={10} className="mt-0.5 shrink-0"/>{b}</div>
              ))}
              {check.warnings.map((w, i) => (
                <div key={i} className="text-[10px] text-amber-300 flex items-start gap-1"><AlertCircle size={10} className="mt-0.5 shrink-0"/>{w}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['overview','Résumé'],['documents','Documents'],['providers','Providers'],['audit','Audit']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ───────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-3 mb-6">
            {/* Identity */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔐 Identité</div>
              {[
                { label:'Statut', val:VERIFICATION_STATUS_CONF[mockIdentityVerification.status].icon + ' ' + VERIFICATION_STATUS_CONF[mockIdentityVerification.status].label, color:VERIFICATION_STATUS_CONF[mockIdentityVerification.status].color },
                { label:'Méthode', val:mockIdentityVerification.method.replace(/_/g,' ') },
                { label:'Vérifié le', val:mockIdentityVerification.verifiedAt ? new Date(mockIdentityVerification.verifiedAt).toLocaleDateString('fr-CA') : '—' },
                { label:'Expire le', val:mockIdentityVerification.expiresAt ? new Date(mockIdentityVerification.expiresAt).toLocaleDateString('fr-CA') : '—' },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-medium ${'color' in s ? s.color : 'text-white'}`}>{s.val}</span>
                </div>
              ))}
              <div className="text-[9px] text-amber-400 mt-2">Mode pilote: {mockIdentityVerification.note}</div>
            </Card>

            {/* License */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">📄 Permis de conduire</div>
              {[
                { label:'Référence', val:mockDriverLicense.licenseReference, mono:true },
                { label:'Classe', val:mockDriverLicense.licenseType },
                { label:'Expire', val:new Date(mockDriverLicense.expiryDate).toLocaleDateString('fr-CA') },
                { label:'Jours restants', val:`${mockDriverLicense.daysUntilExpiry} j`, color:mockDriverLicense.daysUntilExpiry < 30 ? 'text-red-400' : mockDriverLicense.daysUntilExpiry < 90 ? 'text-amber-400' : 'text-green-400' },
                { label:'Vérification', val:VERIFICATION_STATUS_CONF[mockDriverLicense.verificationStatus].label },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-medium ${'color' in s ? s.color : ''} ${'mono' in s ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
                </div>
              ))}
            </Card>

            {/* Taxi Permit */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🚕 Permis taxi</div>
              {[
                { label:'Référence', val:mockTaxiPermit.permitNumberReference, mono:true },
                { label:'Juridiction', val:mockTaxiPermit.jurisdiction },
                { label:'Expire', val:new Date(mockTaxiPermit.expiryDate).toLocaleDateString('fr-CA') },
                { label:'Jours restants', val:`${mockTaxiPermit.daysUntilExpiry} j`, color:'text-green-400' },
                { label:'Vérification', val:VERIFICATION_STATUS_CONF[mockTaxiPermit.verificationStatus].label },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-medium ${'color' in s ? s.color : ''} ${'mono' in s ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ─── DOCUMENTS ──────────────────────────── */}
        {tab === 'documents' && (
          <div className="space-y-3 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Les nouvelles versions conservent les anciennes — historique permanent</div>
            {mockComplianceDocs.map(doc => (
              <div key={doc.id} className={`driver-card p-4 border ${doc.status === 'VERIFIED' ? 'border-green-500/20' : doc.status === 'EXPIRING_SOON' ? 'border-amber-500/20' : doc.status === 'EXPIRED' ? 'border-red-500/20' : ''}`}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-xl shrink-0">{doc.status === 'VERIFIED' ? '✅' : doc.status === 'EXPIRING_SOON' ? '⚠️' : doc.status === 'EXPIRED' ? '❌' : '📄'}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{doc.label}</span>
                      <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">v{doc.version}</span>
                      {doc.version > 1 && <span className="text-[9px] text-slate-500 italic">Original conservé</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">{doc.docType.replace(/_/g,' ')}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[9px] font-bold ${doc.status === 'VERIFIED' ? 'text-green-400' : doc.status === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-red-400'}`}>{doc.status.replace(/_/g,' ')}</div>
                    {doc.daysUntilExpiry !== null && (
                      <div className={`text-[9px] ${doc.daysUntilExpiry < 0 ? 'text-red-400' : doc.daysUntilExpiry < 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {doc.daysUntilExpiry < 0 ? `Expiré ${Math.abs(doc.daysUntilExpiry)}j` : `${doc.daysUntilExpiry}j`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-mono text-[9px] text-slate-600 truncate">{doc.storageReferenceMasked}</div>
              </div>
            ))}
            <button className="w-full py-3.5 rounded-2xl bg-qc-blue/20 border border-qc-blue/40 text-qc-blue-light font-semibold text-sm hover:bg-qc-blue/30 transition-all">
              + Ajouter un document
            </button>
          </div>
        )}

        {/* ─── PROVIDERS ──────────────────────────── */}
        {tab === 'providers' && (
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 mb-3">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              OAuth uniquement — jamais de mot de passe fournisseur · Secrets chiffrés · Jamais stockés en clair
            </div>
            {mockProviderIdentities.map(prov => {
              const conf = CONN_STATUS_CONF[prov.connectionStatus]
              return (
                <div key={prov.provider} className={`driver-card p-4 border ${prov.connectionStatus === 'CONNECTED' ? 'border-green-500/20' : prov.connectionStatus === 'REAUTH_REQUIRED' ? 'border-amber-500/20' : prov.connectionStatus === 'ERROR' ? 'border-red-500/20' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{PROVIDER_ICONS[prov.provider]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{PROVIDER_LABELS[prov.provider]}</span>
                        <span className={`text-[9px] font-bold ${conf.color}`}>{conf.icon} {conf.label}</span>
                      </div>
                      <div className="font-mono text-[9px] text-slate-500">{prov.providerAccountId}</div>
                    </div>
                    {prov.connectionStatus === 'CONNECTED' && (
                      <button className="text-[10px] text-slate-500 border border-slate-700 px-2 py-1 rounded-xl hover:bg-slate-800">Déconnecter</button>
                    )}
                    {prov.connectionStatus === 'REAUTH_REQUIRED' && (
                      <button className="text-[10px] text-amber-400 border border-amber-500/30 px-2 py-1 rounded-xl bg-amber-500/10">Réauth</button>
                    )}
                  </div>
                  {prov.scopes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prov.scopes.map(s => (
                        <span key={s} className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">{s}</span>
                      ))}
                    </div>
                  )}
                  {prov.lastSyncAt && (
                    <div className="text-[9px] text-slate-600 mt-1">Sync: {new Date(prov.lastSyncAt).toLocaleDateString('fr-CA')}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ─── AUDIT ──────────────────────────────── */}
        {tab === 'audit' && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-3">Journal d'audit conformité</div>
            <div className="space-y-1.5">
              {mockAuditEvents.map(e => (
                <div key={e.auditId} className="flex items-start gap-2 py-1.5 border-b border-slate-800 last:border-0 text-[10px]">
                  <span className={`font-bold w-40 shrink-0 ${e.actorRole === 'SYSTEM' ? 'text-blue-400' : e.actorRole === 'ADMIN' ? 'text-purple-400' : e.actorRole === 'REVIEWER' ? 'text-amber-400' : 'text-green-400'}`}>{e.action}</span>
                  <div className="flex-1">
                    <div className="text-slate-300">{e.details}</div>
                    <div className="text-slate-500">{e.actor} · {new Date(e.timestamp).toLocaleDateString('fr-CA')}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
