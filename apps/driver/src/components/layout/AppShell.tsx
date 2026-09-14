'use client'
import { BottomNav } from './BottomNav'
import { TaximetreGovMark } from '@/components/brand/Logo'
import { Bell, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { profile } = useDriverProfile()
  const { theme, toggle } = useTheme()
  const initials = profile ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}` : '?'

  const isDark = theme === 'dark'

  const headerBg     = isDark ? 'linear-gradient(180deg,#001F5C 0%,#0A1628 100%)' : 'white'
  const headerBorder = isDark ? '1px solid rgba(59,130,246,0.2)' : '1px solid #DDE3EE'
  const bodyBg       = isDark ? '#050E1C' : '#F0F4FF'
  const textPrimary  = isDark ? 'white' : '#0A1628'
  const textMuted    = isDark ? 'rgba(255,255,255,0.5)' : '#8A96A8'
  const iconBg       = isDark ? 'rgba(59,130,246,0.1)' : '#F4F6FA'
  const iconBorder   = isDark ? '1px solid rgba(59,130,246,0.2)' : '1px solid #DDE3EE'
  const iconColor    = isDark ? '#3B82F6' : '#4A5568'

  return (
    <div className="flex flex-col min-h-screen qc-watermark" style={{ background: bodyBg }}>
      <header style={{ background: headerBg, borderBottom: headerBorder, position: 'sticky', top: 0, zIndex: 30, boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/home" className="flex items-center gap-2.5">
            <TaximetreGovMark size={30} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', color: textPrimary, lineHeight: 1.1 }}>
                TAXIM<span style={{ color: '#3B82F6' }}>È</span>TRE<span style={{ color: '#3B82F6' }}>.GOV</span>
              </div>
              <div style={{ fontSize: 8, color: textMuted, letterSpacing: '0.08em' }}>Gouvernement du Québec</div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Badge pilote */}
            <div style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 8, fontWeight: 700, padding: '3px 7px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.06em' }}>
              PILOTE
            </div>

            {/* Toggle thème */}
            <button onClick={toggle} style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, border: iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isDark
                ? <Sun size={14} color="#F59E0B" />
                : <Moon size={14} color="#4A5568" />}
            </button>

            {/* Notifications */}
            <Link href="/notifications" style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, border: iconBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={14} color={iconColor} />
            </Link>

            {/* Avatar */}
            <Link href="/profile" style={{ width: 30, height: 30, borderRadius: 8, background: '#003DA5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: showNav ? 76 : 0 }}>
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: theme === 'dark' ? '#F0F4FF' : '#0A1628', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: theme === 'dark' ? '#8BA3CC' : '#6B7280', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
