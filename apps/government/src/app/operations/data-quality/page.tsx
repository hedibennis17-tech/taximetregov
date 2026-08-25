'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { dataQualityScores, type DataQualityGrade } from '@/data/operations.mock'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

const gradeColors: Record<DataQualityGrade, string> = {
  GOOD: 'text-green-600 bg-green-100 border-green-200',
  WARNING: 'text-amber-600 bg-amber-100 border-amber-200',
  CRITICAL: 'text-red-600 bg-red-100 border-red-200',
}
const gradeBarColors: Record<DataQualityGrade, string> = {
  GOOD: 'bg-green-500', WARNING: 'bg-amber-500', CRITICAL: 'bg-red-500'
}
const gradeIcons: Record<DataQualityGrade, React.ReactNode> = {
  GOOD: <CheckCircle size={16} className="text-green-600" />,
  WARNING: <AlertTriangle size={16} className="text-amber-600" />,
  CRITICAL: <XCircle size={16} className="text-red-600" />,
}

export default function DataQualityPage() {
  const avgScore = Math.round(dataQualityScores.reduce((s, d) => s + d.score, 0) / dataQualityScores.length)
  const warnings = dataQualityScores.filter(d => d.grade === 'WARNING').length
  const criticals = dataQualityScores.filter(d => d.grade === 'CRITICAL').length
  const totalIssues = dataQualityScores.reduce((s, d) => s + d.issues, 0)

  return (
    <AppShell>
      <PageHeader
        title="Data Quality Center"
        subtitle="Qualité des données · Doublons · Données manquantes · Erreurs"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw size={12} /> Relancer analyse
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Score global" value={`${avgScore}/100`} large icon={<CheckCircle size={16} />} color={avgScore >= 90 ? 'green' : avgScore >= 75 ? 'orange' : 'red'} />
        <KpiCard label="Avertissements" value={warnings} icon={<AlertTriangle size={16} />} color="orange" />
        <KpiCard label="Critiques" value={criticals} icon={<XCircle size={16} />} color="red" />
        <KpiCard label="Issues détectées" value={totalIssues} color="gray" />
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {dataQualityScores.map(domain => (
          <Card key={domain.domain} className={`p-5 border ${domain.grade === 'CRITICAL' ? 'border-red-200' : domain.grade === 'WARNING' ? 'border-amber-200' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-slate-700 dark:text-slate-200">{domain.domain}</div>
              <div className="flex items-center gap-2">
                {gradeIcons[domain.grade]}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${gradeColors[domain.grade]}`}>{domain.grade}</span>
              </div>
            </div>

            {/* Score */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Score qualité</span>
                <span className={`font-bold ${domain.grade === 'GOOD' ? 'text-green-600' : domain.grade === 'WARNING' ? 'text-amber-600' : 'text-red-600'}`}>{domain.score}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${gradeBarColors[domain.grade]}`} style={{ width: `${domain.score}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{domain.issues} issue(s) sur {domain.total}</span>
              {domain.issues > 0 && (
                <button className="text-[10px] text-qc-blue hover:underline font-medium">Voir →</button>
              )}
            </div>

            {domain.details && (
              <p className="text-[10px] text-slate-400 mt-2 italic">{domain.details}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Data quality rules */}
      <Card className="p-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Règles de qualité surveillées</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { rule: 'Données manquantes', count: 3, status: 'WARNING' as DataQualityGrade },
            { rule: 'Comptes non-associés', count: 5, status: 'WARNING' as DataQualityGrade },
            { rule: 'Doublons détectés', count: 0, status: 'GOOD' as DataQualityGrade },
            { rule: 'Transactions invalides', count: 2, status: 'WARNING' as DataQualityGrade },
            { rule: 'Erreurs calcul taxe', count: 1, status: 'WARNING' as DataQualityGrade },
            { rule: 'Données véhicule', count: 4, status: 'WARNING' as DataQualityGrade },
            { rule: 'Licences incohérentes', count: 2, status: 'WARNING' as DataQualityGrade },
            { rule: 'Documents expirés', count: 8, status: 'CRITICAL' as DataQualityGrade },
          ].map(r => (
            <div key={r.rule} className={`p-3 rounded-xl border ${gradeColors[r.status]} flex items-start gap-2`}>
              <div className="shrink-0 mt-0.5">{gradeIcons[r.status]}</div>
              <div>
                <div className="text-xs font-semibold">{r.rule}</div>
                <div className="text-[10px] opacity-80">{r.count} issue(s)</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
