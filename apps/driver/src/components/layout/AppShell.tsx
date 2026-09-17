'use client'
import { BottomNav } from './BottomNav'
import { TaximetreGovMark } from '@/components/brand/Logo'
import { Bell, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getLang, toggleLang } from '@/lib/i18n/language'

function useInitials() {
  const [ini, setIni] = useState('·')
  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession()
      .then(({ data: { session } }) => setIni((session?.user?.email ?? '??').slice(0,2).toUpperCase()))
      .catch(() => {})
  }, [])
  return ini
}

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { theme, toggle } = useTheme()
  const initials = useInitials()
  const dark = theme === 'dark'
  const [lang, setLangState] = useState<'fr'|'en'>('fr')

  useEffect(() => {
    setLangState(getLang())
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Top bar ── Bleu royal en light, bleu nuit en dark */}
      <header style={{
        background: dark
          ? 'linear-gradient(180deg,#001F5C 0%,#0A1628 100%)'
          : '#003DA5',
        borderBottom: dark ? '1px solid rgba(59,130,246,0.2)' : 'none',
        position:'sticky', top:0, zIndex:30,
        boxShadow: dark
          ? '0 2px 16px rgba(0,0,0,.5)'
          : '0 2px 16px rgba(0,29,92,0.30)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px' }}>

          {/* Logo + wordmark */}
          <Link href="/home" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <TaximetreGovMark size={30} />
            <div>
              <div style={{ fontSize:12, fontWeight:900, letterSpacing:'0.06em', color:'#FFFFFF', lineHeight:1.1 }}>
                TAXIM<span style={{ color:'#F5C842' }}>È</span>TRE<span style={{ color:'#F5C842' }}>.GOV</span>
              </div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.65)', letterSpacing:'0.04em' }}>Gouvernement du Québec</div>
            </div>
          </Link>

          {/* Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>

            {/* Badge PILOTE — doré */}
            <span style={{
              fontSize:8, fontWeight:800, padding:'3px 8px', borderRadius:20,
              background:'rgba(245,200,66,0.20)', color:'#F5C842',
              border:'1px solid rgba(245,200,66,0.35)',
              letterSpacing:'0.08em',
            }}>PILOTE</span>

            {/* Toggle FR/EN */}
            <button
              onClick={() => { toggleLang(); setLangState(l => l === 'fr' ? 'en' : 'fr') }}
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              style={{
                height:32, borderRadius:10, padding:'0 8px',
                background:'rgba(255,255,255,0.12)',
                border:'1px solid rgba(255,255,255,0.20)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', gap:3,
              }}
            >
              <span style={{ fontSize:11, fontWeight:800, color: lang === 'fr' ? '#FFFFFF' : 'rgba(255,255,255,0.40)', letterSpacing:'0.05em' }}>FR</span>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.30)' }}>|</span>
              <span style={{ fontSize:11, fontWeight:800, color: lang === 'en' ? '#FFFFFF' : 'rgba(255,255,255,0.40)', letterSpacing:'0.05em' }}>EN</span>
            </button>

            {/* Toggle thème */}
            <button
              onClick={toggle}
              title={dark ? 'Thème clair' : 'Thème sombre'}
              style={{
                width:32, height:32, borderRadius:10,
                background:'rgba(255,255,255,0.12)',
                border:'1px solid rgba(255,255,255,0.20)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'background 0.15s',
              }}
            >
              {dark
                ? <Sun size={15} color="#F5C842" />
                : <Moon size={15} color="#E8F0FF" />
              }
            </button>

            {/* Notifs */}
            <Link href="/notifications" style={{
              width:32, height:32, borderRadius:10,
              background:'rgba(255,255,255,0.12)',
              border:'1px solid rgba(255,255,255,0.20)',
              display:'flex', alignItems:'center', justifyContent:'center',
              textDecoration:'none',
            }}>
              <Bell size={15} color="#FFFFFF" />
            </Link>

            {/* Avatar */}
            <Link href="/profile" style={{
              width:32, height:32, borderRadius:10,
              background:'#001F5C',
              border:'2px solid rgba(255,255,255,0.30)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:900, color:'white',
              textDecoration:'none', letterSpacing:'0.03em',
            }}>
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

export function PageHeader({
  title, subtitle, action
}: { title:string; subtitle?:string; action?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 16px 12px' }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0, letterSpacing:'-0.01em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:11, color:'var(--text-3)', margin:'3px 0 0', fontWeight:500 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
