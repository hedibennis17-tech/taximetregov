'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/i18n'
import {
  LayoutDashboard, Users, Car, FileText, ScrollText, Plug,
  TrendingUp, Receipt, Percent, FileBarChart, BookOpen, Scale,
  Bell, AlertTriangle, Shield, BarChart2, Settings, Webhook,
  ChevronDown, ChevronRight, Activity, Server, CalendarDays,
  CheckSquare, Workflow, Database, Building, UserCog, Gauge,
  Brain, Clock, Truck, Lock, Eye, Flag, Code, TestTube, ClipboardCheck, Layers,
} from 'lucide-react'
import { useState } from 'react'
import { kpiData } from '@/data/mock'

interface NavItem { label:string; href?:string; icon:React.ElementType; badge?:number; children?:NavItem[] }

function NavSection({ title, items }: { title:string; items:NavItem[] }) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1 text-[9px] font-semibold tracking-widest uppercase" style={{color:"rgba(255,255,255,0.40)"}}>{title}</div>
      {items.map(item=><NavItemRow key={item.label} item={item} depth={0}/>)}
    </div>
  )
}

function NavItemRow({ item, depth }: { item:NavItem; depth:number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.href ? (pathname===item.href || (item.href!=='/' && pathname.startsWith(item.href+'/'))) : false
  const Icon = item.icon
  if (hasChildren) return (
    <div>
      <button onClick={()=>setOpen(o=>!o)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-all ${depth>0?'pl-7':''} text-white/75 hover:bg-white/10 hover:text-white`}>
        <Icon size={13} className="shrink-0"/><span className="flex-1 text-left font-medium">{item.label}</span>
        {open?<ChevronDown size={10}/>:<ChevronRight size={10}/>}
      </button>
      {open && item.children?.map(child=><NavItemRow key={child.label} item={child} depth={depth+1}/>)}
    </div>
  )
  return (
    <Link href={item.href||'#'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-all ${depth>0?'pl-7':''}
        ${isActive?'bg-white/18 text-white font-semibold':'text-white/75 hover:bg-white/10 hover:text-white'}`}>
      <Icon size={13} className="shrink-0"/>
      <span className="flex-1 font-medium">{item.label}</span>
      {item.badge!=null&&item.badge>0&&<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive?'bg-white/20 text-white':'bg-red-100 text-red-600'}`}>{item.badge}</span>}
    </Link>
  )
}

export function Sidebar() {
  const alerts = kpiData.alerts
  const sections = [
    { title:'Vue d\'ensemble', items:[
      { label:'Control Center', href:'/control-center', icon:Gauge },
      { label:'Dashboard', href:'/', icon:LayoutDashboard },
      { label:'Activité en direct', href:'/operations/activity', icon:Activity },
    ]},
    { title:'Chauffeurs & Véhicules', items:[
      { label:'Chauffeurs', href:'/drivers', icon:Users },
      { label:'Véhicules', href:'/vehicles', icon:Car },
      { label:'Licences', href:'/licenses', icon:ScrollText },
      { label:'Documents', href:'/documents', icon:FileText },
    ]},
    { title:'Plateformes', items:[
      { label:'Connexions', href:'/platforms', icon:Plug },
      { label:'Opérations Gateway', href:'/platforms/operations', icon:Activity },
      { label:'Webhook Engine', href:'/webhooks/engine', icon:Webhook },
      { label:'Simulateur', href:'/simulator', icon:Activity },
    ]},
    { title:'Revenus & Transactions', items:[
      { label:'🏛️ Transparence transactionnelle', href:'/provider-transparency', icon:Layers },
      { label:'Transactions', href:'/transactions', icon:Receipt },
      { label:'Ledger Gateway', href:'/transactions/gateway', icon:Receipt },
      { label:'Réconciliation', href:'/reconciliation', icon:Scale },
    ]},
    { title:'Taxes & Fiscalité', items:[
      { label:'Tax Center', href:'/tax/center', icon:Percent },
      { label:'Déclarations', href:'/tax/declarations', icon:BookOpen },
      { label:'Rapports fiscaux', href:'/tax/reports', icon:FileBarChart },
    ]},
    { title:'Analytics', items:[
      { label:'📊 Analytics Center', href:'/analytics/overview', icon:BarChart2 },
      { label:'💰 Revenus', href:'/analytics/revenue', icon:TrendingUp },
      { label:'📋 Taxes', href:'/analytics/taxes', icon:Percent },
      { label:'🚕 Taxi', href:'/analytics/taxi', icon:Car },
      { label:'📦 Livraisons', href:'/analytics/delivery', icon:Truck },
      { label:'⚖️ Conformité', href:'/analytics/compliance', icon:Shield },
      { label:'🧠 Intelligence', href:'/analytics/intelligence', icon:Brain },
      { label:'🚗 Chauffeurs', href:'/analytics/drivers', icon:Users },
    ]},
    { title:'Rapports', items:[
      { label:'Générateur', href:'/reports/builder', icon:FileBarChart },
      { label:'Programmés', href:'/reports/scheduled', icon:Clock },
      { label:'Fiscal', href:'/reports/tax', icon:Percent },
      { label:'Plateformes', href:'/reports/platform', icon:Plug },
      { label:'Conformité', href:'/reports/compliance', icon:Shield },
    ]},
    { title:'Conformité', items:[
      { label:'Alertes', href:'/alerts', icon:Bell, badge:alerts.anomalies+alerts.expiredDocs+alerts.apiIssues },
      { label:'Dossiers', href:'/compliance/cases', icon:AlertTriangle, badge:alerts.anomalies },
      { label:'Audit', href:'/audit', icon:Eye },
    ]},
    { title:'Opérations', items:[
      { label:'Tâches', href:'/tasks', icon:CheckSquare },
      { label:'Approbations', href:'/approvals', icon:Workflow },
      { label:'Calendrier', href:'/operations/calendar', icon:CalendarDays },
      { label:'Qualité données', href:'/operations/data-quality', icon:Database },
    ]},
    { title:'🔐 Sécurité & Gouvernance', items:[
      { label:'Security Center', href:'/security/center', icon:Shield },
      { label:'Monitoring', href:'/security/monitoring', icon:Activity },
      { label:'Sessions', href:'/security/sessions', icon:Lock },
      { label:'Governance Center', href:'/governance/center', icon:Flag },
      { label:'Confidentialité', href:'/privacy/center', icon:Shield },
    ]},
    { title:'🚀 Étape 9 — Final QA', items:[
      { label:'Production Readiness', href:'/production-readiness', icon:ClipboardCheck },
      { label:'E2E Test Suite', href:'/e2e-tests', icon:TestTube },
      { label:'API Contract', href:'/api-contract', icon:Code },
    ]},
    { title:'Administration', items:[
      { label:'Utilisateurs gov.', href:'/admin/users', icon:UserCog },
      { label:'Organisations', href:'/admin/organizations', icon:Building },
      { label:'Santé système', href:'/system/health', icon:Server },
      { label:'Paramètres', href:'/system/settings', icon:Settings },
    ]},
  ]
  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col z-30" style={{width:"var(--sidebar-w)",background:"#002D7A"}} style={{width:'var(--sidebar-w)'}}>
      <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.10)"}}>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TAXIMETER.GOV" width={32} height={32} style={{objectFit:'contain',borderRadius:8}} />
          <div>
            <div className="text-xs font-bold tracking-widest text-white">TAXIMÈTRE.GOV</div>
            <div className="text-[9px] tracking-wide" style={{color:"rgba(255,255,255,0.55)"}}  className="">Gouvernement du Québec</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {sections.map(s=><NavSection key={s.title} title={s.title} items={s.items}/>)}
      </nav>
      <div className="px-3 py-2 mx-2 mb-3 rounded-lg" style={{background:"rgba(245,166,35,0.15)",border:"1px solid rgba(245,166,35,0.35)"}}>
        <div className="text-[9px] font-bold tracking-widest text-center" style={{color:"#F5A623"}} className="">⚠ DONNÉES DE DÉMONSTRATION — PILOT</div>
      </div>
    </aside>
  )
}
