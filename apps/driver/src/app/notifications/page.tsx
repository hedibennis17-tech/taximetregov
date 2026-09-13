'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile } from '@/lib/api'
import { useState, useEffect } from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Notif { id:string; notification_type:string; title:string; body:string; status:string; priority:string; created_at:string }

export default function NotificationsPage() {
  const { profile } = useDriverProfile()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    void (async () => {
      try {
        const sb = getSupabaseBrowserClient()
        const { data } = await sb.from('notifications').select('*').eq('driver_id', profile.id).order('created_at', { ascending: false }).limit(20)
        setNotifs((data ?? []) as Notif[])
      } finally { setLoading(false) }
    })()
  }, [profile?.id])

  const ICONS: Record<string, string> = { WELCOME:'👋', TRIP_COMPLETED:'🚕', PAYMENT_RECEIVED:'💰', TAX_PERIOD_OPENED:'🧾', DOCUMENT_EXPIRING:'📄', PLATFORM_CONNECTED:'🔌' }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <p className="text-xs text-slate-400 mt-0.5">{notifs.filter(n => n.status === 'UNREAD').length} non lue(s)</p>
      </div>
      <div className="px-4 space-y-2 pb-8">
        {loading && <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}
        {!loading && notifs.length === 0 && (
          <Card className="p-8 text-center">
            <Bell size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucune notification.</p>
          </Card>
        )}
        {notifs.map(n => (
          <Card key={n.id} className={`p-4 ${n.status === 'UNREAD' ? 'border-qc-blue/30' : ''}`}>
            <div className="flex gap-3">
              <span className="text-2xl">{ICONS[n.notification_type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-white text-sm">{n.title}</span>
                  {n.status === 'UNREAD' && <div className="w-2 h-2 rounded-full bg-qc-blue shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                <p className="text-[9px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString('fr-CA')}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
