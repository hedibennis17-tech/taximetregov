'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, KpiCard } from '@/components/ui'
import { complianceStatus, driverActivities } from '@/data/driver.mock'
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const statusConf: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  VALID: { icon: <CheckCircle size={16} className="text-green-400"/>, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  EXPIRING: { icon: <AlertTriangle size={16} className="text-amber-400"/>, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  EXPIRED: { icon: <XCircle size={16} className="text-red-400"/>, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  PENDING: { icon: <Clock size={16} className="text-blue-400"/>, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  REJECTED: { icon: <XCircle size={16} className="text-red-400"/>, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  UNDER_REVIEW: { icon: <Clock size={16} className="text-slate-400"/>, color: 'text-slate-400', bg: 'bg-slate-700 border-slate-600' },
}

export default function CompliancePage() {
  const issues = complianceStatus.items.filter(i => i.status !== 'VALID')
  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Conformité</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Card className="p-3 text-center">
            <div className="text-3xl font-bold text-green-400">{complianceStatus.items.filter(i=>i.status==='VALID').length}</div>
            <div className="text-[10px] text-slate-400">Valides</div>
          </Card>
          <Card className={`p-3 text-center ${issues.length > 0 ? 'border-amber-500/30' : ''}`}>
            <div className={`text-3xl font-bold ${issues.length > 0 ? 'text-amber-400' : 'text-green-400'}`}>{issues.length}</div>
            <div className="text-[10px] text-slate-400">À renouveler</div>
          </Card>
        </div>

        <div className="space-y-3 mb-5">
          {complianceStatus.items.map(item => {
            const conf = statusConf[item.status] || statusConf['VALID']
            return (
              <div key={item.key} className={`driver-card p-4 flex items-center gap-4 border ${conf.bg}`}>
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white text-sm">{item.label}</span>
                  </div>
                  {item.expiry && <div className="text-[10px] text-slate-500 font-mono">Expire: {item.expiry}</div>}
                  {item.blocksActivity.length > 0 && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Requis pour: {item.blocksActivity.join(', ')}
                    </div>
                  )}
                </div>
                <div>{conf.icon}</div>
              </div>
            )
          })}
        </div>

        {/* Activity status vs compliance */}
        <Card className="mb-6">
          <div className="font-semibold text-white text-sm mb-3">⚙️ Activités — Statut conformité</div>
          {driverActivities.filter(a => a.authorizationStatus !== 'PENDING').map(act => {
            const hasWarning = act.requiredDocs.some(d => d.status === 'EXPIRING' || d.status === 'EXPIRED')
            return (
              <div key={act.activityType} className={`flex items-center gap-3 py-3 border-b border-slate-800 last:border-0`}>
                <span className="text-xl">{act.icon}</span>
                <span className="flex-1 text-sm text-slate-200 font-medium">{act.label}</span>
                {hasWarning
                  ? <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1"><AlertTriangle size={10}/>Action requise</span>
                  : <span className="text-[10px] font-bold text-green-400 flex items-center gap-1"><CheckCircle size={10}/>Conforme</span>}
              </div>
            )
          })}
        </Card>
      </div>
    </AppShell>
  )
}
