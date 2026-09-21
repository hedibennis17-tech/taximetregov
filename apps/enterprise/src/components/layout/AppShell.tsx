'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/auth/rbac'
import { Menu, Bell, LogOut, ChevronRight } from 'lucide-react'
import { NAV_SECTIONS, CURRENT_ENT, NOTIFICATIONS } from '@/lib/data'
import { signOut } from '@/lib/supabase/auth'

// ── Logos Uber / Uber Eats — vraies images PNG ──
function UberIcon({ size = 32 }: { size?: number }) {
  const src = size <= 32 ? '/logos/uber-icon-32.png' : '/logos/uber-icon-64.png'
  return <img src={src} width={size} height={size} alt="Uber" style={{borderRadius: size*0.2, objectFit:'cover'}}/>
}

function UberEatsIcon({ size = 32 }: { size?: number }) {
  const src = size <= 32 ? '/logos/uber-eats-32.png' : '/logos/uber-eats-64.png'
  return <img src={src} width={size} height={size} alt="Uber Eats" style={{borderRadius: size*0.2, objectFit:'cover'}}/>
}

function UberTextLogo({ height = 40 }: { height?: number }) {
  const ratio = 1170/984
  return <img src="/logos/uber-text-40.png" height={height} width={Math.round(height*ratio)} alt="Uber" style={{filter:'brightness(0) invert(1)'}}/>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen]   = useState(false)
  const pathname          = usePathname()
  const router            = useRouter()
  const { user }          = useAuth()
  const unread            = NOTIFICATIONS.filter(n => !n.read).length

  const handleLogout = async () => {
    try { await signOut() } catch {}
    router.replace('/login')
  }

  const initials  = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'
  const roleColor = user ? (ROLE_COLORS[user.role as Role] ?? '#003DA5') : '#003DA5'
  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : ''

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F5F7' }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `} style={{ background: '#0A0A0A', boxShadow: '4px 0 32px rgba(0,0,0,0.18)' }}>

        {/* ── Header sidebar ── */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          {/* TAXIMETER.GOV badge */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#003DA5,#0057E7)', boxShadow: '0 2px 12px rgba(0,61,165,0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-black tracking-tight" style={{ color: 'white', letterSpacing: '-0.02em' }}>
                TAXIMETER.GOV
              </div>
              <div className="text-xs font-semibold" style={{ color: '#06C167' }}>Enterprise Gov</div>
            </div>
          </div>

          {/* ── Carte Uber — logos réels ── */}
          <div className="rounded-2xl p-4" style={{
            background: 'linear-gradient(145deg, #1A1A1A, #111)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
          }}>
            {/* Logos vrais PNG côte à côte */}
            <div className="flex items-center gap-3 mb-3">
              <UberIcon size={48}/>
              <UberEatsIcon size={48}/>
              <div className="flex-1"/>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-white leading-tight">Uber</span>
                <span className="text-xs font-black leading-tight" style={{ color: '#06C167' }}>Québec</span>
              </div>
            </div>

            {/* Dépt badges */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {[
                { e: '🚗', l: 'Rides' },
                { e: '🚕', l: 'Taxi' },
                { e: '🟢', l: 'Green' },
                { e: '🍔', l: 'Eats' },
                { e: '🛒', l: 'Grocery' },
                { e: '📦', l: 'Courier' },
              ].map(d => (
                <span key={d.l} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }}>
                  {d.e} {d.l}
                </span>
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#06C167' }}/>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Connecté · PILOTE · {CURRENT_ENT.id}
              </span>
            </div>
          </div>

          {/* ── User card ── */}
          {user && (
            <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
                style={{ background: roleColor, boxShadow: `0 2px 8px ${roleColor}60` }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: roleColor + '30', color: roleColor }}>
                    {roleLabel}
                  </span>
                  <span className="text-xs" style={{ color: '#06C167' }}>🔒</span>
                </div>
              </div>
              <button onClick={handleLogout}
                className="p-1.5 rounded-lg cursor-pointer transition-all hover:bg-red-500/20"
                style={{ color: 'rgba(255,255,255,0.3)' }} title="Déconnexion">
                <LogOut size={14}/>
              </button>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.section} className="mb-4">
              <div className="px-3 mb-1.5 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
                {sec.section}
              </div>
              {sec.items.map(item => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all group"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgba(0,61,165,0.8), rgba(0,87,231,0.6))'
                        : 'transparent',
                      color: active ? 'white' : 'rgba(255,255,255,0.45)',
                      boxShadow: active ? '0 2px 12px rgba(0,61,165,0.3)' : 'none',
                    }}>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight size={14} className="opacity-60 shrink-0"/>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer sidebar ── */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-xs">⚠️</span>
            <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
              DONNÉES SYNTHÉTIQUES · PILOTE
            </span>
          </div>
          <div className="text-xs text-center font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>
            TAXIMETER.GOV · v2026 · Québec 🍁
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}/>
      )}

      {/* ══════════════ MAIN ══════════════ */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-20 h-16 flex items-center px-5 gap-4"
          style={{
            background: 'rgba(245,245,247,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
          }}>

          {/* Burger mobile */}
          <button className="lg:hidden p-2 rounded-xl hover:bg-black/5 cursor-pointer transition-all"
            onClick={() => setOpen(true)}>
            <Menu size={18} className="text-slate-600"/>
          </button>

          {/* Breadcrumb / info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="shrink-0">
                <UberIcon size={24}/>
              </div>
              <span className="text-sm font-bold text-slate-800 truncate hidden sm:block">
                {CURRENT_ENT.tradeName}
              </span>
              <span className="text-sm text-slate-400 hidden md:block">·</span>
              <span className="text-sm text-slate-400 hidden md:block truncate">
                {CURRENT_ENT.id}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification bell */}
            <Link href="/notifications"
              className="relative p-2.5 rounded-xl transition-all hover:bg-black/5"
              style={{ color: '#64748B' }}>
              <Bell size={18}/>
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: '#DC2626', fontSize: '9px' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* User pill */}
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ background: roleColor }}>
                  {initials}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-bold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-xs font-semibold leading-tight" style={{ color: roleColor }}>{roleLabel}</div>
                </div>
                <button onClick={handleLogout}
                  className="ml-1 p-1 rounded-lg cursor-pointer hover:bg-red-50 transition-all"
                  style={{ color: '#94A3B8' }}>
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

        {/* ── Footer page ── */}
        <footer className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(245,245,247,0.5)' }}>
          <div className="flex items-center gap-2">
            <UberIcon size={16}/>
            <UberEatsIcon size={16}/>
            <span className="text-xs font-semibold text-slate-400 ml-1">Uber Québec · {CURRENT_ENT.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#B45309' }}>
              ⚠️ PILOTE · DONNÉES SYNTHÉTIQUES
            </span>
            <span className="text-xs text-slate-300">TAXIMETER.GOV © 2026 🍁</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
