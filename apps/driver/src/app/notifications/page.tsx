'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { driverNotifications } from '@/data/driver.mock'

export default function NotificationsPage() {
  const unread = driverNotifications.filter(n=>!n.read).length
  return (
    <AppShell>
      <PageHeader title="Notifications" subtitle={`${unread} non lue(s)`} />
      <div className="px-4">
        <div className="space-y-3">
          {driverNotifications.map(n => (
            <div key={n.id} className={`driver-card p-4 flex items-start gap-3 ${!n.read ? 'border-qc-blue/30 bg-qc-blue/5' : ''}`}>
              <span className="text-2xl shrink-0">{n.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-qc-blue-light shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{n.body}</p>
                <div className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString('fr-CA')}</div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${n.priority==='HIGH'?'bg-red-500/20 text-red-400':n.priority==='MEDIUM'?'bg-amber-500/20 text-amber-400':'bg-slate-700 text-slate-500'}`}>{n.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
