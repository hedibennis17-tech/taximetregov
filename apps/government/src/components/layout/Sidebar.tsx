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
  ChevronDown, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { kpiData } from '@/data/mock'

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  badge?: number
  children?: NavItem[]
}

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="mb-2">
      <div className="px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-slate-400">{title}</div>
      {items.map(item => <NavItemRow key={item.label} item={item} depth={0} />)}
    </div>
  )
}

function NavItemRow({ item, depth }: { item: NavItem; depth: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false
  const Icon = item.icon

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
            ${depth > 0 ? 'pl-8' : ''}
            text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-qc-blue`}
        >
          <Icon size={15} className="shrink-0" />
          <span className="flex-1 text-left font-medium">{item.label}</span>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {open && item.children?.map(child => (
          <NavItemRow key={child.label} item={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <Link
      href={item.href || '#'}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
        ${depth > 0 ? 'pl-8' : ''}
        ${isActive
          ? 'bg-qc-blue text-white font-semibold shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-qc-blue'
        }`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="flex-1 font-medium">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar() {
  const { t } = useI18n()
  const alerts = kpiData.alerts

  const sections = [
    {
      title: t.nav.overview,
      items: [
        { label: t.nav.dashboard, href: '/', icon: LayoutDashboard },
        { label: t.nav.liveOps, href: '/live', icon: Radio, badge: kpiData.drivers.online },
      ]
    },
    {
      title: t.nav.people,
      items: [
        { label: t.nav.drivers, href: '/drivers', icon: Users },
        { label: t.nav.workers, href: '/workers', icon: Briefcase },
        { label: t.nav.organizations, href: '/organizations', icon: Building2 },
      ]
    },
    {
      title: t.nav.transport,
      items: [
        { label: t.nav.vehicles, href: '/vehicles', icon: Car },
        { label: t.nav.taxiLicenses, href: '/licenses', icon: ScrollText },
        { label: t.nav.inspections, href: '/inspections', icon: ClipboardCheck },
        { label: t.nav.permits, href: '/permits', icon: FileText },
      ]
    },
    {
      title: t.nav.platforms,
      items: [
        { label: t.nav.platformConnections, href: '/platforms', icon: Plug },
        { label: 'Uber', href: '/platforms/uber', icon: Car },
        { label: 'Lyft', href: '/platforms/lyft', icon: Car },
        { label: 'DoorDash', href: '/platforms/doordash', icon: Car },
        { label: 'Instacart', href: '/platforms/instacart', icon: Car },
        { label: 'Uber Eats', href: '/platforms/ubereats', icon: Car },
        { label: 'Skip', href: '/platforms/skip', icon: Car },
      ]
    },
    {
      title: t.nav.revenue,
      items: [
        { label: t.nav.transactions, href: '/transactions', icon: Receipt },
        { label: t.nav.trips, href: '/trips', icon: Map },
        { label: t.nav.deliveries, href: '/deliveries', icon: Briefcase },
        { label: t.nav.tips, href: '/tips', icon: DollarSign },
        { label: t.nav.adjustments, href: '/adjustments', icon: SlidersHorizontal },
        { label: t.nav.refunds, href: '/refunds', icon: TrendingUp },
      ]
    },
    {
      title: t.nav.tax,
      items: [
        { label: t.nav.tps, href: '/tax/tps', icon: Percent },
        { label: t.nav.tvq, href: '/tax/tvq', icon: Percent },
        { label: t.nav.taxReports, href: '/tax/reports', icon: FileBarChart },
        { label: t.nav.declarations, href: '/tax/declarations', icon: BookOpen },
        { label: t.nav.reconciliation, href: '/tax/reconciliation', icon: Scale },
      ]
    },
    {
      title: t.nav.compliance,
      items: [
        { label: t.nav.alerts, href: '/alerts', icon: Bell, badge: alerts.anomalies + alerts.expiredDocs + alerts.apiIssues },
        { label: t.nav.anomalies, href: '/anomalies', icon: AlertTriangle, badge: alerts.anomalies },
        { label: t.nav.investigations, href: '/investigations', icon: Search },
        { label: t.nav.auditTrail, href: '/audit', icon: Shield },
        { label: t.nav.documents, href: '/documents', icon: FileText },
      ]
    },
    {
      title: t.nav.analytics,
      items: [
        { label: 'Revenus', href: '/analytics/revenue', icon: BarChart2 },
        { label: 'Plateformes', href: '/analytics/platforms', icon: PieChart },
        { label: 'Chauffeurs', href: '/analytics/drivers', icon: Users },
        { label: 'Géographique', href: '/analytics/geo', icon: Map },
      ]
    },
    {
      title: t.nav.system,
      items: [
        { label: t.nav.usersRoles, href: '/system/users', icon: Key },
        { label: t.nav.permissions, href: '/system/permissions', icon: Shield },
        { label: t.nav.webhooks, href: '/webhooks', icon: Webhook },
        { label: t.nav.integrations, href: '/integrations', icon: Link2 },
        { label: t.nav.systemLogs, href: '/system/logs', icon: List },
        { label: t.nav.settings, href: '/settings', icon: Settings },
      ]
    },
  ]

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col z-30"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ background: 'var(--qc-blue)' }}>
            ⚜
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest text-qc-blue">TAXIMÈTRE.GOV</div>
            <div className="text-[9px] text-slate-400 tracking-wide">Gouvernement du Québec</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {sections.map(s => (
          <NavSection key={s.title} title={s.title} items={s.items} />
        ))}
      </nav>

      {/* Demo Banner */}
      <div className="px-3 py-2 mx-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 demo-pulse">
        <div className="text-[9px] font-bold text-amber-700 tracking-widest text-center">⚠ DONNÉES DE DÉMONSTRATION</div>
      </div>
    </aside>
  )
}
