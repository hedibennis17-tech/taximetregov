'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  ACTIVE_TAX_RULE_VERSIONS, calculateTaxFromRules,
  applyRounding, mockProviderTaxSummaries,
  fmt,
} from '@/lib/engines/tax.engine'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

export default function TaxEstimatePage() {
  const [grossRevenue, setGrossRevenue] = useState(500)
  const [fees, setFees] = useState(80)
  const [adjustments, setAdjustments] = useState(10)
  const [tips, setTips] = useState(40)
  const [source, setSource] = useState<'TAXIMETER'|'UBER'|'DOORDASH'>('TAXIMETER')

  const tpsRuleVersion = ACTIVE_TAX_RULE_VERSIONS[0]
  const tvqRuleVersion = ACTIVE_TAX_RULE_VERSIONS[1]
  const taxableBase = applyRounding(grossRevenue - fees + adjustments, 'ROUND_HALF_UP')
  const tpsCalc = tpsRuleVersion ? calculateTaxFromRules(taxableBase, tpsRuleVersion) : null
  const tvqCalc = tvqRuleVersion ? calculateTaxFromRules(taxableBase, tvqRuleVersion) : null

  const tps = tpsCalc?.taxAmount ?? 0
  const tvq = tvqCalc?.taxAmount ?? 0
  const totalTax = tps + tvq
  const netAfterTax = applyRounding(taxableBase - totalTax, 'ROUND_HALF_UP')

  return (
    <AppShell>
      <PageHeader title="Estimation fiscale" subtitle="TaxCalculationEngine · Taux depuis config" />
      <div className="px-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
          <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0"/>
          <p className="text-xs text-amber-200">
            ESTIMATION — pas une déclaration officielle · Taux chargés depuis configuration · jamais hardcodés · Règle {tpsRuleVersion?.version ?? '—'}
          </p>
        </div>

        {/* Source selector */}
        <div className="flex gap-2 mb-5">
          {[['TAXIMETER','🚕 Taxi'],['UBER','⬛ Uber'],['DOORDASH','🔴 DoorDash']].map(([val, label]) => (
            <button key={val} onClick={() => setSource(val as any)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all border ${source === val ? 'bg-qc-blue border-qc-blue text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        {source !== 'TAXIMETER' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 mb-4 text-[10px] text-slate-400">
            <span>🔌</span> Source {source}: Prix fournisseur conservé · Taximètre jamais utilisé pour remplacer le montant final
          </div>
        )}

        {/* Inputs */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-4">Paramètres</div>
          <div className="space-y-4">
            {[
              { label:'Revenus bruts ($)', val:grossRevenue, set:setGrossRevenue, min:0 },
              { label:'Frais fournisseur ($)', val:fees, set:setFees, min:0 },
              { label:'Ajustements ($)', val:adjustments, set:setAdjustments, min:0 },
              { label:'Pourboires ($)', val:tips, set:setTips, min:0 },
            ].map(({ label, val, set, min }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="font-mono font-bold text-white">{fmt(val)}</span>
                </div>
                <input type="range" min={min} max={2000} step={5} value={val}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full accent-qc-blue" />
              </div>
            ))}
          </div>
        </Card>

        {/* Tax rules applied */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">Règles appliquées — {tpsRuleVersion?.version}</div>
          {tpsRuleVersion && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">TPS (CA-FED)</span>
                <span className="font-mono font-bold text-orange-400">{(tpsRuleVersion.rules[0]?.rate * 100).toFixed(3)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">TVQ (CA-QC)</span>
                <span className="font-mono font-bold text-orange-400">{((tvqRuleVersion?.rules[0]?.rate ?? 0) * 100).toFixed(3)}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Arrondissement</span>
                <span className="text-white">ROUND_HALF_UP</span>
              </div>
            </div>
          )}
          <div className="text-[9px] text-amber-400 mt-2">Taux depuis {tpsRuleVersion?.sourceRef ?? '—'} · jamais hardcodés</div>
        </Card>

        {/* Calculation result */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">Résultat du calcul</div>
          <div className="space-y-2">
            {[
              { label:'Revenus bruts', val:grossRevenue, color:'text-white' },
              { label:'− Frais fournisseur', val:-fees, color:'text-red-400' },
              { label:'+ Ajustements', val:adjustments, color:'text-green-400' },
              { label:'= Base taxable', val:taxableBase, color:'text-blue-400', bold:true },
            ].map(s => (
              <div key={s.label} className={`flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs ${s.bold ? 'font-bold' : ''}`}>
                <span className={s.bold ? 'text-white' : 'text-slate-400'}>{s.label}</span>
                <span className={`font-mono tabular-nums ${s.color}`}>{fmt(Math.abs(s.val))}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 mt-3 pt-3 space-y-2">
            {[
              { label:`TPS (${tpsRuleVersion ? (tpsRuleVersion.rules[0]?.rate * 100).toFixed(3) : '—'}%)`, val:tps, color:'text-orange-400' },
              { label:`TVQ (${tvqRuleVersion ? (tvqRuleVersion.rules[0]?.rate * 100).toFixed(3) : '—'}%)`, val:tvq, color:'text-orange-400' },
              { label:'Total taxes estimées', val:totalTax, color:'text-orange-400', bold:true },
              { label:'Pourboires', val:tips, color:'text-green-400' },
              { label:'Net estimé (après taxes)', val:netAfterTax + tips, color:'text-green-400', bold:true },
            ].map(s => (
              <div key={s.label} className={`flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs ${s.bold ? 'font-bold' : ''}`}>
                <span className={s.bold ? 'text-white' : 'text-slate-400'}>{s.label}</span>
                <span className={`font-mono tabular-nums ${s.color}`}>{fmt(Math.abs(s.val))}</span>
              </div>
            ))}
          </div>
          <div className="text-[8px] text-amber-400 mt-3">⚠ ESTIMATION — pas une déclaration fiscale officielle. Consultez un comptable ou les directives de Revenu Québec / ARC.</div>
        </Card>
      </div>
    </AppShell>
  )
}
