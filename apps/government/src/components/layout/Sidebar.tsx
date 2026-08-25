'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/i18n'
import {
  LayoutDashboard, Radio, Users, Briefcase, Building2,
  Car, FileText, ClipboardCheck, ScrollText,
  Plug, TrendingUp, Receipt, DollarSign, Percent,
  FileBarChart, BookOpen, Scale, Bell, AlertTriangle,
  Search, Shield, BarChart2, Map, PieChart,
  Settings, Key, Webhook, Link2, List, SlidersHorizontal,
  ChevronDown, ChevronRight, Activity, Server,
  CalendarDays, CheckSquare, Workflow, Database,
  Building, UserCog, Gauge
} from 'lucide-react'
import { useState } from 'react'
import { kpiData } from '@/data/mock'

interface NavItem {
  label: string; href?: string; icon: React.ElementType
  badge?: number; children?: NavItem[]
}

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-[9px] font-semibold tracking-widest uppercase text-slate-400">{title}</div>
      {items.map(item => <NavItemRow key={item.label} item={item} depth={0} />)}
    </div>
  )
}

function NavItemRow({ item, depth }: { item: NavItem; depth: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.href ? pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')) || pathname === item.href : false
  const Icon = item.icon

  if (hasChildren) {
    return (
      <div>
        <button onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${depth > 0 ? 'pl-7' : ''} text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-qc-blue`}>
          <Icon size={14} className="shrink-0" />
          <span className="flex-1 text-left font-medium">{item.label}</span>
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        {open && item.children?.map(child => <NavItemRow key={child.label} item={child} depth={depth + 1} />)}
      </div>
    )
  }

  return (
    <Link href={item.href || '#'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
        ${depth > 0 ? 'pl-7' : ''}
        ${isActive ? 'bg-qc-blue text-white font-semibold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-qc-blue'}`}>
      <Icon size={14} className="shrink-0" />
      <span className="flex-1 font-medium">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{item.badge}</span>
      )}
    </Link>
  )
}

export function Sidebar() {
  const { t } = useI18n()
  const alerts = kpiData.alerts

  const sections = [
    {
      title: 'Vue d\'ensemble',
      items: [
        { label: 'Control Center', href: '/control-center', icon: Gauge },
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Activité en direct', href: '/operations/activity', icon: Activity },
      ]
    },
    {
      title: 'Chauffeurs & Véhicules',
      items: [
        { label: 'Chauffeurs', href: '/drivers', icon: Users },
        { label: 'Véhicules', href: '/vehicles', icon: Car },
        { label: 'Licences', href: '/licenses', icon: ScrollText },
        { label: 'Inspections', href: '/inspections', icon: ClipboardCheck },
        { label: 'Travailleurs', href: '/workers', icon: Briefcase },
      ]
    },
    {
      title: 'Plateformes',
      items: [
        { label: 'Connexions', href: '/platforms', icon: Plug },
        { label: 'Opérations Gateway', href: '/platforms/operations', icon: Activity },
        { label: 'Webhook Engine', href: '/webhooks/engine', icon: Webhook },
        { label: 'Simulateur', href: '/simulator', icon: Activity },
      ]
    },
    {
      title: 'Revenus & Transactions',
      items: [
        { label: 'Transactions', href: '/transactions', icon: Receipt },
        { label: 'Ledger Gateway', href: '/transactions/gateway', icon: Receipt },
        { label: 'Revenus', href: '/analytics/revenue', icon: TrendingUp },
        { label: 'Pourboires', href: '/tips', icon: DollarSign },
        { label: 'Remboursements', href: '/refunds', icon: TrendingUp },
      ]
    },
    {
      title: 'Taxes & Fiscalité',
      items: [
        { label: 'Tax Center', href: '/tax/center', icon: Percent },
        { label: 'TPS (5%)', href: '/tax/tps', icon: Percent },
        { label: 'TVQ (9.975%)', href: '/tax/tvq', icon: Percent },
        { label: 'Déclarations', href: '/tax/declarations', icon: BookOpen },
        { label: 'Rapports fiscaux', href: '/tax/reports', icon: FileBarChart },
      ]
    },
    {
      title: 'Conformité',
      items: [
        { label: 'Alertes', href: '/alerts', icon: Bell, badge: alerts.anomalies + alerts.expiredDocs + alerts.apiIssues },
        { label: 'Dossiers conformité', href: '/compliance/cases', icon: AlertTriangle, badge: alerts.anomalies },
        { label: 'Réconciliation', href: '/reconciliation', icon: Scale },
        { label: 'Journal d\'audit', href: '/audit', icon: Shield },
        { label: 'Documents', href: '/documents', icon: FileText },
      ]
    },
    {
      title: 'Analytique & Rapports',
      items: [
        { label: 'Rapports', href: '/reports', icon: FileBarChart },
        { label: 'Revenus', href: '/analytics/revenue', icon: BarChart2 },
        { label: 'Plateformes', href: '/analytics/platforms', icon: PieChart },
        { label: 'Chauffeurs', href: '/analytics/drivers', icon: Users },
      ]
    },
    {
      title: 'Opérations',
      items: [
        { label: 'Tâches', href: '/tasks', icon: CheckSquare },
        { label: 'Approbations', href: '/approvals', icon: Workflow },
        { label: 'Calendrier', href: '/operations/calendar', icon: CalendarDays },
        { label: 'Qualité données', href: '/operations/data-quality', icon: Database },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Utilisateurs gov.', href: '/admin/users', icon: UserCog },
        { label: 'Organisations', href: '/admin/organizations', icon: Building },
        { label: 'Santé système', href: '/system/health', icon: Server },
        { label: 'Confidentialité', href: '/privacy', icon: Shield },
        { label: 'Paramètres', href: '/system/settings', icon: Settings },
      ]
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col z-30" style={{ width: 'var(--sidebar-w)' }}>
      {/* Logo */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ background: 'var(--qc-blue)' }}>⚜</div>
          <div>
            <div className="text-xs font-bold tracking-widest text-qc-blue">TAXIMÈTRE.GOV</div>
            <div className="text-[9px] text-slate-400 tracking-wide">Gouvernement du Québec</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {sections.map(s => <NavSection key={s.title} title={s.title} items={s.items} />)}
      </nav>

      {/* Demo Banner */}
      <div className="px-3 py-2 mx-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 demo-pulse">
        <div className="text-[9px] font-bold text-amber-700 tracking-widest text-center">⚠ DONNÉES DE DÉMONSTRATION</div>
      </div>
    </aside>
  )
}
