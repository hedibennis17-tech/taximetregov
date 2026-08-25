'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, SectionHeader, Amount } from '@/components/ui'
import { todayStats, monthlyRevenue, recentActivities } from '@/data/driver.mock'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

export default function RevenuePage() {
  const [period, setPeriod] = useState<'today'|'month'|'year'>('today')
  const pieData = todayStats.byPlatform.map(p => ({ name:p.name, value:p.revenue }))
  const pieColors = ['#003DA5','#1A56C4','#FF4444']

  return (
    <AppShell>
      <PageHeader title="Mes revenus" subtitle="Consolidé toutes plateformes · SIMULATION" />
      <div className="px-4">
        {/* Period selector */}
        <div className="flex gap-2 mb-5">
          {([['today',"Aujourd'hui"],['month','Ce mois'],['year','2026']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${period===k?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Main revenue card */}
        <Card className="mb-4 bg-gradient-to-br from-qc-blue/30 to-qc-blue-dark/10 border-qc-blue/30">
          <div className="text-xs text-slate-400 mb-1">Revenus bruts</div>
          <Amount value={todayStats.totalRevenue} size="xl" />
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingUp size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">+12.4% vs hier</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label:'Net (après frais)', val:todayStats.netRevenue, color:'text-green-400' },
              { label:'TPS + TVQ', val:todayStats.totalTax, color:'text-slate-400' },
              { label:'Pourboires', val:todayStats.tips, color:'text-blue-400' },
              { label:'Frais plateformes', val:todayStats.fees, color:'text-red-400' },
            ].map(s=>(
              <div key={s.label} className="bg-slate-900/50 rounded-xl p-3">
                <div className={`font-bold font-mono text-sm ${s.color}`}>{fmt(s.val)}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pie by platform */}
        <Card className="mb-4">
          <div className="font-semibold text-sm text-white mb-3">Par plateforme</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                {pieData.map((_,i)=><Cell key={i} fill={pieColors[i]} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {todayStats.byPlatform.map((p,i) => (
                <div key={p.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:pieColors[i]}} />
                    <span className="text-xs text-slate-300">{p.icon} {p.name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-white">{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly chart */}
        <Card className="mb-4">
          <div className="font-semibold text-sm text-white mb-3">Évolution mensuelle</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyRevenue}>
              <XAxis dataKey="month" tick={{fontSize:10, fill:'#64748b'}} />
              <YAxis tick={{fontSize:10, fill:'#64748b'}} tickFormatter={v=>`${(v/1000).toFixed(1)}k$`} />
              <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'12px',color:'#fff'}} />
              <Bar dataKey="gross" fill="#003DA5" radius={[4,4,0,0]} name="Revenus bruts" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tax summary */}
        <Card className="mb-6">
          <div className="font-semibold text-sm text-white mb-3">📋 Résumé fiscal — Aujourd'hui</div>
          <div className="space-y-2">
            {[
              ['Revenus taxables',fmt(todayStats.taxableRevenue),'text-white'],
              ['TPS (5%)',fmt(todayStats.tps),'text-blue-400'],
              ['TVQ (9.975%)',fmt(todayStats.tvq),'text-purple-400'],
              ['Total taxes',fmt(todayStats.totalTax),'text-orange-400'],
            ].map(([l,v,c])=>(
              <div key={l} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{l}</span>
                <span className={`font-mono font-bold text-xs ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
