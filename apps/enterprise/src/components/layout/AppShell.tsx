'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/auth/rbac'
import { Menu, Bell, LogOut, ChevronRight, X } from 'lucide-react'
import { NAV_SECTIONS, CURRENT_ENT, NOTIFICATIONS } from '@/lib/data'
import { signOut } from '@/lib/supabase/auth'

function UberIcon({ size = 32 }: { size?: number }) {
  const src = size <= 32 ? '/logos/uber-icon-32.png' : size <= 48 ? '/logos/uber-icon-48.png' : '/logos/uber-icon-64.png'
  return <img src={src} width={size} height={size} alt="Uber" style={{objectFit:'cover'}}/>
}
function UberEatsIcon({ size = 32 }: { size?: number }) {
  const src = size <= 32 ? '/logos/uber-eats-32.png' : '/logos/uber-eats-64.png'
  return <img src={src} width={size} height={size} alt="Uber Eats" style={{borderRadius: size*0.2, objectFit:'cover'}}/>
}

// ── 1. Bloc services Uber — collapsible (X ferme, icône ouvre) ──
function UberServiceBlock() {
  const [visible, setVisible] = useState(true)

  const DEPTS = [
    { e:'🚗', l:'Rides' }, { e:'🚕', l:'Taxi' }, { e:'🟢', l:'Green' },
    { e:'🍔', l:'Eats'  }, { e:'🛒', l:'Grocery' }, { e:'📦', l:'Courier' },
  ]

  if (!visible) {
    // Icône seule cliquable → réaffiche le bloc
    return (
      <button
        onClick={() => setVisible(true)}
        title="Afficher les services Uber"
        className="flex items-center gap-2 px-3 py-2 rounded-2xl w-full transition-all hover:opacity-80"
        style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.15)' }}>
        <UberIcon size={28}/>
        <UberEatsIcon size={28}/>
        <span className="text-xs font-bold text-white/60 ml-1">Uber Québec</span>
        <span className="ml-auto text-white/40 text-xs">+</span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl p-4 relative" style={{
      background:'rgba(0,0,0,0.25)',
      border:'1px solid rgba(255,255,255,0.15)',
      boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08)'
    }}>
      {/* ✕ ferme */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
        style={{ color:'rgba(255,255,255,0.45)' }}
        title="Réduire">
        <X size={13}/>
      </button>

      {/* Logos */}
      <div className="flex items-center gap-3 mb-3">
        <UberIcon size={48}/>
        <UberEatsIcon size={48}/>
        <div className="flex-1"/>
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-white leading-tight">Uber</span>
          <span className="text-xs font-black leading-tight" style={{ color:'#06C167' }}>Québec</span>
        </div>
      </div>

      {/* Dept badges */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {DEPTS.map(d => (
          <span key={d.l} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)' }}>
            {d.e} {d.l}
          </span>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#06C167' }}/>
        <span className="text-xs font-semibold" style={{ color:'rgba(255,255,255,0.65)' }}>
          Connecté · PILOTE · {CURRENT_ENT.id}
        </span>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open,    setOpen]    = useState(false)
  const pathname              = usePathname()
  const router                = useRouter()
  const { user }              = useAuth()
  const unread                = NOTIFICATIONS.filter(n => !n.read).length

  const handleLogout = async () => {
    try { await signOut() } catch {}
    router.replace('/login')
  }

  const initials  = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
    : 'U'
  const roleColor = user ? (ROLE_COLORS[user.role as Role] ?? '#003DA5') : '#003DA5'
  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : ''

  return (
    <div className="min-h-screen flex" style={{ background:'#F5F5F7' }}>

      {/* ══════════ SIDEBAR — 3. fond blanc, police bleu ══════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `} style={{
        background:'#FFFFFF',
        borderRight:'1px solid #E2E8F0',
        boxShadow:'4px 0 24px rgba(0,61,165,0.08)'
      }}>

        {/* ── Header sidebar ── */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom:'1px solid #EEF2F7' }}>

          {/* 4. Logo TAXIMETER.GOV officiel */}
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/taximetregov-logo.png" alt="TAXIMETER.GOV"
              className="w-9 h-9 rounded-xl object-cover"
              style={{ boxShadow:'0 2px 8px rgba(0,61,165,0.2)' }}
            />
            <div>
              <div className="text-sm font-black tracking-tight" style={{ color:'#003DA5', letterSpacing:'-0.02em' }}>
                TAXIMETER.GOV
              </div>
              <div className="text-xs font-semibold" style={{ color:'#06C167' }}>Enterprise Gov</div>
            </div>
          </div>

          {/* 1. Bloc Uber services collapsible */}
          <UberServiceBlock />

          {/* 2. PAS de user card ici — déjà dans la topbar droite */}
        </div>

        {/* ── 3. Navigation blanche + police bleue ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3"
          style={{ scrollbarWidth:'thin', scrollbarColor:'#E2E8F0 transparent' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.section} className="mb-4">
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color:'#94A3B8', letterSpacing:'0.1em' }}>
                {sec.section}
              </div>
              {sec.items.map(item => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-0.5 transition-all group"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, #003DA5, #0057E7)'
                        : 'transparent',
                      color: active ? '#FFFFFF' : '#1E3A6E',
                      boxShadow: active ? '0 2px 12px rgba(0,61,165,0.25)' : 'none',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#EEF4FF'; (e.currentTarget as HTMLAnchorElement).style.color='#003DA5' }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color='#1E3A6E' }}}>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight size={14} className="opacity-60 shrink-0"/>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer sidebar ── */}
        <div className="px-5 py-4" style={{ borderTop:'1px solid #EEF2F7' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
            style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-xs">⚠️</span>
            <span className="text-xs font-semibold" style={{ color:'#B45309' }}>
              DONNÉES SYNTHÉTIQUES · PILOTE
            </span>
          </div>
          <div className="text-xs text-center font-medium" style={{ color:'#94A3B8' }}>
            TAXIMETER.GOV · v2026 · Québec 🍁
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
          onClick={() => setOpen(false)}/>
      )}

      {/* ══════════ MAIN ══════════ */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">

        {/* ── Topbar premium ── */}
        <header className="sticky top-0 z-20 h-16 flex items-center px-5 gap-4"
          style={{
            background:'rgba(255,255,255,0.92)',
            backdropFilter:'blur(20px)',
            borderBottom:'1px solid rgba(0,61,165,0.08)',
            boxShadow:'0 1px 0 rgba(0,61,165,0.05), 0 2px 16px rgba(0,0,0,0.04)'
          }}>

          <button className="lg:hidden p-2 rounded-xl hover:bg-blue-50 cursor-pointer transition-all"
            onClick={() => setOpen(true)}>
            <Menu size={18} style={{ color:'#003DA5' }}/>
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <UberIcon size={24}/>
            <span className="text-sm font-bold truncate hidden sm:block" style={{ color:'#1E293B' }}>
              {CURRENT_ENT.tradeName}
            </span>
            <span className="text-sm hidden md:block" style={{ color:'#94A3B8' }}>·</span>
            <span className="text-xs hidden md:block truncate" style={{ color:'#94A3B8' }}>
              {CURRENT_ENT.id}
            </span>
          </div>

          {/* Right — bell + user (2. plus de doublon super admin) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/notifications"
              className="relative p-2.5 rounded-xl transition-all hover:bg-blue-50"
              style={{ color:'#64748B' }}>
              <Bell size={18}/>
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background:'#DC2626', fontSize:'9px' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* User pill unique — topbar droite seulement */}
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background:'white', border:'1px solid rgba(0,61,165,0.12)', boxShadow:'0 1px 4px rgba(0,61,165,0.08)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ background:roleColor }}>
                  {initials}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-bold leading-tight" style={{ color:'#1E293B' }}>{user.name}</div>
                  <div className="text-xs font-semibold leading-tight" style={{ color:roleColor }}>{roleLabel}</div>
                </div>
                <button onClick={handleLogout}
                  className="ml-1 p-1 rounded-lg cursor-pointer hover:bg-red-50 transition-all"
                  style={{ color:'#94A3B8' }}>
                  <LogOut size={13}/>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 p-0">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop:'1px solid rgba(0,61,165,0.06)', background:'rgba(248,250,255,0.8)' }}>
          <div className="flex items-center gap-2">
            <UberIcon size={16}/>
            <UberEatsIcon size={16}/>
            <span className="text-xs font-semibold ml-1" style={{ color:'#94A3B8' }}>
              Uber Québec · {CURRENT_ENT.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background:'rgba(245,158,11,0.1)', color:'#B45309' }}>
              ⚠️ PILOTE · DONNÉES SYNTHÉTIQUES
            </span>
            <span className="text-xs" style={{ color:'#CBD5E1' }}>TAXIMETER.GOV © 2026 🍁</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
