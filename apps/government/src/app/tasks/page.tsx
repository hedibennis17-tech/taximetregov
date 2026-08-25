'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockTasks, type TaskStatus, type TaskPriority } from '@/data/operations.mock'
import { useState } from 'react'
import { Plus, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'

const priorityColors: Record<TaskPriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-300',
  LOW: 'bg-slate-100 text-slate-600 border-slate-300',
}
const priorityDots: Record<TaskPriority, string> = {
  CRITICAL: 'bg-red-500 animate-pulse', HIGH: 'bg-orange-500', MEDIUM: 'bg-amber-400', LOW: 'bg-slate-300'
}
const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  WAITING: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-400',
}

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const today = new Date().toISOString().split('T')[0]

  const overdue = mockTasks.filter(t => t.dueDate < today && t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const dueToday = mockTasks.filter(t => t.dueDate === today && t.status !== 'COMPLETED')
  const highPriority = mockTasks.filter(t => (t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status !== 'COMPLETED')
  const completed = mockTasks.filter(t => t.status === 'COMPLETED')
  const open = mockTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')

  const filtered = filter === 'all' ? mockTasks : mockTasks.filter(t => t.status === filter)

  return (
    <AppShell>
      <PageHeader
        title="Tâches administratives"
        subtitle="Mes tâches · Équipe · Priorités · Échéances"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Nouvelle tâche
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Tâches ouvertes" value={open.length} icon={<Clock size={16} />} color="blue" />
        <KpiCard label="En retard" value={overdue.length} icon={<AlertTriangle size={16} />} color="red" />
        <KpiCard label="Dues aujourd'hui" value={dueToday.length} icon={<Calendar size={16} />} color="orange" />
        <KpiCard label="Complétées" value={completed.length} icon={<CheckCircle size={16} />} color="green" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {(['all','TODO','IN_PROGRESS','WAITING','COMPLETED','CANCELLED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {f === 'all' ? 'Toutes' : f}
          </button>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={13} className="text-red-600 shrink-0" />
          <span className="text-xs text-red-700 font-semibold">{overdue.length} tâche(s) en retard :</span>
          <span className="text-xs text-red-600">{overdue.map(t => t.title).join(' · ')}</span>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-3">
        {filtered.map(task => {
          const isOverdue = task.dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
          return (
            <Card key={task.id} className={`p-4 ${isOverdue ? 'border-red-200 dark:border-red-900' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDots[task.priority]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{task.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>{task.priority}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColors[task.status]}`}>{task.status}</span>
                    {isOverdue && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">EN RETARD</span>}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{task.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                    <span>Assigné : <span className="text-slate-600 dark:text-slate-400 font-medium">{task.assignedName}</span></span>
                    <span>Dép. : {task.department}</span>
                    <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                      <Calendar size={10} className="inline mr-0.5" />
                      Échéance : {new Date(task.dueDate).toLocaleDateString('fr-CA')}
                    </span>
                    <span className="font-mono">{task.id}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {task.status === 'TODO' && (
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                      Démarrer
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                      Compléter
                    </button>
                  )}
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                    Voir
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </AppShell>
  )
}
