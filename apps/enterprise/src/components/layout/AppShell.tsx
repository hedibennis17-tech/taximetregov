'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/auth/rbac'
import { Menu, Bell, LogOut, Building2 } from 'lucide-react'
import { NAV_SECTIONS, CURRENT_ENT, NOTIFICATIONS } from '@/lib/data'
import { signOut } from '@/lib/supabase/auth'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen]     = useState(false)
  const pathname            = usePathname()
  const router              = useRouter()
  const { user }            = useAuth()
  const unread              = NOTIFICATIONS.filter(n=>!n.read).length

  const handleLogout = async () => {
    try { await signOut() } catch {}
    router.replace('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()
    : 'U'

  const roleColor = user ? (ROLE_COLORS[user.role as Role] ?? '#003DA5') : '#003DA5'
  const roleLabel = user ? (ROLE_LABELS[user.role as Role] ?? user.role) : ''

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-200 ${open?'translate-x-0':'-translate-x-full'} lg:translate-x-0`}>

        {/* Logo TAXIMETER.GOV */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-white"/>
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">TAXIMETER.GOV</div>
              <div className="text-sm text-blue-700 font-bold">Enterprise Gov</div>
            </div>
          </div>

          {/* Bloc entreprise Uber */}
          <div className="rounded-2xl px-4 py-3" style={{background:'#000'}}>
            <div className="font-black text-white tracking-tighter" style={{fontSize:'2rem',fontFamily:'system-ui',letterSpacing:'-0.05em',lineHeight:0.9}}>uber</div>
            <div className="my-1.5" style={{height:'1px',background:'rgba(255,255,255,0.1)'}}/>
            <div className="flex items-center gap-1.5">
              <span className="font-black" style={{fontFamily:'system-ui',color:'#06B029',fontSize:'1rem',lineHeight:1}}>Uber</span>
              <span className="font-black text-white" style={{fontFamily:'system-ui',fontSize:'1rem',lineHeight:1}}>Eats</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {['🚕','🚗','🟢','🛒','📦'].map((e,i)=><span key={i} className="text-sm">{e}</span>)}
              <span className="text-xs font-bold ml-1" style={{color:'rgba(255,255,255,0.35)'}}>6 services</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
              <span className="text-sm font-bold" style={{color:'rgba(255,255,255,0.55)'}}>Connecté · PILOTE</span>
            </div>
          </div>

          {/* User connecté */}
          {user && (
            <div className="mt-2.5 px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-black shrink-0" style={{background:roleColor}}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</div>
                  <div className="text-sm text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:roleColor}}>{roleLabel}</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">🔒 Sécurisé</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_SECTIONS.map(sec=>(
            <div key={sec.section} className="mb-3">
              <div className="text-sm font-bold text-slate-400 uppercase px-2 mb-1">{sec.section}</div>
              {sec.items.map(item=>{
                const active = pathname===item.href||(item.href!=='/'&&pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}
                    className="flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all mb-0.5"
                    style={{background:active?'#003DA5':'transparent',color:active?'white':'#64748B'}}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-sm text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
            ⚠️ DONNÉES SYNTHÉTIQUES — PILOTE
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors w-full cursor-pointer py-1"
          >
            <LogOut size={12}/> Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open&&<div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={()=>setOpen(false)}/>}

      {/* ── MAIN ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-14 flex items-center px-4 gap-3">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setOpen(true)}>
            <Menu size={16} className="text-slate-500"/>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-400 hidden md:block">
              {CURRENT_ENT.tradeName} · {CURRENT_ENT.id} · NEQ: {CURRENT_ENT.neq}
            </div>
          </div>
          <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell size={16} className="text-slate-500"/>
            {unread>0&&<div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-sm font-black text-white">{unread}</div>}
          </Link>
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0" style={{background:roleColor}}>
                {initials}
              </div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200 hidden md:block">{user.name}</div>
              <button onClick={handleLogout} className="ml-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer hidden md:block">
                <LogOut size={12}/>
              </button>
            </div>
          )}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
