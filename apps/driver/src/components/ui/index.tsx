'use client'
import { clsx } from 'clsx'
import { ReactNode } from 'react'

export function StatusDot({ status }: { status: 'online' | 'offline' | 'busy' | 'warning' }) {
  const colors = { online:'bg-driver-green pulse-green', offline:'bg-slate-500', busy:'bg-driver-amber', warning:'bg-driver-amber pulse-red' }
  return <span className={clsx('inline-block w-2.5 h-2.5 rounded-full', colors[status])} />
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('driver-card p-4', className)}>{children}</div>
}

interface KpiCardProps { label: string; value: string | number; color?: string; icon?: ReactNode; sub?: string; large?: boolean }
export function KpiCard({ label, value, color = 'blue', icon, sub, large }: KpiCardProps) {
  const colors: Record<string, string> = { blue:'text-blue-400', green:'text-green-400', red:'text-red-400', orange:'text-orange-400', purple:'text-purple-400', gray:'text-slate-400', amber:'text-amber-400' }
  return (
    <div className="driver-card p-3 text-center">
      {icon && <div className={clsx('flex justify-center mb-1', colors[color])}>{icon}</div>}
      <div className={clsx('font-bold tabular-nums', large ? 'text-2xl' : 'text-xl', colors[color])}>{value}</div>
      <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
      {sub && <div className="text-[9px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export function DocBadge({ status }: { status: string }) {
  const styles: Record<string,string> = {
    VALID: 'bg-green-500/20 text-green-400 border-green-500/30',
    EXPIRING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    REJECTED: 'bg-red-700/20 text-red-400 border-red-700/30',
    UNDER_REVIEW: 'bg-slate-700 text-slate-400 border-slate-600',
  }
  return <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full border', styles[status] || 'bg-slate-700 text-slate-400 border-slate-600')}>{status}</span>
}

export function PlatformStatusBadge({ status }: { status: string }) {
  const labels: Record<string,string> = { CONNECTED:'🟢 Connecté', OFFLINE:'⚫ Hors ligne', NOT_CONNECTED:'⚪ Non connecté', MAINTENANCE:'🟡 Maintenance', DISCONNECTED:'🔴 Déconnecté', ERROR:'🔴 Erreur', EXPIRED:'⚠️ Expiré' }
  const styles: Record<string,string> = { CONNECTED:'bg-green-500/20 text-green-400', OFFLINE:'bg-slate-700 text-slate-400', NOT_CONNECTED:'bg-slate-800 text-slate-500', MAINTENANCE:'bg-amber-500/20 text-amber-400', DISCONNECTED:'bg-red-500/20 text-red-400', ERROR:'bg-red-500/20 text-red-400', EXPIRED:'bg-orange-500/20 text-orange-400' }
  return <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', styles[status] || 'bg-slate-700 text-slate-400')}>{labels[status] || status}</span>
}

export function ActivityBadge({ type }: { type: string }) {
  const conf: Record<string,{ label:string; color:string }> = {
    TAXI: { label:'🚕 Taxi', color:'bg-qc-blue/20 text-blue-300' },
    RIDESHARE: { label:'🚗 Rideshare', color:'bg-purple-500/20 text-purple-300' },
    FOOD_DELIVERY: { label:'🍕 Livraison', color:'bg-orange-500/20 text-orange-300' },
    GROCERY: { label:'🛒 Épicerie', color:'bg-green-500/20 text-green-300' },
    INDEPENDENT_DELIVERY: { label:'📦 Indépendant', color:'bg-slate-500/20 text-slate-300' },
  }
  const c = conf[type] || { label:type, color:'bg-slate-700 text-slate-400' }
  return <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', c.color)}>{c.label}</span>
}

export function Amount({ value, size = 'md', positive }: { value: number; size?: 'sm'|'md'|'lg'|'xl'; positive?: boolean }) {
  const sizes = { sm:'text-sm', md:'text-lg', lg:'text-2xl', xl:'text-4xl' }
  const formatted = new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD', minimumFractionDigits:2 }).format(value)
  return <span className={clsx('font-bold amount-display tabular-nums', sizes[size], positive !== undefined ? (positive ? 'text-driver-green' : 'text-driver-red') : 'text-white')}>{formatted}</span>
}

export function SectionHeader({ title, action, actionLabel }: { title:string; action?:()=>void; actionLabel?:string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</span>
      {action && actionLabel && (
        <button onClick={action} className="text-xs text-qc-blue-light hover:text-blue-300 transition-colors font-medium">{actionLabel}</button>
      )}
    </div>
  )
}

export function PilotBanner() {
  return (
    <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-center">
      <span className="text-[9px] font-bold text-amber-400 tracking-widest">⚠ SIMULATION — DONNÉES DEMO — MODE PILOTE</span>
    </div>
  )
}

export function SyncBadge({ status }: { status: string }) {
  const conf: Record<string,{label:string;color:string}> = {
    SYNCED: { label:'✅ Synchro', color:'text-green-400' },
    PENDING: { label:'⏳ En attente', color:'text-amber-400' },
    FAILED: { label:'❌ Échec', color:'text-red-400' },
    REVIEW_REQUIRED: { label:'🔍 Révision', color:'text-blue-400' },
  }
  const c = conf[status] || { label:status, color:'text-slate-400' }
  return <span className={clsx('text-[10px] font-semibold', c.color)}>{c.label}</span>
}
