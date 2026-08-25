'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { todayStats, monthlyRevenue } from '@/data/driver.mock'

const fmt = (v:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

export default function TaxPage() {
  return (
    <AppShell>
      <PageHeader title="Centre fiscal" subtitle="TPS · TVQ · Déclarations · Source: Tax Engine" />
      <div className="px-4">
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5 text-xs text-blue-300">
          Les calculs fiscaux proviennent du même Tax Engine que le Government Dashboard. TPS 5% + TVQ 9.975% = 14.975% (QC-CA). Taux configurables selon juridiction.
        </div>
        <Card className="mb-4">
          <div className="font-bold text-white text-sm mb-4">📊 Août 2026</div>
          <div className="space-y-3">
            {[
              ['Revenus bruts', fmt(todayStats.totalRevenue * 22), 'text-white'],
              ['Revenus taxables (90.1%)', fmt(todayStats.taxableRevenue * 22), 'text-slate-300'],
              ['TPS (5%)', fmt(todayStats.tps * 22), 'text-blue-400'],
              ['TVQ (9.975%)', fmt(todayStats.tvq * 22), 'text-purple-400'],
              ['Total taxes', fmt(todayStats.totalTax * 22), 'text-orange-400'],
              ['Revenus nets', fmt(todayStats.netRevenue * 22), 'text-green-400'],
            ].map(([l,v,c])=>(
              <div key={l} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{l}</span>
                <span className={`font-mono font-bold text-sm ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="mb-4">
          <div className="font-bold text-white text-sm mb-3">📋 Périodes fiscales</div>
          {[
            { period:'Q1 2026 (Jan-Mar)', status:'FILED', total:fmt(8200) },
            { period:'Q2 2026 (Avr-Jun)', status:'FILED', total:fmt(10910) },
            { period:'Q3 2026 (Jul-Sep)', status:'OPEN', total:fmt(6840) },
          ].map(p=>(
            <div key={p.period} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
              <div>
                <div className="text-sm font-medium text-slate-300">{p.period}</div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status==='FILED'?'bg-green-500/20 text-green-400':'bg-blue-500/20 text-blue-400'}`}>{p.status}</span>
              </div>
              <span className="font-mono font-bold text-white">{p.total}</span>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  )
}
