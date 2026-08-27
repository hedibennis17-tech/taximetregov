'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockExpenses, EXPENSE_CATEGORY_CONFIG, ACTIVITY_ICONS_EXPENSE,
  aggregateExpenses, formatCAD, type ExpenseCategory
} from '@/lib/engines/expenses.engine'
import { useState } from 'react'
import { Plus, AlertCircle, Shield } from 'lucide-react'

const CATS = Object.keys(EXPENSE_CATEGORY_CONFIG) as ExpenseCategory[]

const statusConf: Record<string, { color: string; label: string }> = {
  CONFIRMED: { color:'text-green-400', label:'Confirmé' },
  DRAFT: { color:'text-amber-400', label:'Brouillon' },
  REVIEW_REQUIRED: { color:'text-orange-400', label:'À réviser' },
  REJECTED: { color:'text-red-400', label:'Rejeté' },
  ARCHIVED: { color:'text-slate-500', label:'Archivé' },
}

export default function ExpensesPage() {
  const [catFilter, setCatFilter] = useState<ExpenseCategory | 'ALL'>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)
  const agg = aggregateExpenses(mockExpenses, catFilter === 'ALL' ? undefined : catFilter)
  const displayed = catFilter === 'ALL' ? mockExpenses : mockExpenses.filter(e => e.category === catFilter)

  // By category totals
  const byCat = Object.entries(agg.byCategory).sort((a,b) => b[1]-a[1])

  return (
    <AppShell>
      <PageHeader title="Mes dépenses" subtitle="Professionnelles · Kilométrage · Déductibilité" />
      <div className="px-4">
        {/* Deductibility disclaimer */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>Déductibilité:</strong> Taximètre.GOV prépare vos données de dépenses. La déductibilité fiscale est déterminée par le Tax Engine selon les règles applicables — jamais automatiquement. Consultez un comptable ou les directives officielles de Revenu Québec / l'ARC.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label:'Total dépenses', val:formatCAD(mockExpenses.reduce((a,e)=>a+e.totalAmount,0)), color:'text-white' },
            { label:'Portion affaires', val:formatCAD(mockExpenses.reduce((a,e)=>a+e.businessPortion,0)), color:'text-blue-400' },
            { label:'Portion personnelle', val:formatCAD(mockExpenses.reduce((a,e)=>a+e.personalPortion,0)), color:'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-sm tabular-nums ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <Card className="mb-5">
          <div className="font-semibold text-white text-sm mb-3">Par catégorie — Août 2026</div>
          <div className="space-y-2">
            {byCat.slice(0, 6).map(([cat, val]) => {
              const conf = EXPENSE_CATEGORY_CONFIG[cat as ExpenseCategory]
              const total = mockExpenses.reduce((a,e)=>a+e.totalAmount,0)
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-base w-6 shrink-0">{conf.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs text-slate-300">{conf.label}</span>
                      <span className={`font-bold text-xs tabular-nums ${conf.color}`}>{formatCAD(val)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-qc-blue rounded-full" style={{width:`${Math.round(val/total*100)}%`}} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {(['ALL', ...CATS] as const).map(k => (
            <button key={k} onClick={() => setCatFilter(k as ExpenseCategory | 'ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${catFilter===k?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {k === 'ALL' ? 'Toutes' : EXPENSE_CATEGORY_CONFIG[k as ExpenseCategory].icon}
            </button>
          ))}
        </div>

        {/* Expense list */}
        <div className="space-y-3 mb-5">
          {displayed.map(exp => {
            const conf = EXPENSE_CATEGORY_CONFIG[exp.category]
            const st = statusConf[exp.status]
            const isOpen = expanded === exp.id
            return (
              <div key={exp.id}>
                <button onClick={() => setExpanded(isOpen ? null : exp.id)}
                  className={`w-full driver-card p-4 text-left transition-all ${isOpen ? 'border-qc-blue/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xl shrink-0">{conf.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-white text-sm">{exp.supplier ?? conf.label}</span>
                        <span className={`text-[9px] font-bold ${st.color}`}>{st.label}</span>
                        {exp.possibleDuplicate && <span className="text-[9px] text-amber-400 font-bold">⚠ Possible doublon</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">{exp.date} · {ACTIVITY_ICONS_EXPENSE[exp.activity]} {exp.activity} · {exp.businessUsePercentage}% affaires</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white tabular-nums">{formatCAD(exp.totalAmount)}</div>
                      <div className="text-[10px] text-blue-400">{formatCAD(exp.businessPortion)} affaires</div>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="driver-card p-4 border-t-0 -mt-3 pt-5 rounded-t-none border-qc-blue/30 space-y-2">
                    {[
                      { label:'Sous-total', val:formatCAD(exp.subtotal) },
                      { label:'Taxes', val:formatCAD(exp.taxAmount) },
                      { label:'Total', val:formatCAD(exp.totalAmount), bold:true },
                      { label:'Usage affaires', val:`${exp.businessUsePercentage}%` },
                      { label:'Portion affaires', val:formatCAD(exp.businessPortion) },
                      { label:'Portion personnelle', val:formatCAD(exp.personalPortion) },
                      { label:'Déductibilité', val:exp.deductibilityStatus, mono:true },
                      { label:'Mode paiement', val:exp.paymentMethod },
                      { label:'Véhicule', val:exp.vehicleId ?? '—', mono:true },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between text-xs py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-400">{s.label}</span>
                        <span className={`${s.bold ? 'font-black text-white' : s.mono ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
                      </div>
                    ))}
                    <div className="text-[9px] text-amber-400 mt-1">Déductibilité = UNKNOWN — le Tax Engine détermine le traitement fiscal applicable</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add expense */}
        <button className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold flex items-center justify-center gap-2 hover:bg-qc-blue-dark transition-all mb-6 shadow-lg shadow-blue-900/30">
          <Plus size={18} /> Ajouter une dépense
        </button>
      </div>
    </AppShell>
  )
}
