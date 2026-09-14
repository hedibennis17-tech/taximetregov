'use client'
import { BottomNav } from './BottomNav'
import { TaximetreGovMark } from '@/components/brand/Logo'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useDriverProfile } from '@/lib/api'

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const { profile } = useDriverProfile()
  const initials = profile ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}` : '?'

  return (
    <div className="flex flex-col min-h-screen qc-watermark" style={{ background:'#050E1C' }}>
      {/* Header */}
      <header style={{
        background:'linear-gradient(180deg, #001F5C 0%, #0A1628 100%)',
        borderBottom:'1px solid rgba(59,130,246,0.2)',
        position:'sticky', top:0, zIndex:30,
        boxShadow:'0 2px 16px rgba(0,0,0,0.4)',
      }}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/home" className="flex items-center gap-2.5">
            <TaximetreGovMark size={34} />
            <div>
              <div style={{ fontSize:13, fontWeight:900, letterSpacing:'0.06em', color:'white', lineHeight:1.1 }}>
                TAXIM<span style={{ color:'#3B82F6' }}>È</span>TRE
                <span style={{ color:'#3B82F6' }}>.GOV</span>
              </div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.5)', letterSpacing:'0.08em' }}>
                Gouvernement du Québec
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div style={{ background:'rgba(245,158,11,0.15)', color:'#F59E0B', fontSize:8, fontWeight:700, padding:'3px 8px', borderRadius:6, letterSpacing:'0.08em', border:'1px solid rgba(245,158,11,0.3)' }}>
              PILOTE
            </div>
            <Link href="/notifications" style={{ width:32, height:32, borderRadius:10, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={15} color="#3B82F6" />
            </Link>
            <Link href="/profile" style={{ width:32, height:32, borderRadius:10, background:'#003DA5', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: showNav ? 80 : 0 }}>
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#F0F4FF', margin:0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:11, color:'#8BA3CC', margin:'2px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
