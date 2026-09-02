'use client'

import { Bell, Search, Sun, Moon, ChevronDown, LogOut, ShieldCheck } from 'lucide-react'
import { useTheme } from './Providers'
import { useI18n } from '@/i18n'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAdminIdentity } from '@/lib/supabase/useAdminIdentity'

export function Topbar() {
  const { theme, toggle } = useTheme()
  const { t, lang, setLang } = useI18n()
  const { administrator } = useAdminIdentity()
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut()
    window.location.assign('/auth/login')
  }

  const role = administrator?.roles[0] ?? 'ACCÈS VÉRIFIÉ'
  const initials = administrator?.email.slice(0, 2).toUpperCase() ?? 'GA'

  return (
    <header className="fixed top-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-3 z-20" style={{ left: 'var(--sidebar-w)' }}>
      <div className="flex-1 max-w-lg"><div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${searchOpen ? 'border-qc-blue bg-blue-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}><Search size={14} className="text-slate-400" /><input type="text" placeholder={t.search} className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} /></div></div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[10px] font-semibold text-green-700">SESSION SÉCURISÉE</span></div>
      <div className="px-2 py-1 rounded text-[10px] font-bold tracking-widest text-white" style={{ background: 'var(--qc-blue)' }}>{t.environment}</div>
      <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="text-xs font-semibold text-slate-500 hover:text-qc-blue border border-slate-200 dark:border-slate-700 rounded px-2 py-1 transition-colors">{lang === 'fr' ? 'EN' : 'FR'}</button>
      <button onClick={toggle} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" aria-label="Notifications"><Bell size={16} /></button>
      <div className="relative"><button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--qc-blue)' }}>{initials}</div><div className="text-left hidden md:block"><div className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-48 truncate">{administrator?.email ?? 'Vérification…'}</div><div className="text-[9px] text-slate-400">{role}</div></div><ChevronDown size={12} className="text-slate-400" /></button>{profileOpen && <div className="absolute right-0 top-10 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-green-600" />Authentification et MFA vérifiés</div><button onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={14} />Déconnexion sécurisée</button></div>}</div>
    </header>
  )
}
