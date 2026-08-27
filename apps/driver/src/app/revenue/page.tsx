'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockRevenueEntries, mockLedgerEntries, mockWebhooks, mockReconciliationCases,
  mockProviderTransactions, mockTransactionVersions, mockDailyClose,
  mockRefund, ledgerBalance,
  SOURCE_CONF, RECON_STATUS_CONF, WEBHOOK_STATUS_CONF, fmt,
  type RevenueSource,
} from '@/lib/engines/ledger.engine'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Shield, Lock, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function RevenuePage() {
  const [tab, setTab] = useState<'summary' | 'entries' | 'ledger' | 'webhooks' | 'reconciliation'>('summary')

  const confirmed = mockRevenueEntries.filter(e => e.status === 'CONFIRMED')
  const totalGross = confirmed.reduce((a, e) => a + e.grossAmount, 0)
  const totalFees  = confirmed.reduce((a, e) => a + e.fees, 0)
  const totalTips  = confirmed.reduce((a, e) => a + e.tip, 0)
  const totalNet   = confirmed.reduce((a, e) => a + e.netAmount, 0)

  // By source
  const bySource: Partial<Record<RevenueSource, number>> = {}
  confirmed.forEach(e => { bySource[e.source] = (bySource[e.source] ?? 0) + e.netAmount })

  return (
    <AppShell>
      <PageHeader title="Revenus & Ledger" subtitle="Multi-sources · Réconciliation · Webhooks · Audit" />
      <div className="px-4">
        {/* Immutability notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Lock size={12} className="text-qc-blue-light mt-0.5 shrink-0"/>
          <p className="text-xs text-slate-400">Ledger finalisé = immuable · Webhook non authentifié = REJECTED · Idempotency: provider+transactionId</p>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-qc-blue/20 to-slate-900 rounded-3xl border border-qc-blue/30 p-5 mb-5">
          <div className="text-xs text-slate-400 mb-1">Revenus nets confirmés (26 août 2026)</div>
          <div className="text-5xl font-black text-white tabular-nums mb-4">{fmt(totalNet)}</div>
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            {[
              { label:'Bruts', val:totalGross, color:'text-white' },
              { label:'Frais', val:-totalFees, color:'text-red-400' },
              { label:'Pourboires', val:totalTips, color:'text-green-400' },
              { label:'En attente', val:mockRevenueEntries.filter(e=>e.status==='PENDING').reduce((a,e)=>a+e.grossAmount,0), color:'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-2xl p-2 text-center">
                <div className={`font-black tabular-nums ${s.color}`}>{fmt(Math.abs(s.val))}</div>
                <div className="text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['summary','Résumé'],['entries','Transactions'],['ledger','Ledger'],['webhooks','Webhooks'],['reconciliation','Réconcil.']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── SUMMARY ─────────────────────────────────── */}
        {tab === 'summary' && (
          <div className="space-y-4 mb-6">
            {/* By source */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Par source</div>
              <div className="space-y-2.5">
                {Object.entries(bySource).map(([source, net]) => {
                  const conf = SOURCE_CONF[source as RevenueSource]
                  const pct = Math.round((net! / totalNet) * 100)
                  return (
                    <div key={source}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{conf.icon}</span>
                        <span className="text-xs text-slate-300 flex-1">{conf.label}</span>
                        <span className={`font-bold text-xs tabular-nums ${conf.color}`}>{fmt(net!)}</span>
                        {!conf.taximeter && <span className="text-[8px] bg-slate-800 text-slate-600 px-1 rounded font-mono">Txm: OFF</span>}
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-qc-blue rounded-full transition-all" style={{width:`${pct}%`}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Daily close */}
            <Card className={mockDailyClose.status === 'REVIEW' ? 'border-amber-500/20' : 'border-green-500/20'}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{mockDailyClose.status === 'CLOSED' ? '✅' : '⚠️'}</span>
                <span className="font-semibold text-white text-sm">Clôture journalière — {mockDailyClose.date}</span>
                <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mockDailyClose.status === 'CLOSED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{mockDailyClose.status}</span>
              </div>
              {[
                { label:'Taxi', val:mockDailyClose.taxiGross, color:'text-qc-blue-light' },
                { label:'Rideshare', val:mockDailyClose.rideshareGross, color:'text-white' },
                { label:'Livraison', val:mockDailyClose.deliveryGross, color:'text-white' },
                { label:'Frais total', val:-mockDailyClose.totalFees, color:'text-red-400' },
                { label:'Remboursements', val:-mockDailyClose.totalRefunds, color:'text-orange-400' },
                { label:'NET', val:mockDailyClose.netRevenue, color:'text-green-400', bold:true },
              ].map(s => (
                <div key={s.label} className={`flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs ${s.bold ? 'font-bold' : ''}`}>
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`tabular-nums ${s.color}`}>{fmt(Math.abs(s.val))}{s.val < 0 ? ' (-)' : ''}</span>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-center">
                {[
                  { label:'Réconciliées', val:mockDailyClose.reconciledCount, color:'text-green-400' },
                  { label:'En attente', val:mockDailyClose.pendingCount, color:'text-amber-400' },
                  { label:'Exceptions', val:mockDailyClose.exceptionsCount, color:'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-2">
                    <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
                    <div className="text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Provider transactions with versioning */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Transactions fournisseur — Ajustements</div>
              <div className="text-[9px] text-slate-500 mb-2">Montant original conservé · Ajustement séparé · Version traceable</div>
              {mockProviderTransactions.map(pt => (
                <div key={pt.id} className="border-b border-slate-800 last:border-0 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{SOURCE_CONF[pt.provider].icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{SOURCE_CONF[pt.provider].label}</span>
                        <span className="font-mono text-[9px] text-slate-500">{pt.providerTransactionId}</span>
                        {pt.status === 'ADJUSTED' && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">AJUSTÉ</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white">{fmt(pt.netAmount)}</div>
                      <div className="text-[9px] text-slate-500">net chauffeur</div>
                    </div>
                  </div>
                  {pt.adjustments !== 0 && (
                    <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                      <div className="bg-slate-800/50 rounded-lg p-1.5 text-center">
                        <div className="text-slate-500">Original</div>
                        <div className="font-mono text-slate-400 line-through">{fmt(pt.originalGrossAmount)}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-1.5 text-center">
                        <div className="text-slate-500">Ajustement</div>
                        <div className="font-mono text-green-400">+{fmt(pt.adjustments)}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-1.5 text-center">
                        <div className="text-slate-500">Final</div>
                        <div className="font-mono text-white font-bold">{fmt(pt.grossAmount + pt.adjustments)}</div>
                      </div>
                    </div>
                  )}
                  {/* Versions */}
                  {mockTransactionVersions.filter(v => v.transactionId === pt.id).length > 1 && (
                    <div className="flex gap-1 mt-1.5">
                      {mockTransactionVersions.filter(v => v.transactionId === pt.id).map(v => (
                        <span key={v.versionId} className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">v{v.version}: {v.source}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ─── ENTRIES ─────────────────────────────────── */}
        {tab === 'entries' && (
          <div className="space-y-2 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Idempotency: provider + transactionId · Pas de doublons · Original conservé</div>
            {mockRevenueEntries.map(entry => {
              const conf = SOURCE_CONF[entry.source]
              return (
                <div key={entry.id} className={`driver-card p-3.5 border ${entry.status === 'CONFIRMED' ? '' : 'border-amber-500/20'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{conf.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white">{conf.label}</span>
                        <span className={`text-[9px] font-bold ${entry.status === 'CONFIRMED' ? 'text-green-400' : 'text-amber-400'}`}>{entry.status}</span>
                        {entry.taximeterUsed && <span className="text-[9px] bg-qc-blue/20 text-blue-300 px-1 rounded">Txm ✓</span>}
                        {!entry.taximeterUsed && <span className="text-[9px] bg-slate-800 text-slate-600 px-1 rounded">Txm: OFF</span>}
                      </div>
                      {entry.providerTransactionId && <div className="font-mono text-[9px] text-slate-500 truncate">{entry.providerTransactionId}</div>}
                      <div className="grid grid-cols-4 gap-1 mt-1.5 text-[9px]">
                        <div><div className="text-slate-600">Brut</div><div className="text-white tabular-nums">{fmt(entry.grossAmount)}</div></div>
                        <div><div className="text-slate-600">Frais</div><div className="text-red-400 tabular-nums">-{fmt(entry.fees)}</div></div>
                        <div><div className="text-slate-600">Pourboire</div><div className="text-green-400 tabular-nums">+{fmt(entry.tip)}</div></div>
                        <div><div className="text-slate-600">Net</div><div className="font-bold text-white tabular-nums">{fmt(entry.netAmount)}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── LEDGER ──────────────────────────────────── */}
        {tab === 'ledger' && (
          <div className="mb-6">
            <div className="text-[10px] text-slate-500 mb-3">Double-entry · SETTLED = immuable · Modification → VOID/REVERSED avec audit</div>
            <div className="driver-card divide-y divide-slate-800 mb-3">
              {mockLedgerEntries.map(entry => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 ${entry.status === 'PENDING' ? 'opacity-60' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${entry.entryType === 'CREDIT' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {entry.entryType === 'CREDIT' ? <ArrowDownLeft size={14} className="text-green-400"/> : <ArrowUpRight size={14} className="text-red-400"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate">{entry.description}</div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-600">
                      <span>{new Date(entry.timestamp).toLocaleTimeString('fr-CA')}</span>
                      {entry.isImmutable && <span className="text-purple-400 flex items-center gap-0.5"><Lock size={8}/> immuable</span>}
                      {entry.status === 'PENDING' && <span className="text-amber-400">⏳ pending</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-black tabular-nums ${entry.entryType === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.entryType === 'CREDIT' ? '+' : '-'}{fmt(entry.credit || entry.debit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-slate-400">Solde (settled)</span>
              <span className="font-black text-green-400 text-lg tabular-nums">{fmt(ledgerBalance)}</span>
            </div>
          </div>
        )}

        {/* ─── WEBHOOKS ────────────────────────────────── */}
        {tab === 'webhooks' && (
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              Signature vérifiée · Replay protection · event_id UNIQUE · REJECTED = aucune transaction créée
            </div>
            {mockWebhooks.map(wh => {
              const conf = WEBHOOK_STATUS_CONF[wh.processingStatus]
              return (
                <Card key={wh.id} className={wh.processingStatus === 'DUPLICATE' ? 'border-amber-500/20' : wh.processingStatus === 'REJECTED' ? 'border-red-500/20' : ''}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{conf.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white">{wh.provider}</span>
                        <span className="text-xs text-slate-400">{wh.eventType}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${conf.color} bg-slate-800`}>{wh.processingStatus}</span>
                      </div>
                      <div className="font-mono text-[9px] text-slate-500 truncate">{wh.eventId}</div>
                      <div className="flex items-center gap-3 text-[9px] mt-0.5">
                        <span className={wh.signatureStatus === 'VERIFIED' ? 'text-green-400' : 'text-red-400'}>
                          {wh.signatureStatus === 'VERIFIED' ? '✓ Sig.' : '✗ Sig. INVALIDE'}
                        </span>
                        {wh.attemptCount > 1 && <span className="text-blue-400">{wh.attemptCount} tentatives</span>}
                        {wh.processingStatus === 'DUPLICATE' && <span className="text-amber-400">Ignoré — idempotency</span>}
                      </div>
                      {wh.lastError && <div className="text-[9px] text-red-400 mt-0.5">{wh.lastError}</div>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* ─── RECONCILIATION ──────────────────────────── */}
        {tab === 'reconciliation' && (
          <div className="space-y-4 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Match par: transactionId + tripId + driver + montant + timestamp. Jamais montant seul.</div>
            {mockReconciliationCases.map(rec => {
              const conf = RECON_STATUS_CONF[rec.issueType]
              return (
                <Card key={rec.id} className={rec.issueType === 'MATCHED' ? 'border-green-500/20' : rec.issueType === 'AMOUNT_MISMATCH' ? 'border-red-500/20' : 'border-amber-500/20'}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{conf.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{rec.provider}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${conf.color} bg-slate-800`}>{conf.label}</span>
                        <span className={`text-[9px] ml-auto ${rec.status === 'RESOLVED' ? 'text-green-400' : rec.status === 'UNDER_REVIEW' ? 'text-amber-400' : 'text-slate-500'}`}>{rec.status}</span>
                      </div>
                      {rec.transactionId && <div className="font-mono text-[9px] text-slate-500">{rec.transactionId}</div>}
                    </div>
                  </div>
                  {rec.issueType === 'AMOUNT_MISMATCH' && (
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      {[
                        { label:'Interne', val:rec.internalAmount },
                        { label:'Fournisseur', val:rec.providerAmount },
                        { label:'Écart', val:rec.difference },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-800/50 rounded-xl p-2 text-center">
                          <div className={`font-bold tabular-nums ${s.label === 'Écart' ? 'text-red-400' : 'text-white'}`}>{s.val !== null ? fmt(s.val) : '—'}</div>
                          <div className="text-slate-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {rec.resolution && <div className="text-[10px] text-green-400 mt-1.5">✓ {rec.resolution}</div>}
                  {rec.assignedTo && <div className="text-[9px] text-slate-500 mt-1">Assigné: {rec.assignedTo}</div>}
                </Card>
              )
            })}

            {/* Refund */}
            <Card className="border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">↩</span>
                <span className="font-semibold text-white text-sm">Remboursement</span>
                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full ml-auto">{mockRefund.status}</span>
              </div>
              <div className="text-xs text-slate-400 mb-1">{mockRefund.reason}</div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Lié à</span>
                <span className="font-mono text-qc-blue-light text-[10px]">{mockRefund.transactionId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Montant remboursé</span>
                <span className="text-red-400 font-bold">-{fmt(mockRefund.amount)}</span>
              </div>
              <div className="text-[9px] text-slate-600 mt-1">Transaction originale: CONSERVÉE · Entrée remboursement: DISTINCTE</div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
