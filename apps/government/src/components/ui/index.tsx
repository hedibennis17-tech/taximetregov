'use client'
import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Platform, DriverStatus, TransactionStatus, AlertPriority, ConnectionStatus } from '@/data/mock'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/data/mock'

// ─── KPI CARD ───────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray'
  large?: boolean
}
const colorMap = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950', icon: 'text-qc-blue', border: 'border-blue-100' },
  green: { bg: 'bg-green-50 dark:bg-green-950', icon: 'text-green-600', border: 'border-green-100' },
  red: { bg: 'bg-red-50 dark:bg-red-950', icon: 'text-red-600', border: 'border-red-100' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950', icon: 'text-orange-600', border: 'border-orange-100' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950', icon: 'text-purple-600', border: 'border-purple-100' },
  gray: { bg: 'bg-slate-50 dark:bg-slate-900', icon: 'text-slate-500', border: 'border-slate-100' },
}

export function KpiCard({ label, value, sub, icon, trend, trendValue, color = 'blue', large }: KpiCardProps) {
  const c = colorMap[color]
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border ${c.border} dark:border-slate-800 p-4 flex flex-col gap-2 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        {icon && <div className={`${c.icon} ${c.bg} p-1.5 rounded-lg`}>{icon}</div>}
      </div>
      <div className={`font-bold text-slate-800 dark:text-slate-100 ${large ? 'text-3xl' : 'text-2xl'}`}>
        {value}
      </div>
      <div className="flex items-center justify-between">
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  connected: 'bg-green-100 text-green-700 border-green-200',
  disconnected: 'bg-slate-100 text-slate-500 border-slate-200',
  expired: 'bg-red-100 text-red-600 border-red-200',
  revoked: 'bg-red-100 text-red-700 border-red-200',
  error: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  finalized: 'bg-green-100 text-green-700 border-green-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  disputed: 'bg-orange-100 text-orange-700 border-orange-200',
  processing: 'bg-blue-100 text-blue-600 border-blue-200',
  ok: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
}

const statusDots: Record<string, string> = {
  active: 'bg-green-500', inactive: 'bg-slate-400', suspended: 'bg-red-500', pending: 'bg-amber-500',
  connected: 'bg-green-500', disconnected: 'bg-slate-400', expired: 'bg-red-500', revoked: 'bg-red-600',
  error: 'bg-orange-500', completed: 'bg-blue-500', finalized: 'bg-green-600', ok: 'bg-green-500',
  warning: 'bg-amber-500', critical: 'bg-red-600',
}

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  const dotColor = statusDots[status] || 'bg-slate-400'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {status}
    </span>
  )
}

// ─── PLATFORM BADGE ────────────────────────────────────────────────────────
export function PlatformBadge({ platform, status, size = 'sm' }: { platform: Platform; status?: ConnectionStatus; size?: 'sm' | 'md' }) {
  const color = PLATFORM_COLORS[platform]
  const label = PLATFORM_LABELS[platform]
  const isConnected = status === 'connected'
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-semibold`}
      style={{ borderColor: color + '40', background: color + '10', color }}>
      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-300'}`} />
      {label}
    </div>
  )
}

// ─── SECTION HEADER ────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ─── TABLE ────────────────────────────────────────────────────────────────
export function GovTable({ headers, children, empty }: { headers: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full gov-table">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-sm text-slate-400">
                Aucune donnée à afficher
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

// ─── AMOUNT ───────────────────────────────────────────────────────────────
export function Amount({ value, currency = 'CAD', size = 'md', colored }: { value: number; currency?: string; size?: 'sm' | 'md' | 'lg'; colored?: boolean }) {
  const formatted = new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(value)
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-xs' : 'text-sm'
  const color = colored ? (value >= 0 ? 'text-green-600' : 'text-red-500') : 'text-slate-800 dark:text-slate-200'
  return <span className={`font-mono font-semibold ${cls} ${color}`}>{formatted}</span>
}

// ─── ALERT PRIORITY BADGE ─────────────────────────────────────────────────
export function AlertBadge({ priority }: { priority: AlertPriority }) {
  const styles: Record<AlertPriority, string> = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-slate-100 text-slate-600 border-slate-300',
  }
  const dots: Record<AlertPriority, string> = {
    critical: 'bg-red-600 animate-pulse', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-slate-400'
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[priority]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority]}`} />
      {priority}
    </span>
  )
}

// ─── FLEUR WATERMARK SECTION ──────────────────────────────────────────────
export function FleurSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute right-4 top-4 text-8xl opacity-[0.04] select-none pointer-events-none">⚜</div>
      {children}
    </div>
  )
}
