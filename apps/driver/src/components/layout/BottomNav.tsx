'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gauge, MapPin, DollarSign, User } from 'lucide-react'

const navItems = [
  { href:'/home', icon:Home, label:'Accueil' },
  { href:'/taximeter', icon:Gauge, label:'Taximètre' },
  { href:'/gps', icon:MapPin, label:'GPS' },
  { href:'/revenue', icon:DollarSign, label:'Revenus' },
  { href:'/profile', icon:User, label:'Profil' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 bottom-nav">
      <div className="flex items-center justify-around px-2 pt-2">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${active ? 'text-qc-blue-light' : 'text-slate-500 hover:text-slate-300'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-qc-blue-light" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
