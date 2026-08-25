'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, StatusDot, Amount, SectionHeader, ActivityBadge, PlatformStatusBadge } from '@/components/ui'
import { mockDriver, mockPlatforms, todayStats, recentActivities } from '@/data/driver.mock'
import { useState } from 'react'
import { Bell, ChevronRight, Zap, MapPin, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [driverStatus, setDriverStatus] = useState<'ONLINE'|'OFFLINE'>('OFFLINE')
  const isOnline = driverStatus === 'ONLINE'
  const connectedPlatforms = mockPlatforms.filter(p => p.status === 'CONNECTED')

  return (
    <AppShell>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-qc-blue flex items-center justify-center text-white font-bold text-lg">
            {mockDriver.firstName[0]}
          </div>
          <div>
            <div className="text-xs text-slate-400">Bonjour,</div>
            <div className="font-bold text-white">{mockDriver.firstName} {mockDriver.lastName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <Bell size={18} className="text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </Link>
        </div>
      </div>

      {/* GO ONLINE / OFFLINE Big Button */}
      <div className="px-4 py-4">
        <button
          onClick={() => setDriverStatus(s => s === 'ONLINE' ? 'OFFLINE' : 'ONLINE')}
          className={`w-full py-5 rounded-3xl font-bold text-xl transition-all active:scale-98 shadow-2xl flex items-center justify-center gap-3
            ${isOnline
              ? 'bg-driver-red/20 border-2 border-driver-red text-driver-red shadow-red-900/30'
              : 'bg-qc-blue border-2 border-qc-blue text-white shadow-blue-900/40'}`}>
          <StatusDot status={isOnline ? 'online' : 'offline'} />
          {isOnline ? 'PASSER HORS LIGNE' : 'ALLER EN LIGNE'}
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isOnline ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-900 border border-slate-800'}`}>
          <MapPin size={14} className={isOnline ? 'text-green-400' : 'text-slate-500'} />
          <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
            {isOnline ? 'GPS ● Montréal actif' : 'GPS en veille'}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
          <Clock size={14} className="text-slate-500" />
          <span className="text-xs text-slate-400">7.5h</span>
        </div>
      </div>

      {/* Today Stats */}
      <div className="px-4 mb-5">
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-qc-blue/30 to-qc-blue-dark/10 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Aujourd'hui</span>
              <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString('fr-CA')}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2 mb-1">
              <Amount value={todayStats.totalRevenue} size="xl" />
              <span className="text-xs text-slate-400 mb-1.5">brut</span>
            </div>
            <div className="flex items-center gap-1 mb-4 text-xs text-slate-400">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-green-400 font-semibold">+12.4%</span>
              <span>vs hier</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'Courses', val:todayStats.totalTrips, icon:'🛣️' },
                { label:'Taxes', val:`${new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(todayStats.totalTax)}`, icon:'📋' },
                { label:'Net', val:new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(todayStats.netRevenue), icon:'💰' },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="font-bold text-white text-sm">{s.val}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* By platform */}
          <div className="border-t border-slate-800 divide-y divide-slate-800/50">
            {todayStats.byPlatform.map(p => (
              <div key={p.provider} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{p.name}</span>
                    <span className="font-bold text-white text-sm">{new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(p.revenue)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{p.trips} course(s)</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Connected platforms */}
      <div className="px-4 mb-5">
        <SectionHeader title="Mes plateformes" actionLabel="Voir tout" action={() => {}} />
        <div className="grid grid-cols-2 gap-3">
          {mockPlatforms.slice(0, 4).map(p => (
            <Link key={p.provider} href="/platforms"
              className={`rounded-2xl p-3 border flex items-start gap-2.5 transition-all
                ${p.status === 'CONNECTED' ? 'bg-slate-900 border-green-500/20' : 'bg-slate-900/50 border-slate-800'}`}>
              <span className="text-2xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{p.name}</div>
                <PlatformStatusBadge status={p.status} />
                {p.status === 'CONNECTED' && (
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.todayTrips} courses</div>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link href="/platforms" className="flex items-center justify-center gap-2 mt-3 py-3 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-xs hover:border-slate-600 transition-colors">
          <span>+ Connecter une plateforme</span>
        </Link>
      </div>

      {/* Recent Activities */}
      <div className="px-4 mb-4">
        <SectionHeader title="Activités récentes" actionLabel="Voir tout" action={() => {}} />
        <div className="space-y-2">
          {recentActivities.slice(0, 3).map(act => (
            <div key={act.id} className="driver-card px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                {act.type === 'TAXI' ? '🚕' : act.type === 'RIDESHARE' ? '🚗' : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ActivityBadge type={act.type} />
                  <span className="text-[10px] text-slate-500">{act.startTime}</span>
                </div>
                <div className="text-xs text-slate-400">{act.distance} · {act.duration}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-white text-sm">{new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(act.fare + act.tip)}</div>
                <div className="text-[10px] text-green-400">+{new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(act.tip)} tip</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-6">
        <SectionHeader title="Actions rapides" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { href:'/taximeter', icon:'🚕', label:'Démarrer course taxi', color:'bg-qc-blue/20 border-qc-blue/30' },
            { href:'/revenue', icon:'💰', label:'Voir mes revenus', color:'bg-green-500/10 border-green-500/20' },
            { href:'/documents', icon:'📄', label:'Mes documents', color:'bg-amber-500/10 border-amber-500/20' },
            { href:'/tax', icon:'📋', label:'Centre fiscal', color:'bg-purple-500/10 border-purple-500/20' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className={`rounded-2xl p-4 border flex flex-col gap-2 transition-all hover:opacity-80 ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold text-white leading-snug">{a.label}</span>
              <ChevronRight size={14} className="text-slate-400 self-end" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
