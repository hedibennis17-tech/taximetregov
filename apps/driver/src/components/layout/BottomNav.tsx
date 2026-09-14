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
  principal:'⚡ Principal',
  dossier:  '📁 Mon dossier',
  fiscal:   '💰 Fiscal & Revenus',
  systeme:  '⚙️ Système',
}

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(4px)' }}
          onClick={() => setOpen(false)}>
          <div style={{
            position:'absolute', bottom:72, left:8, right:8,
            borderRadius:20, background:'white', border:'1px solid #DDE3EE',
            boxShadow:'0 -4px 40px rgba(0,0,0,0.15)', overflow:'hidden',
          }} onClick={e => e.stopPropagation()}>
            {/* Header menu */}
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #EDF0F7', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:900, letterSpacing:'0.12em', color:'#003DA5' }}>TAXIMETER.GOV</div>
                <div style={{ fontSize:9, color:'#8A96A8' }}>Espace professionnel chauffeur</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ width:28, height:28, borderRadius:8, background:'#F4F6FA', border:'1px solid #DDE3EE', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={14} color="#4A5568" />
              </button>
            </div>

            <div style={{ maxHeight:'62vh', overflowY:'auto', padding:8 }}>
              {Object.entries(cats).map(([cat, label]) => (
                <div key={cat} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:'#8A96A8', padding:'4px 8px 6px', textTransform:'uppercase' }}>{label}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                    {menuItems.filter(i => i.cat === cat).map(item => {
                      const active = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                          style={{
                            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                            padding:'10px 4px', borderRadius:12, textDecoration:'none',
                            background: active ? '#EBF0FA' : '#F8FAFF',
                            border: `1px solid ${active ? '#003DA5' : '#EDF0F7'}`,
                            transition:'all 0.15s',
                          }}>
                          <span style={{ fontSize:20 }}>{item.emoji}</span>
                          <span style={{ fontSize:9, fontWeight:600, textAlign:'center', lineHeight:1.2, color: active ? '#003DA5' : '#4A5568' }}>{item.label}</span>
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

      {/* Barre de navigation */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        background:'white', borderTop:'1px solid #DDE3EE',
        boxShadow:'0 -2px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', padding:'6px 4px 8px' }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'6px 12px', borderRadius:10, textDecoration:'none', transition:'all 0.15s', background: active ? '#EBF0FA' : 'transparent' }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} color={active ? '#003DA5' : '#8A96A8'} />
                <span style={{ fontSize:9, fontWeight: active ? 700 : 500, color: active ? '#003DA5' : '#8A96A8' }}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setOpen(o => !o)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'6px 12px', borderRadius:10, border:'none', cursor:'pointer', background: open ? '#EBF0FA' : 'transparent', transition:'all 0.15s' }}>
            <Grid size={20} strokeWidth={open ? 2.5 : 1.8} color={open ? '#003DA5' : '#8A96A8'} />
            <span style={{ fontSize:9, fontWeight: open ? 700 : 500, color: open ? '#003DA5' : '#8A96A8' }}>Menu</span>
          </button>
        </div>
      </nav>
    </>
  )
}
