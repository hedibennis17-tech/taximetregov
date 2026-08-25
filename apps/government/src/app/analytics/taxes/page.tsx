'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { taxAnalytics, monthlyRevenue, platformAnalytics, formatCAD, PLATFORM_COLORS_7 } from '@/data/analytics.mock'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Percent, Scale, AlertCircle, CheckCircle } from 'lucide-react'

export default function TaxAnalyticsPage() {
  const remittanceRate = Math.round(taxAnalytics.totalRemitted / taxAnalytics.totalCollected * 100)
  const expectedRate = 14.975
  const actualRate = Math.round(taxAnalytics.rate * 100) / 100

  return (
    <AppShell>
      <PageHeader title="Tax Analytics" subtitle="TPS 5% · TVQ 9.975% · Source: Tax Engine · SIMULATION" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Revenus taxables" value={formatCAD(taxAnalytics.totalTaxable, 0)} icon={<Percent size={16} />} color="blue" />
        <KpiCard label="TPS perçue (5%)" value={formatCAD(taxAnalytics.tpsCollected, 0)} color="blue" sub="Fédérale" />
        <KpiCard label="TVQ perçue (9.975%)" value={formatCAD(taxAnalytics.tvqCollected, 0)} color="purple" sub="Provinciale" />
        <KpiCard label="Total perçu" value={formatCAD(taxAnalytics.totalCollected, 0)} color="green" sub={`${actualRate.toFixed(2)}% effectif`} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Remis" value={formatCAD(taxAnalytics.totalRemitted, 0)} color="green" sub={`${remittanceRate}% du perçu`} />
        <KpiCard label="En attente" value={formatCAD(taxAnalytics.outstanding, 0)} color="orange" />
        <KpiCard label="Remboursements" value={formatCAD(taxAnalytics.refunds, 0)} color="purple" />
      </div>

      {/* Tax rate validation */}
      <Card className="mb-5 p-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Validation du taux effectif</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">Taux TPS théorique</div>
            <div className="text-2xl font-bold text-blue-600">5.000%</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">Taux TVQ théorique</div>
            <div className="text-2xl font-bold text-purple-600">9.975%</div>
          </div>
          <div className={`text-center p-4 rounded-xl ${Math.abs(actualRate - expectedRate) < 0.1 ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50'}`}>
            <div className="text-xs text-slate-500 mb-1">Taux effectif calculé</div>
            <div className={`text-2xl font-bold ${Math.abs(actualRate - expectedRate) < 0.1 ? 'text-green-600' : 'text-orange-600'}`}>{actualRate.toFixed(3)}%</div>
            <div className={`text-[10px] font-bold mt-1 flex items-center justify-center gap-1 ${Math.abs(actualRate - expectedRate) < 0.1 ? 'text-green-600' : 'text-orange-600'}`}>
              {Math.abs(actualRate - expectedRate) < 0.1 ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              {Math.abs(actualRate - expectedRate) < 0.1 ? 'CONFORME' : 'ÉCART'}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Monthly tax trend */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">TPS + TVQ — Évolution mensuelle</div>
          <div className="text-[10px] text-slate-400 mb-3">Source: Tax Engine · SIMULATION</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taxAnalytics.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={(v:number)=>`${v.toFixed(0)}$`} />
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="tps" name="TPS (5%)" fill="#003DA5" stackId="tax" radius={[0,0,0,0]} />
              <Bar dataKey="tvq" name="TVQ (9.975%)" fill="#7C3AED" stackId="tax" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tax by platform */}
        <Card className="p-4">
          <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">Taxes par plateforme — Août</div>
          <div className="text-[10px] text-slate-400 mb-3">TPS + TVQ combinées · Source: Tax Engine</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taxAnalytics.byPlatform} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize:9, fill:'#94a3b8' }} tickFormatter={(v:number)=>`${v.toFixed(0)}$`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} width={70} />
              <Tooltip formatter={(v:number)=>formatCAD(v)} />
              <Bar dataKey="total" name="Total taxes" radius={[0,4,4,0]}>
                {taxAnalytics.byPlatform.map((p,i)=><Cell key={i} fill={PLATFORM_COLORS_7[p.provider]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tax reconciliation detail */}
      <Card className="p-4">
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Réconciliation fiscale — Août 2026</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Revenus enregistrés (Ledger)', val:formatCAD(284620, 0), color:'text-slate-700 dark:text-slate-200', bg:'bg-slate-50 dark:bg-slate-800' },
            { label:'Revenus taxables (90.1%)', val:formatCAD(taxAnalytics.totalTaxable, 0), color:'text-blue-600', bg:'bg-blue-50' },
            { label:'Taxes théoriques (14.975%)', val:formatCAD(Math.round(taxAnalytics.totalTaxable * 0.14975), 0), color:'text-purple-600', bg:'bg-purple-50' },
            { label:'Taxes perçues', val:formatCAD(taxAnalytics.totalCollected, 0), color:'text-green-600', bg:'bg-green-50' },
          ].map(r => (
            <div key={r.label} className={`p-4 rounded-xl ${r.bg} text-center`}>
              <div className="text-[10px] text-slate-500 mb-2">{r.label}</div>
              <div className={`text-lg font-bold font-mono ${r.color}`}>{r.val}</div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
