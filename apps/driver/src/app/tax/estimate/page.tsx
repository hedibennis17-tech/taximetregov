'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { mockTaxSummary, ACTIVE_TAX_RULES, calculateTax } from '@/lib/engines/tax.engine'
import { AlertCircle, Calculator } from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(v)

export default function TaxEstimatePage() {
  const calc = calculateTax({
    grossAmount: mockTaxSummary.taxableRevenue,
    taxableAmount: mockTaxSummary.taxableRevenue,
    jurisdiction: 'CA-QC',
    taxTypes: ['TPS', 'TVQ'],
    transactionDate: '2026-08-24',
    taxIncluded: false,
  })

  return (
    <AppShell>
      <PageHeader title="Estimation fiscale" subtitle="Préparation préliminaire · Non officielle" />
      <div className="px-4">
        <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 mb-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 mb-1">⚠ ESTIMATION PRÉLIMINAIRE</div>
              <p className="text-xs text-amber-200 leading-relaxed">
                Ces calculs sont des estimations basées sur les données disponibles et les règles fiscales versionnées. Ils ne remplacent pas <strong>Revenu Québec</strong>, <strong>l'ARC</strong> ou un comptable agréé.
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-4">
          <div className="font-semibold text-white text-sm mb-3">⚙️ Règles fiscales actives</div>
          <div className="space-y-2">
            {ACTIVE_TAX_RULES.map(rule => (
              <div key={rule.ruleId} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                <div>
                  <div className="text-xs font-semibold text-white">{rule.taxType} — {rule.jurisdiction}</div>
                  <div className="text-[10px] text-slate-500">v{rule.version} · {rule.effectiveFrom} · {rule.sourceReference}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white">{(rule.rate * 100).toFixed(3)}%</div>
                  <div className="text-[9px] text-slate-500">Seuil: {fmt(rule.threshold ?? 30000)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-amber-400 mt-2">⚠ Jamais hardcodé — chargé depuis TaxRuleEngine</div>
        </Card>

        <Card className="mb-4 border-qc-blue/30">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={16} className="text-qc-blue-light" />
            <span className="font-semibold text-white text-sm">Calcul TaxRuleEngine — {calc.ruleVersion}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-xs text-slate-400">Base taxable</span>
              <span className="font-mono font-bold text-white">{fmt(calc.taxableBase)}</span>
            </div>
            {calc.breakdown.map(b => (
              <div key={b.taxType} className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-xs text-slate-400">{b.taxType} ({(b.rate * 100).toFixed(3)}%)</span>
                <span className={`font-mono font-bold ${b.taxType === 'TPS' ? 'text-blue-400' : 'text-purple-400'}`}>{fmt(b.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-xs text-slate-400">Total taxes estimées</span>
              <span className="font-mono font-bold text-orange-400">{fmt(calc.totalTax)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-700 mt-1">
              <span className="text-sm font-bold text-white">Net estimé</span>
              <span className="font-mono font-black text-xl text-green-400">{fmt(calc.netAmount)}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 italic">{calc.note}</div>
        </Card>

        <Card className="mb-6">
          <div className="font-semibold text-white text-sm mb-3">📅 Estimations trimestrielles — {new Date().getFullYear()}</div>
          <div className="space-y-2">
            {[
              { q:'T1 (Jan-Mar)', taxable:8200, tps:410, tvq:817.95 },
              { q:'T2 (Avr-Jun)', taxable:10910, tps:545.50, tvq:1088.28 },
              { q:'T3 (Jul-Sep)', taxable:6840, tps:342, tvq:682.23 },
              { q:'T4 (Oct-Déc)', taxable:0, tps:0, tvq:0 },
            ].map(p => (
              <div key={p.q} className={`flex items-center gap-2 py-2 border-b border-slate-800 last:border-0 text-[10px] ${p.taxable === 0 ? 'opacity-40' : ''}`}>
                <span className="text-slate-400 w-28 shrink-0">{p.q}</span>
                <span className="text-slate-300 flex-1">{fmt(p.taxable)}</span>
                <span className="text-blue-400">TPS {fmt(p.tps)}</span>
                <span className="text-purple-400">TVQ {fmt(p.tvq)}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-amber-400 mt-2">ESTIMATION — pas une déclaration officielle</div>
        </Card>
      </div>
    </AppShell>
  )
}
