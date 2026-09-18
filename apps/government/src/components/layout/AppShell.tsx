'use client'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ReactNode } from 'react'
import { RequireAdminSession } from '@/components/auth/RequireAdminSession'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RequireAdminSession>
      <div className="min-h-screen" style={{background:"#D6E4F7"}}>
        <Sidebar />
        <Topbar />
        <main
          className="pt-14 min-h-screen" style={{background:"#E0ECF9"}}
          style={{ marginLeft: 'var(--sidebar-w)' }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </RequireAdminSession>
  )
}
