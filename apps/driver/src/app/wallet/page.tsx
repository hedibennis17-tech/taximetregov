'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockWallet, mockWalletEntries, mockPayout, mockReceipts, mockAudit,
  PAYMENT_METHOD_CONF, fmt
} from '@/lib/engines/payment.engine'
import { useState } from 'react'
import { Lock, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react'

export default function WalletPage() {
  const [tab, setTab] = useState<'wallet' | 'receipts' | 'audit'>('wallet')

  return (
    <AppShell>
      <PageHeader title="Wallet & Gains" subtitle="Solde · Ledger · Virements · Reçus" />
      <div className="px-4">
        {/* Security notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Lock size={12} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">Solde calculé depuis le ledger · Débité après confirmation uniquement · Coordonnées bancaires tokenisées · Jamais en clair</p>
        </div>

        {/* Wallet balance hero */}
        <div className="bg-gradient-to-br from-qc-blue/20 to-slate-900 rounded-3xl border border-qc-blue/30 p-6 mb-5">
          <div className="text-xs text-slate-400 mb-1">Solde disponible</div>
          <div className="text-5xl font-black text-white tabular-nums mb-3">{fmt(mockWallet.availableBalance)}</div>
          <div className="flex gap-4 mb-4 text-xs">
            <div><span className="text-slate-500">En attente: </span><span className="text-amber-400 font-bold">{fmt(mockWallet.pendingBalance)}</span></div>
            <div><span className="text-slate-500">Total: </span><span className="text-white font-bold">{fmt(mockWallet.totalBalance)}</span></div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-lg">
              <ArrowUpRight size={16}/> Virer
            </button>
            <button className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
              Historique
            </button>
          </div>
          <div className="text-[9px] text-slate-500 mt-2 text-center">Solde calculé depuis le ledger des entrées · auditable en tout temps</div>
        </div>

        {/* Last payout */}
        <Card className="mb-5 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <ArrowUpRight size={18} className="text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">Dernier virement</div>
              <div className="text-[10px] text-slate-400">{new Date(mockPayout.requestedAt).toLocaleDateString('fr-CA')} · {mockPayout.provider} · {mockPayout.destinationTokenReference}</div>
            </div>
            <div className="text-right">
              <div className="font-black text-green-400 tabular-nums">-{fmt(mockPayout.amount)}</div>
              <div className="text-[9px] text-green-400">{mockPayout.status}</div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['wallet','Ledger'],['receipts','Reçus'],['audit','Audit']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── WALLET LEDGER ───────────────────────────── */}
        {tab === 'wallet' && (
          <div className="mb-6">
            <div className="text-[10px] text-slate-500 mb-3">Chaque entrée est traceable jusqu'à la transaction source — le solde est toujours recalculable</div>
            <div className="driver-card divide-y divide-slate-800">
              {mockWalletEntries.map(entry => {
                const isCredit = entry.amount > 0
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {isCredit ? <ArrowDownLeft size={14} className="text-green-400"/> : <ArrowUpRight size={14} className="text-red-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white">{entry.type.replace(/_/g,' ')}</div>
                      <div className="text-[10px] text-slate-500 truncate">{entry.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-black tabular-nums ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : ''}{fmt(entry.amount)}
                      </div>
                      <div className={`text-[9px] ${entry.status === 'SETTLED' ? 'text-green-400' : 'text-amber-400'}`}>{entry.status}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Running balance */}
            <div className="flex justify-between items-center mt-3 px-2">
              <span className="text-xs text-slate-400">Solde calculé</span>
              <span className="font-black text-green-400 tabular-nums">{fmt(mockWallet.availableBalance)}</span>
            </div>
          </div>
        )}

        {/* ─── RECEIPTS ────────────────────────────────── */}
        {tab === 'receipts' && (
          <div className="space-y-4 mb-6">
            {mockReceipts.map(rcpt => (
              <div key={rcpt.receiptId} className="driver-card p-4">
                {/* Receipt header */}
                <div className="text-center mb-4 pb-3 border-b border-dashed border-slate-700">
                  <div className="text-[10px] text-qc-blue-light font-bold tracking-widest uppercase">Taximètre.GOV</div>
                  <div className="text-[10px] text-slate-500">Reçu de course · SIMULATION</div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label:'Course', val:rcpt.tripId ?? '—', mono:true },
                    { label:'Paiement', val:rcpt.paymentId, mono:true },
                    { label:'Date', val:new Date(rcpt.issuedAt).toLocaleString('fr-CA') },
                    { label:'Activité', val:rcpt.activity + (rcpt.taximeterEnabled ? ' (Taximètre ✓)' : '') },
                    { label:'Tarif', val:fmt(rcpt.fare) },
                    { label:'TPS', val:fmt(rcpt.tpsAmount) },
                    { label:'TVQ', val:fmt(rcpt.tvqAmount) },
                    { label:'Pourboire', val:fmt(rcpt.tipAmount) },
                    { label:'TOTAL', val:fmt(rcpt.totalAmount), bold:true },
                    { label:'Mode paiement', val:PAYMENT_METHOD_CONF[rcpt.paymentMethod].label },
                    { label:'Référence', val:rcpt.referenceId, mono:true },
                  ].map(s => (
                    <div key={s.label} className={`flex justify-between text-xs ${s.bold ? 'border-t border-dashed border-slate-700 pt-2 mt-1' : ''}`}>
                      <span className="text-slate-400">{s.label}</span>
                      <span className={`${s.bold ? 'font-black text-white text-sm' : s.mono ? 'font-mono text-[10px] text-qc-blue-light' : 'text-white'}`}>{s.val}</span>
                    </div>
                  ))}
                </div>
                {rcpt.notes && <div className="text-[9px] text-slate-500 mt-2 italic">{rcpt.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ─── AUDIT ──────────────────────────────────── */}
        {tab === 'audit' && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-3">Journal d'audit paiements</div>
            <div className="space-y-1.5">
              {mockAudit.map(e => (
                <div key={e.auditId} className="flex items-start gap-2 py-1.5 border-b border-slate-800 last:border-0 text-[10px]">
                  <span className={`font-bold w-36 shrink-0 ${e.actorRole === 'SYSTEM' ? 'text-blue-400' : e.actorRole === 'PROVIDER' ? 'text-purple-400' : 'text-green-400'}`}>{e.action}</span>
                  <div className="flex-1">
                    <div className="text-slate-300">{e.details}</div>
                    <div className="text-slate-500">{e.actor} · {new Date(e.timestamp).toLocaleString('fr-CA')}</div>
                  </div>
                  {e.amount && <span className={`font-bold shrink-0 ml-2 ${e.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(Math.abs(e.amount))}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
