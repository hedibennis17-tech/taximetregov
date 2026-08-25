'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockActiveSessions, mfaPolicy } from '@/data/security.mock'
import { Shield, Lock, Monitor, Smartphone, AlertCircle, CheckCircle, LogOut } from 'lucide-react'

export default function SessionsPage() {
  const withMfa = mockActiveSessions.filter(s => s.mfaVerified).length
  const withoutMfa = mockActiveSessions.filter(s => !s.mfaVerified).length

  return (
    <AppShell>
      <PageHeader title="Gestion des sessions" subtitle="Sessions actives · MFA · Expiration · Révocation sécurisée" />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Sessions actives" value={mockActiveSessions.length} icon={<Monitor size={16}/>} color="blue" />
        <KpiCard label="Vérifiées MFA" value={withMfa} icon={<CheckCircle size={16}/>} color="green" />
        <KpiCard label="Sans MFA" value={withoutMfa} icon={<AlertCircle size={16}/>} color={withoutMfa > 0 ? 'orange' : 'green'} />
      </div>

      {withoutMfa > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-700">
          <AlertCircle size={13} className="shrink-0" />
          <span><strong>{withoutMfa} session(s) sans vérification MFA.</strong> Politique : MFA obligatoire pour les rôles ELEVATED et CRITICAL. Notification envoyée aux utilisateurs concernés.</span>
        </div>
      )}

      <Card className="mb-5">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Sessions actives</div>
          <div className="text-[10px] text-slate-400">Expiration automatique après {30} minutes d'inactivité · MFA vérifié à la connexion</div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {mockActiveSessions.map(sess => (
            <div key={sess.id} className={`px-4 py-4 flex items-start gap-4 ${sess.current ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${sess.current ? 'bg-qc-blue' : 'bg-slate-400'}`}>
                {sess.userName.split(' ').map(n=>n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{sess.userName}</span>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-1.5 py-0.5 rounded">{sess.userRole}</span>
                  {sess.current && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">SESSION COURANTE</span>}
                  <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${sess.mfaVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {sess.mfaVerified ? <><CheckCircle size={9}/> MFA vérifié</> : <><AlertCircle size={9}/> Sans MFA</>}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-slate-400">
                  <div><span className="text-slate-500 font-medium">Appareil</span><br/>{sess.deviceType} · {sess.browser}</div>
                  <div><span className="text-slate-500 font-medium">IP</span><br/><code className="font-mono">{sess.ipAddress}</code></div>
                  <div><span className="text-slate-500 font-medium">Localisation</span><br/>{sess.location}</div>
                  <div><span className="text-slate-500 font-medium">Connexion</span><br/>{new Date(sess.loginAt).toLocaleTimeString('fr-CA')}</div>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  Dernière activité : {new Date(sess.lastActivity).toLocaleString('fr-CA')}
                </div>
              </div>
              {!sess.current && (
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors shrink-0">
                  <LogOut size={11} /> Révoquer
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* MFA Policy */}
      <Card className="p-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Politique MFA — par niveau de risque</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(mfaPolicy).map(([level, policy]) => (
            <div key={level} className={`p-4 rounded-xl border ${policy.required ? 'border-qc-blue/30 bg-blue-50 dark:bg-blue-950' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className={policy.required ? 'text-qc-blue' : 'text-slate-400'} />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{level}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${policy.required ? 'bg-qc-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {policy.required ? 'OBLIGATOIRE' : 'RECOMMANDÉ'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{policy.description}</p>
              <div className="flex flex-wrap gap-1">
                {policy.roles.map(r => (
                  <span key={r} className="text-[9px] font-mono px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-400">{r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
