'use client'
import { Bell, Search, Sun, Moon, ChevronDown, AlertCircle, CheckCircle, Clock, User } from 'lucide-react'
import { useTheme } from './Providers'
import { useI18n } from '@/i18n'
import { useState } from 'react'
import { mockAlerts } from '@/data/mock'

export function Topbar() {
  const { theme, toggle } = useTheme()
  const { t, lang, setLang } = useI18n()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const unresolvedAlerts = mockAlerts.filter(a => !a.resolved)

  const priorityColor = { critical: 'text-red-500', high: 'text-orange-500', medium: 'text-yellow-500', low: 'text-blue-500' }
  const priorityIcon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }

  return (
    <header
      className="fixed top-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-3 z-20"
      style={{ left: 'var(--sidebar-w)' }}
    >
      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all
          ${searchOpen ? 'border-qc-blue bg-blue-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
          <kbd className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-600 rounded px-1">⌘K</kbd>
        </div>
      </div>

      {/* System Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-green-700">SYSTÈMES OK</span>
      </div>

      {/* Env badge */}
      <div className="px-2 py-1 rounded text-[10px] font-bold tracking-widest text-white" style={{ background: 'var(--qc-blue)' }}>
        {t.environment}
      </div>

      {/* Language */}
      <button
        onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
        className="text-xs font-semibold text-slate-500 hover:text-qc-blue border border-slate-200 dark:border-slate-700 rounded px-2 py-1 transition-colors"
      >
        {lang === 'fr' ? 'EN' : 'FR'}
      </button>

      {/* Theme */}
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(o => !o)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors relative"
        >
          <Bell size={16} />
          {unresolvedAlerts.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unresolvedAlerts.length}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">Alertes récentes</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {unresolvedAlerts.slice(0, 5).map(a => (
                <div key={a.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{priorityIcon[a.priority]}</span>
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleString('fr-CA')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 text-center">
              <a href="/alerts" className="text-xs text-qc-blue font-medium hover:underline">Voir toutes les alertes →</a>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--qc-blue)' }}>
          GA
        </div>
        <div className="text-left hidden md:block">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Gov. Admin</div>
          <div className="text-[9px] text-slate-400">SUPER_ADMIN</div>
        </div>
        <ChevronDown size={12} className="text-slate-400" />
      </button>
    </header>
  )
}
