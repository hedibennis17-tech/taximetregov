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
    <div className="flex flex-col min-h-screen qc-watermark" style={{ background:'#F4F6FA' }}>

      {/* Header gouvernemental */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #DDE3EE',
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Bande bleue QC */}
        <div style={{ background: '#003DA5', height: 4 }} />

        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2">
            <TaximetreGovMark size={28} />
            <div>
              <div style={{ fontSize:12, fontWeight:900, letterSpacing:'0.06em', color:'#003DA5', lineHeight:1.1 }}>
                TAXIM<span style={{ color:'#C8102E' }}>È</span>TRE.GOV
              </div>
              <div style={{ fontSize:8, color:'#8A96A8', letterSpacing:'0.05em' }}>
                Gouvernement du Québec
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Badge pilote */}
            <div style={{ background:'#FEF3C7', color:'#D97706', fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:6, letterSpacing:'0.05em' }}>
              PILOTE
            </div>

            {/* Notifications */}
            <Link href="/notifications"
              style={{ width:32, height:32, borderRadius:10, background:'#F4F6FA', border:'1px solid #DDE3EE', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={15} style={{ color:'#4A5568' }} />
            </Link>

            {/* Avatar */}
            <Link href="/profile"
              style={{ width:32, height:32, borderRadius:10, background:'#003DA5', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>
              {initials}
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {children}
      </main>

      {/* Navigation bas */}
      <BottomNav />
    </div>
  )
}

// PageHeader réutilisable
export function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#0A1628', margin:0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:11, color:'#8A96A8', margin:'2px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
