'use client'
import { BottomNav } from './BottomNav'
import { TaximetreGovMark } from '@/components/brand/Logo'
import { Bell, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function useInitials() {
  const [initials, setInitials] = useState('·')
  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? ''
      setInitials(email.slice(0, 2).toUpperCase() || '?')
    }).catch(() => {})
  }, [])
  return initials
}

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { theme, toggle } = useTheme()
  const initials = useInitials()
  const d = theme === 'dark'

  const bg     = d ? '#050E1C' : '#F0F4FF'
  const hBg    = d ? '#001F5C' : '#FFFFFF'
  const hBdr   = d ? 'rgba(59,130,246,0.2)' : '#DDE3EE'
  const title  = d ? '#FFFFFF' : '#003DA5'
  const sub    = d ? 'rgba(255,255,255,0.4)' : '#8A96A8'
  const icoBox = d ? 'rgba(59,130,246,0.12)' : '#F4F6FA'
  const icoBdr = d ? 'rgba(59,130,246,0.25)' : '#DDE3EE'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:bg, transition:'background 0.25s' }}>
      <header style={{ background:hBg, borderBottom:`1px solid ${hBdr}`, position:'sticky', top:0, zIndex:30, boxShadow: d ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px' }}>
          <Link href="/home" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <TaximetreGovMark size={30} />
            <div>
              <div style={{ fontSize:12, fontWeight:900, letterSpacing:'0.06em', color:title, lineHeight:1.1 }}>
                TAXIM<span style={{ color:'#3B82F6' }}>È</span>TRE<span style={{ color:'#3B82F6' }}>.GOV</span>
              </div>
              <div style={{ fontSize:8, color:sub }}>Gouvernement du Québec</div>
            </div>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:8, fontWeight:700, padding:'3px 7px', borderRadius:6, background:'rgba(245,158,11,0.15)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.3)' }}>PILOTE</span>

            {/* Toggle ☀️ / 🌙 */}
            <button onClick={toggle} style={{ width:30, height:30, borderRadius:8, background:icoBox, border:`1px solid ${icoBdr}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              {d ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="#003DA5" />}
            </button>

            <Link href="/notifications" style={{ width:30, height:30, borderRadius:8, background:icoBox, border:`1px solid ${icoBdr}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={14} color={d ? '#3B82F6' : '#4A5568'} />
            </Link>

            <Link href="/profile" style={{ width:30, height:30, borderRadius:8, background:'#003DA5', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, textDecoration:'none' }}>
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex:1, overflowY:'auto', paddingBottom: showNav ? 76 : 0 }}>
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?: React.ReactNode }) {
  const { theme } = useTheme()
  const d = theme === 'dark'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 16px 12px' }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:800, color: d ? '#F0F4FF' : '#0A1628', margin:0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:11, color: d ? '#8BA3CC' : '#6B7280', margin:'2px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
