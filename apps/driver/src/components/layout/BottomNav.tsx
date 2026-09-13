'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gauge, DollarSign, FileText, User, Grid } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/home',      icon: Home,        label: 'Accueil'   },
  { href: '/taximeter', icon: Gauge,        label: 'Taximètre' },
  { href: '/tax',       icon: FileText,     label: 'Fiscal'    },
  { href: '/revenue',   icon: DollarSign,   label: 'Revenus'   },
  { href: '/profile',   icon: User,         label: 'Profil'    },
]

const menuItems = [
  { href: '/home',          label: 'Accueil',                emoji: '🏠', cat: 'principal' },
  { href: '/taximeter',     label: 'Taximètre',              emoji: '📟', cat: 'principal' },
  { href: '/trips',         label: 'Mes courses',            emoji: '🚕', cat: 'principal' },
  { href: '/revenue',       label: 'Mes revenus',            emoji: '💰', cat: 'principal' },
  { href: '/profile',       label: 'Mon profil',             emoji: '👤', cat: 'dossier'   },
  { href: '/documents',     label: 'Mes documents',          emoji: '📄', cat: 'dossier'   },
  { href: '/vehicle',       label: 'Mon véhicule',           emoji: '🚗', cat: 'dossier'   },
  { href: '/platforms',     label: 'Mes plateformes',        emoji: '🔌', cat: 'dossier'   },
  { href: '/tax',           label: 'Fiscalité & Déclarations', emoji: '🧾', cat: 'fiscal'  },
  { href: '/wallet',        label: 'Wallet & Paiements',     emoji: '💳', cat: 'fiscal'    },
  { href: '/compliance',    label: 'Ma conformité',          emoji: '✅', cat: 'fiscal'    },
  { href: '/notifications', label: 'Notifications',          emoji: '🔔', cat: 'systeme'   },
  { href: '/sync',          label: 'Synchronisation',        emoji: '🔄', cat: 'systeme'   },
  { href: '/security',      label: 'Sécurité',               emoji: '🔐', cat: 'systeme'   },
  { href: '/support',       label: 'Support',                emoji: '🆘', cat: 'systeme'   },
]

const cats: Record<string, string> = {
  principal: '⚡ Principal',
  dossier:   '📁 Mon dossier',
  fiscal:    '💰 Fiscal & Revenus',
  systeme:   '⚙️ Système',
}

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute bottom-20 left-2 right-2 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black tracking-[0.2em] text-qc-blue">TAXIMETER.GOV</div>
                <div className="text-[9px] text-slate-500">Espace professionnel chauffeur</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-500 text-lg">✕</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {Object.entries(cats).map(([cat, catLabel]) => (
                <div key={cat} className="mb-3">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-2 pb-1">{catLabel}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {menuItems.filter(i => i.cat === cat).map(item => {
                      const active = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all
                            ${active ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-300 active:bg-slate-700'}`}>
                          <span className="text-xl leading-none">{item.emoji}</span>
                          <span className="text-[9px] font-semibold text-center leading-tight">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))
            const Icon   = item.icon
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all
                  ${active ? 'text-qc-blue' : 'text-slate-500'}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[9px] font-semibold">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-qc-blue" />}
              </Link>
            )
          })}
          <button onClick={() => setOpen(o => !o)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all
              ${open ? 'text-qc-blue bg-qc-blue/10' : 'text-slate-500'}`}>
            <Grid size={20} strokeWidth={open ? 2.5 : 1.5} />
            <span className="text-[9px] font-semibold">Menu</span>
          </button>
        </div>
      </nav>
    </>
  )
}
