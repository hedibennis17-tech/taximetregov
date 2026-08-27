'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockPayments, mockDailySettlement, mockReconciliation, mockAnomalies,
  mockWebhookEvents, mockAudit, mockCashSettlement,
  PAYMENT_METHOD_CONF, PAYMENT_STATUS_CONF, ACTIVITY_ICONS_PAY, fmt,
  type PaymentActivity, type PaymentMethod
} from '@/lib/engines/payment.engine'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Shield, Lock, Zap } from 'lucide-react'

export default function PaymentsPage() {
  const [tab, setTab] = useState<'daily' | 'payments' | 'webhook' | 'reconciliation'>('daily')
  const completed = mockPayments.filter(p => p.paymentStatus === 'COMPLETED')
  const pending = mockPayments.filter(p => p.paymentStatus === 'PENDING')
  const failed = mockPayments.filter(p => p.paymentStatus === 'FAILED')
  const totalGross = completed.reduce((a, p) => a + p.grossAmount + p.tipAmount, 0)

  return (
    <AppShell>
      <PageHeader title="Paiements" subtitle="Cash · Carte · Interac · Provider · Wallet" />
      <div className="px-4">
        {/* Security notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Lock size={12} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">Montants fournisseurs immuables · Wallet débité après confirmation uniquement · Webhook idempotent · Secrets chiffrés</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Complétés', val:completed.length, color:'text-green-400' },
            { label:'En attente', val:pending.length, color:'text-amber-400' },
            { label:'Échoués', val:failed.length, color:'text-red-400' },
            { label:'Anomalies', val:mockAnomalies.length, color:mockAnomalies.length>0?'text-orange-400':'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['daily','Journée'],['payments','Paiements'],['webhook','Webhooks'],['reconciliation','Réconciliation']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── DAILY ─────────────────────────────────────── */}
        {tab === 'daily' && (
          <div className="space-y-4 mb-6">
            {/* Daily settlement hero */}
            <div className="bg-gradient-to-br from-qc-blue/20 to-slate-900 rounded-3xl border border-qc-blue/30 p-5">
              <div className="text-xs text-slate-400 mb-1">26 août 2026 — Règlement journalier</div>
              <div className="text-4xl font-black text-white tabular-nums mb-3">{fmt(mockDailySettlement.netTotal)}</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon:'🚕', label:'Taxi', val:mockDailySettlement.taxi, note:'Taximètre ✓' },
                  { icon:'🚗', label:'Rideshare', val:mockDailySettlement.rideshare, note:'Prix fournisseur' },
                  { icon:'📦', label:'Livraison', val:mockDailySettlement.delivery, note:'Prix fournisseur' },
                ].map(a => (
                  <div key={a.label} className="bg-slate-900/60 rounded-2xl p-2.5 text-center">
                    <div className="text-lg">{a.icon}</div>
                    <div className="font-black text-white text-sm tabular-nums">{fmt(a.val).replace('CA\u00a0','')}</div>
                    <div className="text-[8px] text-slate-500">{a.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method breakdown */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Par méthode de paiement</div>
              <div className="space-y-2.5">
                {[
                  { method:'CASH' as PaymentMethod, val:mockDailySettlement.cash },
                  { method:'CARD' as PaymentMethod, val:mockDailySettlement.card },
                  { method:'INTERAC' as PaymentMethod, val:mockDailySettlement.interac },
                  { method:'PROVIDER' as PaymentMethod, val:mockDailySettlement.provider },
                ].filter(m => m.val > 0).map(m => {
                  const conf = PAYMENT_METHOD_CONF[m.method]
                  return (
                    <div key={m.method} className="flex items-center gap-3">
                      <span className="text-lg w-6 shrink-0">{conf.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs text-slate-300">{conf.label}</span>
                          <span className={`font-bold text-xs tabular-nums ${conf.color}`}>{fmt(m.val)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-qc-blue rounded-full" style={{width:`${Math.round(m.val/mockDailySettlement.grossTotal*100)}%`}} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Summary breakdown */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Décomposition financière</div>
              <div className="space-y-2">
                {[
                  { label:'Revenus bruts', val:mockDailySettlement.grossTotal, color:'text-white' },
                  { label:'dont Taximètre (Taxi)', val:mockDailySettlement.taximeterAmount, color:'text-blue-400' },
                  { label:'dont Fournisseurs (Rideshare/Livraison)', val:mockDailySettlement.providerAmount, color:'text-slate-300', note:'Immuable — jamais recalculé' },
                  { label:'Pourboires', val:mockDailySettlement.totalTips, color:'text-green-400' },
                  { label:'Frais fournisseurs', val:-mockDailySettlement.totalFees, color:'text-red-400' },
                  { label:'En attente', val:-mockDailySettlement.pendingAmount, color:'text-amber-400' },
                  { label:'NET journalier', val:mockDailySettlement.netTotal, color:'text-green-400', bold:true },
                ].map(s => (
                  <div key={s.label} className={`flex justify-between py-1.5 ${s.bold ? 'border-t border-slate-700 pt-2.5 mt-1' : 'border-b border-slate-800 last:border-0'}`}>
                    <div>
                      <span className="text-xs text-slate-400">{s.label}</span>
                      {s.note && <div className="text-[9px] text-slate-600">{s.note}</div>}
                    </div>
                    <span className={`font-mono font-bold text-sm ${s.color}`}>{fmt(Math.abs(s.val))}{s.val < 0 ? ' (-)' : ''}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cash settlement */}
            <Card className={mockCashSettlement.status === 'MATCHED' ? 'border-green-500/20' : 'border-amber-500/20'}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💵</span>
                <span className="font-semibold text-white text-sm">Règlement comptant</span>
                <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mockCashSettlement.status === 'MATCHED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {mockCashSettlement.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                {[
                  { label:'Attendu', val:mockCashSettlement.expectedCash },
                  { label:'Déclaré', val:mockCashSettlement.declaredCash },
                  { label:'Écart', val:mockCashSettlement.difference },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-2 text-center">
                    <div className={`font-bold tabular-nums ${s.label==='Écart' && s.val!==0 ? 'text-amber-400' : 'text-white'}`}>{fmt(s.val)}</div>
                    <div className="text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── PAYMENTS ──────────────────────────────────── */}
        {tab === 'payments' && (
          <div className="space-y-3 mb-6">
            {mockPayments.map(pay => {
              const mConf = PAYMENT_METHOD_CONF[pay.paymentMethod]
              const sConf = PAYMENT_STATUS_CONF[pay.paymentStatus]
              return (
                <Card key={pay.id} className={pay.paymentStatus === 'FAILED' ? 'border-red-500/20' : pay.paymentStatus === 'PENDING' ? 'border-amber-500/20' : ''}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-xl">{ACTIVITY_ICONS_PAY[pay.activity]}</span>
                      <span className="text-base">{mConf.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-sm">{pay.activity}</span>
                        <span className={`text-[9px] font-bold ${sConf.color}`}>{sConf.icon} {sConf.label}</span>
                        {pay.taximeterUsed && <span className="text-[9px] bg-qc-blue/20 text-blue-300 px-1.5 py-0.5 rounded-full">Taximeter ✓</span>}
                        {!pay.taximeterUsed && pay.activity !== 'TAXI' && <span className="text-[9px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">Taximeter: OFF</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">{mConf.label} · {pay.tripId}</div>
                      {pay.providerTransactionId && (
                        <div className="font-mono text-[9px] text-qc-blue-light">{pay.providerTransactionId}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white tabular-nums">{fmt(pay.grossAmount + pay.tipAmount)}</div>
                      {pay.providerFee > 0 && <div className="text-[10px] text-red-400">-{fmt(pay.providerFee)} frais</div>}
                      {pay.paymentStatus === 'FAILED' && <div className="text-[10px] text-red-400">⛔ Wallet: non crédité</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                    {[
                      { label:'Brut', val:fmt(pay.grossAmount) },
                      { label:'Taxe', val:fmt(pay.taxAmount) },
                      { label:'Pourboire', val:fmt(pay.tipAmount) },
                      { label:'Driver net', val:fmt(pay.driverAmount), color:'text-green-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-800/50 rounded-lg p-1">
                        <div className="text-slate-500">{s.label}</div>
                        <div className={`font-bold tabular-nums ${s.color ?? 'text-white'}`}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* ─── WEBHOOK ───────────────────────────────────── */}
        {tab === 'webhook' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              Signature vérifiée · Timestamp validé · event_id UNIQUE (idempotent) · Payload hash calculé
            </div>
            {mockWebhookEvents.map(wh => (
              <Card key={wh.id} className={wh.status === 'DUPLICATE' ? 'border-amber-500/20' : wh.status === 'FAILED' ? 'border-red-500/20' : ''}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-xl shrink-0">{wh.status === 'PROCESSED' ? '✅' : wh.status === 'DUPLICATE' ? '⚠️' : wh.status === 'PROCESSING' ? '🔄' : '❌'}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-white text-sm">{wh.provider}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${wh.status==='PROCESSED'?'bg-green-500/20 text-green-400':wh.status==='DUPLICATE'?'bg-amber-500/20 text-amber-400':wh.status==='PROCESSING'?'bg-blue-500/20 text-blue-400':'bg-red-500/20 text-red-400'}`}>{wh.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{wh.eventType}</div>
                    <div className="font-mono text-[9px] text-slate-500 truncate">{wh.eventId}</div>
                    {wh.status === 'DUPLICATE' && (
                      <div className="text-[9px] text-amber-400 mt-0.5">⚠ event_id déjà traité — aucun double débit</div>
                    )}
                    {wh.retryCount > 0 && (
                      <div className="text-[9px] text-blue-400 mt-0.5">Tentatives: {wh.retryCount}</div>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-slate-500 shrink-0">{new Date(wh.receivedAt).toLocaleTimeString('fr-CA')}</div>
                </div>
              </Card>
            ))}

            {/* Anomalies */}
            {mockAnomalies.map(ano => (
              <Card key={ano.id} className="border-orange-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-orange-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-sm">ANOMALIE</span>
                      <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-bold">{ano.type}</span>
                      <span className="text-[9px] text-slate-500 ml-auto">{ano.severity}</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-1">{ano.description}</p>
                    <div className="text-[9px] text-orange-300">ANOMALIE ≠ FRAUDE — révision manuelle requise</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ─── RECONCILIATION ────────────────────────────── */}
        {tab === 'reconciliation' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              Transaction → Paiement → Ledger → Wallet. Tout écart → REVIEW_REQUIRED. Jamais correction silencieuse.
            </div>
            {mockReconciliation.map(rec => (
              <Card key={rec.id} className={rec.status === 'MATCHED' ? 'border-green-500/20' : rec.status === 'PENDING' ? 'border-amber-500/20' : 'border-red-500/20'}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{rec.status === 'MATCHED' ? '✅' : rec.status === 'PENDING' ? '⏳' : '⚠️'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{rec.provider}</span>
                      <span className="font-mono text-[10px] text-slate-500">{rec.paymentId}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${rec.status==='MATCHED'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>{rec.status}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                  {[
                    { label:'Fournisseur', val:rec.providerAmount },
                    { label:'Ledger', val:rec.ledgerAmount },
                    { label:'Wallet', val:rec.walletAmount },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/50 rounded-xl p-2 text-center">
                      <div className="text-slate-500">{s.label}</div>
                      <div className="font-bold text-white tabular-nums">{fmt(s.val)}</div>
                    </div>
                  ))}
                </div>
                {rec.notes && <div className="text-[9px] text-slate-400 italic">{rec.notes}</div>}
                {rec.difference !== 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-2">
                    <AlertCircle size={12} className="text-amber-400 shrink-0"/>
                    <span className="text-xs text-amber-300">Écart: {fmt(Math.abs(rec.difference))} → Révision manuelle requise</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
