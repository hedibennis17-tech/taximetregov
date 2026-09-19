'use client'
import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Bell, LogOut, Building2, ChevronDown } from 'lucide-react'
import { NAV_SECTIONS, CURRENT_ENT, NOTIFICATIONS } from '@/lib/data'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const unread = NOTIFICATIONS.filter(n=>!n.read).length

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-200 ${open?'translate-x-0':'-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-qc-blue flex items-center justify-center">
              <Building2 size={16} className="text-white"/>
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">TAXIMETER.GOV</div>
              <div className="text-[9px] text-qc-blue font-bold">Enterprise Gov</div>
            </div>
          </div>
          {/* Entreprise courante — Logo Uber + Uber Eats */}
          <div className="rounded-xl px-3 py-2.5" style={{background:'#000000'}}>
            {/* Uber logo */}
            <div className="text-white font-black tracking-tighter" style={{fontSize:'1.5rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
            {/* Uber Eats logo */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-black" style={{fontFamily:'system-ui',letterSpacing:'-0.5px',color:'#06B029',fontSize:'0.7rem'}}>Uber</span>
              <span className="font-black" style={{fontFamily:'system-ui',letterSpacing:'-0.5px',color:'rgba(255,255,255,0.7)',fontSize:'0.7rem'}}>Eats</span>
              <span className="text-[7px] font-bold" style={{color:'rgba(255,255,255,0.35)'}}>+ 5 services</span>
            </div>
            <div className="text-[7px] font-mono mt-1" style={{color:'rgba(255,255,255,0.35)'}}>DEMO · {CURRENT_ENT.id}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
              <span className="text-[8px] font-bold" style={{color:'rgba(255,255,255,0.7)'}}>Connecté · PILOTE</span>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_SECTIONS.map(sec=>(
            <div key={sec.section} className="mb-3">
              <div className="text-[8px] font-bold text-slate-400 uppercase px-2 mb-1">{sec.section}</div>
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
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[8px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg mb-2">⚠️ DONNÉES SYNTHÉTIQUES — PILOTE</div>
          <button className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-red-500 transition-colors w-full">
            <LogOut size={11}/> Déconnexion (DEMO)
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open&&<div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={()=>setOpen(false)}/>}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-14 flex items-center px-4 gap-3">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setOpen(true)}>
            <Menu size={16} className="text-slate-500"/>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-400 hidden md:block">
              {CURRENT_ENT.tradeName} · {CURRENT_ENT.id} · NEQ: {CURRENT_ENT.neq}
            </div>
          </div>
          <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell size={16} className="text-slate-500"/>
            {unread>0&&<div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">{unread}</div>}
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-qc-blue flex items-center justify-center text-[10px] font-black text-white">R</div>
            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 hidden md:block">Sophie Marchand</div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
