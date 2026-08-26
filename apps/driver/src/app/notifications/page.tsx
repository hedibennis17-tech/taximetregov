'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockNotifications, PRIORITY_CONFIG, getUnreadCount, groupByPriority,
  type DriverNotification, type NotificationPriority, type NotificationStatus
} from '@/lib/engines/notification.engine'
import { useState } from 'react'
import { CheckCheck, Archive, Bell, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<NotificationStatus | 'ALL'>('ALL')

  const unread = getUnreadCount(notifications)

  const markAllRead = () =>
    setNotifications(ns => ns.map(n => ({ ...n, status: n.status === 'UNREAD' ? 'READ' as const : n.status })))

  const markRead = (id: string) =>
    setNotifications(ns => ns.map(n => n.id === id && n.status === 'UNREAD' ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n))

  const archive = (id: string) =>
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, status: 'ARCHIVED' as const } : n))

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return n.status !== 'ARCHIVED'
    return n.status === filter
  })

  const groups = groupByPriority(filtered)
  const priorityOrder: NotificationPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} non lue(s)` : 'Tout lu'}
        action={
          unread > 0 ? (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
              <CheckCheck size={13} /> Tout marquer lu
            </button>
          ) : undefined
        }
      />
      <div className="px-4">
        {/* Government message notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-qc-blue/10 border border-qc-blue/30 mb-5 text-xs text-blue-200">
          <Shield size={12} className="mt-0.5 shrink-0" />
          Les messages gouvernementaux sont signés numériquement. Taximètre.GOV ne vous demandera jamais de mots de passe par notification.
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([['ALL','Toutes'],['UNREAD','Non lues'],['READ','Lues']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter===k?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {l} {k === 'UNREAD' && unread > 0 && `(${unread})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell size={36} className="text-slate-600 mx-auto mb-3" />
            <div className="text-slate-500 text-sm">Aucune notification</div>
          </div>
        )}

        {/* Grouped by priority */}
        <div className="space-y-6 mb-6">
          {priorityOrder.map(priority => {
            const items = groups.get(priority)
            if (!items || items.length === 0) return null
            const pConf = PRIORITY_CONFIG[priority]
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${pConf.dot}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{pConf.label}</span>
                </div>
                <div className="space-y-2">
                  {items.map(n => {
                    const isUnread = n.status === 'UNREAD'
                    return (
                      <div key={n.id}
                        className={`driver-card p-4 border transition-all ${isUnread ? 'border-qc-blue/20 bg-qc-blue/5' : ''} ${n.isGovernmentMessage ? 'border-qc-blue/30' : ''}`}
                        onClick={() => markRead(n.id)}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold text-sm ${isUnread ? 'text-white' : 'text-slate-300'}`}>{n.title}</span>
                                {isUnread && <div className="w-2 h-2 rounded-full bg-qc-blue-light shrink-0" />}
                                {n.isGovernmentMessage && (
                                  <span className="text-[9px] font-bold bg-qc-blue/20 text-blue-300 px-1.5 py-0.5 rounded-full border border-qc-blue/30 flex items-center gap-1">
                                    <Shield size={8} /> GOV
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-2">{n.body}</p>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[10px] text-slate-600">
                                {new Date(n.createdAt).toLocaleString('fr-CA', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                              </span>
                              <div className="flex items-center gap-2">
                                {n.actionLabel && n.actionUrl && (
                                  <Link href={n.actionUrl}
                                    onClick={e => e.stopPropagation()}
                                    className="text-[10px] font-bold text-qc-blue-light hover:text-blue-300 transition-colors">
                                    {n.actionLabel} →
                                  </Link>
                                )}
                                <button onClick={e => { e.stopPropagation(); archive(n.id) }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                                  <Archive size={11} className="text-slate-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
