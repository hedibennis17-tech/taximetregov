'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile, useRevenue, money } from '@/lib/api'
import { DollarSign, FileText, Calendar, TrendingUp } from 'lucide-react'

export default function TaxPage() {
  const { profile } = useDriverProfile()
  const { revenue, loading } = useRevenue('month')

  const gross  = parseFloat(revenue?.summary.total_gross ?? '0')
  const tps    = Math.round(gross * 0.05 * 100) / 100
  const tvq    = Math.round(gross * 0.09975 * 100) / 100
  const total  = Math.round((tps + tvq) * 100) / 100

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Centre fiscal</h1>
        <p className="text-xs text-slate-400 mt-0.5">TPS · TVQ · Québec · TAXIMETER.GOV</p>
      </div>
      <div className="px-4 space-y-4 pb-8">

        {/* Avertissement pilote */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] text-amber-400">⚠️ Mode pilote — Les montants fiscaux sont calculés à titre indicatif uniquement. Consultez Revenu Québec pour vos obligations réelles.</p>
        </div>

        {/* Statut compte fiscal */}
        {profile && (
          <Card className="p-4">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Compte fiscal</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <FileText size={18} className="text-green-400" />
              </div>
              <div>
                <div className="font-bold text-white">{profile.first_name} {profile.last_name}</div>
                <div className="text-xs text-green-400">✅ TPS Enregistrée · TVQ Enregistrée</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-slate-400">TPS</div>
                <div className="text-green-400 font-bold">DEMO-••••-TPS</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2">
                <div className="text-slate-400">TVQ</div>
                <div className="text-green-400 font-bold">DEMO-••••-TVQ</div>
              </div>
            </div>
          </Card>
        )}

        {/* Calcul taxes ce mois */}
        <Card className="p-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Taxes ce mois (estimé)</div>
          <div className="space-y-3">
            {[
              { label:'Revenus bruts imposables', val: money(gross),  color:'text-white' },
              { label:'TPS (5 %)',                val: money(tps),   color:'text-purple-400' },
              { label:'TVQ (9,975 %)',            val: money(tvq),   color:'text-purple-400' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-400">{r.label}</span>
                <span className={`font-bold text-sm ${r.color}`}>{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-bold text-white">Total taxes estimé</span>
              <span className="font-bold text-lg text-purple-400">{money(total)}</span>
            </div>
          </div>
        </Card>

        {/* Périodes */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-qc-blue" />
            <span className="text-sm font-bold text-white">Période fiscale active</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between"><span>Période</span><span className="text-white">Q3 — Juillet–Septembre 2026</span></div>
            <div className="flex justify-between"><span>Fréquence</span><span className="text-white">Trimestrielle</span></div>
            <div className="flex justify-between"><span>Statut</span><span className="text-amber-400">En cours</span></div>
            <div className="flex justify-between"><span>Échéance</span><span className="text-white">31 octobre 2026</span></div>
          </div>
        </Card>

        {/* Répartition par source */}
        {revenue && revenue.breakdown.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-qc-blue" />
              <span className="text-sm font-bold text-white">Revenus par source</span>
            </div>
            <div className="space-y-2">
              {revenue.breakdown.map(b => (
                <div key={b.source_type} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{b.source_type}</span>
                  <div className="text-right">
                    <div className="text-white font-bold">{money(b.gross)}</div>
                    <div className="text-slate-500">{b.count} activité(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
