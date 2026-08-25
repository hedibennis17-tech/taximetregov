'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { driverAnalytics, geoAnalytics, formatCAD, formatNum } from '@/data/analytics.mock'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, Shield } from 'lucide-react'

const activityColors = ['#003DA5','#1A56C4','#F97316','#22C55E']

export default function DriverAnalyticsPage() {
  const avgRev = formatCAD(driverAnalytics.avgRevenue, 0)
  const medianRev = formatCAD(driverAnalytics.medianRevenue, 0)

  return (
    <AppShell>
      <PageHeader title="Driver Analytics" subtitle="Statistiques agrégées · Données individuelles protégées par RBAC · SIMULATION" />

      <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <Shield size={13} className="shrink-0" />
        Les informations individuelles restent protégées par RBAC. Cette page affiche des statistiques agrégées.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Enregistrés" value={driverAnalytics.registered} large icon={<Users size={16} />} color="blue" />
        <KpiCard label="Actifs" value={driverAnalytics.active} large color="green" />
        <KpiCard label="Inactifs" value={driverAnalytics.inactive} color="gray" />
        <KpiCard label="Suspendus" value={driverAnalytics.suspended} color="red" />
        <KpiCard label="En attente" value={driverAnalytics.pending} color="orange" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Revenu moyen" value={avgRev} icon={<TrendingUp size={16} />} color="blue" />
        <KpiCard label="Revenu médian" value={medianRev} color="green" />
        <KpiCard label="Top 10% revenu" value={formatCAD(driverAnalytics.topDecile, 0)} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Chauffeurs par activité</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={driverAnalytics.byActivity} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={65}>
                {driverAnalytics.byActivity.map((_,i)=><Cell key={i} fill={activityColors[i]} />)}
              </Pie>
              <Tooltip formatter={(v:number)=>`${v} chauffeurs`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {driverAnalytics.byActivity.map((a,i)=>(
              <div key={a.type} className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:activityColors[i]}} /><span className="text-slate-500">{a.type}</span></div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{a.count}</span>
                  <span className="text-slate-400 ml-2">{formatCAD(a.revenue, 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Revenus par région</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={geoAnalytics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize:9, fill:'#94a3b8' }} tickFormatter={(v:number)=>`${(v/1000).toFixed(0)}k$`} />
              <YAxis type="category" dataKey="region" tick={{ fontSize:10, fill:'#64748b' }} width={80} />
              <Tooltip formatter={(v:number)=>formatCAD(v, 0)} />
              <Bar dataKey="revenue" fill="#003DA5" radius={[0,4,4,0]} name="Revenus" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Analytique géographique — par région</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Région','Chauffeurs','Activités','Revenus','TPS+TVQ','Dossiers'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {geoAnalytics.map(r=>(
                <tr key={r.region} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-2.5 font-semibold text-sm text-slate-700 dark:text-slate-200">{r.region}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{r.drivers}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatNum(r.activities)}</td>
                  <td className="px-4 py-2.5 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCAD(r.revenue, 0)}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-blue-600">{formatCAD(r.tps + r.tvq, 0)}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">{r.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
