'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, ActivityBadge, SectionHeader } from '@/components/ui'
import { recentActivities } from '@/data/driver.mock'
import { Filter } from 'lucide-react'
import { useState } from 'react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

export default function ActivitiesPage() {
  const [filter, setFilter] = useState('ALL')
  const types = ['ALL','TAXI','RIDESHARE','FOOD_DELIVERY']
  const filtered = filter === 'ALL' ? recentActivities : recentActivities.filter(a => a.type === filter)

  return (
    <AppShell>
      <PageHeader title="Mes activités" subtitle="Courses · Livraisons · Historique" />
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter===t?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {t === 'ALL' ? 'Toutes' : t === 'TAXI' ? '🚕 Taxi' : t === 'RIDESHARE' ? '🚗 Rideshare' : '📦 Livraison'}
            </button>
          ))}
        </div>
        <div className="space-y-3 mb-4">
          {filtered.map(act => (
            <Card key={act.id}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                  {act.type==='TAXI'?'🚕':act.type==='RIDESHARE'?'🚗':'📦'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <ActivityBadge type={act.type} />
                    <span className="text-[10px] text-slate-500 font-mono">{act.startTime}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400 mb-2">
                    <span>{act.distance}</span><span>·</span>
                    <span>{act.duration}</span><span>·</span>
                    <span>{act.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600">Synchro Ledger ✅</span>
                    <div className="text-right">
                      <div className="font-bold text-white">{fmt(act.fare)}</div>
                      {act.tip > 0 && <div className="text-[10px] text-green-400">+{fmt(act.tip)} tip</div>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">Aucune activité pour ce filtre</div>
        )}
      </div>
    </AppShell>
  )
}
