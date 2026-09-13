'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useRevenue, money } from '@/lib/api'
import { useDriverProfile } from '@/lib/api'
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function WalletPage() {
  const { revenue, loading } = useRevenue('month')
  const { profile } = useDriverProfile()

  const net   = parseFloat(revenue?.summary.total_net   ?? '0')
  const gross = parseFloat(revenue?.summary.total_gross ?? '0')
  const tips  = parseFloat(revenue?.summary.total_tips  ?? '0')

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Wallet & Paiements</h1>
        <p className="text-xs text-slate-400 mt-0.5">CAD · Québec · TAXIMETER.GOV</p>
      </div>
      <div className="px-4 space-y-4 pb-8">

        {/* Solde principal */}
        <Card className="p-6 text-center bg-gradient-to-br from-qc-blue/20 to-slate-900 border-qc-blue/30">
          <div className="text-xs text-slate-400 mb-1 tracking-widest uppercase">Revenus nets ce mois</div>
          <div className="text-5xl font-black text-white mb-1">{money(net)}</div>
          <div className="text-xs text-slate-400">CAD · Québec</div>
        </Card>

        {/* Résumé */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'Revenus bruts', val: money(gross), icon: ArrowUpRight, color:'text-green-400', bg:'bg-green-500/10' },
            { label:'Pourboires',    val: money(tips),  icon: TrendingUp,   color:'text-purple-400', bg:'bg-purple-500/10' },
          ].map(k => (
            <Card key={k.label} className={`p-4 ${k.bg}`}>
              <k.icon size={16} className={k.color} />
              <div className={`text-xl font-bold ${k.color} mt-2`}>{k.val}</div>
              <div className="text-[10px] text-slate-400">{k.label}</div>
            </Card>
          ))}
        </div>

        {/* Transactions récentes */}
        <Card className="p-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Activités récentes</div>
          {(revenue?.breakdown ?? []).map(b => (
            <div key={b.source_type} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm">
                {b.source_type === 'TAXI' ? '🚕' : b.source_type === 'UBER' ? '⬛' : b.source_type === 'LYFT' ? '🟣' : b.source_type === 'DOORDASH' ? '🔴' : '📦'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{b.source_type}</div>
                <div className="text-[10px] text-slate-400">{b.count} activité(s)</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">{money(b.gross)}</div>
                {parseFloat(b.tips) > 0 && <div className="text-[10px] text-purple-400">+{money(b.tips)} tips</div>}
              </div>
            </div>
          ))}
          {(!revenue || revenue.breakdown.length === 0) && !loading && (
            <p className="text-sm text-slate-400 text-center py-4">Aucune activité ce mois.</p>
          )}
        </Card>

        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
          <p className="text-[10px] text-slate-400 text-center">Mode pilote · Données synthétiques · Aucun virement réel</p>
        </div>
      </div>
    </AppShell>
  )
}
