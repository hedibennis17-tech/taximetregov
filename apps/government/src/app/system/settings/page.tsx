'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { systemSettings } from '@/data/operations.mock'
import { useState } from 'react'
import { Settings, Shield, Percent, Bell, Database, Clock, Lock, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general'|'security'|'tax'|'notifications'|'retention'>('general')

  const tabs = [
    { key:'general', label:'Général', icon:<Settings size={14}/> },
    { key:'security', label:'Sécurité', icon:<Shield size={14}/> },
    { key:'tax', label:'Fiscal', icon:<Percent size={14}/> },
    { key:'notifications', label:'Notifications', icon:<Bell size={14}/> },
    { key:'retention', label:'Rétention', icon:<Database size={14}/> },
  ] as const

  return (
    <AppShell>
      <PageHeader title="Configuration système" subtitle="Paramètres versionnés · Toute modification génère un audit · Maker-Checker requis pour les changements sensibles" />

      {/* Config versioning notice */}
      <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200">
        <AlertCircle size={14} className="text-qc-blue mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700">
          <strong>Configuration versionnée :</strong> Chaque modification sensible crée une entrée <code className="bg-blue-100 px-1 rounded">ConfigurationVersion</code> avec before/after, acteur, raison et timestamp. Les valeurs ne sont jamais écrasées silencieusement. Les taux fiscaux proviennent du Tax Rule Service — jamais hardcodés ici.
        </div>
      </div>

      <div className="flex gap-1 mb-5 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${activeTab === t.key ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* GENERAL */}
      {activeTab === 'general' && (
        <Card className="p-5">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Paramètres généraux</div>
          <div className="space-y-4 max-w-lg">
            {[
              { label:'Nom de la plateforme', val:systemSettings.general.platformName, editable:false },
              { label:'Environnement', val:systemSettings.general.environment, editable:false },
              { label:'Langue par défaut', val:systemSettings.general.defaultLanguage.toUpperCase(), editable:true },
              { label:'Fuseau horaire', val:systemSettings.general.defaultTimezone, editable:true },
              { label:'Mode maintenance', val:systemSettings.general.maintenanceMode ? 'ACTIVÉ' : 'DÉSACTIVÉ', editable:true, sensitive:true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.label}</div>
                  {s.sensitive && <div className="text-[10px] text-amber-600">⚠ Maker-Checker requis</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">{s.val}</span>
                  {s.editable && (
                    <button className="text-xs text-qc-blue hover:underline">Modifier</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SECURITY */}
      {activeTab === 'security' && (
        <Card className="p-5">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Paramètres de sécurité</div>
          <div className="space-y-4 max-w-lg">
            {[
              { label:'MFA requis (gouvernement)', val:systemSettings.security.mfaRequired ? '✅ Activé' : '❌ Désactivé', warn:!systemSettings.security.mfaRequired },
              { label:'Expiration de session', val:`${systemSettings.security.sessionTimeoutMinutes} minutes`, warn:false },
              { label:'Tentatives de connexion max', val:systemSettings.security.maxLoginAttempts.toString(), warn:false },
              { label:'Longueur mot de passe min', val:`${systemSettings.security.passwordMinLength} caractères`, warn:false },
              { label:'Audit de tous les accès', val:systemSettings.security.auditAllAccess ? '✅ Activé' : '❌ Désactivé', warn:!systemSettings.security.auditAllAccess },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-700 dark:text-slate-200">{s.label}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-semibold ${s.warn ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`}>{s.val}</span>
                  <button className="text-xs text-qc-blue hover:underline">Modifier</button>
                </div>
              </div>
            ))}
          </div>
          {!systemSettings.security.mfaRequired && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <Lock size={13} /> Certains comptes n'ont pas MFA activé. Renforcement recommandé.
            </div>
          )}
        </Card>
      )}

      {/* TAX */}
      {activeTab === 'tax' && (
        <Card className="p-5">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Paramètres fiscaux</div>
          <div className="text-xs text-slate-400 mb-4">Les taux sont définis dans le Tax Rule Service — versionnés et auditables. Modification via workflow d'approbation uniquement.</div>
          <div className="space-y-4 max-w-lg">
            {[
              { label:'Juridiction par défaut', val:systemSettings.tax.defaultJurisdiction },
              { label:'Taux TPS', val:`${(systemSettings.tax.tpsRate*100).toFixed(1)}% — Tax Rule Service`, readonly:true },
              { label:'Taux TVQ', val:`${(systemSettings.tax.tvqRate*100).toFixed(3)}% — Tax Rule Service`, readonly:true },
              { label:'Seuil d\'inscription', val:`${systemSettings.tax.registrationThreshold.toLocaleString('fr-CA')} $ / an` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-700 dark:text-slate-200">{s.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">{s.val}</span>
                  {!s.readonly && <button className="text-xs text-qc-blue hover:underline">Modifier</button>}
                  {s.readonly && <span className="text-[10px] text-slate-400">Lecture seule</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Card className="p-5">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Canaux de notification</div>
          <div className="space-y-3 max-w-lg">
            {[
              { label:'Notifications in-app', enabled:systemSettings.notifications.inAppEnabled, channel:'IN_APP' },
              { label:'Notifications email', enabled:systemSettings.notifications.emailEnabled, channel:'EMAIL' },
              { label:'Notifications SMS', enabled:systemSettings.notifications.smsEnabled, channel:'SMS' },
              { label:'Notifications push', enabled:systemSettings.notifications.pushEnabled, channel:'PUSH' },
            ].map(n => (
              <div key={n.channel} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{n.channel}</div>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold ${n.enabled ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${n.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                  {n.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RETENTION */}
      {activeTab === 'retention' && (
        <Card className="p-5">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Politiques de rétention</div>
          <div className="text-xs text-slate-400 mb-4">Durées configurables selon les exigences légales. Legal Hold suspend automatiquement la suppression pour les dossiers actifs.</div>
          <div className="space-y-3 max-w-lg">
            {Object.entries(systemSettings.retention).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-700 dark:text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-qc-blue">{val} ans</span>
                  <button className="text-xs text-qc-blue hover:underline">Modifier</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <Clock size={13} /> Les modifications aux politiques de rétention requièrent une approbation de niveau SUPER_ADMIN et génèrent un ConfigurationVersion immuable.
          </div>
        </Card>
      )}
    </AppShell>
  )
}
