'use client'
import Link from 'next/link'
import { P2_NAV } from '@/lib/enterprise-phase2-data'

export function P2Nav({ active }: { active: string }) {
  return (
    <div className="space-y-1.5 mb-5">
      <div className="text-[8px] font-bold text-slate-400 uppercase px-1">Phase 1</div>
      <div className="flex gap-1 overflow-x-auto pb-1 flex-nowrap">
        {P2_NAV.filter(n=>n.group==='phase1').map(n=>(
          <Link key={n.href} href={n.href} className="shrink-0 px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all whitespace-nowrap" style={{background:active===n.href?'#64748B':'transparent',color:active===n.href?'white':'#64748B',borderColor:active===n.href?'#64748B':'rgba(148,163,184,0.30)'}}>{n.l}</Link>
        ))}
      </div>
      <div className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase px-1">Phase 2 — Supervision gouvernementale avancée</div>
      <div className="flex gap-1 overflow-x-auto pb-1 flex-nowrap">
        {P2_NAV.filter(n=>n.group==='phase2').map(n=>(
          <Link key={n.href} href={n.href} className="shrink-0 px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all whitespace-nowrap" style={{background:active===n.href?'#003DA5':'transparent',color:active===n.href?'white':'#64748B',borderColor:active===n.href?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>
        ))}
      </div>
    </div>
  )
}
