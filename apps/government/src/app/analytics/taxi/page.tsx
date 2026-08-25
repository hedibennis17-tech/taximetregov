'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { taxiAnalytics, deliveryAnalytics, formatCAD, formatNum, PLATFORM_COLORS_7 } from '@/data/analytics.mock'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Car, Package, Gauge } from 'lucide-react'

export default function TaxiAnalyticsPage() {
  return (
    <AppShell>
      <PageHeader title="Taxi Analytics" subtitle="Courses · Taximètres · Paiements · Performances · SIMULATION" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Courses taxi" value={formatNum(taxiAnalytics.trips)} large icon={<Car size={16} />} color="blue" />
        <KpiCard label="Revenus taxi" value={formatCAD(taxiAnalytics.revenue, 0)} large icon={<Gauge size={16} />} color="green" />
        <KpiCard label="Tarif moyen" value={formatCAD(taxiAnalytics.avgFare)} color="blue" sub={`${taxiAnalytics.avgDistanceKm} km moy.`} />
        <KpiCard label="Durée moyenne" value={`${taxiAnalytics.avgDurationMin} min`} color="purple" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Sessions taximètre" value={formatNum(taxiAnalytics.meterSessions)} color="blue" />
        <KpiCard label="Instances certifiées" value={`${taxiAnalytics.certifiedInstances}/${taxiAnalytics.meterInstances}`} color="green" />
        <KpiCard label="Versions obsolètes" value={taxiAnalytics.outdatedVersions} color={taxiAnalytics.outdatedVersions > 0 ? 'orange' : 'green'} />
        <KpiCard label="Erreurs taximètre" value={taxiAnalytics.meterErrors} color={taxiAnalytics.meterErrors > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Payment breakdown */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Méthodes de paiement — Taxi</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={taxiAnalytics.paymentBreakdown} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={60}>
                {taxiAnalytics.paymentBreakdown.map((_,i)=><Cell key={i} fill={['#003DA5','#1A56C4','#64748B','#3B82F6'][i]} />)}
              </Pie>
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {taxiAnalytics.paymentBreakdown.map((p,i)=>(
              <div key={p.method} className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:['#003DA5','#1A56C4','#64748B','#3B82F6'][i]}} />
                  <span className="text-slate-500">{p.method} ({p.pct}%)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatCAD(p.amount, 0)}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{formatNum(p.count)} tx</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Hourly taxi */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Courses taxi par heure</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taxiAnalytics.byHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize:9, fill:'#94a3b8' }} interval={3} />
              <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="trips" fill="#003DA5" radius={[2,2,0,0]} name="Courses" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Delivery section */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Delivery Analytics</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total livraisons" value={formatNum(deliveryAnalytics.total)} large icon={<Package size={16} />} color="orange" />
        <KpiCard label="Revenus livraisons" value={formatCAD(deliveryAnalytics.revenue, 0)} large color="green" />
        <KpiCard label="Pourboires" value={formatCAD(deliveryAnalytics.tips, 0)} color="purple" />
        <KpiCard label="Net livraisons" value={formatCAD(deliveryAnalytics.net, 0)} color="green" />
      </div>
      <Card>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Livraisons par plateforme</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Plateforme','Livraisons','Revenus','Pourboires','Net moyen'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveryAnalytics.byPlatform.map(p=>(
                <tr key={p.platform} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:PLATFORM_COLORS_7[p.platform.toLowerCase().replace(' ','')]}} />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.platform}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{formatNum(p.deliveries)}</td>
                  <td className="px-4 py-2.5 font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCAD(p.revenue, 0)}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-green-600">+{formatCAD(p.tips, 0)}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-slate-500">{formatCAD(Math.round((p.revenue + p.tips) / p.deliveries * 0.75))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
