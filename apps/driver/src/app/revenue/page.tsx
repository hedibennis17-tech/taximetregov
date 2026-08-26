'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockRevenueTransactions, mockMonthlyData, mockReconciliation,
  aggregateRevenue, formatCAD, ACTIVITY_ICONS, SOURCE_ICONS,
  type ActivityCategory, type RevenueSource
} from '@/lib/engines/revenue.engine'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, AlertCircle, CheckCircle, Download, ChevronRight, Shield } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'year'

// Filter transactions by period (mock — uses all for demo)
function filterByPeriod(txs: typeof mockRevenueTransactions, period: Period) {
  const now = new Date('2026-08-24T23:59:59Z')
  return txs.filter(t => {
    const d = new Date(t.occurredAt)
    if (period === 'today') return d.toDateString() === now.toDateString()
    if (period === 'week') return (now.getTime() - d.getTime()) < 7 * 86400000
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  })
}

const syncColor: Record<string, string> = {
  SYNCED: 'text-green-400', PENDING: 'text-amber-400', PROCESSING: 'text-blue-400',
  ERROR: 'text-red-400', UNMATCHED: 'text-red-400', REVIEW_REQUIRED: 'text-orange-400',
}
const syncIcon: Record<string, string> = {
  SYNCED: '✅', PENDING: '⏳', PROCESSING: '🔄', ERROR: '❌', UNMATCHED: '🔍', REVIEW_REQUIRED: '⚠️',
}

