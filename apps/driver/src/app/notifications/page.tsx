'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle } from '@/lib/theme-helpers'
import { useState, useEffect } from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Notif { id:string; notification_type:string; title:string; body:string; status:string; priority:string; created_at:string }

const PRIORITY_COLOR: Record<string,string> = { HIGH:'#DC2626', NORMAL:'#003DA5', LOW:'#4A6A9A' }
const TYPE_ICON: Record<string,string> = { COMPLIANCE:'🏛️', FISCAL:'💰', SYSTEM:'⚙️', DOCUMENT:'📄', TRIP:'🚕', DEFAULT:'🔔' }

function fmt(d:string){ return new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(d)) }

export default function NotificationsPage() {
  const { profile } = useDriverProfile()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const sb = getSupabaseBrowserClient()
      const { data } = await sb.from('driver_notifications').select('*').eq('driver_id', profile.id).order('created_at', { ascending:false }).limit(30)
      setNotifs(data ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [profile?.id])

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement des notifications…" />
      </div>
    </AppShell>
  )

  const unread = notifs.filter(n => n.status === 'UNREAD').length

  return (
    <AppShell>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 16px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Notifications</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>
            {unread > 0 ? `${unread} non-lue(s)` : 'Tout à jour ✓'}
          </p>
        </div>
        <button onClick={load} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      <div style={{ padding:'0 16px 24px' }}>
        {notifs.length === 0 ? (
          <div style={{ ...cardStyle(t), padding:'48px 0', textAlign:'center' }}>
            <Bell size={40} color={t.text3} style={{ margin:'0 auto 12px', display:'block' }} />
            <div style={{ fontSize:14, color:t.text3, fontWeight:500 }}>Aucune notification</div>
          </div>
        ) : (
          <div style={{ ...cardStyle(t), overflow:'hidden' }}>
            {notifs.map((n, idx) => {
              const icon = TYPE_ICON[n.notification_type] ?? TYPE_ICON.DEFAULT
              const pc   = PRIORITY_COLOR[n.priority] ?? PRIORITY_COLOR.NORMAL
              const unrd = n.status === 'UNREAD'
              return (
                <div key={n.id} style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  padding:'13px 15px',
                  borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
                  background: unrd ? (dark ? 'rgba(0,61,165,0.08)' : 'rgba(0,61,165,0.04)') : 'transparent',
                }}>
                  <div style={{ width:38, height:38, borderRadius:11, background: dark ? 'rgba(0,61,165,0.15)' : 'rgba(0,61,165,0.07)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight: unrd ? 700 : 600, color:t.text, flex:1 }}>{n.title}</span>
                      {unrd && <div style={{ width:7, height:7, borderRadius:'50%', background:pc, flexShrink:0 }} />}
                    </div>
                    <div style={{ fontSize:11, color:t.text2, lineHeight:1.4, marginBottom:4 }}>{n.body}</div>
                    <div style={{ fontSize:10, color:t.text3 }}>{fmt(n.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
