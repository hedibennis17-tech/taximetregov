'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockAccessLogs, rbacPermissions, retentionPolicies, type GovernmentRole } from '@/data/compliance.mock'
import { Shield, Lock, Eye, AlertCircle, CheckCircle, Key, FileText, Database } from 'lucide-react'
import { useState } from 'react'

const roleColors: Record<GovernmentRole, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  TAX_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  COMPLIANCE_OFFICER: 'bg-blue-100 text-blue-700 border-blue-200',
  AUDITOR: 'bg-green-100 text-green-700 border-green-200',
  SUPPORT_AGENT: 'bg-amber-100 text-amber-700 border-amber-200',
  ANALYST: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SYSTEM_ADMIN: 'bg-slate-100 text-slate-700 border-slate-200',
}

const roleDescriptions: Record<GovernmentRole, string> = {
  SUPER_ADMIN: 'Administration complète — Accès total',
  TAX_ADMIN: 'Fiscalité — Calculs, déclarations, ajustements',
  COMPLIANCE_OFFICER: 'Conformité — Dossiers, anomalies, notifications',
  AUDITOR: 'Consultation lecture seule — Audit trail',
  SUPPORT_AGENT: 'Support limité — Données de base uniquement',
  ANALYST: 'Statistiques agrégées — Sans données nominatives sensibles',
  SYSTEM_ADMIN: 'Infrastructure — Webhooks, intégrations',
}

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState<'governance' | 'access' | 'rbac' | 'retention'>('governance')
  const roles = Object.keys(rbacPermissions) as GovernmentRole[]

  const tabs = [
    { key: 'governance', label: 'Gouvernance' },
    { key: 'access', label: 'Journal d\'accès' },
    { key: 'rbac', label: 'RBAC — Permissions' },
    { key: 'retention', label: 'Rétention' },
  ] as const

  return (
    <AppShell>
      <PageHeader title="Confidentialité & Gouvernance des données" subtitle="Privacy by Design · RBAC · Chiffrement · Journalisation · Minimisation" />

      {/* Privacy principles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Lock size={18} />, title: 'Chiffrement', desc: 'AES-256 en repos · TLS 1.3 en transit · Field-level pour données sensibles', color: 'text-blue-600 bg-blue-50' },
          { icon: <Shield size={18} />, title: 'NAS / Identité', desc: 'Jamais dans les transactions · Module Identity Vault séparé · Accès extrêmement restreint', color: 'text-red-600 bg-red-50' },
          { icon: <Eye size={18} />, title: 'Minimisation', desc: 'Chaque rôle voit uniquement ce dont il a besoin · Least privilege · Séparation des fonctions', color: 'text-purple-600 bg-purple-50' },
          { icon: <Database size={18} />, title: 'Rétention', desc: 'Politiques versionnées par catégorie · Legal hold · Suppression contrôlée', color: 'text-green-600 bg-green-50' },
        ].map(p => (
          <Card key={p.title} className="p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.color} mb-3`}>{p.icon}</div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">{p.title}</div>
            <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-white dark:bg-slate-900 text-qc-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GOVERNANCE */}
      {activeTab === 'governance' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Identity Vault — Données sensibles</div>
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs text-red-700">
                <strong>NAS / Numéro d'assurance sociale</strong> : N'est jamais affiché dans le dashboard général, jamais copié dans les transactions, jamais utilisé comme identifiant externe, jamais visible sans autorisation explicite. Le module Identity Vault est séparé avec accès extrêmement limité, chiffrement fort et journalisation de chaque accès.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: 'Government ID (TG-XXXXXX)', display: '✅ Affiché', sensitive: false, note: 'Identifiant interne non-sensible' },
                { field: 'NAS / SIN', display: '🔴 MASQUÉ', sensitive: true, note: 'Identity Vault uniquement · Accès restreint' },
                { field: 'Nom complet', display: '✅ Affiché (si autorisé)', sensitive: false, note: 'Selon rôle et contexte' },
                { field: 'Email / Téléphone', display: '⚠ Partiel', sensitive: true, note: 'Support: masqué · Admin: complet' },
                { field: 'Adresse', display: '⚠ Restreint', sensitive: true, note: 'Conformité uniquement' },
                { field: 'Données bancaires', display: '🔴 JAMAIS', sensitive: true, note: 'Hors du système' },
              ].map(r => (
                <div key={r.field} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${r.sensitive ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{r.field}</div>
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{r.display}</div>
                    <div className="text-[9px] text-slate-400">{r.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Architecture de confidentialité</div>
            <div className="space-y-2 text-xs">
              {[
                ['Chiffrement en repos', 'AES-256 pour tokens, credentials, données sensibles', 'ok'],
                ['Chiffrement en transit', 'TLS 1.3 minimum — toutes les communications', 'ok'],
                ['Field-level encryption', 'NAS, tokens OAuth — chiffrés au niveau du champ', 'ok'],
                ['RBAC granulaire', '7 rôles · Permissions par ressource · Least privilege', 'ok'],
                ['Journalisation des accès', 'Qui a vu quoi · Quand · Pourquoi', 'ok'],
                ['Contrôles d\'export', 'Export limité aux données autorisées par rôle', 'ok'],
                ['Legal Hold', 'Dossiers actifs — suppression suspendue', 'ok'],
                ['Data Minimization', 'Chaque service reçoit uniquement ce dont il a besoin', 'ok'],
              ].map(([label, desc, status]) => (
                <div key={label} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <CheckCircle size={13} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{label}</div>
                    <div className="text-[10px] text-slate-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ACCESS LOGS */}
      {activeTab === 'access' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Journal d'accès aux données</div>
            <div className="text-[10px] text-slate-400">Chaque consultation sensible est enregistrée · Qui · Quoi · Quand · Pourquoi</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {mockAccessLogs.map(log => (
              <div key={log.id} className="px-4 py-3 flex items-start gap-4">
                <div className="shrink-0">
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{log.agentId}</div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleColors[log.agentRole]}`}>{log.agentRole}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${log.action === 'VIEW' ? 'bg-blue-100 text-blue-700' : log.action === 'EXPORT' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                      {log.action}
                    </span>
                    <span className="font-semibold">{log.resource}</span>
                    <span className="font-mono text-[10px] text-qc-blue">{log.resourceId}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Raison: {log.reason}</span>
                    <span>·</span>
                    <span className="font-mono">{new Date(log.timestamp).toLocaleString('fr-CA')}</span>
                  </div>
                </div>
                <Eye size={13} className="text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RBAC */}
      {activeTab === 'rbac' && (
        <div className="space-y-4">
          {roles.map(role => {
            const perms = rbacPermissions[role]
            const isAll = perms.includes('*')
            return (
              <Card key={role} className="p-4">
                <div className="flex items-start gap-4">
                  <div>
                    <span className={`inline-flex text-xs font-bold px-2 py-1 rounded border ${roleColors[role]}`}>{role}</span>
                    <p className="text-xs text-slate-500 mt-1">{roleDescriptions[role]}</p>
                  </div>
                  <div className="flex-1">
                    {isAll ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <Key size={13} className="text-red-600" />
                        <span className="text-xs text-red-700 font-bold">Accès total (* — SUPER_ADMIN uniquement)</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {perms.map(p => (
                          <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-600">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* RETENTION */}
      {activeTab === 'retention' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Politiques de rétention</div>
            <div className="text-[10px] text-slate-400">Configurables · Basées sur les exigences légales applicables · Legal Hold disponible</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {retentionPolicies.map(p => (
              <div key={p.category} className="px-4 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{p.category}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.legalBasis}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-qc-blue">{p.retentionYears}</div>
                  <div className="text-[10px] text-slate-400">ans</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-amber-50">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <AlertCircle size={13} />
              <span><strong>Legal Hold</strong> : Tout dossier soumis à une obligation de conservation voit sa suppression automatiquement suspendue. Statut: SUSPENDED · Raison: ACTIVE_CASE</span>
            </div>
          </div>
        </Card>
      )}
    </AppShell>
  )
}
