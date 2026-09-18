'use client'
import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, COMPLIANCE_CHECKS, COMP_STATUS } from '@/lib/enterprise-phase2-data'
import { P2Nav } from '@/components/enterprise/P2Nav'
import { ENTERPRISES } from '@/lib/enterprise-data'

const CATEGORIES: Record<string,string> = {
  IDENTITY:'Identité',DOCUMENTS:'Documents',VEHICLES:'Véhicules',DRIVERS:'Chauffeurs',
  OBLIGATIONS:'Obligations',DECLARATIONS:'Déclarations',TRANSACTIONS:'Transactions',
  TAXES:'Fiscalité',CONNECTIONS:'Connexions',RECONCILIATION:'Réconciliation',
}

function ComplianceScore({entId}: React.PropsWithoutRef<{entId:string}>) {
  const checks = COMPLIANCE_CHECKS.filter(c=>c.entId===entId)
  if (!checks.length) return null
  const totalWeight = checks.reduce((s,c)=>s+c.weight,0)
  const compliantWeight = checks.filter(c=>c.status==='COMPLIANT').reduce((s,c)=>s+c.weight,0)
  const score = Math.round((compliantWeight/totalWeight)*100)
  const ent = ENTERPRISES.find(e=>e.id===entId)
  const color = score>=90?'#059669':score>=70?'#B45309':'#DC2626'
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" stroke={color} strokeDasharray={`${score} ${100-score}`} strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{color}}>{score}%</div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white">{ent?.tradeName}</div>
          <div className="text-[9px] font-bold mt-0.5" style={{color}}>{score>=90?'🟢 CONFORME':score>=70?'🟡 ATTENTION REQUISE':'🔴 INTERVENTION REQUISE'}</div>
          <div className="text-[8px] text-slate-400 mt-0.5">Indicateur administratif · Non opposable</div>
        </div>
      </div>
      <div className="space-y-1">
        {checks.map(c=>{
          const cs = COMP_STATUS[c.status]!
          return (
            <div key={c.category} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{cs.icon}</span>
                <span className="text-[9px] text-slate-600 dark:text-slate-300">{CATEGORIES[c.category]??c.category}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.note&&<span className="text-[8px] text-slate-400 italic max-w-[120px] truncate">{c.note}</span>}
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{color:cs.color,background:cs.bg}}>{cs.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Page() {
  const entIds = [...new Set(COMPLIANCE_CHECKS.map(c=>c.entId))]
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">⚖️</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise Compliance</h1></div>
        <p className="text-sm text-slate-500 mb-4">Identité · Documents · Véhicules · Chauffeurs · Obligations · Déclarations · Connexions</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/compliance"/>
        <div className="text-[9px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">{PILOT} · Score indicatif administratif uniquement — pas une décision réglementaire</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'CONFORME',     v:entIds.filter(id=>{const c=COMPLIANCE_CHECKS.filter(cc=>cc.entId===id); return c.every(cc=>cc.status==='COMPLIANT')}).length, c:'#059669',bg:'bg-green-50 dark:bg-green-500/10',icon:'🟢'},
            {l:'ATTENTION',    v:entIds.filter(id=>COMPLIANCE_CHECKS.some(c=>c.entId===id&&c.status==='ATTENTION')).length,     c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',icon:'🟡'},
            {l:'INTERVENTION', v:entIds.filter(id=>COMPLIANCE_CHECKS.some(c=>c.entId===id&&c.status==='ACTION_REQUIRED')).length,c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',  icon:'🔴'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <>{entIds.map((entId: string)=>(<ComplianceScore key={entId} entId={entId}/>))}</>
      </div>
    </AppShell>
  )
}
