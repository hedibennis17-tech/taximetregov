'use client'
import { clsx } from 'clsx'
import { ReactNode } from 'react'

// ─── STATUS DOT ──────────────────────────────────────────────
export function StatusDot({ status }: { status: 'online' | 'offline' | 'busy' | 'warning' }) {
  const colors = { online:'bg-driver-green pulse-green', offline:'bg-slate-500', busy:'bg-driver-amber', warning:'bg-driver-amber pulse-red' }
  return <span className={clsx('inline-block w-2.5 h-2.5 rounded-full', colors[status])} />
}

// ─── CARD ────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('driver-card p-4', className)}>{children}</div>
}

// ─── DRIVER BADGE ────────────────────────────────────────────
export function DocBadge({ status }: { status: string }) {
  const styles: Record<string,string> = {
    VALID: 'bg-green-500/20 text-green-400 border-green-500/30',
    EXPIRING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    REJECTED: 'bg-red-700/20 text-red-400 border-red-700/30',
  }
  return <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full border', styles[status] || 'bg-slate-700 text-slate-400 border-slate-600')}>{status}</span>
}

// ─── PLATFORM BADGE ──────────────────────────────────────────
export function PlatformStatusBadge({ status }: { status: string }) {
  const styles: Record<string,string> = {
    CONNECTED: 'bg-green-500/20 text-green-400',
    OFFLINE: 'bg-slate-700 text-slate-400',
    NOT_CONFIGURED: 'bg-slate-800 text-slate-500',
    MAINTENANCE: 'bg-amber-500/20 text-amber-400',
  }
  const labels: Record<string,string> = { CONNECTED:'🟢 Connecté', OFFLINE:'⚫ Hors ligne', NOT_CONFIGURED:'⚪ Non configuré', MAINTENANCE:'🟡 Maintenance' }
  return <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', styles[status] || '')}>{labels[status] || status}</span>
}

// ─── ACTIVITY TYPE BADGE ──────────────────────────────────────
export function ActivityBadge({ type }: { type: string }) {
  const conf: Record<string,{ label:string; color:string }> = {
    TAXI: { label:'🚕 Taxi', color:'bg-qc-blue/20 text-blue-300' },
    RIDESHARE: { label:'🚗 Rideshare', color:'bg-purple-500/20 text-purple-300' },
    FOOD_DELIVERY: { label:'🍕 Livraison', color:'bg-orange-500/20 text-orange-300' },
    GROCERY: { label:'🛒 Épicerie', color:'bg-green-500/20 text-green-300' },
    COURIER: { label:'📦 Colis', color:'bg-slate-500/20 text-slate-300' },
  }
  const c = conf[type] || { label:type, color:'bg-slate-700 text-slate-400' }
  return <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', c.color)}>{c.label}</span>
}

// ─── AMOUNT DISPLAY ───────────────────────────────────────────
export function Amount({ value, size = 'md', positive }: { value: number; size?: 'sm'|'md'|'lg'|'xl'; positive?: boolean }) {
  const sizes = { sm:'text-sm', md:'text-lg', lg:'text-2xl', xl:'text-4xl' }
  const formatted = new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD', minimumFractionDigits:2 }).format(value)
  return (
    <span className={clsx('font-bold amount-display tabular-nums', sizes[size], positive !== undefined ? (positive ? 'text-driver-green' : 'text-driver-red') : 'text-white')}>
      {formatted}
    </span>
  )
}

// ─── SECTION HEADER ──────────────────────────────────────────
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

// ─── PILL BUTTON ─────────────────────────────────────────────
export function PillButton({ label, active, onClick, icon }: { label:string; active:boolean; onClick:()=>void; icon?:string }) {
  return (
    <button onClick={onClick} className={clsx(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
      active ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
    )}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  )
}

// ─── PILOT BANNER ────────────────────────────────────────────
export function PilotBanner() {
  return (
    <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-center">
      <span className="text-[9px] font-bold text-amber-400 tracking-widest">⚠ SIMULATION — DONNÉES DE DÉMONSTRATION — MODE PILOTE</span>
    </div>
  )
}
