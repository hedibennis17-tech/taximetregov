'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { activityTimeline, mockTasks, mockApprovals, mockIncidents } from '@/data/operations.mock'
import { controlCenterKpis as cc } from '@/data/compliance.mock'
import { Activity, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

const typeColors: Record<string, string> = {
  meter: 'text-qc-blue bg-blue-50', webhook: 'text-green-600 bg-green-50',
  system: 'text-slate-600 bg-slate-100', transaction: 'text-purple-600 bg-purple-50',
  compliance: 'text-orange-600 bg-orange-50', tax: 'text-indigo-600 bg-indigo-50',
  incident: 'text-red-600 bg-red-50', audit: 'text-slate-600 bg-slate-100',
  approval: 'text-green-600 bg-green-50',
}

export default function ActivityCenterPage() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const fmt = (n: number) => n.toLocaleString('fr-CA')
  const pendingTasks = mockTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const pendingApprovals = mockApprovals.filter(a => a.status === 'SUBMITTED' || a.status === 'IN_REVIEW')
  const openIncidents = mockIncidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED')

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Government Activity Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Supervision temps réel · SIMULATION</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-green-700">LIVE · {time.toLocaleTimeString('fr-CA')}</span>
        </div>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Actifs maintenant" value={fmt(cc.activeToday)} icon={<Activity size={16} />} color="green" large />
        <KpiCard label="Transactions aujourd'hui" value={fmt(cc.transactionsToday)} icon={<Zap size={16} />} color="blue" />
        <KpiCard label="Tâches ouvertes" value={pendingTasks.length} icon={<Clock size={16} />} color="orange" />
        <KpiCard label="Incidents actifs" value={openIncidents.length} icon={<AlertTriangle size={16} />} color={openIncidents.length > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity timeline */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <Activity size={14} className="text-qc-blue" />
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Timeline d'activité — Aujourd'hui</div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {activityTimeline.map((event, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5 w-12">{event.time}</div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base ${typeColors[event.type] || 'text-slate-600 bg-slate-100'}`}>
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{event.event}</div>
                    <div className="text-[10px] text-slate-400 truncate">{event.detail}</div>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${typeColors[event.type]?.includes('red') ? 'bg-red-500' : typeColors[event.type]?.includes('amber') ? 'bg-amber-500' : 'bg-green-400'}`} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending approvals */}
          <Card>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Approbations en attente</div>
              <span className="text-xs text-qc-blue font-bold">{pendingApprovals.length}</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {pendingApprovals.map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">{a.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Par : {a.createdByName} · {a.type.replace('_',' ')}</div>
                  <div className={`text-[9px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded ${a.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {a.status}
                  </div>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-400"><CheckCircle size={20} className="mx-auto mb-1 text-green-400" />Aucune approbation en attente</div>
              )}
            </div>
          </Card>

          {/* Active incidents */}
          {openIncidents.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <div className="px-4 py-3 border-b border-red-100 dark:border-red-900">
                <div className="font-semibold text-sm text-red-700">Incidents actifs</div>
              </div>
              <div className="divide-y divide-red-50 dark:divide-red-900">
                {openIncidents.map(inc => (
                  <div key={inc.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold text-red-700">{inc.status}</span>
                      <span className="font-mono text-[10px] text-slate-400">{inc.id}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{inc.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{inc.service}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* High priority tasks */}
          <Card>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Tâches critiques</div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {mockTasks.filter(t => (t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'COMPLETED').slice(0, 4).map(task => (
                <div key={task.id} className="px-4 py-3 flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${task.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">{task.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{task.assignedName} · {task.dueDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
