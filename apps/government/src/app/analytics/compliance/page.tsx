'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { complianceAnalytics, webhookAnalytics, reconciliationAnalytics, formatCAD, formatNum, PLATFORM_COLORS_7 } from '@/data/analytics.mock'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AlertTriangle, Scale, Wifi, CheckCircle } from 'lucide-react'

export default function ComplianceAnalyticsPage() {
  return (
    <AppShell>
      <PageHeader title="Compliance & Webhook Analytics" subtitle="Anomalies · Risques · Webhooks · Réconciliation · SIMULATION" />

      {/* Compliance section */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Compliance Analytics</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Dossiers ouverts" value={complianceAnalytics.openCases} icon={<AlertTriangle size={16} />} color="orange" />
        <KpiCard label="Résolus (30j)" value={complianceAnalytics.resolved} icon={<CheckCircle size={16} />} color="green" />
        <KpiCard label="Taux résolution" value={`${complianceAnalytics.resolutionRatePercent.toFixed(1)}%`} color={complianceAnalytics.resolutionRatePercent >= 80 ? 'green' : 'orange'} sub="Cible : ≥80%" />
        <KpiCard label="Délai moyen" value={`${complianceAnalytics.avgResolutionDays}j`} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Risk distribution */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Distribution des risques</div>
          <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">Score de risque = outil de priorisation uniquement. Aucune décision automatique.</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={complianceAnalytics.riskDistribution} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={55}>
                {complianceAnalytics.riskDistribution.map((r,i)=><Cell key={i} fill={r.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {complianceAnalytics.riskDistribution.map(r=>(
              <div key={r.level} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:r.color}} />
                  <span className="text-slate-500 text-[10px]">{r.level}</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">{r.count} dossiers</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Cases by type */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Dossiers par type d'anomalie</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complianceAnalytics.byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize:9, fill:'#94a3b8' }} allowDecimals={false} />
              <YAxis type="category" dataKey="type" tick={{ fontSize:8, fill:'#64748b' }} width={110} tickFormatter={(v:string)=>v.replace('_',' ').toLowerCase().replace(/^\w/,c=>c.toUpperCase())} />
              <Tooltip />
              <Bar dataKey="count" fill="#003DA5" radius={[0,4,4,0]} name="Dossiers" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Compliance trend */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Tendance — Dossiers</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={complianceAnalytics.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Line type="monotone" dataKey="opened" name="Ouverts" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Résolus" stroke="#22C55E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Webhook section */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Webhook Analytics</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Reçus" value={formatNum(webhookAnalytics.received)} icon={<Wifi size={16} />} color="blue" />
        <KpiCard label="Traités" value={formatNum(webhookAnalytics.processed)} color="green" sub={`${webhookAnalytics.successRatePercent}%`} />
        <KpiCard label="Doublons bloqués" value={webhookAnalytics.duplicates} color="orange" />
        <KpiCard label="Échecs" value={webhookAnalytics.failed} color={webhookAnalytics.failed > 10 ? 'red' : 'orange'} sub={`DL: ${webhookAnalytics.deadLetter}`} />
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Webhooks par plateforme — Aujourd'hui</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Plateforme','Reçus','Traités','Doublons','Échecs','Latence moy.','Taux succès'].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhookAnalytics.byPlatform.map(p=>{
                const rate = Math.round(p.processed/p.received*100)
                return (
                  <tr key={p.provider} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{background:PLATFORM_COLORS_7[p.provider]}} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">{p.provider}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">{formatNum(p.received)}</td>
                    <td className="px-3 py-2.5 text-xs text-green-600 font-semibold">{formatNum(p.processed)}</td>
                    <td className="px-3 py-2.5 text-xs text-amber-600">{p.duplicates}</td>
                    <td className="px-3 py-2.5 text-xs text-red-500">{p.failed}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{p.avgMs > 0 ? `${p.avgMs}ms` : '⚠ timeout'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-16">
                          <div className={`h-full rounded-full ${rate >= 98 ? 'bg-green-500' : rate >= 90 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width:`${rate}%`}} />
                        </div>
                        <span className={`text-xs font-bold ${rate >= 98 ? 'text-green-600' : rate >= 90 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
