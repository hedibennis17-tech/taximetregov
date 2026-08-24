'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { mockAuditLogs } from '@/data/mock'
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react'

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'text-red-600 bg-red-50',
  GOVERNMENT_ADMIN: 'text-qc-blue bg-blue-50',
  TAX_ADMIN: 'text-purple-600 bg-purple-50',
  AUDITOR: 'text-green-600 bg-green-50',
  INSPECTOR: 'text-orange-600 bg-orange-50',
  SYSTEM: 'text-slate-600 bg-slate-100',
}

export default function AuditPage() {
  return (
    <AppShell>
      <PageHeader
        title="Journal d'audit"
        subtitle="Toutes les actions administratives importantes — Immuable · Signé · Horodaté"
      />

      {/* Security notice */}
      <Card className="mb-6 p-4">
        <div className="flex items-start gap-3">
          <Lock size={16} className="text-qc-blue mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Propriétés du journal d'audit :</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {[
                { icon: '🔒', label: 'Immuable', desc: 'Aucune modification possible après création' },
                { icon: '✍️', label: 'Signé', desc: 'Signature cryptographique de chaque entrée' },
                { icon: '⏱️', label: 'Horodaté', desc: 'Timestamp UTC précis (millisecondes)' },
                { icon: '🔗', label: 'Corrélé', desc: 'Correlation ID pour tracer les flux multi-actions' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span>{item.icon}</span>
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200 text-[10px]">{item.label}</div>
                    <div className="text-[9px] text-slate-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Important rule */}
      <div className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-amber-50 border border-amber-200">
        <AlertCircle size={14} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Règle de conformité :</strong> Aucun administrateur ne peut modifier silencieusement une transaction financière.
          Toute correction crée une entrée d'audit obligatoire avec motif, before/after, et identité de l'acteur.
        </p>
      </div>

      {/* Audit log table */}
      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Shield size={14} className="text-qc-blue" />
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Entrées d'audit récentes</div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {mockAuditLogs.map(log => (
            <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-start gap-4">
                {/* Actor */}
                <div className="shrink-0 w-28">
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{log.actorId}</div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${roleColors[log.actorRole] || 'text-slate-600 bg-slate-100'}`}>
                    {log.actorRole}
                  </span>
                </div>

                {/* Action */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <code className="text-xs font-mono font-bold text-qc-blue">{log.action}</code>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs text-slate-500">{log.resource}</span>
                    <span className="text-[10px] font-mono text-slate-400">{log.resourceId}</span>
                  </div>

                  {/* Before/After */}
                  {(log.before || log.after) && (
                    <div className="flex items-center gap-2 mb-1">
                      {log.before && <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-mono rounded">{log.before}</span>}
                      {log.before && log.after && <span className="text-slate-400 text-xs">→</span>}
                      {log.after && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-mono rounded">{log.after}</span>}
                    </div>
                  )}

                  {log.reason && (
                    <p className="text-xs text-slate-500 italic">Motif : {log.reason}</p>
                  )}

                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-mono">
                    <span>{new Date(log.timestamp).toLocaleString('fr-CA')}</span>
                    <span>CORR: {log.correlationId}</span>
                  </div>
                </div>

                {/* Integrity indicator */}
                <div className="shrink-0">
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Roles reference */}
      <Card className="mt-6 p-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Rôles système (RBAC)</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { role: 'SUPER_ADMIN', desc: 'Accès total' },
            { role: 'GOVERNMENT_ADMIN', desc: 'Administration générale' },
            { role: 'TRANSPORT_ADMIN', desc: 'Chauffeurs et véhicules' },
            { role: 'TAX_ADMIN', desc: 'Fiscalité et déclarations' },
            { role: 'INSPECTOR', desc: 'Inspections et permis' },
            { role: 'AUDITOR', desc: 'Lecture audit uniquement' },
            { role: 'ANALYST', desc: 'Analytics en lecture' },
            { role: 'SUPPORT_AGENT', desc: 'Support de niveau 1' },
            { role: 'READ_ONLY', desc: 'Lecture seule globale' },
          ].map(r => (
            <div key={r.role} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${roleColors[r.role] || 'text-slate-600 bg-slate-100'}`}>{r.role}</span>
              <span className="text-[10px] text-slate-500">{r.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
