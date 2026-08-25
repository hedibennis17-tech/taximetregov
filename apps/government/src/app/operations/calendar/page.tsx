'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { calendarEvents } from '@/data/operations.mock'
import { Calendar, AlertTriangle, Clock, FileText, Scale, Percent, ClipboardCheck } from 'lucide-react'

const typeColors: Record<string, string> = {
  DEADLINE: 'bg-red-100 text-red-700 border-red-200',
  TASK: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLIANCE: 'bg-orange-100 text-orange-700 border-orange-200',
  LICENSE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  TAX: 'bg-purple-100 text-purple-700 border-purple-200',
  REPORT: 'bg-green-100 text-green-700 border-green-200',
  DOCUMENT: 'bg-amber-100 text-amber-700 border-amber-200',
}
const typeIcons: Record<string, React.ReactNode> = {
  DEADLINE: <AlertTriangle size={13} />, TASK: <ClipboardCheck size={13} />,
  COMPLIANCE: <Scale size={13} />, LICENSE: <FileText size={13} />,
  TAX: <Percent size={13} />, REPORT: <Calendar size={13} />,
  DOCUMENT: <FileText size={13} />,
}
const priorityDots: Record<string, string> = {
  CRITICAL: 'bg-red-500 animate-pulse', HIGH: 'bg-orange-500', MEDIUM: 'bg-amber-400', LOW: 'bg-slate-300'
}

// Group events by month
const groupedEvents = calendarEvents.reduce((acc, event) => {
  const month = event.date.substring(0, 7)
  if (!acc[month]) acc[month] = []
  acc[month].push(event)
  return acc
}, {} as Record<string, typeof calendarEvents>)

const monthLabels: Record<string, string> = {
  '2026-08': 'Août 2026', '2026-09': 'Septembre 2026', '2026-10': 'Octobre 2026',
  '2026-11': 'Novembre 2026', '2026-12': 'Décembre 2026',
}

export default function CalendarPage() {
  const upcoming = calendarEvents.filter(e => e.date >= '2026-08-24').slice(0, 3)

  return (
    <AppShell>
      <PageHeader title="Calendrier administratif" subtitle="Échéances · Périodes fiscales · Licences · Tâches" />

      {/* Upcoming events */}
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Prochains événements</div>
        <div className="grid grid-cols-3 gap-3">
          {upcoming.map(e => (
            <Card key={e.id} className={`p-4 border ${typeColors[e.type]?.includes('red') ? 'border-red-200' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeColors[e.type]}`}>
                  {typeIcons[e.type]} {e.type}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${priorityDots[e.priority]}`} />
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">{e.title}</div>
              <div className="text-[10px] text-slate-400 font-mono">{new Date(e.date).toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              {e.assignedTo && <div className="text-[10px] text-slate-400 mt-1">{e.assignedTo}</div>}
            </Card>
          ))}
        </div>
      </div>

      {/* Full calendar by month */}
      <div className="space-y-5">
        {Object.entries(groupedEvents).map(([month, events]) => (
          <Card key={month}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Calendar size={14} className="text-qc-blue" />
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{monthLabels[month] || month}</div>
              <span className="text-xs text-slate-400 ml-1">{events.length} événement(s)</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {events.map(e => (
                <div key={e.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="w-12 text-center shrink-0">
                    <div className="text-lg font-bold text-qc-blue">{new Date(e.date).getDate()}</div>
                    <div className="text-[9px] text-slate-400">{new Date(e.date).toLocaleDateString('fr-CA', { weekday: 'short' })}</div>
                  </div>
                  <div className={`w-1 h-10 rounded-full shrink-0 ${e.priority === 'CRITICAL' ? 'bg-red-500' : e.priority === 'HIGH' ? 'bg-orange-500' : e.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{e.title}</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeColors[e.type]}`}>
                        {typeIcons[e.type]} {e.type}
                      </span>
                    </div>
                    {e.assignedTo && <div className="text-[10px] text-slate-400">Responsable : {e.assignedTo}</div>}
                  </div>
                  <div className={`text-[9px] font-bold px-2 py-1 rounded ${e.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : e.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                    {e.priority}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
