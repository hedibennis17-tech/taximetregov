'use client'
import { BottomNav } from './BottomNav'
import { PilotBanner } from '@/components/ui'
import { ReactNode } from 'react'

export function AppShell({ children, showNav = true, className = '' }: { children: ReactNode; showNav?: boolean; className?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <PilotBanner />
      <main className={`flex-1 ${showNav ? 'pb-24' : ''} ${className}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}

// Page header for driver app
export function PageHeader({ title, subtitle, back, action }: { title:string; subtitle?:string; back?:string; action?: ReactNode }) {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}
