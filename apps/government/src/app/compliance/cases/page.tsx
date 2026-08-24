'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { mockComplianceCases, anomalySignals, type ComplianceSeverity, type CaseStatus } from '@/data/compliance.mock'
import { useState } from 'react'
import { Search, AlertTriangle, Shield, Clock, CheckCircle, User } from 'lucide-react'

const severityColors: Record<ComplianceSeverity, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-300',
  LOW: 'bg-slate-100 text-slate-600 border-slate-300',
}
const severityDots: Record<ComplianceSeverity, string> = {
  CRITICAL: 'bg-red-500 animate-pulse', HIGH: 'bg-orange-500', MEDIUM: 'bg-amber-400', LOW: 'bg-slate-300'
}
const statusColors: Record<CaseStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700', ASSIGNED: 'bg-purple-100 text-purple-700',
  IN_REVIEW: 'bg-indigo-100 text-indigo-700', WAITING_INFORMATION: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-slate-100 text-slate-600',
}
const anomalyIcons: Record<string, string> = {
  REVENUE_MISMATCH:'💰', DUPLICATE_TRANSACTION:'⚠️', MISSING_TRANSACTION:'❓',
  IMPOSSIBLE_ADJUSTMENT:'🔧', UNUSUAL_INACTIVITY:'⏸️', TAX_INCONSISTENCY:'📊', METER_ERROR:'🚕'
}
const fmt = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

export default function ComplianceCasesPage() {
  const [search, setSearch] = useState('')
  const [sevFilter, setSevFilter] = useState<ComplianceSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')

  const filtered = mockComplianceCases.filter(c => {
    const q = search.toLowerCase()
    return (!q || c.caseId.toLowerCase().includes(q) || c.driverId.toLowerCase().includes(q) || c.driverName.toLowerCase().includes(q))
      && (sevFilter === 'all' || c.severity === sevFilter)
      && (statusFilter === 'all' || c.status === statusFilter)
  })

  const severities: ComplianceSeverity[] = ['CRITICAL','HIGH','MEDIUM','LOW']
  const statuses: CaseStatus[] = ['OPEN','ASSIGNED','IN_REVIEW','WAITING_INFORMATION','RESOLVED','CLOSED']
  const counts = { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0 }
  mockComplianceCases.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').forEach(c => counts[c.severity]++)

  return (
    <AppShell>
      <PageHeader title="Dossiers de conformité" subtitle="Compliance Engine · Détection basée sur signaux · Décision humaine obligatoire" />

      {/* Important disclaimer */}
      <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200">
        <Shield size={14} className="text-qc-blue mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700">
          <strong>Principe fondamental :</strong> Une anomalie n'est PAS automatiquement une fraude. Le système détecte et priorise des signaux de risque. Toute décision administrative requiert une révision humaine selon les procédures applicables. Le score de risque (0-100) est un outil de priorisation, pas une conclusion.
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {severities.map(s => (
          <button key={s} onClick={() => setSevFilter(f => f === s ? 'all' : s)}
            className={`p-4 rounded-xl border text-left transition-all ${severityColors[s]} ${sevFilter === s ? 'ring-2 ring-offset-2 ring-current' : 'opacity-80 hover:opacity-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full shrink-0 ${severityDots[s]}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{s}</span>
            </div>
            <div className="text-3xl font-bold">{counts[s]}</div>
            <div className="text-[10px] opacity-70 mt-0.5">dossiers actifs</div>
          </button>
        ))}
      </div>

      {/* Anomaly signals */}
      <Card className="mb-5">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Signaux de risque récents — Compliance Anomaly Engine</div>
          <div className="text-[10px] text-slate-400">Signaux automatiques — Révision humaine requise avant toute action</div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {anomalySignals.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-start gap-4">
              <span className="text-xl shrink-0 mt-0.5">{anomalyIcons[a.type]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severityColors[a.severity]}`}>{a.severity}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
                  <span className="font-mono text-[10px] text-qc-blue">{a.driverId}</span>
                </div>
                <p className="text-xs text-slate-500">{a.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-sm font-bold ${a.riskScore >= 70 ? 'text-red-600' : a.riskScore >= 40 ? 'text-amber-600' : 'text-green-600'}`}>
                  {a.riskScore}/100
                </div>
                <div className="text-[9px] text-slate-400">Score de risque</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters + Table */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Case ID, chauffeur, ID..." className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all',...severities] as const).map(f => (
              <button key={f} onClick={() => setSevFilter(f as any)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${sevFilter === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Tous' : f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all',...statuses] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f as any)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-semibold transition-colors ${statusFilter === f ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Tous statuts' : f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Case ID','Chauffeur','Anomalie','Priorité','Source','Montant / Écart','Score risque','Statut','Assigné','Créé'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-3 py-3">
                    <span className="font-mono text-[10px] text-qc-blue font-bold">{c.caseId}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-xs text-slate-700 dark:text-slate-200">{c.driverName}</div>
                    <div className="font-mono text-[10px] text-qc-blue">{c.driverId}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span>{anomalyIcons[c.anomalyType]}</span>
                      <span className="text-[10px] text-slate-500">{c.anomalyType.replace(/_/g,' ')}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severityColors[c.severity]}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">{c.source}</td>
                  <td className="px-3 py-3">
                    {c.difference != null
                      ? <span className={`text-xs font-mono font-bold ${c.difference > 1000 ? 'text-red-600' : 'text-orange-600'}`}>{fmt(c.difference)}</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full w-16">
                        <div className={`h-full rounded-full ${c.riskScore >= 70 ? 'bg-red-500' : c.riskScore >= 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${c.riskScore}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${c.riskScore >= 70 ? 'text-red-600' : c.riskScore >= 40 ? 'text-amber-600' : 'text-green-600'}`}>{c.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    {c.assignedTo
                      ? <div className="flex items-center gap-1 text-[10px] text-slate-500"><User size={10} />{c.assignedTo}</div>
                      : <span className="text-[10px] text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-400 font-mono">
                    {new Date(c.createdAt).toLocaleDateString('fr-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
          {filtered.length} dossiers · Score de risque = outil de priorisation uniquement · Révision humaine obligatoire
        </div>
      </Card>
    </AppShell>
  )
}
