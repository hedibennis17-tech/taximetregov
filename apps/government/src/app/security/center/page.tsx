'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card, KpiCard } from '@/components/ui'
import { mockSecurityAlerts, mockSecurityIncidents, mockActiveSessions, securityPosture } from '@/data/security.mock'
import { Shield, AlertTriangle, Users, Lock, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const alertIcons: Record<string, string> = {
  MULTIPLE_FAILED_LOGIN:'🔐', WEBHOOK_SIGNATURE_FAILURE:'🔔', UNUSUAL_ACCESS:'👁️',
  PRIVILEGE_CHANGE:'🔑', MASS_EXPORT:'📤', RATE_LIMIT:'🚦', SUSPICIOUS_ACTIVITY:'⚠️'
}
const statusColors: Record<string, string> = {
  READY:'text-green-600 bg-green-100', PARTIAL:'text-amber-600 bg-amber-100',
  REVIEW_REQUIRED:'text-red-600 bg-red-100', MISSING:'text-red-700 bg-red-200'
}

export default function SecurityCenterPage() {
  const openAlerts = mockSecurityAlerts.filter(a => !a.resolved)
  const activeIncidents = mockSecurityIncidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED')
  const noMfaSessions = mockActiveSessions.filter(s => !s.mfaVerified)

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Security Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Score: {securityPosture.overall}/100</span>
          </div>
          <p className="text-sm text-slate-500">Sécurité · Confidentialité · Gouvernance · Zero Trust</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><RefreshCw size={11} /> {new Date().toLocaleTimeString('fr-CA')}</div>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200">
        <Shield size={14} className="text-qc-blue mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700"><strong>Zero Trust :</strong> Aucune confiance implicite au frontend. Toutes les permissions critiques vérifiées backend. Actions sensibles = auth + autorisation + audit. Erreurs sans détails système internes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Alertes ouvertes" value={openAlerts.length} icon={<AlertTriangle size={16} />} color={openAlerts.length > 3 ? 'red' : 'orange'} />
        <KpiCard label="Incidents actifs" value={activeIncidents.length} icon={<Shield size={16} />} color={activeIncidents.length > 0 ? 'orange' : 'green'} />
        <KpiCard label="Sessions actives" value={mockActiveSessions.length} icon={<Users size={16} />} color="blue" />
        <KpiCard label="Sessions sans MFA" value={noMfaSessions.length} icon={<Lock size={16} />} color={noMfaSessions.length > 0 ? 'orange' : 'green'} />
      </div>

      <Card className="mb-5 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Security Posture Score</div>
            <div className="text-[10px] text-slate-400">Indicateur interne — Pas une certification gouvernementale officielle</div>
          </div>
          <div className={`text-3xl font-bold ${securityPosture.overall >= 80 ? 'text-green-600' : securityPosture.overall >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {securityPosture.overall}<span className="text-lg text-slate-400">/100</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {securityPosture.categories.map(cat => (
            <div key={cat.name} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusColors[cat.status]}`}>{cat.status}</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-1">
                <div className={`h-full rounded-full ${cat.score >= 80 ? 'bg-green-500' : cat.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width:`${cat.score}%` }} />
              </div>
              <div className="flex justify-between">
                <p className="text-[9px] text-slate-400 flex-1 leading-snug">{cat.notes}</p>
                <span className={`text-[10px] font-bold ml-1 ${cat.score >= 80 ? 'text-green-600' : cat.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{cat.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Alertes de sécurité</div>
            <Link href="/security/monitoring" className="text-xs text-qc-blue hover:underline">Tout voir →</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {mockSecurityAlerts.filter(a => !a.resolved).map(alert => (
              <div key={alert.id} className="px-4 py-3 flex items-start gap-3">
                <span className="text-lg shrink-0">{alertIcons[alert.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{alert.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${alert.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{alert.severity}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">{alert.description.substring(0, 75)}...</p>
                  {alert.actor && <div className="text-[10px] text-qc-blue font-mono mt-0.5">{alert.actor}</div>}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${alert.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{alert.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Sessions actives</div>
            <Link href="/security/sessions" className="text-xs text-qc-blue hover:underline">Gérer →</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {mockActiveSessions.map(sess => (
              <div key={sess.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${sess.current ? 'bg-qc-blue' : 'bg-slate-400'}`}>
                  {sess.userName.split(' ').map(n=>n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{sess.userName}</span>
                    {sess.current && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">COURANTE</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sess.mfaVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{sess.mfaVerified ? '🔐 MFA' : '⚠ Sans MFA'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{sess.userRole} · {sess.browser} · {sess.location}</div>
                  <div className="text-[10px] font-mono text-slate-400">{sess.ipAddress}</div>
                </div>
                {!sess.current && <button className="text-[10px] text-red-500 hover:underline shrink-0">Révoquer</button>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {activeIncidents.length > 0 && (
        <Card className="mb-5 border-orange-200 dark:border-orange-900">
          <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-900 font-semibold text-sm text-orange-700">Incidents de sécurité actifs</div>
          {activeIncidents.map(inc => (
            <div key={inc.id} className="p-4">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{inc.title}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{inc.severity}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{inc.status}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{inc.description}</p>
              <div className="space-y-1.5">
                {inc.timeline.map((e,i)=>(
                  <div key={i} className="flex items-start gap-2 text-[10px] text-slate-500">
                    <span className="font-mono text-slate-400 w-10 shrink-0">{e.time}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-qc-blue mt-0.5 shrink-0" />
                    <span className="flex-1">{e.event}</span>
                    <span className="text-slate-400 shrink-0">{e.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href:'/security/monitoring', label:'Security Monitoring', icon:'🔍' },
          { href:'/security/sessions', label:'Gestion Sessions', icon:'🔐' },
          { href:'/governance/center', label:'Gouvernance', icon:'⚖️' },
          { href:'/privacy/center', label:'Confidentialité & PII', icon:'🔒' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-qc-blue/40 transition-all group">
            <span className="text-2xl">{l.icon}</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-qc-blue transition-colors">{l.label}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
