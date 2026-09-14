'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gauge, FileText, DollarSign, User, Grid, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href:'/home',      icon:Home,      label:'Accueil'   },
  { href:'/taximeter', icon:Gauge,      label:'Taximètre' },
  { href:'/tax',       icon:FileText,   label:'Fiscal'    },
  { href:'/revenue',   icon:DollarSign, label:'Revenus'   },
  { href:'/profile',   icon:User,       label:'Profil'    },
]

const menuItems = [
  { href:'/home',          label:'Accueil',                 emoji:'🏠', cat:'principal' },
  { href:'/taximeter',     label:'Taximètre',               emoji:'📟', cat:'principal' },
  { href:'/trips',         label:'Mes courses',             emoji:'🚕', cat:'principal' },
  { href:'/revenue',       label:'Mes revenus',             emoji:'💰', cat:'principal' },
  { href:'/profile',       label:'Mon profil',              emoji:'👤', cat:'dossier'   },
  { href:'/documents',     label:'Mes documents',           emoji:'📄', cat:'dossier'   },
  { href:'/vehicle',       label:'Mon véhicule',            emoji:'🚗', cat:'dossier'   },
  { href:'/platforms',     label:'Mes plateformes',         emoji:'🔌', cat:'dossier'   },
  { href:'/tax',           label:'Fiscalité & Déclarations',emoji:'🧾', cat:'fiscal'    },
  { href:'/wallet',        label:'Wallet & Paiements',      emoji:'💳', cat:'fiscal'    },
  { href:'/compliance',    label:'Ma conformité',           emoji:'✅', cat:'fiscal'    },
  { href:'/notifications', label:'Notifications',           emoji:'🔔', cat:'systeme'   },
  { href:'/sync',          label:'Synchronisation',         emoji:'🔄', cat:'systeme'   },
  { href:'/security',      label:'Sécurité',                emoji:'🔐', cat:'systeme'   },
  { href:'/support',       label:'Support',                 emoji:'🆘', cat:'systeme'   },
]

const cats: Record<string,string> = {
  principal:'⚡ Principal', dossier:'📁 Mon dossier', fiscal:'💰 Fiscal', systeme:'⚙️ Système',
}

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)' }} onClick={() => setOpen(false)}>
          <div style={{ position:'absolute', bottom:68, left:6, right:6, borderRadius:20, background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'0 -8px 40px rgba(0,0,0,.5)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--header-bg)' }}>
              <span style={{ fontSize:11, fontWeight:900, letterSpacing:'0.12em', color:'var(--text)' }}>TAXIMETER<span style={{ color:'#3B82F6' }}>.GOV</span></span>
              <button onClick={() => setOpen(false)} style={{ width:26, height:26, borderRadius:8, background:'rgba(59,130,246,.1)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={13} color="#3B82F6" /></button>
            </div>
            <div style={{ maxHeight:'60vh', overflowY:'auto', padding:8 }}>
              {Object.entries(cats).map(([cat, label]) => (
                <div key={cat} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.1em', color:'var(--text-3)', padding:'4px 6px', textTransform:'uppercase' }}>{label}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
                    {menuItems.filter(i => i.cat === cat).map(item => {
                      const active = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 4px', borderRadius:12, textDecoration:'none', background: active ? 'rgba(0,61,165,.3)' : 'rgba(59,130,246,.05)', border:`1px solid ${active ? '#3B82F6' : 'var(--border)'}` }}>
                          <span style={{ fontSize:20 }}>{item.emoji}</span>
                          <span style={{ fontSize:8.5, fontWeight:600, textAlign:'center', lineHeight:1.2, color: active ? '#3B82F6' : 'var(--text-2)' }}>{item.label}</span>
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
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, background:'var(--nav-bg)', borderTop:'1px solid var(--nav-bdr)', boxShadow:'0 -2px 12px rgba(0,0,0,.08)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'6px 2px 8px' }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'5px 10px', borderRadius:10, textDecoration:'none', background: active ? 'rgba(0,61,165,0.12)' : 'transparent' }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} color={active ? 'var(--nav-active)' : 'var(--text-3)'} />
                <span style={{ fontSize:8.5, fontWeight: active ? 700 : 400, color: active ? 'var(--nav-active)' : 'var(--text-3)' }}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setOpen(o => !o)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'5px 10px', borderRadius:10, border:'none', cursor:'pointer', background: open ? 'rgba(0,61,165,0.12)' : 'transparent' }}>
            <Grid size={20} strokeWidth={open ? 2.5 : 1.8} color={open ? 'var(--nav-active)' : 'var(--text-3)'} />
            <span style={{ fontSize:8.5, fontWeight: open ? 700 : 400, color: open ? 'var(--nav-active)' : 'var(--text-3)' }}>Menu</span>
          </button>
        </div>
      </nav>
    </>
  )
}
