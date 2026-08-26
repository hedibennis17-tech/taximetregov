'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { PROVIDER_DEFINITIONS, getOAuthFlow, type Provider } from '@/lib/engines/provider.engine'
import { TAXIMETER_ENABLED_BY_ACTIVITY } from '@/data/driver.mock'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, ChevronRight, Lock, AlertTriangle, CheckCircle, ExternalLink, Gauge } from 'lucide-react'
import { Suspense } from 'react'

function ConnectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const provider = (searchParams.get('provider') || 'uber') as Provider
  const def = PROVIDER_DEFINITIONS[provider]
  const flow = getOAuthFlow(provider)
  const [step, setStep] = useState<'info' | 'permissions' | 'connecting' | 'success' | 'cancelled'>('info')
  const [flowStep, setFlowStep] = useState(0)

  const isMock = def.availability === 'MOCK_ONLY'
  const isComingSoon = def.availability === 'COMING_SOON'
  const taximeterEnabled = TAXIMETER_ENABLED_BY_ACTIVITY[def.activityType as keyof typeof TAXIMETER_ENABLED_BY_ACTIVITY] ?? false

  const handleConnect = () => {
    setStep('permissions')
  }

  const handleAuthorize = () => {
    setStep('connecting')
    // Simulate OAuth flow steps
    let i = 0
    const interval = setInterval(() => {
      i++
      setFlowStep(i)
      if (i >= flow.length) {
        clearInterval(interval)
        setTimeout(() => setStep('success'), 500)
      }
    }, 600)
  }

  if (isComingSoon) return (
    <AppShell>
      <PageHeader title={`Connecter ${def.name}`} subtitle="Disponibilité" />
      <div className="px-4">
        <Card className="text-center p-8">
          <div className="text-5xl mb-4">{def.icon}</div>
          <div className="font-bold text-white text-xl mb-2">{def.name}</div>
          <div className="text-amber-400 text-sm font-semibold mb-3">🔜 Bientôt disponible</div>
          <p className="text-xs text-slate-400">{def.oauthNote}</p>
        </Card>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <PageHeader title={`Connecter ${def.name}`} subtitle={isMock ? '⚠ MOCK — Pilote seulement' : 'Connexion OAuth officielle'} />
      <div className="px-4">

        {isMock && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-200">
              <strong>Mode MOCK — Pilote.</strong> {def.oauthNote} Les données de cette connexion sont simulées.
            </div>
          </div>
        )}

        {/* Provider card */}
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl shrink-0">
            {def.icon}
          </div>
          <div>
            <div className="font-black text-white text-xl">{def.name}</div>
            <div className="text-sm text-slate-400">{def.serviceType.replace('_',' ')}</div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1.5
              ${taximeterEnabled ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
              <Gauge size={9} />
              {taximeterEnabled ? 'Taximètre: ACTIF' : 'Taximètre: DÉSACTIVÉ'}
            </div>
          </div>
        </div>

        {/* ─── INFO STEP ───────────────────────────────── */}
        {step === 'info' && (
          <div className="space-y-4">
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔐 Comment ça fonctionne</div>
              <div className="space-y-3">
                {[
                  { icon:'1️⃣', text:`Vous serez redirigé vers ${def.name}` },
                  { icon:'2️⃣', text:`Vous vous connectez à votre compte ${def.name}` },
                  { icon:'3️⃣', text:`${def.name} vous demande votre consentement` },
                  { icon:'4️⃣', text:`Taximètre.GOV reçoit une autorisation — aucun mot de passe` },
                  { icon:'5️⃣', text:`Votre compte est lié à votre profil Taximètre.GOV` },
                ].map(s => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{s.icon}</span>
                    <span className="text-sm text-slate-300">{s.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-qc-blue-light" />
                <span className="font-semibold text-white text-sm">Jamais votre mot de passe {def.name}</span>
              </div>
              <p className="text-xs text-slate-400">{def.connectInstructions}</p>
            </Card>

            {def.apiApprovalRequired && (
              <Card className="border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-300">
                    <strong>Approbation requise:</strong> L'accès officiel à l'API {def.name} nécessite une approbation de {def.name}. En mode pilote, cette connexion est simulée (MOCK).
                  </div>
                </div>
              </Card>
            )}

            <button onClick={handleConnect}
              className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold text-base hover:bg-qc-blue-dark active:scale-98 transition-all shadow-lg shadow-blue-900/40">
              Continuer vers les autorisations →
            </button>
            <button onClick={() => router.back()}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm font-semibold hover:bg-slate-800 transition-all">
              Annuler
            </button>
          </div>
        )}

        {/* ─── PERMISSIONS STEP ────────────────────────── */}
        {step === 'permissions' && (
          <div className="space-y-4">
            <Card>
              <div className="font-semibold text-white text-sm mb-1">Autorisations demandées</div>
              <div className="text-xs text-slate-500 mb-4">Taximètre.GOV demandera accès à :</div>
              <div className="space-y-3">
                {def.oauthScopes.length > 0 ? def.oauthScopes.map(scope => (
                  <div key={scope} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white font-mono">{scope}</div>
                      <div className="text-[10px] text-slate-500">
                        {scope === 'partner.accounts' ? 'Identité du compte chauffeur' :
                         scope === 'partner.trips' ? 'Historique des courses/livraisons' :
                         scope === 'partner.payments' ? 'Données de revenus et paiements' :
                         scope === 'rides.read' ? 'Courses Lyft' :
                         scope === 'profile' ? 'Informations du profil' :
                         scope === 'dasher.read' ? 'Informations Dasher' :
                         scope === 'payments.read' ? 'Données de paiement' : scope}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-slate-400">Scopes en cours de définition avec {def.name}</div>
                )}
              </div>
              <div className="border-t border-slate-800 mt-4 pt-4">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-2">Non demandé:</div>
                {['Messages personnels', 'Contacts', 'Données inutiles au registre fiscal'].map(r => (
                  <div key={r} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-red-400">✕</span> {r}
                  </div>
                ))}
              </div>
            </Card>

            <button onClick={handleAuthorize}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-500 active:scale-98 transition-all shadow-lg shadow-green-900/40 flex items-center justify-center gap-2">
              <ExternalLink size={16} /> {isMock ? 'Simuler la connexion (MOCK)' : `Se connecter chez ${def.name}`}
            </button>
            <button onClick={() => setStep('info')}
              className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm font-semibold hover:bg-slate-800 transition-all">
              ← Retour
            </button>
          </div>
        )}

        {/* ─── CONNECTING STEP ─────────────────────────── */}
        {step === 'connecting' && (
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2 animate-pulse">{def.icon}</div>
              <div className="font-bold text-white mb-1">Connexion en cours...</div>
              {isMock && <div className="text-[10px] text-amber-400">MOCK — Simulation OAuth</div>}
            </div>
            <div className="space-y-3">
              {flow.map((s, i) => (
                <div key={s.step} className={`flex items-start gap-3 transition-all ${i < flowStep ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold
                    ${i < flowStep ? 'bg-green-500 text-white' : i === flowStep ? 'bg-qc-blue text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                    {i < flowStep ? '✓' : s.step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{s.label}</div>
                    <div className="text-[10px] text-slate-400">{s.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ─── SUCCESS ─────────────────────────────────── */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <div className="text-xl font-black text-white mb-1">Connecté !</div>
            <div className="text-sm text-slate-400 mb-1">{def.name} lié à votre profil</div>
            {isMock && <div className="text-[10px] text-amber-400 mb-6">MOCK — Connexion simulée</div>}
            <div className="driver-card p-4 mb-6 text-left space-y-2">
              {[
                { label:'Fournisseur', val:def.name },
                { label:'Activité', val:def.serviceType.replace('_',' ') },
                { label:'Taximètre', val: taximeterEnabled ? '🟢 ACTIF' : '⚫ DÉSACTIVÉ' },
                { label:'Scopes', val:def.oauthScopes.join(', ') || 'N/A' },
                { label:'Statut', val:'✅ CONNECTED' },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{s.label}</span>
                  <span className="text-white font-medium text-right max-w-[60%] truncate">{s.val}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/platforms')}
              className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold text-base hover:bg-qc-blue-dark transition-all">
              ← Retour aux plateformes
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>}>
      <ConnectContent />
    </Suspense>
  )
}