const PIE_COLORS = ['#003DA5', '#6B7280', '#EF4444']

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('today')
  const [actFilter, setActFilter] = useState<ActivityCategory | 'ALL'>('ALL')
  const [tab, setTab] = useState<'summary' | 'transactions' | 'charts' | 'reconciliation'>('summary')
  const [selectedTx, setSelectedTx] = useState<string | null>(null)

  const filtered = filterByPeriod(mockRevenueTransactions, period)
  const displayed = actFilter === 'ALL' ? filtered : filtered.filter(t => t.activity === actFilter)
  const agg = aggregateRevenue(displayed)
  const selectedTxData = mockRevenueTransactions.find(t => t.transactionId === selectedTx)

  const pieData = [
    { name:'Taxi', value:agg.taxiGross },
    { name:'Rideshare', value:agg.rideshareGross },
    { name:'Livraison', value:agg.deliveryGross },
  ].filter(d => d.value > 0)

  return (
    <AppShell>
      <PageHeader
        title="Mes revenus"
        subtitle="Vue consolidée · Toutes activités · SIMULATION"
      />
      <div className="px-4">
        {/* Period selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {([['today',"Aujourd'hui"],['week','Semaine'],['month','Mois'],['year','Année']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${period===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Activity filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([['ALL','Tout'],['TAXI','🚕 Taxi'],['RIDESHARE','🚗 Rideshare'],['DELIVERY','📦 Livraison']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setActFilter(k as ActivityCategory | 'ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${actFilter===k?'bg-slate-600 text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Main revenue display */}
        <div className="bg-gradient-to-br from-qc-blue/30 to-slate-900 rounded-3xl border border-qc-blue/30 p-5 mb-5">
          <div className="text-xs text-slate-400 mb-1">Revenus bruts</div>
          <div className="text-5xl font-black text-white tabular-nums mb-1">
            {formatCAD(agg.grossRevenue + agg.totalTips)}
          </div>
          <div className="flex items-center gap-1.5 mb-4">
            <TrendingUp size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">+12.4% vs période précédente</span>
          </div>

          {/* Activity breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {([['TAXI', agg.taxiGross, agg.taxiTrips], ['RIDESHARE', agg.rideshareGross, agg.rideshareTrips], ['DELIVERY', agg.deliveryGross, agg.deliveryOrders]] as const).map(([act, gross, count]) => (
              <div key={act} className="bg-slate-900/60 rounded-2xl p-3 text-center">
                <div className="text-xl mb-0.5">{ACTIVITY_ICONS[act as ActivityCategory]}</div>
                <div className="font-black text-white text-sm tabular-nums">{formatCAD(gross as number).replace('CA\u00a0','')}</div>
                <div className="text-[9px] text-slate-500">{count} course{(count as number) > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial breakdown row */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { label:'Pourboires', val:agg.totalTips, color:'text-blue-400' },
            { label:'Frais plateforme', val:-agg.totalFees, color:'text-red-400' },
            { label:'Ajustements', val:agg.totalAdjustments, color:agg.totalAdjustments >= 0 ? 'text-green-400' : 'text-red-400' },
            { label:'Remboursements', val:-agg.totalRefunds, color:'text-red-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3">
              <div className="text-[10px] text-slate-500 mb-0.5">{s.label}</div>
              <div className={`font-bold tabular-nums ${s.color}`}>
                {s.val >= 0 ? '+' : ''}{formatCAD(Math.abs(s.val))}
              </div>
            </div>
          ))}
        </div>

        {/* Net revenue */}
        <div className="driver-card p-4 mb-5 border-green-500/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Revenu NET</div>
            <div className="text-xs text-slate-500">Après frais, ajustements, remboursements</div>
          </div>
          <div className="text-2xl font-black text-green-400 tabular-nums">{formatCAD(agg.netRevenue)}</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {[['summary','Résumé'],['transactions','Transactions'],['charts','Graphiques'],['reconciliation','Réconciliation']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── SUMMARY ─────────────────────────────────── */}
        {tab === 'summary' && (
          <div className="space-y-4 mb-6">
            {/* Source breakdown */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Par fournisseur</div>
              <div className="space-y-2.5">
                {Object.entries(agg.bySource).filter(([,v]) => v > 0).map(([src, val]) => (
                  <div key={src} className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{SOURCE_ICONS[src as RevenueSource]}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-sm text-slate-200 font-medium">{src.replace('_',' ')}</span>
                        <span className="font-black text-white tabular-nums">{formatCAD(val)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-qc-blue rounded-full"
                          style={{width:`${Math.round((val / (agg.grossRevenue + agg.totalTips + 0.01)) * 100)}%`}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Monthly overview */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Évolution mensuelle</div>
              <div className="space-y-2">
                {mockMonthlyData.slice(-3).map(m => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-8 shrink-0">{m.label}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-qc-blue rounded-full"
                        style={{width:`${Math.round((m.net / 4500) * 100)}%`}} />
                    </div>
                    <span className="font-bold text-white text-xs tabular-nums w-20 text-right">{formatCAD(m.net)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Taximeter separation notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
              <Shield size={13} className="text-qc-blue-light mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                <span className="font-bold text-white">Sources séparées:</span> Taxi = Taximètre.GOV · Rideshare = Uber/Lyft (prix fourni) · Livraison = plateforme (prix fourni). Les revenus sont consolidés mais jamais mélangés.
              </p>
            </div>
          </div>
        )}

        {/* ─── TRANSACTIONS ────────────────────────────── */}
        {tab === 'transactions' && (
          <div className="space-y-3 mb-6">
            {displayed.map(tx => (
              <div key={tx.transactionId}>
                <button onClick={() => setSelectedTx(selectedTx === tx.transactionId ? null : tx.transactionId)}
                  className={`w-full driver-card p-4 text-left transition-all ${selectedTx === tx.transactionId ? 'border-qc-blue/40' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{SOURCE_ICONS[tx.source]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-white text-sm">{tx.providerName}</span>
                        <span className={`text-[9px] font-bold ${syncColor[tx.syncStatus]}`}>
                          {syncIcon[tx.syncStatus]} {tx.syncStatus}
                        </span>
                        {tx.amountStatus !== 'FINAL' && (
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{tx.amountStatus}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.occurredAt).toLocaleTimeString('fr-CA', {hour:'2-digit', minute:'2-digit'})}
                        {tx.distanceKm && ` · ${tx.distanceKm} km`}
                        {tx.durationMin && ` · ${tx.durationMin} min`}
                        {' · '}{tx.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white tabular-nums">{formatCAD(tx.grossAmount + tx.tip)}</div>
                      {tx.providerFee > 0 && <div className="text-[10px] text-red-400">-{formatCAD(tx.providerFee)} frais</div>}
                    </div>
                  </div>
                </button>

                {/* Expanded transaction detail */}
                {selectedTx === tx.transactionId && (
                  <div className="driver-card p-4 border-t-0 rounded-t-none -mt-3 pt-5 space-y-2 border-qc-blue/40">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Détail transaction</div>
                    {[
                      { label:'Transaction ID', val:tx.transactionId, mono:true },
                      { label:'Référence fournisseur', val:tx.providerReference || '—', mono:true },
                      { label:'Activité', val:`${ACTIVITY_ICONS[tx.activity]} ${tx.activity}` },
                      { label:'Taximètre', val:tx.taximeterEnabled ? '🟢 ACTIF' : '⚫ DÉSACTIVÉ' },
                      { label:'Montant brut', val:formatCAD(tx.grossAmount) },
                      { label:'Frais plateforme', val:tx.providerFee > 0 ? `-${formatCAD(tx.providerFee)}` : '—' },
                      { label:'Pourboire', val:tx.tip > 0 ? `+${formatCAD(tx.tip)}` : '—' },
                      { label:'Ajustements', val:tx.positiveAdjustments > 0 ? `+${formatCAD(tx.positiveAdjustments)}` : '—' },
                      { label:'Remboursements', val:tx.refunds > 0 ? `-${formatCAD(tx.refunds)}` : '—' },
                      { label:'Montant net', val:formatCAD(tx.netAmount), bold:true },
                      { label:'Paiement', val:tx.paymentMethod },
                      { label:'Statut montant', val:tx.amountStatus },
                      { label:'Ledger', val:tx.ledgerPosted ? '✅ POSTÉ' : '⏳ EN ATTENTE' },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between text-xs py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-400">{s.label}</span>
                        <span className={`${s.mono ? 'font-mono text-[10px] text-qc-blue-light' : s.bold ? 'font-black text-green-400' : 'text-white'}`}>{s.val}</span>
                      </div>
                    ))}
                    {tx.notes && (
                      <div className="text-[10px] text-slate-500 italic pt-1">{tx.notes}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {displayed.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">Aucune transaction pour cette période / filtre</div>
            )}
          </div>
        )}

        {/* ─── CHARTS ──────────────────────────────────── */}
        {tab === 'charts' && (
          <div className="space-y-4 mb-6">
            {/* Monthly bar chart */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Revenus mensuels — 2026</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={mockMonthlyData}>
                  <XAxis dataKey="label" tick={{fontSize:10, fill:'#64748b'}} />
                  <YAxis tick={{fontSize:10, fill:'#64748b'}} tickFormatter={v=>`${(v/1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: number) => formatCAD(v)} contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'12px',color:'#fff',fontSize:11}} />
                  <Bar dataKey="taxi" name="Taxi" fill="#003DA5" stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="rideshare" name="Rideshare" fill="#6B7280" stackId="a" />
                  <Bar dataKey="delivery" name="Livraison" fill="#EF4444" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {[['#003DA5','Taxi'],['#6B7280','Rideshare'],['#EF4444','Livraison']].map(([c,l])=>(
                  <div key={l} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{background:c}} />
                    {l}
                  </div>
                ))}
              </div>
            </Card>

            {/* Activity pie */}
            {pieData.length > 0 && (
              <Card>
                <div className="font-semibold text-white text-sm mb-3">Par activité</div>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                        {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {pieData.map((d,i) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{background:PIE_COLORS[i]}} />
                          <span className="text-xs text-slate-300">{d.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-white">{formatCAD(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Annual summary */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">📊 Bilan annuel 2026</div>
              <div className="space-y-2">
                {[
                  { label:'Taxi', val:mockMonthlyData.reduce((a,m)=>a+m.taxi,0), icon:'🚕', color:'text-blue-400' },
                  { label:'Rideshare', val:mockMonthlyData.reduce((a,m)=>a+m.rideshare,0), icon:'🚗', color:'text-slate-300' },
                  { label:'Livraison', val:mockMonthlyData.reduce((a,m)=>a+m.delivery,0), icon:'📦', color:'text-red-400' },
                  { label:'Pourboires', val:mockMonthlyData.reduce((a,m)=>a+m.tips,0), icon:'💙', color:'text-blue-300' },
                  { label:'Frais', val:-mockMonthlyData.reduce((a,m)=>a+m.fees,0), icon:'💸', color:'text-red-400' },
                  { label:'NET total', val:mockMonthlyData.reduce((a,m)=>a+m.net,0), icon:'💰', color:'text-green-400', bold:true },
                ].map(s=>(
                  <div key={s.label} className={`flex justify-between py-1.5 ${s.bold ? 'border-t border-slate-700 pt-2.5 mt-1' : 'border-b border-slate-800'} last:border-0`}>
                    <span className="text-xs text-slate-400">{s.icon} {s.label}</span>
                    <span className={`font-mono font-bold text-sm ${s.color}`}>{formatCAD(Math.abs(s.val))}{s.val < 0 ? ' (-)' : ''}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── RECONCILIATION ──────────────────────────── */}
        {tab === 'reconciliation' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              La réconciliation compare les données fournisseur vs le Ledger interne. Jamais de correction automatique — REVIEW_REQUIRED si écart.
            </div>
            {mockReconciliation.map(rec => (
              <Card key={rec.provider} className={rec.status !== 'MATCHED' ? 'border-amber-500/20' : 'border-green-500/20'}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{rec.provider==='Uber'?'⬛':rec.provider==='DoorDash'?'🔴':rec.provider==='Lyft'?'🔵':'🚕'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{rec.provider}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rec.status==='MATCHED'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>
                        {rec.status === 'MATCHED' ? '✅ MATCHED' : `⚠ ${rec.status}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{rec.transactionCount} transactions · {new Date('2026-08-24').toLocaleDateString('fr-CA')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-slate-800/50 rounded-xl p-2.5">
                    <div className="text-slate-500 text-[10px]">Fournisseur</div>
                    <div className="font-bold text-white">{formatCAD(rec.providerTotal)}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-2.5">
                    <div className="text-slate-500 text-[10px]">Ledger interne</div>
                    <div className="font-bold text-white">{formatCAD(rec.internalTotal)}</div>
                  </div>
                </div>
                {rec.status !== 'MATCHED' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle size={12} className="text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300">
                      Écart: {formatCAD(Math.abs(rec.difference))} · {rec.missingCount} transaction(s) manquante(s) → Review requis
                    </span>
                  </div>
                )}
              </Card>
            ))}

            {/* Export */}
            <div className="driver-card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white text-sm">Exporter mes revenus</div>
                <div className="text-[10px] text-slate-500">CSV · PDF · JSON · Audité</div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all">
                <Download size={13} /> Exporter
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
