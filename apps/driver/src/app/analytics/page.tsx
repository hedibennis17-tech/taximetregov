'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { todayStats, recentActivities, mockPlatformAccounts, monthlyRevenue } from '@/data/driver.mock'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useState } from 'react'
import { TrendingUp, Gauge } from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

const hourlyData = Array.from({length:12}, (_,i) => ({
  hour:`${7+i}h`, trips: Math.round(0.5 + Math.random()*2.5), revenue: Math.round(20+Math.random()*60)
}))

const weekData = [
  { day:'Lun', trips:14, revenue:298 }, { day:'Mar', trips:18, revenue:412 },
  { day:'Mer', trips:12, revenue:256 }, { day:'Jeu', trips:20, revenue:485 },
  { day:'Ven', trips:22, revenue:524 }, { day:'Sam', trips:28, revenue:640 },
  { day:'Dim', trips:16, revenue:342 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'day'|'week'|'month'>('day')

  const taxiTrips = recentActivities.filter(a => a.type === 'TAXI').length
  const deliveries = recentActivities.filter(a => a.type === 'FOOD_DELIVERY').length
  const rideshares = recentActivities.filter(a => a.type === 'RIDESHARE').length

  const avgFare = todayStats.totalRevenue / Math.max(todayStats.totalTrips, 1)
  const earningsPerHour = todayStats.netRevenue / Math.max(todayStats.hoursOnline, 1)

  return (
    <AppShell>
      <PageHeader title="Analytics chauffeur" subtitle="Performance · Revenus · Activités · SIMULATION" />
      <div className="px-4">
        <div className="flex gap-2 mb-5">
          {([['day',"Aujourd'hui"],['week','Semaine'],['month','Mois']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${period===k?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon:'🛣️', label:'Courses totales', val:todayStats.totalTrips },
            { icon:'💰', label:'Revenus bruts', val:fmt(todayStats.totalRevenue) },
            { icon:'⏱️', label:'Heures en ligne', val:`${todayStats.hoursOnline}h` },
            { icon:'📍', label:'km parcourus', val:`${todayStats.kmDriven} km` },
            { icon:'💵', label:'Course moyenne', val:fmt(avgFare) },
            { icon:'⚡', label:'$/heure net', val:fmt(earningsPerHour) },
          ].map(s => (
            <div key={s.label} className="driver-card p-4">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-black text-white text-lg tabular-nums">{s.val}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Activity breakdown */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">Répartition par activité</div>
          <div className="space-y-3">
            {[
              { icon:'🚕', label:'Taxi', count:taxiTrips, rev:todayStats.byPlatform[0]?.revenue??0, color:'bg-qc-blue' },
              { icon:'🚗', label:'Rideshare', count:rideshares, rev:todayStats.byPlatform[1]?.revenue??0, color:'bg-slate-500' },
              { icon:'📦', label:'Livraison', count:deliveries, rev:todayStats.byPlatform[2]?.revenue??0, color:'bg-red-500' },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="text-xl w-8 shrink-0">{a.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1 text-xs">
                    <span className="text-slate-300 font-medium">{a.label}</span>
                    <span className="font-bold text-white">{fmt(a.rev)}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${a.color} rounded-full`}
                      style={{width:`${Math.round((a.count / Math.max(todayStats.totalTrips,1)) * 100)}%`}} />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{a.count} course(s)</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Hourly/weekly chart */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">
            {period === 'day' ? 'Revenus par heure' : period === 'week' ? 'Revenus par jour' : 'Revenus mensuels'}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            {period === 'day' ? (
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{fontSize:9, fill:'#64748b'}} />
                <YAxis tick={{fontSize:9, fill:'#64748b'}} tickFormatter={v=>`${v}$`} />
                <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'12px',color:'#fff',fontSize:11}} />
                <Bar dataKey="revenue" fill="#003DA5" radius={[4,4,0,0]} name="Revenus" />
              </BarChart>
            ) : period === 'week' ? (
              <BarChart data={weekData}>
                <XAxis dataKey="day" tick={{fontSize:9, fill:'#64748b'}} />
                <YAxis tick={{fontSize:9, fill:'#64748b'}} tickFormatter={v=>`${v}$`} />
                <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'12px',color:'#fff',fontSize:11}} />
                <Bar dataKey="revenue" fill="#003DA5" radius={[4,4,0,0]} name="Revenus" />
              </BarChart>
            ) : (
              <LineChart data={monthlyRevenue}>
                <XAxis dataKey="month" tick={{fontSize:9, fill:'#64748b'}} />
                <YAxis tick={{fontSize:9, fill:'#64748b'}} tickFormatter={v=>`${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'12px',color:'#fff',fontSize:11}} />
                <Line dataKey="gross" stroke="#003DA5" strokeWidth={2} dot={false} name="Brut" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Card>

        {/* Platform performance */}
        <Card className="mb-6">
          <div className="font-semibold text-white text-sm mb-3">Performance par plateforme</div>
          <div className="space-y-2.5">
            {todayStats.byPlatform.map(p => (
              <div key={p.provider} className="flex items-center gap-3">
                <span className="text-xl shrink-0">{p.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5 text-xs">
                    <span className="text-slate-300">{p.name}</span>
                    <span className="font-bold text-white">{fmt(p.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-qc-blue rounded-full"
                      style={{width:`${Math.round((p.revenue/Math.max(todayStats.totalRevenue,1))*100)}%`}} />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{p.trips} course(s)</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
