'use client'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <Topbar />
      <main
        className="pt-14 min-h-screen"
        style={{ marginLeft: 'var(--sidebar-w)' }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
