'use client'
import { BottomNav } from './BottomNav'
import { TaximetreGovMark } from '@/components/brand/Logo'
import { Bell, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { useEffect } from 'react'

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { profile } = useDriverProfile()
  const { theme, toggle } = useTheme()
  const d = theme === 'dark'
  const initials = profile ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}` : '?'

  // Appliquer le thème au document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.style.background = d ? '#050E1C' : '#F0F4FF'
    document.body.style.color = d ? '#F0F4FF' : '#0A1628'
  }, [theme, d])

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background: d ? '#050E1C' : '#F0F4FF' }}>
      {/* Header */}
      <header style={{
        background: d ? 'linear-gradient(180deg,#001F5C 0%,#0A1628 100%)' : 'white',
        borderBottom: d ? '1px solid rgba(59,130,246,0.2)' : '1px solid #DDE3EE',
        position:'sticky', top:0, zIndex:30,
        boxShadow: d ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px' }}>
          <Link href="/home" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <TaximetreGovMark size={30} />
            <div>
              <div style={{ fontSize:12, fontWeight:900, letterSpacing:'0.06em', color: d ? 'white' : '#003DA5', lineHeight:1.1 }}>
                TAXIM<span style={{ color:'#3B82F6' }}>È</span>TRE<span style={{ color:'#3B82F6' }}>.GOV</span>
              </div>
              <div style={{ fontSize:8, color: d ? 'rgba(255,255,255,0.45)' : '#8A96A8', letterSpacing:'0.08em' }}>
                Gouvernement du Québec
              </div>
            </div>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ background:'rgba(245,158,11,0.15)', color:'#F59E0B', fontSize:8, fontWeight:700, padding:'3px 7px', borderRadius:6, border:'1px solid rgba(245,158,11,0.3)' }}>
              PILOTE
            </div>

            {/* Toggle thème ☀️ / 🌙 */}
            <button onClick={toggle}
              title={d ? 'Thème clair' : 'Thème sombre'}
              style={{ width:30, height:30, borderRadius:8, border: d ? '1px solid rgba(59,130,246,0.25)' : '1px solid #DDE3EE', background: d ? 'rgba(59,130,246,0.1)' : '#F4F6FA', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              {d ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="#003DA5" />}
            </button>

            <Link href="/notifications"
              style={{ width:30, height:30, borderRadius:8, border: d ? '1px solid rgba(59,130,246,0.2)' : '1px solid #DDE3EE', background: d ? 'rgba(59,130,246,0.08)' : '#F4F6FA', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={14} color={d ? '#3B82F6' : '#4A5568'} />
            </Link>

            <Link href="/profile"
              style={{ width:30, height:30, borderRadius:8, background:'#003DA5', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, textDecoration:'none' }}>
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
